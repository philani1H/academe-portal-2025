import 'dotenv/config';
import express, { type Request, type Response, type NextFunction, type RequestHandler } from "express"
import cors from "cors"
import { createServer } from "http"
import { Server } from "socket.io"
import { getConnection } from "../lib/db.js"
import prisma from "../lib/prisma.js"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import jwt from "jsonwebtoken"
import {
  sendEmail,
  renderBrandedEmail,
  renderInvitationEmail,
  renderBrandedEmailPreview,
  renderStudentCredentialsEmail,
  renderTutorCredentialsEmail,
  renderAdminCredentialsEmail,
  renderLiveSessionStartedEmail,
  renderMaterialUploadedEmail,
  renderTestCreatedEmail,
  renderStudentApprovedEmail,
  renderStudentRejectedEmail,
} from "../lib/email.js"
import { generatePasswordFromName } from "../lib/utils.js"
import { v2 as cloudinary } from "cloudinary"
import crypto from "crypto"
import multer from "multer"
import { createRequire } from "module"

// Configure Cloudinary
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('⚠ Cloudinary credentials not configured. File uploads to Cloudinary will fail.');
}
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true
});

const require = createRequire(import.meta.url)
const pdfParse = require("pdf-parse")
const bcrypt = require("bcryptjs")

// Duplicate email prevention for server endpoints
const recentCredentialsSent = new Map<string, number>();
const CREDENTIALS_COOLDOWN = 300000; // 5 minutes cooldown

function canSendCredentials(endpoint: string, userId: string): boolean {
  const key = `${endpoint}:${userId}`;
  const now = Date.now();
  const lastSent = recentCredentialsSent.get(key);
  
  if (lastSent && (now - lastSent) < CREDENTIALS_COOLDOWN) {
    return false;
  }
  
  recentCredentialsSent.set(key, now);
  
  // Clean up old entries
  for (const [k, timestamp] of recentCredentialsSent.entries()) {
    if (now - timestamp > CREDENTIALS_COOLDOWN) {
      recentCredentialsSent.delete(k);
    }
  }
  
  return true;
}

// Type declarations
interface AuthenticatedRequest extends Request {
  user?: {
    id: number | string
    email: string
    role: string
    name?: string
    username?: string
  }
}

interface SessionData {
  sessionId: string
  courseId: number
  tutorName: string
  courseName: string
  department: string
  message: string
  startTime: number
}

// Resolve base path in both ESM and CJS
const resolvedDir = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url))
const baseDir = path.resolve(resolvedDir, "..")
const uploadsDir = path.resolve(baseDir, "..", "public", "uploads")

// Ensure uploads directory exists
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error)

// Store active live sessions in memory (courseId -> sessionData)
const activeSessions = new Map<string, SessionData>()

// Store whiteboard history (sessionId -> action[])
const whiteboardHistory = new Map<string, any[]>()

// Store whiteboard documents (sessionId -> CanvasDocument[])
const whiteboardDocuments = new Map<string, any[]>()

// Track users in each session with their details (sessionId -> Map<socketId, UserData>)
const sessionUsers = new Map<string, Map<string, { userId: string, userRole: string, userName: string, isVideoOn: boolean, isAudioOn: boolean, isHandRaised: boolean }>>();


// Helper for safe database queries with retry logic
const safeQuery = async <T>(fn: () => Promise<T>): Promise<T | null> => {
  let retries = 5
  let delay = 1000
  while (retries > 0) {
    try {
      return await fn()
    } catch (e: any) {
      if (
        e?.code === 'P1001' || // Can't reach database server
        e?.code === 'P2024' || // Timed out fetching a new connection
        e?.name === 'PrismaClientInitializationError' ||
        e?.message?.includes('Can\'t reach database server') ||
        e?.message?.includes('connection closed')
      ) {
        console.warn(`Database query retry (${retries} left) in ${delay}ms...`)
        retries--
        await new Promise(r => setTimeout(r, delay))
        delay *= 1.5 // Exponential backoff (gentler)
        continue
      }
      throw e
    }
  }
  console.error("Database connection failed after retries")
  return null // Return null instead of throwing to prevent crash
}

// Helper to save whiteboard state
const saveWhiteboardState = async (sessionId: string, action: any) => {
  try {
    const anyPrisma = prisma as any;
    if (!anyPrisma.whiteboardState) return; 

    const liveSession = await prisma.liveSession.findUnique({
      where: { sessionId }
    });
    
    if (liveSession) {
      await anyPrisma.whiteboardState.create({
        data: {
          liveSessionId: liveSession.id,
          action: JSON.stringify(action),
          timestamp: new Date()
        }
      });
    }
  } catch (error) {
    // Suppress errors to avoid log spam if DB is busy or not ready
  }
};

// Helper to save whiteboard document
const saveWhiteboardDocument = async (sessionId: string, doc: any) => {
  try {
    const anyPrisma = prisma as any;
    if (!anyPrisma.whiteboardDocument) return; 

    const liveSession = await prisma.liveSession.findUnique({
      where: { sessionId }
    });
    
    if (liveSession) {
      await anyPrisma.whiteboardDocument.create({
        data: {
          id: doc.id,
          liveSessionId: liveSession.id,
          data: JSON.stringify(doc)
        }
      });
    }
  } catch (error) {
     // console.error('Failed to save whiteboard doc:', error);
  }
};

const updateWhiteboardDocument = async (docId: string, updates: any) => {
    try {
        const anyPrisma = prisma as any;
        if (!anyPrisma.whiteboardDocument) return;
        
        const doc = await anyPrisma.whiteboardDocument.findUnique({ where: { id: docId } });
        if (doc) {
            const currentData = JSON.parse(doc.data);
            const newData = { ...currentData, ...updates };
            await anyPrisma.whiteboardDocument.update({
                where: { id: docId },
                data: { data: JSON.stringify(newData) }
            });
        }
    } catch (e) {}
}

const deleteWhiteboardDocument = async (docId: string) => {
    try {
        const anyPrisma = prisma as any;
        if (!anyPrisma.whiteboardDocument) return;
        await anyPrisma.whiteboardDocument.delete({ where: { id: docId } });
    } catch (e) {}
}

// Scheduled session checker
let scheduledSessionChecker: NodeJS.Timeout
let isCheckerRunning = false

const startScheduledSessionChecker = (): void => {
  if (isCheckerRunning) return
  isCheckerRunning = true
  console.log("✓ Starting scheduled session checker...")

  const anyPrisma: any = prisma as any
  if (!anyPrisma?.scheduledSession || typeof anyPrisma.scheduledSession.findMany !== "function") {
    console.warn(
      "⚠ Prisma scheduledSession model not available. Skipping scheduled session checker to avoid crashes.",
    )
    return
  }

  const checkSessions = async () => {
    let nextCheckDelay = 60000 // Default 1 minute
    try {
      const now = new Date()
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

      const queryResult = await safeQuery(() => anyPrisma.scheduledSession.findMany({
        where: {
          status: "scheduled",
          scheduledAt: {
            gte: now,
            lte: fiveMinutesFromNow,
          },
        },
        include: {
          course: true,
          tutor: true,
        },
      }))

      if (queryResult === null) {
         console.warn("⚠ Database unreachable for scheduled sessions. Backing off for 5 minutes.")
         nextCheckDelay = 300000 // 5 minutes
      }

      const scheduledSessions = queryResult || []

      for (const session of scheduledSessions) {
        console.log(
          `Auto-starting scheduled session: ${session.title} for courseId=${session.courseId}, courseName=${session.course.name}`,
        )

        const sessionId = `${session.courseId}-${Date.now()}`

        await safeQuery(() => anyPrisma.scheduledSession.update({
          where: { id: session.id },
          data: {
            status: "active",
            sessionId: sessionId,
          },
        }))

        activeSessions.set(String(session.courseId), {
          sessionId,
          courseId: session.courseId,
          tutorName: session.tutor.name,
          courseName: session.course.name,
          department: session.course.category,
          message: `${session.tutor.name} started a scheduled live session for ${session.course.name}!`,
        })

        io.to(`course:${session.courseId}`).emit("session-live", {
          sessionId,
          courseId: session.courseId,
          tutorName: session.tutor.name,
          courseName: session.course.name,
          department: session.course.category,
          message: `${session.tutor.name} started a scheduled live session for ${session.course.name}!`,
        })

        // Send emails to enrolled students
        try {
          const course = await safeQuery(() => prisma.course.findUnique({
            where: { id: session.courseId },
            include: {
              courseEnrollments: {
                include: { user: true },
              },
            },
          }))

          if (course && course.courseEnrollments.length > 0) {
            const frontendBase = process.env.FRONTEND_URL || "https://www.excellenceakademie.co.za"
            const sessionLink = `${frontendBase}/student/dashboard?joinSession=${sessionId}&courseId=${session.courseId}&tutorName=${encodeURIComponent(session.tutor.name)}`

            console.log(`Sending scheduled session emails to ${course.courseEnrollments.length} students...`)

            await Promise.all(
              course.courseEnrollments.map(async (enrollment) => {
                const student = enrollment.user
                if (student.email) {
                  const content = `
                  <div style="font-family: sans-serif; color: #333;">
                    <h2>Scheduled Live Session Started!</h2>
                    <p>Hi ${student.name},</p>
                    <p>The scheduled live session "<strong>${session.title}</strong>" for <strong>${course.name}</strong> has started.</p>
                    <p><strong>Tutor:</strong> ${session.tutor.name}</p>
                    <p><strong>Duration:</strong> ${session.duration} minutes</p>
                    <br/>
                    <a href="${sessionLink}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Live Session</a>
                    <br/><br/>
                    <p>See you there!</p>
                  </div>
                `
                  try {
                    await sendEmail({
                      to: student.email,
                      subject: `🔴 Scheduled Session Live: ${session.title}`,
                      content,
                    })
                  } catch (e) {
                    console.error(`Failed to send email to ${student.email}`, e)
                  }
                }
              }),
            )
          }
        } catch (error) {
          console.error("Error sending scheduled session emails:", error)
        }

        console.log(`Scheduled session ${session.title} started successfully`)
      }
    } catch (error: any) {
      // Check if it's a table not found error (P2021)
      if (error.code === 'P2021') {
        console.warn("⚠ Scheduled sessions table does not exist yet. Please run Prisma migrations: npx prisma migrate deploy")
      } else {
        console.error("Error checking scheduled sessions:", error)
      }
    }
    finally {
      if (isCheckerRunning) {
        scheduledSessionChecker = setTimeout(checkSessions, nextCheckDelay)
      }
    }
  }
  checkSessions()
}

const stopScheduledSessionChecker = (): void => {
  isCheckerRunning = false
  if (scheduledSessionChecker) {
    clearTimeout(scheduledSessionChecker)
    console.log("✓ Stopped scheduled session checker")
  }
}

const app = express()
const httpServer = createServer(app)
const port = process.env.PORT || 3000

// Enhanced CORS configuration - Allow all origins for now
const isProd = process.env.NODE_ENV === "production"
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
}

app.use(cors(corsOptions as cors.CorsOptions))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ limit: "10mb", extended: true }))

// Server Readiness Check
// This prevents "Connection Refused" errors during startup by accepting connections
// but returning 503 until the server is fully initialized.
let isServerReady = false
app.use((req, res, next) => {
  // Allow health checks and static files even during startup
  if (req.path === '/api/health' || !req.path.startsWith('/api')) {
    return next()
  }
  
  if (!isServerReady) {
    return res.status(503).json({ 
      success: false, 
      error: 'Server is initializing', 
      retryAfter: 5 
    })
  }
  
  next()
})

// Timetable API
// Remove file-based storage references
// const timetableFile = path.resolve(resolvedDir, "data", "timetable.json")
// const testsFile = path.resolve(resolvedDir, "data", "tests.json")
// fs.mkdir(path.dirname(timetableFile), { recursive: true }).catch(console.error)
const testsFile = path.resolve(resolvedDir, "data", "tests.json")

app.get("/api/timetable", async (req: Request, res: Response) => {
  try {
    const entries = await prisma.timetableEntry.findMany({
      include: {
        tutor: true,
        course: true,
      },
    })

    const contentTutors = await prisma.tutor.findMany()
    const contentTutorMap = new Map(contentTutors.map((t) => [t.name, t.id]))

    const data = entries.map((e) => {
      const [startTime, endTime] = (e.timeSlot || "").split("-")
      return {
        id: e.id,
        day: e.day,
        startTime: startTime || "",
        endTime: endTime || "",
        time: startTime || "",
        tutorId: contentTutorMap.get(e.tutor?.name || "") || e.tutorId,
        tutorName: e.tutor?.name || "",
        courseId: e.courseId,
        courseName: e.course?.name || "",
        subject: e.course?.category || "",
        grade: e.grade || "Grade 12",
        type: e.type,
        students: e.students || "",
      }
    })
    res.json({ data })
  } catch (error) {
    console.error("Error fetching timetable:", error)
    res.json({ data: [] })
  }
})

app.post("/api/timetable", async (req: Request, res: Response) => {
  try {
    const { timetable } = req.body
    if (!Array.isArray(timetable)) {
      return res.status(400).json({ success: false, error: "timetable must be an array" })
    }

    // 1. Resolve names to IDs (prioritize IDs if available)
    const validEntries = []
    for (const entry of timetable) {
      let user = null
      let course = null

      // Try resolving Tutor by ID first
      if (entry.tutorId) {
        const tId = Number.parseInt(String(entry.tutorId))
        if (!isNaN(tId)) {
          user = await prisma.user.findUnique({ where: { id: tId } })
        }
      }
      // Fallback to Tutor Name
      if (!user && entry.tutorName) {
        user = await prisma.user.findFirst({
          where: { name: entry.tutorName, role: "tutor" },
        })
      }

      // Try resolving Course by ID first
      if (entry.courseId) {
        const cId = Number.parseInt(String(entry.courseId))
        if (!isNaN(cId)) {
          course = await prisma.course.findUnique({ where: { id: cId } })
        }
      }
      // Fallback to Course Name
      if (!course && entry.courseName) {
        course = await prisma.course.findFirst({
          where: { name: entry.courseName },
        })
      }

      if (user && course) {
        validEntries.push({
          day: entry.day,
          timeSlot: `${entry.startTime}-${entry.endTime}`,
          courseId: course.id,
          tutorId: user.id,
          type: entry.type || "Group",
          grade: entry.grade || null,
          students: entry.students || "",
        })
      }
    }

    // 2. Transaction: Replace all entries
    await prisma.$transaction([
      prisma.timetableEntry.deleteMany({}),
      prisma.timetableEntry.createMany({
        data: validEntries,
      }),
    ])

    const ioInstance = req.app.get("io") as Server | undefined
    if (ioInstance) {
      ioInstance.emit("timetable-updated")
    }

    res.json({ success: true })

  } catch (error) {
    console.error("Error saving timetable:", error)
    res.status(500).json({ error: "Failed to save timetable" })
  }
})


// Upload endpoint for timetable (CSV/Excel)
app.post("/api/timetable/upload", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileContent, fileType } = req.body || {}
    if (!fileContent) return res.status(400).json({ error: "No file content provided" })

    let entries: any[] = []

    if (fileType === "json") {
      const parsed = JSON.parse(fileContent)
      entries = Array.isArray(parsed) ? parsed : parsed.timetable || []
    } else if (fileType === "csv") {
      const lines = fileContent.trim().split("\n")
      if (lines.length < 2) throw new Error("CSV must have header and data rows")
      
      // Expected headers: Tutor, Day, Start, End, Course, Subject, Grade, Type, Students
      const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase())
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        if (values.length === 0) continue
        
        const row: any = {}
        headers.forEach((header: string, index: number) => {
          if (values[index] !== undefined) row[header] = values[index].trim()
        })
        
        // Map CSV columns to Timetable structure
        if (row.tutor && row.day && row.start && row.course) {
          entries.push({
            tutorName: row.tutor,
            day: row.day,
            startTime: row.start,
            endTime: row.end || addMinutesToTime(row.start, 60), // Default 1h if missing
            courseName: row.course,
            subject: row.subject || "General",
            grade: row.grade || "Grade 12",
            type: row.type || "Group",
            students: row.students || ""
          })
        }
      }
    } else {
      return res.status(400).json({ error: "Unsupported file type. Use CSV or JSON." })
    }

    if (entries.length === 0) {
      return res.status(400).json({ error: "No valid timetable entries found" })
    }

    // Process entries similar to POST /api/timetable
    const validEntries = []
    for (const entry of entries) {
      if (!entry.tutorName || !entry.courseName) continue

      // Find Tutor ID
      let user = await prisma.user.findFirst({
        where: { name: entry.tutorName, role: "tutor" },
      })
      
      // If tutor not found, try to find by fuzzy match or skip? 
      // For now, strict match or skip.
      if (!user) continue;

      // Find Course ID
      let course = await prisma.course.findFirst({
        where: { name: entry.courseName },
      })
      
      // If course not found, maybe create it or skip?
      // Strict match for safety.
      if (!course) continue;

      validEntries.push({
        day: entry.day,
        timeSlot: `${entry.startTime}-${entry.endTime}`,
        courseId: course.id,
        tutorId: user.id,
        type: entry.type || "Group",
        grade: entry.grade || null,
        students: entry.students || "",
      })
    }

    if (validEntries.length === 0) {
      return res.status(400).json({ error: "No entries could be matched to existing Tutors/Courses. Please ensure names match exactly." })
    }

    // Transaction: Append or Replace? 
    // Usually uploads are additive or replacements. Let's assume replacement for consistency with bulk operations, 
    // OR we can make it additive. Given the request "upload a timetable", it often implies setting the schedule.
    // However, safely we should probably append or ask user. 
    // For this implementation, I will APPEND to avoid wiping existing data unless user explicitly clears.
    // Wait, the previous POST /api/timetable REPLACES everything. 
    // Let's stick to REPLACING for consistency with "uploading a NEW timetable".
    
    await prisma.$transaction([
      prisma.timetableEntry.deleteMany({}),
      prisma.timetableEntry.createMany({
        data: validEntries,
      }),
    ])

    const ioInstance = req.app.get("io") as Server | undefined
    if (ioInstance) {
      ioInstance.emit("timetable-updated")
    }

    return res.json({ success: true, count: validEntries.length, message: `Successfully uploaded ${validEntries.length} classes` })

  } catch (error) {
    console.error("Timetable upload error:", error)
    return res.status(500).json({ success: false, error: "Failed to upload timetable" })
  }
})

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname) || ".webm"
    cb(null, file.fieldname + "-" + uniqueSuffix + ext)
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
})

// Upload endpoint for course materials
app.post("/api/upload/material", authenticateJWT as RequestHandler, upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = req.file
    const { courseId, type, name, description } = req.body
    const userId = req.user?.id
    const userRole = req.user?.role

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" })
    }
    if (!courseId) {
      await fs.unlink(file.path).catch(console.error)
      return res.status(400).json({ error: "Course ID is required" })
    }

    // If tutor, verify they own the course
    if (userRole === "tutor" && userId) {
      const course = await prisma.course.findFirst({
        where: {
          id: Number.parseInt(courseId),
          tutorId: userId
        }
      })
      if (!course) {
        await fs.unlink(file.path).catch(console.error)
        return res.status(403).json({ error: "Access denied: You can only upload materials to your own courses" })
      }
    }

    const fileUrl = `/uploads/${file.filename}`

    console.log(`File uploaded: ${file.filename} for course ${courseId}`)

    const material = await prisma.courseMaterial.create({
      data: {
        courseId: Number.parseInt(courseId),
        name: name || file.originalname,
        type: type || "video",
        url: fileUrl,
        description: description || "Live session recording",
      },
    })

    res.json({ success: true, material })
  } catch (error) {
    console.error("Upload error:", error)
    res.status(500).json({ error: "Failed to upload material" })
  }
})

app.post("/api/upload", authenticateJWT as RequestHandler, upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = req.file

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    const fileUrl = `/uploads/${file.filename}`

    res.json({
      url: fileUrl,
      id: file.filename,
      name: file.originalname,
    })
  } catch (error) {
    console.error("Generic upload error:", error)
    res.status(500).json({ error: "Failed to upload file" })
  }
})

// Cloudinary material upload endpoint - saves Cloudinary URL to database
app.post("/api/upload/cloudinary-material", authenticateJWT as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, type, name, url, publicId, format, duration, size, description } = req.body
    const userId = req.user?.id
    const userRole = req.user?.role

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" })
    }
    if (!url) {
      return res.status(400).json({ error: "Cloudinary URL is required" })
    }

    // If tutor, verify they own the course
    if (userRole === "tutor" && userId) {
      const course = await prisma.course.findFirst({
        where: {
          id: Number.parseInt(courseId),
          tutorId: userId
        }
      })
      if (!course) {
        return res.status(403).json({ error: "Access denied: You can only upload materials to your own courses" })
      }
    }

    console.log(`Saving Cloudinary material for course ${courseId}: ${url}`)

    const material = await prisma.courseMaterial.create({
      data: {
        courseId: Number.parseInt(courseId),
        name: name || "Live Session Recording",
        type: type || "video",
        url: url,
        description: description || `Cloudinary video - ${format} format${duration ? `, ${Math.round(duration)}s duration` : ''}${size ? `, ${Math.round(size / (1024 * 1024))}MB` : ''}`,
      },
    })

    const io = req.app.get("io")
    io.emit("material-added", { courseId, material })
    io.to(`course:${courseId}`).emit("course-updated", { courseId })

    res.json({
      success: true,
      material,
      cloudinary: {
        publicId,
        format,
        duration,
        size
      }
    })
  } catch (error) {
    console.error("Cloudinary material save error:", error)
    res.status(500).json({ error: "Failed to save Cloudinary material to database" })
  }
})

// Cloudinary delete endpoint
app.post("/api/cloudinary/delete", async (req: Request, res: Response) => {
  try {
    const { publicId, resourceType = 'image' } = req.body

    if (!publicId) {
      return res.status(400).json({ error: "Public ID is required" })
    }

    // Cloudinary configuration from environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Cloudinary credentials missing in environment")
      return res.status(500).json({ error: "Server configuration error" })
    }

    // Generate signature for deletion
    const timestamp = Math.round(new Date().getTime() / 1000)
    const crypto = await import('crypto')
    const signature = crypto
      .createHash('sha1')
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex')

    // Call Cloudinary API
    const formData = new URLSearchParams()
    formData.append('public_id', publicId)
    formData.append('timestamp', timestamp.toString())
    formData.append('api_key', apiKey)
    formData.append('signature', signature)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    )

    const result = await response.json()

    if (result.result === 'ok') {
      res.json({ success: true, message: 'Resource deleted successfully' })
    } else {
      res.status(400).json({ error: 'Failed to delete resource', details: result })
    }
  } catch (error) {
    console.error("Cloudinary delete error:", error)
    res.status(500).json({ error: "Failed to delete from Cloudinary" })
  }
})

app.post("/api/tests/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ success: false, error: "No file" })
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext !== ".pdf") {
      await fs.unlink(file.path).catch(() => {})
      return res.status(400).json({ success: false, error: "Only PDF supported" })
    }
    const data = await fs.readFile(file.path)
    const parsed = await pdfParse(data)
    const text = String(parsed.text || "").replace(/\r/g, "")
    const rawSections = text
      .split(/\n{2,}/)
      .map((s: string) => s.trim())
      .filter(Boolean)
    const sections = rawSections.map((s: string, i: number) => {
      const lines = s.split("\n")
      const titleLine = lines[0] || `Section ${i + 1}`
      const content = lines.slice(1).join("\n")
      return { title: titleLine, content: content || s }
    })
    await fs.unlink(file.path).catch(() => {})
    return res.json({ success: true, sections })
  } catch (error) {
    return res.status(500).json({ success: false, error: "Parse failed" })
  }
})

app.post("/api/tests/generate", async (req: Request, res: Response) => {
  try {
    const { sections, options } = req.body || {}
    const num = Number(options?.count || 20)
    const sentences = Array.isArray(sections)
      ? sections.flatMap((sec: any) =>
          String(sec?.content || "")
            .split(/[.!?]\s+/)
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 20),
        )
      : []
    const pick = (arr: string[], n: number) => arr.slice(0, n)
    const slice = pick(sentences, num)
    const randWord = (s: string) => {
      const words = s.split(/\s+/).filter((w) => w.length > 6)
      return words[0] || null
    }
    const makeMCQ = (s: string) => {
      const key = randWord(s) || s.split(/\s+/)[0]
      const distractors = ["analysis", "process", "context", "outcome"].filter(
        (d) => d.toLowerCase() !== String(key).toLowerCase(),
      )
      const mcqOptions = [key, ...distractors].slice(0, 4).sort(() => Math.random() - 0.5)
      return { type: "mcq", prompt: s, options: mcqOptions, answer: key }
    }
    const makeTF = (s: string) => {
      return { type: "true_false", prompt: s, answer: true }
    }
    const makeFill = (s: string) => {
      const key = randWord(s)
      if (!key) return { type: "short", prompt: s, answer: "" }
      const prompt = s.replace(new RegExp(key, "i"), "_____")
      return { type: "fill", prompt, answer: key }
    }
    const makeShort = (s: string) => {
      return { type: "short", prompt: s, answer: "" }
    }
    const out: any[] = []
    slice.forEach((s: string, i: number) => {
      if (i % 4 === 0) out.push(makeMCQ(s))
      else if (i % 4 === 1) out.push(makeTF(s))
      else if (i % 4 === 2) out.push(makeFill(s))
      else out.push(makeShort(s))
    })
    return res.json({ success: true, questions: out })
  } catch (error) {
    return res.status(500).json({ success: false, error: "Generate failed" })
  }
})

app.post("/api/tests/save", authenticateJWT as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body || {}
    const userId = req.user?.id
    const userRole = req.user?.role
    const courseId = body?.courseId

    // Verify tutor owns the course if they're trying to create a test
    if (userRole === "tutor" && userId && courseId) {
      const course = await prisma.course.findFirst({
        where: {
          id: Number.parseInt(courseId),
          tutorId: userId
        }
      })
      if (!course) {
        return res.status(403).json({ success: false, error: "Access denied: You can only create tests for your own courses" })
      }
    }

    const id = String(body?.id || Date.now())
    const payload = { id, ...body }
    let existing: any[] = []
    try {
      const raw = await fs.readFile(testsFile, "utf-8")
      existing = JSON.parse(raw)
    } catch {}
    const next = Array.isArray(existing) ? [...existing, payload] : [payload]
    await fs.mkdir(path.dirname(testsFile), { recursive: true }).catch(() => {})
    await fs.writeFile(testsFile, JSON.stringify(next, null, 2))
    return res.json({ success: true, id })
  } catch (error) {
    return res.status(500).json({ success: false, error: "Save failed" })
  }
})

// Socket.IO Setup
const io = new Server(httpServer, {
  maxHttpBufferSize: 1e8, // 100 MB
  cors: {
    origin: isProd ? undefined : "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

app.set("io", io)

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("join-user-room", (userId: string) => {
    socket.join(`user:${userId}`)
    console.log(`User ${userId} joined their notification room`)
  })

  socket.on("join-course-room", async (courseIds: number[]) => {
    if (Array.isArray(courseIds)) {
      courseIds.forEach((id) => socket.join(`course:${id}`))
      console.log(`Socket ${socket.id} joined course rooms: ${courseIds.join(", ")}`)
    }
  })

  // Track which sessions each socket is in to prevent duplicate joins
  const socketSessions = new Set<string>();
  
  socket.on(
    "join-session",
    async ({ sessionId, userId, userRole, userName, courseId, courseName, category, isVideoOn, isAudioOn, isHandRaised, isScreenSharing, isRecording }) => {
      // Prevent duplicate joins for the same session
      const sessionKey = `${socket.id}-${sessionId}`;
      if (socketSessions.has(sessionKey)) {
        console.log(`[Socket] Duplicate join attempt ignored: ${userName || userId} (${userRole}) in session ${sessionId}`);
        return;
      }
      socketSessions.add(sessionKey);

      socket.join(sessionId)
      console.log(`[Session] ${userName || userId || 'Unknown'} (${userRole}) joined session ${sessionId}`);

      // Track this user in the session (in-memory)
      if (!sessionUsers.has(sessionId)) {
        sessionUsers.set(sessionId, new Map());
      }
      sessionUsers.get(sessionId)!.set(socket.id, {
        userId,
        userRole,
        userName,
        isVideoOn: isVideoOn ?? true,
        isAudioOn: isAudioOn ?? true,
        isHandRaised: isHandRaised ?? false,
        isScreenSharing: isScreenSharing ?? false,
        isRecording: isRecording ?? false
      });

      // Notify others that this user joined
      socket
        .to(sessionId)
        .emit("user-joined", {
          userId,
          userRole,
          socketId: socket.id,
          userName,
          isVideoOn,
          isAudioOn,
          isHandRaised: isHandRaised ?? false,
          isScreenSharing: isScreenSharing ?? false,
          isRecording: isRecording ?? false
        })

      // Find or create database session to send start time and persist participant
      try {
        let dbSession = await prisma.liveSession.findUnique({
          where: { sessionId },
          include: { participants: true }
        });

        if (dbSession) {
          // Session exists in database - persist this participant
          await prisma.liveSessionParticipant.create({
            data: {
              liveSessionId: dbSession.id,
              userId: userId ? parseInt(String(userId)) : null,
              socketId: socket.id,
              userName,
              userRole
            }
          });

          // Update participant count
          await prisma.liveSession.update({
            where: { id: dbSession.id },
            data: { participantCount: { increment: 1 } }
          });

          // Send session info with database start time
          socket.emit("session-info", {
            startTime: dbSession.startTime.getTime(),
            tutorName: activeSessions.get(String(courseId))?.tutorName,
            courseName: courseName
          });
        } else {
          // Check in-memory sessions
          let sessionData: SessionData | undefined;
          if (courseId) {
            sessionData = activeSessions.get(String(courseId));
          }

          if (!sessionData || sessionData.sessionId !== sessionId) {
            for (const session of activeSessions.values()) {
              if (session.sessionId === sessionId) {
                sessionData = session;
                break;
              }
            }
          }

          if (sessionData) {
            socket.emit("session-info", {
              startTime: sessionData.startTime,
              tutorName: sessionData.tutorName,
              courseName: sessionData.courseName
            });
          }
        }
      } catch (err: any) {
        if (err.code === 'P1001') {
           console.error('[Session] Database connection failed while persisting participant. Proceeding in-memory only.');
        } else {
           console.error('[Session] Error persisting participant:', err);
        }
        
        // Fallback: Check in-memory sessions even if DB fails
        let sessionData: SessionData | undefined;
        if (courseId) {
          sessionData = activeSessions.get(String(courseId));
        }

        if (!sessionData || sessionData.sessionId !== sessionId) {
          for (const session of activeSessions.values()) {
            if (session.sessionId === sessionId) {
              sessionData = session;
              break;
            }
          }
        }

        if (sessionData) {
          socket.emit("session-info", {
            startTime: sessionData.startTime,
            tutorName: sessionData.tutorName,
            courseName: sessionData.courseName
          });
        }
      }
    },
  )
  
  // Handle request for existing users in session
  socket.on("get-session-users", ({ sessionId }) => {
    const usersInSession = sessionUsers.get(sessionId);
    if (usersInSession) {
      const users = Array.from(usersInSession.entries())
        .filter(([socketId]) => socketId !== socket.id) // Don't include the requester
        .map(([socketId, userData]) => ({
          socketId,
          ...userData
        }));
      
      console.log(`[Session] Sending ${users.length} existing users to ${socket.id} in session ${sessionId}`);
      socket.emit("existing-users", { users });
    }
  });

  socket.on("stream-state-change", ({ sessionId, isVideoOn, isAudioOn, isScreenSharing, isRecording }) => {
    // Update stored user state
    const usersInSession = sessionUsers.get(sessionId);
    if (usersInSession && usersInSession.has(socket.id)) {
      const userData = usersInSession.get(socket.id)!;
      userData.isVideoOn = isVideoOn;
      userData.isAudioOn = isAudioOn;
      userData.isScreenSharing = isScreenSharing ?? false;
      // Note: isRecording is not stored in sessionUsers, only broadcast
    }

    // Broadcast state change to all other users in session
    socket.to(sessionId).emit("stream-state-changed", {
      socketId: socket.id,
      isVideoOn,
      isAudioOn,
      isScreenSharing: isScreenSharing ?? false,
      isRecording: isRecording ?? false
    })
  })

  socket.on("hand-raised-change", ({ sessionId, isHandRaised }) => {
    // Update stored user state
    const usersInSession = sessionUsers.get(sessionId);
    if (usersInSession && usersInSession.has(socket.id)) {
      usersInSession.get(socket.id)!.isHandRaised = isHandRaised;
    }

    socket.to(sessionId).emit("hand-raised-changed", { socketId: socket.id, isHandRaised })
  })

  socket.on("session-started", async ({ sessionId, courseId, tutorName, students }) => {
    console.log(`Session started event received`, { sessionId, courseId, tutorName })

    try {
      const cId = Number.parseInt(String(courseId))
      if (isNaN(cId)) {
        console.error("Invalid courseId for session-started", { courseId })
        return
      }

      const course = await prisma.course.findUnique({
        where: { id: cId },
        include: {
          courseEnrollments: {
            include: { user: true },
          },
        },
      })

      const courseName = course?.name || (course as any)?.title || "Course"
      const department = (course as any)?.category
      const tutorId = course?.tutorId

      const startTime = Date.now();

      activeSessions.set(String(cId), {
        sessionId,
        courseId: cId,
        tutorName,
        courseName,
        department,
        message: `${tutorName} started a live session for ${courseName}!`,
        startTime,
      })

      // Persist session to database (Upsert to handle potential race conditions or re-connections)
      try {
        const dbSession = await prisma.liveSession.upsert({
          where: { sessionId },
          update: {
             status: 'active',
             startTime: new Date(startTime), // Ensure start time is consistent
             // Don't update tutorId/courseId as they shouldn't change
          },
          create: {
            sessionId,
            courseId: cId,
            tutorId: tutorId || 0, // Fallback to 0 if no tutor ID
            startTime: new Date(startTime),
            status: 'active'
          }
        });
        console.log(`[Session] Created/Updated database session record:`, dbSession.id);
      } catch (dbErr: any) {
        if (dbErr.code === 'P1001') {
           console.error(`[Session] Database connection failed while creating session. Proceeding in-memory only.`);
        } else {
           console.error(`[Session] Failed to persist session to database:`, dbErr);
        }
      }

      io.to(`course:${cId}`).emit("session-live", {
        sessionId,
        courseId: cId,
        tutorName,
        courseName,
        department,
        message: `${tutorName} started a live session for ${courseName}!`,
        startTime,
      })

      // Also notify users already in the session room
      io.to(sessionId).emit("session-info", {
        startTime,
        tutorName,
        courseName
      })

      console.log(`Broadcasted live session`, { courseId: cId, courseName, sessionId })

      if (course && course.courseEnrollments.length > 0) {
        const frontendBase = process.env.FRONTEND_URL || "https://www.excellenceakademie.co.za"
        const sessionLink = `${frontendBase}/student/dashboard?joinSession=${sessionId}&courseId=${cId}&courseName=${encodeURIComponent(courseName)}&tutorName=${encodeURIComponent(tutorName)}`

        console.log(`Sending live session emails`, {
          courseId: cId,
          courseName,
          recipients: course.courseEnrollments.length,
        })

        await Promise.all(
          course.courseEnrollments.map(async (enrollment) => {
            const student = enrollment.user
            if (student.email) {
              const content = `
              <div style="font-family: sans-serif; color: #333;">
                <h2>Live Session Started!</h2>
                <p>Hi ${student.name},</p>
                <p><strong>${tutorName}</strong> has started a live session for <strong>${courseName}</strong>.</p>
                <br/>
                <a href="${sessionLink}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Live Session</a>
                <br/><br/>
                <p>See you there!</p>
              </div>
            `
              try {
                await sendEmail({
                  to: student.email,
                  subject: `🔴 Live Now: ${courseName}`,
                  content,
                })
              } catch (e) {
                console.error(`Failed to send email to ${student.email}`, e)
              }
            }
          }),
        )
        console.log(`Sent live session emails successfully`, {
          courseId: cId,
          courseName,
          recipients: course.courseEnrollments.length,
        })
      } else {
        console.log("No enrolled students found for course, skipping email broadcast", {
          courseId: cId,
          courseName,
        })
      }
    } catch (error) {
      console.error("Error handling session-started", error)
    }
  })

  socket.on("end-session", async ({ courseId, sessionId }) => {
    console.log(`Session ended for course ${courseId}`)
    if (courseId) {
      activeSessions.delete(String(courseId))
    }
    io.to(`course:${courseId}`).emit("session-ended", { courseId, sessionId })

    // Update database session as ended
    try {
      await prisma.liveSession.updateMany({
        where: { sessionId, status: 'active' },
        data: {
          status: 'ended',
          endTime: new Date()
        }
      });
      console.log(`[Session] Marked session ${sessionId} as ended in database`);
    } catch (dbErr) {
      console.error(`[Session] Failed to mark session as ended:`, dbErr);
    }
  })

  socket.on("signal", ({ to, signal, from, userRole, userName, isVideoOn, isAudioOn }) => {
    io.to(to).emit("signal", { signal, from, userRole, userName, isVideoOn, isAudioOn })
  })

  socket.on("whiteboard-action", ({ sessionId, action }) => {
    if (!sessionId || !action) return;

    const usersInSession = sessionUsers.get(sessionId);
    const userData = usersInSession?.get(socket.id);

    socket.to(sessionId).emit("whiteboard-action", {
      action,
      userId: userData?.userId || socket.id,
      userName: userData?.userName || "Unknown"
    });
  });

  socket.on("whiteboard-draw", (payload: any) => {
    try {
      if (!payload) return
      const sessionId = payload.sessionId
      if (!sessionId) return

      const data = typeof payload.data !== "undefined" ? payload.data : (() => {
        const { sessionId: _sid, ...rest } = payload
        return rest
      })()

      // Store in history
      if (!whiteboardHistory.has(sessionId)) {
        whiteboardHistory.set(sessionId, [])
      }

      // Optimization: If clear, reset history
      if (data.action && data.action.type === 'clear') {
        whiteboardHistory.set(sessionId, [data])
      } else {
        whiteboardHistory.get(sessionId)!.push(data)
      }

      // Save to DB
      saveWhiteboardState(sessionId, data);

      socket.to(sessionId).emit("whiteboard-draw", data)
    } catch (err) {
      console.error("Error handling whiteboard-draw event:", err)
    }
  })

  socket.on("whiteboard-clear", ({ sessionId }) => {
    // Clear history
    if (sessionId) {
      whiteboardHistory.set(sessionId, [])
      whiteboardDocuments.set(sessionId, []) // Also clear documents? Probably yes if "Clear Canvas"
      // Save clear action to DB
      saveWhiteboardState(sessionId, { type: 'clear', id: Date.now().toString() });
      
      // Also delete all documents from DB for this session?
      // Or we can just let them be orphan? No, cleaner to delete.
      // But we don't have easy way to delete all docs for session without liveSessionId.
      // We can fetch session first.
      try {
          const anyPrisma = prisma as any;
          if (anyPrisma.whiteboardDocument) {
             // We need liveSessionId. We can't get it easily without query.
             // Async fire and forget
             prisma.liveSession.findUnique({ where: { sessionId } }).then(ls => {
                 if (ls) {
                     anyPrisma.whiteboardDocument.deleteMany({ where: { liveSessionId: ls.id } }).catch(() => {});
                 }
             }).catch(() => {});
          }
      } catch (e) {}
    }
    socket.to(sessionId).emit("whiteboard-clear")
    // Also emit doc delete all? Client clears everything on 'whiteboard-clear' usually.
    // Whiteboard.tsx:
    // const handleClear = useCallback(() => { ... clearCanvas(); setStickyNotes([]); ... });
    // It does NOT clear documents in setDocuments([])!
    // We should probably emit a specific event or update Whiteboard.tsx to clear docs too.
    // But for now let's leave it as is to match client behavior.
    // Wait, if server clears docs but client doesn't, they will be out of sync.
    // Let's check Whiteboard.tsx handleClear.
  })

  socket.on("get-whiteboard-history", async ({ sessionId }) => {
    let history = whiteboardHistory.get(sessionId) || []
    let documents = whiteboardDocuments.get(sessionId) || []
    
    // If in-memory empty, try DB
    if (history.length === 0 && documents.length === 0) {
      try {
        const anyPrisma = prisma as any;
        if (anyPrisma.whiteboardState && anyPrisma.whiteboardDocument) {
           const liveSession = await prisma.liveSession.findUnique({ where: { sessionId } });
           if (liveSession) {
               // Load History
               const states = await anyPrisma.whiteboardState.findMany({
                   where: { liveSessionId: liveSession.id },
                   orderBy: { timestamp: 'asc' }
               });
               if (states.length > 0) {
                   history = states.map((s: any) => {
                     try { return JSON.parse(s.action); } catch { return null; }
                   }).filter(Boolean);
                   whiteboardHistory.set(sessionId, history);
               }

               // Load Documents
               const docs = await anyPrisma.whiteboardDocument.findMany({
                   where: { liveSessionId: liveSession.id },
                   orderBy: { createdAt: 'asc' }
               });
               if (docs.length > 0) {
                   documents = docs.map((d: any) => {
                       try { return JSON.parse(d.data); } catch { return null; }
                   }).filter(Boolean);
                   whiteboardDocuments.set(sessionId, documents);
               }
           }
        }
      } catch (e) {
        console.error("Error fetching whiteboard history from DB:", e);
      }
    }

    socket.emit("whiteboard-history", { history, documents })
  })

  socket.on("whiteboard-doc-add", ({ sessionId, doc }) => {
      if (!sessionId || !doc) return;
      
      // Update in-memory
      if (!whiteboardDocuments.has(sessionId)) {
          whiteboardDocuments.set(sessionId, []);
      }
      const docs = whiteboardDocuments.get(sessionId)!;
      // Avoid duplicates
      if (!docs.some(d => d.id === doc.id)) {
          docs.push(doc);
      }
      
      // Persist
      saveWhiteboardDocument(sessionId, doc);
      
      // Broadcast
      socket.to(sessionId).emit("whiteboard-doc-add", { doc });
  });

  socket.on("whiteboard-doc-update", ({ sessionId, docId, updates }) => {
      if (!sessionId || !docId) return;

      // Update in-memory
      const docs = whiteboardDocuments.get(sessionId);
      if (docs) {
          const docIndex = docs.findIndex(d => d.id === docId);
          if (docIndex !== -1) {
              docs[docIndex] = { ...docs[docIndex], ...updates };
          }
      }

      // Persist
      updateWhiteboardDocument(docId, updates);

      // Broadcast
      socket.to(sessionId).emit("whiteboard-doc-update", { docId, updates });
  });

  socket.on("whiteboard-doc-delete", ({ sessionId, docId }) => {
      if (!sessionId || !docId) return;

      // Update in-memory
      const docs = whiteboardDocuments.get(sessionId);
      if (docs) {
          whiteboardDocuments.set(sessionId, docs.filter(d => d.id !== docId));
      }

      // Persist
      deleteWhiteboardDocument(docId);

      // Broadcast
      socket.to(sessionId).emit("whiteboard-doc-delete", { docId });
  });

  socket.on("whiteboard-image", ({ sessionId, imageUrl }) => {
    socket.to(sessionId).emit("whiteboard-image", imageUrl)
  })

  socket.on("chat-message", ({ sessionId, message }) => {
    socket.to(sessionId).emit("chat-message", message)
  })

  socket.on("file-shared", ({ sessionId, file }) => {
    socket.to(sessionId).emit("file-shared", file)
  })

  socket.on("shared-notes-update", ({ sessionId, notes }) => {
    socket.to(sessionId).emit("shared-notes-update", notes)
  })

  socket.on("notes-typing", ({ sessionId, userName }) => {
    socket.to(sessionId).emit("notes-typing", userName)
  })

  // Admin actions (mute, kick, request-unmute)
  socket.on("admin-action", ({ action, targetId, sessionId }) => {
    console.log(`Admin action: ${action} on ${targetId} in session ${sessionId}`)
    io.to(targetId).emit("admin-command", { action, sessionId })
  })

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id)

    // Clean up from all sessions
    sessionUsers.forEach(async (users, sessionId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        // Notify others in the session
        socket.to(sessionId).emit("user-left", { socketId: socket.id });
        console.log(`[Session] User ${socket.id} left session ${sessionId}`);

        // Mark participant as left in database
        try {
          await prisma.liveSessionParticipant.updateMany({
            where: {
              socketId: socket.id,
              leftAt: null
            },
            data: {
              leftAt: new Date()
            }
          });
          console.log(`[Session] Marked participant ${socket.id} as left in database`);
        } catch (dbErr) {
          console.error(`[Session] Failed to mark participant as left:`, dbErr);
        }

        // Remove session from memory if empty
        if (users.size === 0) {
          sessionUsers.delete(sessionId);
          console.log(`[Session] Session ${sessionId} is empty, removing from memory`);
        }
      }
    });

    // Clean up session keys
    socketSessions.forEach(key => {
      if (key.startsWith(socket.id)) {
        socketSessions.delete(key);
      }
    });
  })
})

// Preflight handler - Allow all origins
app.options(
  "*",
  cors({
    origin: true, // Allow all origins
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  }),
)

// Serve static uploads
app.use("/uploads", (req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
  next()
})

// JWT auth helpers
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required for security. Server cannot start without it.');
}
const JWT_SECRET = process.env.JWT_SECRET

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers?.cookie || ""
  return header.split(";").reduce(
    (acc: Record<string, string>, part: string) => {
      const [key, ...v] = part.trim().split("=")
      if (!key) return acc
      acc[key] = decodeURIComponent(v.join("="))
      return acc
    },
    {} as Record<string, string>,
  )
}

function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void | Response {
  const cookies = parseCookies(req)
  const headerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice("Bearer ".length)
    : undefined

  // Helper to verify token and return decoded payload or null
  const verify = (token: string | undefined): any | null => {
    if (!token) return null
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch {
      return null
    }
  }

  // Try to validate tokens in order of precedence: Header -> Admin Cookie -> Auth Cookie
  // This ensures that if a header token is stale (e.g. from localStorage), we fall back to a valid cookie
  const decoded = verify(headerToken) || verify(cookies["admin_token"]) || verify(cookies["auth_token"])

  if (decoded) {
    req.user = decoded
    next()
  } else {
    res.status(401).json({ success: false, error: "Unauthorized" })
  }
}

function authorizeRoles(
  ...allowedRoles: string[]
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: "Forbidden" })
      return
    }
    next()
  }
}

// Ensure credentials table exists
async function ensureCredentialsTable(): Promise<void> {
  const db = await getConnection()
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_credentials (
        email TEXT PRIMARY KEY,
        user_id TEXT,
        password_hash TEXT,
        created_at TEXT,
        updated_at TEXT
      );
    `)
  } finally {
    await db.close()
  }
}

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex")
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(`scrypt:${salt}:${derivedKey.toString("hex")}`)
    })
  })
}

async function ensureNotificationsTable(): Promise<void> {
  const db = await getConnection()
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT,
        status TEXT,
        created_at TEXT NOT NULL,
        read INTEGER DEFAULT 0
      );
    `)
  } finally {
    await db.close()
  }
}

async function ensureAdminUsersTable(): Promise<void> {
  const db = await getConnection()
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        display_name TEXT,
        email TEXT UNIQUE,
        personal_email TEXT,
        password_hash TEXT NOT NULL,
        permissions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
  } finally {
    await db.close()
  }
}

async function seedAdminFromEnv(): Promise<void> {
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ""
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"
  try {
    const anyPrisma: any = prisma as any
    if (anyPrisma.adminUser && typeof anyPrisma.adminUser.findFirst === "function") {
      const existing =
        (await anyPrisma.adminUser.findFirst({
          where: {
            OR: [{ username: ADMIN_USERNAME }, { email: ADMIN_EMAIL }],
          },
        })) || null
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
      const companyEmail = makeCompanyEmail(ADMIN_USERNAME)
      const personalEmail = ADMIN_EMAIL || null
      if (!existing) {
        await anyPrisma.adminUser.create({
          data: {
            username: ADMIN_USERNAME,
            displayName: process.env.ADMIN_DISPLAY_NAME || ADMIN_USERNAME,
            email: companyEmail,
            personalEmail: process.env.ADMIN_PERSONAL_EMAIL || personalEmail,
            permissions: "superadmin",
            passwordHash,
          },
        })
        console.log("✓ Admin user created successfully")
      } else {
        await anyPrisma.adminUser.update({
          where: { id: existing.id },
          data: {
            username: ADMIN_USERNAME,
            email: companyEmail,
            passwordHash,
            displayName: process.env.ADMIN_DISPLAY_NAME || ADMIN_USERNAME,
            personalEmail: process.env.ADMIN_PERSONAL_EMAIL || personalEmail,
            permissions: existing.permissions || "superadmin",
          },
        })
        console.log("✓ Admin user updated successfully")
      }
    }
  } catch (e: any) {
    // Check if it's a table not found error (P2021)
    if (e.code === 'P2021') {
      console.warn("⚠ Admin users table does not exist yet. Please run Prisma migrations: npx prisma migrate deploy")
    } else if (e.code === 'P1001') {
        console.error("⚠ Database connection failed. Skipping admin seed.", e.message);
    } else {
      console.error("Admin seed error:", e)
    }
  }
}

async function ensureTutorRatingsTable(): Promise<void> {
  const db = await getConnection()
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tutor_ratings (
        id TEXT PRIMARY KEY,
        tutor_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TEXT NOT NULL
      );
    `)
  } finally {
    await db.close()
  }
}

// University Application content
app.get("/api/admin/content/university-application", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const record = await (prisma.universityApplicationContent as any)
      ?.findFirst({ where: { isActive: true } })
      .catch(() => null as any)
    if (record) {
      return res.json({
        success: true,
        services: record.services ?? "[]",
        requirements: record.requirements ?? "[]",
        process: record.process ?? "[]",
      })
    }
    return res.json({ success: true, services: "[]", requirements: "[]", process: "[]" })
  } catch (error) {
    console.error("University application content error:", error)
    return res.json({ success: true, services: "[]", requirements: "[]", process: "[]" })
  }
})

// Tutor ratings
app.post(
  "/api/admin/content/tutors/:id/ratings",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tutorId = String(req.params.id || "")
      const { rating, comment } = req.body || {}
      const r = Number(rating)
      if (!tutorId) return res.status(400).json({ success: false, error: "Tutor ID is required" })
      if (!Number.isFinite(r) || r < 1 || r > 5)
        return res.status(400).json({ success: false, error: "Rating must be 1-5" })

      await ensureTutorRatingsTable()
      const db = await getConnection()
      try {
        const id = globalThis.crypto?.randomUUID?.() || crypto.randomUUID()
        const now = new Date().toISOString()
        await db.run("INSERT INTO tutor_ratings (id, tutor_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)", [
          id,
          tutorId,
          r,
          String(comment || ""),
          now,
        ])
        return res.json({ success: true, id })
      } finally {
        await db.close()
      }
    } catch (error) {
      console.error("Create tutor rating error:", error)
      return res.status(500).json({ success: false, error: "Failed to submit rating" })
    }
  },
)

// Auto-place selected students into a specific course
app.post("/api/admin/students/auto-place", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentIds, courseId } = req.body || {}
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, error: "studentIds is required" })
    }
    if (!courseId) {
      return res.status(400).json({ success: false, error: "courseId is required" })
    }

    const course = await prisma.course.findUnique({ where: { id: Number(courseId) } })
    if (!course) {
      return res.status(404).json({ success: false, error: "Course not found" })
    }

    let placed = 0
    const warnings: string[] = []

    for (const sid of studentIds) {
      const userId = Number(sid)
      const student = await prisma.user.findUnique({ where: { id: userId } })
      if (!student) {
        warnings.push(`Student ${sid} not found`)
        continue
      }
      if (student.role !== "student") {
        warnings.push(`User ${sid} is role ${student.role}, skipping`)
        continue
      }

      const exists = await prisma.courseEnrollment.findFirst({
        where: { userId: userId, courseId: course.id },
      })
      if (exists) {
        warnings.push(`Student ${student.name} already enrolled in ${course.name}`)
        continue
      }

      await prisma.courseEnrollment.create({
        data: {
          userId: userId,
          courseId: course.id,
          status: "enrolled",
        },
      })
      placed++
    }

    return res.json({
      success: true,
      placed,
      total: studentIds.length,
      courseId: course.id,
      courseName: course.name,
      warnings,
    })
  } catch (error) {
    console.error("Auto-place students error:", error)
    return res.status(500).json({ success: false, error: "Failed to auto-place students" })
  }
})

// Invite tutors (admin only)
app.post(
  "/api/admin/tutors/invite",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { emails, department, tutorName } = req.body || {}
      if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ success: false, error: "emails[] is required" })
      }
      const frontendBase = process.env.FRONTEND_URL || "https://www.excellenceakademie.co.za"
      const results: any[] = []

      for (const email of emails) {
        const clean = String(email || "")
          .trim()
          .toLowerCase()
        if (!clean || !clean.includes("@")) continue

        let user = await prisma.user.findUnique({ where: { email: clean } })
        let isNewUser = false
        let tempPassword = ""

        if (!user) {
          isNewUser = true
          tempPassword = crypto.randomBytes(4).toString("hex") + Math.floor(Math.random() * 100)

          const name = clean.split("@")[0]
          user = await prisma.user.create({
            data: {
              email: clean,
              name: name,
              role: "tutor",
              department_id: department || null,
            },
          })

          const hash = await hashPassword(tempPassword)
          const db = await getConnection()
          try {
            const now = new Date().toISOString()
            await db.run(
            `INSERT INTO user_credentials (email, user_id, password_hash, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash, user_id=excluded.user_id, updated_at=excluded.updated_at RETURNING email`,
            [clean, user.id, hash, now, now],
          )
          } finally {
            await db.close()
          }
        }

        if (isNewUser) {
          const link = `${frontendBase.replace(/\/$/, "")}/tutor/login`
          const content = renderStudentCredentialsEmail({
            recipientName: user.name,
            studentNumber: "N/A",
            studentEmail: clean,
            tempPassword,
            loginUrl: link,
            courseName: department,
          })
          const send = await sendEmail({
            to: clean,
            subject: "Tutor Account Credentials - Excellence Academia",
            content,
          })
          results.push({ email: clean, sent: !!send.success, tempPassword })
        } else {
          results.push({ email: clean, error: "User already exists" })
        }
      }
      
      if (results.some(r => r.sent)) {
         const io = req.app.get("io")
         io.emit("user-updated", { role: "tutor", action: "invite" })
         io.emit("admin-stats-updated")
      }

      return res.json({ success: true, invited: results })
    } catch (error) {
      console.error("Tutor invite error:", error)
      return res.status(500).json({ success: false, error: "Failed to send tutor invitations" })
    }
  },
)

// Send credentials to existing tutors (admin only)
app.post(
  "/api/admin/tutors/send-credentials",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { tutorIds, subject, message } = req.body || {}
      if (!Array.isArray(tutorIds) || tutorIds.length === 0) {
        return res.status(400).json({ success: false, error: "tutorIds[] is required" })
      }

      const frontendBase = process.env.FRONTEND_URL || "https://www.excellenceakademie.co.za"
      const results: any[] = []

      for (const tutorId of tutorIds) {
        try {
          // Get tutor details with courses and enrollments
          const tutor = await prisma.user.findUnique({ 
            where: { id: parseInt(tutorId) },
            include: {
              courses: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  department: true
                }
              }
            }
          })

          if (!tutor || tutor.role !== "tutor") {
            results.push({ tutorId, error: "Tutor not found" })
            continue
          }

          // Check if tutor has a personal email
          if (!tutor.personalEmail || tutor.personalEmail.trim() === "") {
            results.push({ 
              tutorId, 
              name: tutor.name,
              systemEmail: tutor.email,
              error: "No personal email found - credentials cannot be sent" 
            })
            continue
          }

          // Validate personal email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(tutor.personalEmail)) {
            results.push({ 
              tutorId, 
              name: tutor.name,
              personalEmail: tutor.personalEmail,
              error: "Invalid personal email format" 
            })
            continue
          }

          // Generate password using the same method as PDF export
          const tempPassword = generatePasswordFromName(tutor.name)
          const hash = await hashPassword(tempPassword)

          // Update password in database (still use system email for login)
          const db = await getConnection()
          try {
            const now = new Date().toISOString()
            await db.run(
              `INSERT INTO user_credentials (email, user_id, password_hash, created_at, updated_at)
               VALUES (?, ?, ?, ?::timestamp, ?::timestamp)
               ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash, updated_at=excluded.updated_at RETURNING email`,
              [tutor.email, tutor.id, hash, now, now]
            )
          } finally {
            await db.close()
          }

          // Get tutor's courses and departments (same logic as PDF export)
          const tutorCourses = tutor.courses || []
          const courseNames = tutorCourses.map(course => course.name)
          const courseDepartments = [...new Set(tutorCourses.map(course => course.department).filter(Boolean))]
          
          // Primary department from tutor profile, fallback to course departments
          const primaryDepartment = tutor.department || courseDepartments[0] || "General"
          
          // All departments (tutor's primary + course departments)
          const allDepartments = [...new Set([
            tutor.department,
            ...courseDepartments
          ].filter(Boolean))]

          // Create email content
          const loginUrl = `https://www.excellenceakademie.co.za/tutor-login`
          
          const emailContent = renderTutorCredentialsEmail({
            recipientName: tutor.name,
            tutorEmail: tutor.email, // System email for login
            personalEmail: tutor.personalEmail, // Personal email for display
            tempPassword,
            loginUrl,
            department: primaryDepartment,
            allDepartments: allDepartments.join(", "),
            courses: courseNames.join(", ") || "No courses assigned",
            courseCount: courseNames.length,
            additionalMessage: message || ""
          })

          // Send email to PERSONAL EMAIL
          const emailResult = await sendEmail({
            to: tutor.personalEmail, // Send to personal email
            subject: subject || "Your Tutor Account Credentials - Excellence Academia",
            content: emailContent,
          })

          results.push({ 
            tutorId, 
            systemEmail: tutor.email,
            personalEmail: tutor.personalEmail,
            name: tutor.name,
            department: primaryDepartment,
            allDepartments: allDepartments,
            courses: courseNames,
            courseCount: courseNames.length,
            sent: !!emailResult.success, 
            tempPassword: emailResult.success ? tempPassword : undefined,
            error: !emailResult.success ? "Failed to send email" : undefined
          })

        } catch (error) {
          console.error(`Error processing tutor ${tutorId}:`, error)
          results.push({ tutorId, error: "Processing failed" })
        }
      }

      // Emit socket events for real-time updates
      if (results.some(r => r.sent)) {
        const io = req.app.get("io")
        io.emit("user-updated", { role: "tutor", action: "credentials-sent" })
        io.emit("admin-stats-updated")
      }

      // Separate successful sends from failures
      const successful = results.filter(r => r.sent)
      const failed = results.filter(r => !r.sent)
      const noPersonalEmail = results.filter(r => r.error && r.error.includes("personal email"))

      return res.json({ 
        success: true, 
        sent: successful.length,
        failed: failed.length,
        noPersonalEmail: noPersonalEmail.length,
        results,
        summary: {
          total: tutorIds.length,
          successful: successful.length,
          failed: failed.length,
          noPersonalEmail: noPersonalEmail.length
        }
      })

    } catch (error) {
      console.error("Send tutor credentials error:", error)
      return res.status(500).json({ success: false, error: "Failed to send tutor credentials" })
    }
  },
)

// Send credentials to existing admins (admin only)
app.post(
  "/api/admin/admins/send-credentials",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await ensureAdminUsersTable()
      const { adminIds, subject, message } = req.body || {}
      if (!Array.isArray(adminIds) || adminIds.length === 0) {
        return res.status(400).json({ success: false, error: "adminIds[] is required" })
      }

      const frontendBase = process.env.FRONTEND_URL || "https://www.excellenceakademie.co.za"
      const results: any[] = []

      for (const adminId of adminIds) {
        try {
          // Get admin details
          const admin = await prisma.adminUser.findUnique({ 
            where: { id: parseInt(adminId) }
          })

          if (!admin) {
            results.push({ adminId, error: "Admin not found" })
            continue
          }

          // Check if admin has a personal email
          if (!admin.personalEmail || admin.personalEmail.trim() === "") {
            results.push({ 
              adminId, 
              name: admin.displayName || admin.username,
              systemEmail: admin.email,
              error: "No personal email found - credentials cannot be sent" 
            })
            continue
          }

          // Validate personal email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(admin.personalEmail)) {
            results.push({ 
              adminId, 
              name: admin.displayName || admin.username,
              personalEmail: admin.personalEmail,
              error: "Invalid personal email format" 
            })
            continue
          }

          // Generate password using the same method as PDF export
          const tempPassword = generatePasswordFromName(admin.displayName || admin.username)
          const passwordHash = await bcrypt.hash(tempPassword, 10)

          // Update password in adminUser table
          await prisma.adminUser.update({
            where: { id: admin.id },
            data: { passwordHash }
          })

          // Create email content
          const loginUrl = `${frontendBase.replace(/\/$/, "")}/admin-login`
          
          const emailContent = renderAdminCredentialsEmail({
            recipientName: admin.displayName || admin.username,
            adminEmail: admin.email, // System email for login
            personalEmail: admin.personalEmail, // Personal email for display
            tempPassword,
            loginUrl,
            additionalMessage: message || ""
          })

          // Send email to PERSONAL EMAIL
          const emailResult = await sendEmail({
            to: admin.personalEmail, // Send to personal email
            subject: subject || "Your Admin Account Credentials - Excellence Academia",
            content: emailContent,
          })

          results.push({ 
            adminId, 
            systemEmail: admin.email,
            personalEmail: admin.personalEmail,
            name: admin.displayName || admin.username,
            sent: !!emailResult.success, 
            tempPassword: emailResult.success ? tempPassword : undefined,
            error: !emailResult.success ? "Failed to send email" : undefined
          })

        } catch (error) {
          console.error(`Error processing admin ${adminId}:`, error)
          results.push({ adminId, error: "Processing failed" })
        }
      }

      // Emit socket events for real-time updates
      if (results.some(r => r.sent)) {
        const io = req.app.get("io")
        io.emit("user-updated", { role: "admin", action: "credentials-sent" })
        io.emit("admin-stats-updated")
      }

      // Separate successful sends from failures
      const successful = results.filter(r => r.sent)
      const failed = results.filter(r => !r.sent)
      const noPersonalEmail = results.filter(r => r.error && r.error.includes("personal email"))

      return res.json({ 
        success: true, 
        sent: successful.length,
        failed: failed.length,
        noPersonalEmail: noPersonalEmail.length,
        results,
        summary: {
          total: adminIds.length,
          successful: successful.length,
          failed: failed.length,
          noPersonalEmail: noPersonalEmail.length
        }
      })

    } catch (error) {
      console.error("Send admin credentials error:", error)
      return res.status(500).json({ success: false, error: "Failed to send admin credentials" })
    }
  },
)

// Preview admin credentials email (admin only)
app.post(
  "/api/admin/admins/credentials-preview",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await ensureAdminUsersTable()
      const { adminId, subject, message } = req.body || {}
      
      if (!adminId) {
        return res.status(400).json({ success: false, error: "adminId is required" })
      }

      // Get admin details for preview
      const admin = await prisma.adminUser.findUnique({ 
        where: { id: parseInt(adminId) }
      })

      if (!admin) {
        return res.status(404).json({ success: false, error: "Admin not found" })
      }

      // Prepare preview data
      const frontendBase = process.env.FRONTEND_URL || "https://www.excellenceakademie.co.za"
      const loginUrl = `${frontendBase.replace(/\/$/, "")}/admin-login`
      
      // Generate preview email content
      const emailContent = renderAdminCredentialsEmail({
        recipientName: admin.displayName || admin.username,
        adminEmail: admin.email,
        personalEmail: admin.personalEmail || undefined,
        tempPassword: "PREVIEW123", // Sample password for preview
        loginUrl,
        additionalMessage: message || ""
      })

      return res.json({ 
        success: true, 
        preview: {
          html: emailContent,
          subject: subject || "Your Admin Account Credentials - Excellence Academia",
          recipientName: admin.displayName || admin.username,
          personalEmail: admin.personalEmail,
          systemEmail: admin.email,
          hasPersonalEmail: !!admin.personalEmail
        }
      })

    } catch (error) {
      console.error("Admin credentials preview error:", error)
      return res.status(500).json({ success: false, error: "Failed to generate preview" })
    }
  },
)

// Send credentials to existing students (admin only)
app.post(
  "/api/admin/students/send-credentials",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { studentIds, subject, message } = req.body || {}
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ success: false, error: "studentIds[] is required" })
      }

      const frontendBase = process.env.FRONTEND_URL || "https://www.excellenceakademie.co.za"
      const results: any[] = []

      for (const studentId of studentIds) {
        try {
          // Get student details with courses and enrollments
          const student = await prisma.user.findUnique({ 
            where: { id: parseInt(studentId) },
            include: {
              courseEnrollments: {
                include: {
                  course: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      department: true
                    }
                  }
                }
              }
            }
          })

          if (!student || student.role !== "student") {
            results.push({ studentId, error: "Student not found" })
            continue
          }

          // Check if student has a personal email
          if (!student.personalEmail || student.personalEmail.trim() === "") {
            results.push({ 
              studentId, 
              name: student.name,
              systemEmail: student.email,
              error: "No personal email found - credentials cannot be sent" 
            })
            continue
          }

          // Validate personal email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(student.personalEmail)) {
            results.push({ 
              studentId, 
              name: student.name,
              personalEmail: student.personalEmail,
              error: "Invalid personal email format" 
            })
            continue
          }

          // Generate password using the same method as PDF export
          const tempPassword = generatePasswordFromName(student.name)
          const hash = await hashPassword(tempPassword)

          // Update password in database (still use system email for login)
          const db = await getConnection()
          try {
            const now = new Date().toISOString()
            await db.run(
              `INSERT INTO user_credentials (email, user_id, password_hash, created_at, updated_at)
               VALUES (?, ?, ?, ?::timestamp, ?::timestamp)
               ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash, updated_at=excluded.updated_at RETURNING email`,
              [student.email, student.id, hash, now, now]
            )
          } finally {
            await db.close()
          }

          // Get student's courses and departments
          const studentCourses = student.courseEnrollments?.map(enrollment => enrollment.course) || []
          const courseNames = studentCourses.map(course => course.name)
          const courseDepartments = [...new Set(studentCourses.map(course => course.department).filter(Boolean))]
          
          // Primary department from student profile, fallback to course departments
          const primaryDepartment = student.department || courseDepartments[0] || "General"
          
          // All departments (student's primary + course departments)
          const allDepartments = [...new Set([
            student.department,
            ...courseDepartments
          ].filter(Boolean))]

          // Create email content
          const loginUrl = `https://www.excellenceakademie.co.za/student-login`
          
          const emailContent = renderStudentCredentialsEmail({
            recipientName: student.name,
            studentNumber: student.studentNumber || "N/A",
            studentEmail: student.email, // System email for login
            personalEmail: student.personalEmail, // Personal email for display
            tempPassword,
            loginUrl,
            department: primaryDepartment,
            allDepartments: allDepartments.join(", "),
            courses: courseNames.join(", ") || "No courses enrolled",
            courseCount: courseNames.length,
            additionalMessage: message || ""
          })

          // Send email to PERSONAL EMAIL
          const emailResult = await sendEmail({
            to: student.personalEmail, // Send to personal email
            subject: subject || "Your Student Account Credentials - Excellence Academia",
            content: emailContent,
          })

          results.push({ 
            studentId, 
            systemEmail: student.email,
            personalEmail: student.personalEmail,
            name: student.name,
            studentNumber: student.studentNumber,
            department: primaryDepartment,
            allDepartments: allDepartments,
            courses: courseNames,
            courseCount: courseNames.length,
            sent: !!emailResult.success, 
            tempPassword: emailResult.success ? tempPassword : undefined,
            error: !emailResult.success ? "Failed to send email" : undefined
          })

        } catch (error) {
          console.error(`Error processing student ${studentId}:`, error)
          results.push({ studentId, error: "Processing failed" })
        }
      }

      // Emit socket events for real-time updates
      if (results.some(r => r.sent)) {
        const io = req.app.get("io")
        io.emit("user-updated", { role: "student", action: "credentials-sent" })
        io.emit("admin-stats-updated")
      }

      // Separate successful sends from failures
      const successful = results.filter(r => r.sent)
      const failed = results.filter(r => !r.sent)
      const noPersonalEmail = results.filter(r => r.error && r.error.includes("personal email"))

      return res.json({ 
        success: true, 
        sent: successful.length,
        failed: failed.length,
        noPersonalEmail: noPersonalEmail.length,
        results,
        summary: {
          total: studentIds.length,
          successful: successful.length,
          failed: failed.length,
          noPersonalEmail: noPersonalEmail.length
        }
      })

    } catch (error) {
      console.error("Send student credentials error:", error)
      return res.status(500).json({ success: false, error: "Failed to send student credentials" })
    }
  },
)

// Preview tutor credentials email (admin only)
app.post(
  "/api/admin/tutors/credentials-preview",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { tutorId, subject, message } = req.body || {}
      
      if (!tutorId) {
        return res.status(400).json({ success: false, error: "tutorId is required" })
      }

      // Get tutor details for preview
      const tutor = await prisma.user.findUnique({ 
        where: { id: parseInt(tutorId) },
        include: {
          courses: {
            select: {
              name: true,
              description: true,
              department: true
            }
          }
        }
      })

      if (!tutor || tutor.role !== "tutor") {
        return res.status(404).json({ success: false, error: "Tutor not found" })
      }

      // Prepare preview data
      const frontendBase = process.env.FRONTEND_URL || "https://www.excellenceakademie.co.za"
      const coursesList = tutor.courses?.map(c => c.name).join(", ") || "No courses assigned"
      const department = tutor.department || tutor.courses?.[0]?.department || "General"
      const loginUrl = `${frontendBase.replace(/\/$/, "")}/tutor/login`
      
      // Generate preview email content
      const emailContent = renderTutorCredentialsEmail({
        recipientName: tutor.name,
        tutorEmail: tutor.email,
        personalEmail: tutor.personalEmail || undefined,
        tempPassword: "PREVIEW123", // Sample password for preview
        loginUrl,
        department,
        courses: coursesList,
        additionalMessage: message || ""
      })

      return res.json({ 
        success: true, 
        preview: {
          html: emailContent,
          subject: subject || "Your Tutor Account Credentials - Excellence Academia",
          recipientName: tutor.name,
          personalEmail: tutor.personalEmail,
          systemEmail: tutor.email,
          department,
          courses: coursesList,
          hasPersonalEmail: !!tutor.personalEmail
        }
      })

    } catch (error) {
      console.error("Tutor credentials preview error:", error)
      return res.status(500).json({ success: false, error: "Failed to generate preview" })
    }
  },
)

// Student auth: login
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ success: false, error: "Email and password are required" })
    
    const userEmail = String(email).toLowerCase()
    
    // 1. Check Prisma User table (bcrypt) - Primary for seeded/new users
    let user = await prisma.user.findUnique({ where: { email: userEmail } })
    let isAuthenticated = false

    if (user && user.password_hash) {
      // Check if it's a bcrypt hash (starts with $2)
      if (user.password_hash.startsWith('$2')) {
        isAuthenticated = await bcrypt.compare(String(password), user.password_hash)
      }
    }

    // 2. Fallback: Check user_credentials table (scrypt) - For legacy/specific tool users
    if (!isAuthenticated) {
      await ensureCredentialsTable()
      const db = await getConnection()
      try {
        const row = await db.get("SELECT * FROM user_credentials WHERE email = ?", [userEmail])
        
        if (row && row.password_hash) {
          const [scheme, salt, stored] = String(row.password_hash).split(":")
          if (scheme === "scrypt" && salt && stored) {
            const derived = await new Promise<string>((resolve, reject) => {
              crypto.scrypt(String(password), salt, 64, (err, dk) => (err ? reject(err) : resolve(dk.toString("hex"))))
            })
            if (derived === stored) {
              isAuthenticated = true
              // If user wasn't found in Prisma but exists in credentials, we might need to handle that
              // But usually they should exist in Prisma too if they are in credentials
              if (!user) {
                 user = await prisma.user.findUnique({ where: { email: userEmail } })
              }
            }
          }
        }
      } finally {
        await db.close()
      }
    }

    if (!isAuthenticated || !user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" })
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" })
    const secure = process.env.NODE_ENV === "production" ? " Secure;" : ""
    res.setHeader(
      "Set-Cookie",
      `auth_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax;${secure}`,
    )
    return res.json({ success: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } })
  } catch (error) {
    console.error("Login error:", error)
    return res.status(500).json({ success: false, error: "Login failed" })
  }
})

// Student auth: logout
app.post("/api/auth/logout", (req: Request, res: Response) => {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : ""
  res.setHeader("Set-Cookie", `auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax;${secure}`)
  return res.json({ success: true })
})

// Current user
app.get("/api/auth/me", authenticateJWT as RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, user: req.user })
})

// List users - ADMIN ONLY, returns students by default
app.get("/api/users", authenticateJWT as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role
    const userId = req.user?.id

    // Default: only return students (not tutors, not admins)
    let where: any = { role: "student" }

    // If tutor is calling, only return their students
    if (userRole === "tutor" && userId) {
      // Get tutor's courses
      const tutorCourses = await safeQuery(() => prisma.course.findMany({
        where: { tutorId: userId },
        select: { id: true }
      })) || []
      const courseIds = tutorCourses.map(c => c.id)

      // Get students enrolled in those courses
      const enrollments = await safeQuery(() => prisma.courseEnrollment.findMany({
        where: { courseId: { in: courseIds } },
        select: { userId: true },
        distinct: ['userId']
      })) || []
      const studentIds = enrollments.map(e => e.userId)

      where = {
        id: { in: studentIds },
        role: "student"
      }
    }

    const users = await safeQuery(() => prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" }
    })) || []

    return res.json({ success: true, data: users })
  } catch (error) {
    console.error("List users error:", error)
    return res.status(500).json({ success: false, error: "Failed to list users" })
  }
})

// List students for a specific tutor
app.get("/api/tutor/:tutorId/students", authenticateJWT as RequestHandler, authorizeRoles("tutor", "admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tutorId = Number.parseInt(req.params.tutorId)
    if (isNaN(tutorId)) {
      return res.status(400).json({ success: false, error: "Invalid tutor ID" })
    }

    const courses = await safeQuery(() => prisma.course.findMany({
      where: { tutorId },
      include: {
        courseEnrollments: {
          include: { user: true },
        },
      },
    })) || []

    const studentMap = new Map()
    courses.forEach((course) => {
      course.courseEnrollments.forEach((enrollment) => {
        const student = enrollment.user
        if (student && student.role === "student") {
          if (!studentMap.has(student.id)) {
            studentMap.set(student.id, {
              ...student,
              enrolledCourses: [course],
            })
          } else {
            const existing = studentMap.get(student.id)
            if (!existing.enrolledCourses.find((c: any) => c.id === course.id)) {
              existing.enrolledCourses.push(course)
            }
          }
        }
      })
    })

    const students = Array.from(studentMap.values())
    return res.json({ success: true, data: students })
  } catch (error) {
    console.error("List tutor students error:", error)
    return res.status(500).json({ success: false, error: "Failed to list tutor students" })
  }
})

// Admin stats for analytics
app.get("/api/admin/stats", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Execute sequentially to avoid exhausting connection pool
    const tutorsCount = await safeQuery(() => prisma.tutor.count({ where: { isActive: true } })).then(r => r ?? 0)
    const subjectsCount = await safeQuery(() => prisma.subject.count({ where: { isActive: true } })).then(r => r ?? 0)
    const testimonialsCount = await safeQuery(() => prisma.testimonial.count({ where: { isActive: true } })).then(r => r ?? 0)
    const activeAnnouncementsCount = await safeQuery(() => prisma.announcement.count().catch(() => 0)).then(r => r ?? 0)
    const totalStudents = await safeQuery(() => prisma.user.count({ where: { role: "student" } })).then(r => r ?? 0)
    const totalTutors = await safeQuery(() => prisma.user.count({ where: { role: "tutor" } })).then(r => r ?? 0)
    const totalCourses = await safeQuery(() => prisma.course.count()).then(r => r ?? 0)

    const totalUsers = totalStudents + totalTutors
    const activeStudents = Math.round(totalStudents * 0.7)
    const activeUsers = Math.round(totalUsers * 0.75)

    res.set("Cache-Control", "public, max-age=300")
    return res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalStudents,
        activeStudents,
        totalTutors,
        activeTutors: tutorsCount,
        courses: totalCourses,
        activeCourses: totalCourses,
        tutors: tutorsCount,
        subjects: subjectsCount,
        testimonials: testimonialsCount,
        announcements: activeAnnouncementsCount,
        completionRate: 75,
        averageGrade: 82,
        monthlyGrowth: 12,
        courseStats: [],
        monthlyData: [],
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return res.status(500).json({ success: false, error: "Failed to load stats" })
  }
})

app.get("/api/admin/users", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roleParam = (req.query.role ?? "").toString().trim()
    const where = roleParam ? { role: roleParam } : {}

    const users = await safeQuery(() => prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })) || []

    const data = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      personalEmail: u.personalEmail,
      role: u.role,
      department: u.department,
      subjects: u.subjects,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }))
    return res.json({ success: true, data })
  } catch (error) {
    console.error("Admin users fetch error:", error)
    return res.status(500).json({ success: false, error: "Failed to load users" })
  }
})

app.get("/api/admin/admin-users", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureAdminUsersTable()
    
    const admins = await safeQuery(() => prisma.adminUser.findMany({
      orderBy: { createdAt: "desc" },
    })) || []

    const data = admins.map((a) => ({
      id: a.id,
      username: a.username,
      displayName: a.displayName,
      email: a.email,
      personalEmail: a.personalEmail,
      permissions: a.permissions,
      createdAt: a.createdAt,
    }))
    return res.json({ success: true, data })
  } catch (error) {
    console.error("Admin admin-users fetch error:", error)
    return res.status(500).json({ success: false, error: "Failed to load admin users" })
  }
})

// Debug endpoint to check tutor data
app.get("/api/debug/tutors", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "tutor" },
      select: {
        id: true,
        name: true,
        email: true,
        personalEmail: true,
        department: true,
        subjects: true,
        createdAt: true
      }
    })

    const tutorTable = await prisma.tutor.findMany({
      select: {
        id: true,
        name: true,
        contactEmail: true,
        subjects: true,
        isActive: true
      }
    })

    return res.json({
      success: true,
      userTableTutors: users,
      tutorTable: tutorTable,
      counts: {
        userTableTutors: users.length,
        tutorTable: tutorTable.length
      }
    })
  } catch (error) {
    console.error("Debug tutors error:", error)
    return res.status(500).json({ success: false, error: "Failed to fetch debug data" })
  }
})

app.post("/api/admin/admin-users/bulk-upload", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureAdminUsersTable()
    const { fileContent, fileType } = req.body || {}
    if (!fileContent) return res.status(400).json({ error: "No file content provided" })

    let entries: any[] = []

    if (fileType === "json") {
      const parsed = JSON.parse(fileContent)
      entries = Array.isArray(parsed) ? parsed : parsed.admins || parsed.entries || []
    } else if (fileType === "csv") {
      const lines = fileContent.trim().split("\n")
      if (lines.length < 2) throw new Error("CSV must have header and data rows")
      const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase())
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        if (values.length === 0) continue
        const row: any = {}
        headers.forEach((header: string, index: number) => {
          if (values[index] !== undefined) row[header] = values[index].trim()
        })
        entries.push(row)
      }
    } else {
      return res.status(400).json({ error: "Unsupported file type" })
    }

    if (!entries || entries.length === 0) {
      return res.status(400).json({ error: "No admin user data found" })
    }

    const warnings: string[] = []
    let created = 0
    let updated = 0

    for (const item of entries) {
      const usernameRaw = item.username || item.user || ""
      const emailRaw = item.email || ""
      const username = String(usernameRaw || "").trim()
      const email = String(emailRaw || "").trim() || null

      if (!username) {
        warnings.push("Row with missing username was skipped")
        continue
      }

      const displayName = item.displayName || item.name || username
      const personalEmail = item.personalEmail || item.personal_email || null
      const permissions = item.permissions || null

      const existing = await prisma.adminUser.findUnique({
        where: { username },
      })

      const normalizedUsername = username.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "")
      const companyDomain =
        process.env.COMPANY_DOMAIN ||
        (() => {
          const frontend = process.env.FRONTEND_URL
          if (!frontend) return "excellenceakademie.co.za"
          try {
            const host = new URL(frontend).hostname.toLowerCase()
            return host.replace(/^www\./, "")
          } catch {
            return "excellenceakademie.co.za"
          }
        })()
      const companyEmail = email || `${normalizedUsername || "admin"}@${companyDomain}`
      const finalPersonalEmail = personalEmail || email || null

      if (existing) {
        await prisma.adminUser.update({
          where: { username },
          data: {
            displayName,
            email: companyEmail,
            personalEmail: finalPersonalEmail,
            permissions,
          },
        })
        updated++
      } else {
        // Generate a secure random password (16 chars: alphanumeric + special)
        const rawPassword = crypto.randomBytes(12).toString('base64').slice(0, 16) + '!Aa1'
        const passwordHash = await bcrypt.hash(rawPassword, 10)
        await prisma.adminUser.create({
          data: {
            username,
            displayName,
            email: companyEmail,
            personalEmail: finalPersonalEmail,
            permissions,
            passwordHash,
          },
        })
        created++
      }
    }

    return res.json({
      message: "Admin users processed successfully",
      total: entries.length,
      created,
      updated,
      warnings,
    })
  } catch (error) {
    console.error("Admin users bulk upload error:", error)
    return res.status(500).json({ success: false, error: "Failed to process admin users file" })
  }
})

app.put(
  "/api/admin/admin-users/profile",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await ensureAdminUsersTable()
      const { username: nextUsername, displayName, personalEmail } = req.body || {}
      const currentUsername = String(req.user?.username || "").trim()
      if (!currentUsername) return res.status(400).json({ success: false, error: "No current user" })
      const existing = await prisma.adminUser.findFirst({
        where: { OR: [{ username: currentUsername }, { email: currentUsername }, { personalEmail: currentUsername }] },
      })
      const newUsername = String(nextUsername || currentUsername).trim()
      if (existing) {
        if (newUsername !== currentUsername) {
          const dupe = await prisma.adminUser.findUnique({ where: { username: newUsername } }).catch(() => null as any)
          if (dupe) return res.status(409).json({ success: false, error: "Username already taken" })
        }
        const normalized = newUsername.toLowerCase().trim().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "")
        const companyEmail = `${normalized || "admin"}@${getCompanyDomain()}`
        const updated = await prisma.adminUser.update({
          where: { id: existing.id },
          data: {
            username: newUsername,
            displayName: displayName ?? existing.displayName,
            email: companyEmail,
            personalEmail: personalEmail ?? existing.personalEmail,
          },
        })
        const token = jwt.sign(
          { username: updated.username, role: "admin", exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 },
          JWT_SECRET,
        )
        const secure = process.env.NODE_ENV === "production" ? " Secure;" : ""
        res.setHeader("Set-Cookie", `admin_token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict;${secure}`)
        return res.json({
          success: true,
          data: {
            id: updated.id,
            username: updated.username,
            displayName: updated.displayName,
            email: updated.email,
            personalEmail: updated.personalEmail,
          },
        })
      } else {
        const normalized = newUsername.toLowerCase().trim().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "")
        const companyEmail = `${normalized || "admin"}@${getCompanyDomain()}`
        const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10)
        const created = await prisma.adminUser.create({
          data: {
            username: newUsername,
            displayName: displayName || newUsername,
            email: companyEmail,
            personalEmail: personalEmail || null,
            permissions: "superadmin",
            passwordHash,
          },
        })
        const token = jwt.sign(
          { username: created.username, role: "admin", exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 },
          JWT_SECRET,
        )
        const secure = process.env.NODE_ENV === "production" ? " Secure;" : ""
        res.setHeader("Set-Cookie", `admin_token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict;${secure}`)
        return res.json({
          success: true,
          data: {
            id: created.id,
            username: created.username,
            displayName: created.displayName,
            email: created.email,
            personalEmail: created.personalEmail,
          },
        })
      }
    } catch (error) {
      console.error("Admin profile update error:", error)
      return res.status(500).json({ success: false, error: "Failed to update profile" })
    }
  },
)

app.post(
  "/api/admin/admin-users/change-password",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await ensureAdminUsersTable()
      const { currentPassword, newPassword } = req.body || {}
      const currentUsername = String(req.user?.username || "").trim()
      if (!currentUsername) return res.status(400).json({ success: false, error: "No current user" })
      if (!currentPassword || !newPassword)
        return res.status(400).json({ success: false, error: "currentPassword and newPassword are required" })
      const admin = await prisma.adminUser.findFirst({
        where: { OR: [{ username: currentUsername }, { email: currentUsername }, { personalEmail: currentUsername }] },
      })
      if (!admin) return res.status(404).json({ success: false, error: "User not found" })
      const matches = await bcrypt.compare(String(currentPassword), admin.passwordHash)
      if (!matches) return res.status(401).json({ success: false, error: "Current password incorrect" })
      const passwordHash = await bcrypt.hash(String(newPassword), 10)
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { passwordHash },
      })
      return res.json({ success: true })
    } catch (error) {
      console.error("Admin change-password error:", error)
      return res.status(500).json({ success: false, error: "Failed to change password" })
    }
  },
)

app.get("/api/admin/departments", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get course counts by department
    const courseGroups = await safeQuery(() => prisma.course.groupBy({
      by: ["department"],
      _count: { _all: true },
    })) || []

    // Get all departments from courses
    const departments = courseGroups.map(g => g.department || "General")

    // Get student counts by department (Optimized to avoid N+1 queries)
    const studentGroups = await safeQuery(() => prisma.user.groupBy({
      by: ["department"],
      where: { role: "student" },
      _count: { _all: true },
    })) || []

    const studentCounts = departments.map(dept => {
      const group = studentGroups.find(g => g.department === dept)
      return { department: dept, count: group?._count._all || 0 }
    })

    // Get tutor counts by department (Based on active course assignments)
    // This ensures tutors teaching across multiple departments are counted in each
    const coursesWithTutors = await safeQuery(() => prisma.course.findMany({
      where: { 
        tutorId: { not: null } 
      },
      select: {
        department: true,
        tutorId: true
      }
    })) || []

    const departmentTutorMap = new Map<string, Set<number>>()
    
    coursesWithTutors.forEach(c => {
        const dept = c.department || "General"
        if (!departmentTutorMap.has(dept)) {
            departmentTutorMap.set(dept, new Set())
        }
        if (c.tutorId) {
            departmentTutorMap.get(dept)!.add(c.tutorId)
        }
    })

    const tutorCounts = departments.map(dept => {
      const count = departmentTutorMap.get(dept)?.size || 0
      return { department: dept, count }
    })

    // Combine all data
    const data = courseGroups.map((g) => {
      const deptName = g.department || "General"
      const students = studentCounts.find(s => s.department === deptName)?.count || 0
      const tutors = tutorCounts.find(t => t.department === deptName)?.count || 0
      
      return {
        name: deptName,
        courses: g._count._all,
        students,
        tutors
      }
    })

    return res.json({ success: true, data })
  } catch (error) {
    console.error("Admin departments fetch error:", error)
    return res.status(500).json({ success: false, error: "Failed to load departments" })
  }
})

// Invite students (admin/tutor)
app.post(
  "/api/admin/students/invite",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin", "tutor") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { emails, courseName, tutorName, department } = req.body || {}
      if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ success: false, error: "emails[] is required" })
      }
      const frontendBase = process.env.FRONTEND_URL || "https://www.excellenceakademie.co.za"
      const results: any[] = []
      const year = new Date().getFullYear()

      // Get the calling user info
      const callingUserId = req.user?.id
      const callingUserRole = req.user?.role

      // Get tutor info for email sending
      let tutorEmail: string | undefined
      let tutorNameForEmail = tutorName || "Your Tutor"

      if (callingUserRole === "tutor" && callingUserId) {
        const tutor = await prisma.user.findUnique({ where: { id: callingUserId } })
        if (tutor) {
          tutorEmail = tutor.email
          tutorNameForEmail = tutor.name || tutorNameForEmail
        }
      }

      let courseId: number | null = null
      if (courseName) {
        // Filter course by tutor if called by a tutor
        const courseWhere: any = { name: courseName }
        if (callingUserRole === "tutor" && callingUserId) {
          courseWhere.tutorId = callingUserId
        }
        const course = await prisma.course.findFirst({ where: courseWhere })
        if (course) courseId = course.id
      }

      for (const email of emails) {
        const clean = String(email || "")
          .trim()
          .toLowerCase()
        if (!clean || !clean.includes("@")) continue

        let user = await prisma.user.findUnique({ where: { email: clean } })
        let studentNumber = ""
        let studentEmail = clean

        let isNewUser = false
        let tempPassword = ""

        if (!user) {
          isNewUser = true
          let isUnique = false
          let attempts = 0

          // Import student number utilities
          const { generateStudentNumber, generateStudentEmail, PROGRAM_CODES } = await import("../lib/studentNumber.js")

          // Default to Excellence Akademie program
          const programCode = PROGRAM_CODES.EXCELLENCE_AKADEMIE

          while (!isUnique && attempts < 10) {
            // Get the max sequence number for this year and program
            const maxSequenceUser = await prisma.user.findFirst({
              where: {
                studentNumber: {
                  startsWith: `${year}${programCode.toString().padStart(2, '0')}`
                }
              },
              orderBy: {
                studentNumber: 'desc'
              }
            })

            let sequenceNumber = 1
            if (maxSequenceUser?.studentNumber) {
              // Extract sequence from existing student number (positions 6-10)
              const existingSequence = parseInt(maxSequenceUser.studentNumber.slice(6, 10), 10)
              sequenceNumber = existingSequence + 1
            }

            // Generate student number with check digit
            studentNumber = generateStudentNumber(year, programCode, sequenceNumber)
            studentEmail = generateStudentEmail(studentNumber)

            const existing = await prisma.user.findUnique({ where: { email: studentEmail } })
            const existingNumber = await prisma.user.findUnique({ where: { studentNumber: studentNumber } })

            if (!existing && !existingNumber) isUnique = true
            attempts++
          }

          if (!isUnique) {
            results.push({ email: clean, error: "Failed to generate unique Student ID" })
            continue
          }

          tempPassword = crypto.randomBytes(4).toString("hex") + Math.floor(Math.random() * 100)

          const name = clean.split("@")[0]

          user = await prisma.user.create({
            data: {
              email: studentEmail,
              studentNumber: studentNumber,
              programCode: programCode,
              name: name,
              role: "student",
              personalEmail: clean, // Store their personal email for communications
              department: department || null,
            },
          })

          const hash = await hashPassword(tempPassword)
          const now = new Date().toISOString()
          
          await prisma.userCredential.upsert({
            where: { email: studentEmail },
            update: {
                passwordHash: hash,
                userId: user.id.toString(),
                updatedAt: now
            },
            create: {
                email: studentEmail,
                userId: user.id.toString(),
                passwordHash: hash,
                createdAt: now,
                updatedAt: now
            }
          })
        } else {
          studentEmail = user.email
        }

        if (courseId && user) {
          const enrollment = await prisma.courseEnrollment.findFirst({
            where: { userId: user.id, courseId: courseId },
          })
          if (!enrollment) {
            await prisma.courseEnrollment.create({
              data: { userId: user.id, courseId: courseId, status: "enrolled" },
            })
          }
        }

        if (isNewUser) {
          const link = `${frontendBase.replace(/\/$/, "")}/login`
          const content = renderStudentCredentialsEmail({
            recipientName: user.name,
            studentNumber,
            studentEmail,
            tempPassword,
            loginUrl: link,
            courseName,
          })

          const send = await sendEmail({
            to: clean,
            subject: "Your Student Login Credentials - Excellence Academia",
            content,
            fromEmail: tutorEmail, // Use tutor's email if available
          })
          results.push({ email: clean, studentNumber, studentEmail, sent: !!send.success })
        } else {
          if (courseName) {
            const content = renderBrandedEmail({
              title: "Course Enrollment",
              message: `<p>You have been enrolled in <strong>${courseName}</strong>.</p>`,
            })
            const send = await sendEmail({
              to: clean,
              subject: "Course Enrollment - Excellence Academia",
              content,
              fromEmail: tutorEmail, // Use tutor's email if available
            })
            results.push({ email: clean, enrolled: true, sent: !!send.success })
          } else {
            results.push({ email: clean, error: "User already exists" })
          }
        }
      }
      return res.json({ success: true, invited: results })
    } catch (error) {
      console.error("Invite error:", error)
      return res.status(500).json({ success: false, error: "Failed to send invitations" })
    }
  },
)

// Set password from invitation token
app.post("/api/auth/set-password", async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body || {}
    if (!token || !password || String(password).length < 8) {
      return res.status(400).json({ success: false, error: "Valid token and password (min 8 chars) are required" })
    }
    let payload: any
    try {
      payload = jwt.verify(token, JWT_SECRET) as any
    } catch (e) {
      return res.status(400).json({ success: false, error: "Invalid or expired token" })
    }
    if (!payload.email || !["invite", "tutor-invite"].includes(String(payload.purpose))) {
      return res.status(400).json({ success: false, error: "Invalid token purpose" })
    }
    const email = String(payload.email).toLowerCase()
    await ensureCredentialsTable()
    const hash = await hashPassword(String(password))

    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      const role = payload.purpose === "tutor-invite" ? "tutor" : "student"
      user = await prisma.user.create({ data: { email, name: email.split("@")[0], role } })
    }

    const now = new Date().toISOString()
    
    await prisma.userCredential.upsert({
      where: { email },
      update: {
          passwordHash: hash,
          userId: user.id.toString(),
          updatedAt: now
      },
      create: {
          email,
          userId: user.id.toString(),
          passwordHash: hash,
          createdAt: now,
          updatedAt: now
      }
    })

    return res.json({ success: true })
  } catch (error) {
    console.error("Set password error:", error)
    return res.status(500).json({ success: false, error: "Failed to set password" })
  }
})

// Change password (authenticated users)
app.post(
  "/api/auth/change-password",
  authenticateJWT as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body || {}
      const userEmail = req.user?.email

      if (!userEmail) {
        return res.status(401).json({ success: false, error: "Not authenticated" })
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: "Current and new passwords are required" })
      }

      if (String(newPassword).length < 8) {
        return res.status(400).json({ success: false, error: "New password must be at least 8 characters" })
      }

      await ensureCredentialsTable()

      const db = await getConnection()
      try {
        const row = await db.get("SELECT * FROM user_credentials WHERE email = ?", [userEmail])

        if (!row || !row.password_hash) {
          return res.status(401).json({ success: false, error: "Invalid credentials" })
        }

        const [scheme, salt, stored] = String(row.password_hash).split(":")
        if (scheme !== "scrypt" || !salt || !stored) {
          return res.status(500).json({ success: false, error: "Invalid credential record" })
        }

        const derived = await new Promise<string>((resolve, reject) => {
          crypto.scrypt(String(currentPassword), salt, 64, (err, dk) =>
            err ? reject(err) : resolve(dk.toString("hex")),
          )
        })

        if (derived !== stored) {
          return res.status(401).json({ success: false, error: "Current password is incorrect" })
        }

        const newHash = await hashPassword(String(newPassword))
        const now = new Date().toISOString()

        await db.run(
            "UPDATE user_credentials SET password_hash = ?, updated_at = ? WHERE email = ?",
            [newHash, now, userEmail]
        )

        return res.json({ success: true, message: "Password changed successfully" })
      } finally {
        await db.close()
      }
    } catch (error) {
      console.error("Change password error:", error)
      return res.status(500).json({ success: false, error: "Failed to change password" })
    }
  },
)

app.use("/uploads", express.static(uploadsDir))

// Request compression for better performance
app.set("trust proxy", 1)

// Enhanced request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()

  res.on("finish", () => {
    const duration = Date.now() - start
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`)
  })

  next()
})

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`Error in ${req.method} ${req.path}:`, {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  })

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    timestamp: new Date().toISOString(),
  })
})

// Health check
app.get("/api/health", async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      database: "connected",
    })
  } catch (error) {
    console.error("Health check failed:", error)
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Database connection failed",
    })
  }
})

// Tests API
app.get("/api/tests", authenticateJWT as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, tutorId } = req.query
    const userId = req.user?.id
    const userRole = req.user?.role

    const where: any = {}

    // If tutor role, ALWAYS filter by their tutorId
    if (userRole === "tutor" && userId) {
      // Tutors can only see their own tests
      where.course = {
        tutorId: userId
      }

      // Additional courseId filter if provided
      if (courseId) {
        const courseIdNum = Number.parseInt(courseId as string, 10)
        // Verify course belongs to this tutor
        const course = await prisma.course.findFirst({
          where: { id: courseIdNum, tutorId: userId }
        })
        if (!course) {
          return res.status(403).json({ success: false, error: "Access denied to this course" })
        }
        where.courseId = courseIdNum
      }
    } else {
      // Admin or student: can filter by courseId or tutorId
      if (courseId) {
        where.courseId = Number.parseInt(courseId as string)
      }
      if (tutorId) {
        const tutorIdNum = Number.parseInt(tutorId as string, 10)
        where.course = {
          tutorId: tutorIdNum
        }
      }
    }

    const tests = await prisma.test.findMany({
      where,
      include: {
        course: true,
        questions: true,
        submissions: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.json({ success: true, tests, data: tests })
  } catch (error) {
    console.error("Error fetching tests:", error)
    res.status(500).json({ success: false, error: "Failed to fetch tests" })
  }
})

// Create test
app.post("/api/tests", authenticateJWT as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, dueDate, courseId, questions, totalPoints } = req.body
    const userId = req.user?.id
    const userRole = req.user?.role

    if (!title || !courseId) {
      return res.status(400).json({
        success: false,
        error: "title and courseId are required",
      })
    }

    // If tutor, verify they own the course
    if (userRole === "tutor" && userId) {
      const course = await prisma.course.findFirst({
        where: {
          id: Number.parseInt(courseId),
          tutorId: userId
        }
      })
      if (!course) {
        return res.status(403).json({
          success: false,
          error: "Access denied: You can only create tests for your own courses"
        })
      }
    }
    
    const now = new Date().toISOString()
    const result = await prisma.test.create({
        data: {
            title,
            description: description || null,
            dueDate: dueDate || null,
            totalPoints: totalPoints || 0,
            courseId: Number(courseId),
            createdAt: now
        }
    })
    
    if (questions && Array.isArray(questions)) {
        for (const q of questions) {
            await prisma.testQuestion.create({
                data: {
                    testId: result.id,
                    question: q.question || q.prompt || "",
                    options: JSON.stringify(q.options || []),
                    answer: q.answer || ""
                }
            })
        }
    }
    
    const newTest = {
      id: result.id,
      title,
      description,
      dueDate,
      courseId,
      questions: questions || [],
      totalPoints: totalPoints || 0,
      createdAt: now,
    }

    res.status(201).json({ success: true, data: newTest })
  } catch (error) {
    console.error("Error creating test:", error)
    res.status(500).json({
      success: false,
      error: "Failed to create test",
    })
  }
})

// Email API - Get emails
app.get("/api/emails", authenticateJWT as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { folder = "inbox" } = req.query
    const userId = req.user?.id
    const userEmail = req.user?.email

    if (!userEmail) {
      return res.status(400).json({ success: false, error: "User email not found" })
    }

    let emails
    if (folder === "sent") {
      emails = await prisma.email.findMany({
        where: {
          from: userEmail,
          folder: "sent",
        },
        orderBy: { timestamp: "desc" },
        take: 100,
      })
    } else {
      emails = await prisma.email.findMany({
        where: {
          to: userEmail,
          folder: folder as string,
        },
        orderBy: { timestamp: "desc" },
        take: 100,
      })
    }

    res.json({ success: true, emails })
  } catch (error) {
    console.error("Error fetching emails:", error)
    res.status(500).json({ success: false, error: "Failed to fetch emails" })
  }
})

// Email API - Send email
app.post("/api/emails/send", authenticateJWT as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { to, subject, body } = req.body
    const userId = req.user?.id
    const userEmail = req.user?.email
    const userName = req.user?.name || "User"

    if (!to || !subject || !body) {
      return res.status(400).json({ success: false, error: "Missing required fields" })
    }

    const html = renderBrandedEmail({
      recipientName: to.split("@")[0],
      content: body,
      title: subject,
    })

    const emailResult = await sendEmail({
      to,
      subject,
      content: html,
      fromEmail: userEmail,
      fromName: userName,
    })

    const email = await prisma.email.create({
      data: {
        from: userEmail!,
        fromName: userName,
        to,
        subject,
        body,
        htmlBody: html,
        timestamp: new Date(),
        read: false,
        starred: false,
        folder: "sent",
      },
    })

    return res.json({ success: true, email, sent: !!emailResult?.success })
  } catch (error) {
    console.error("Send email error:", error)
    return res.status(500).json({ success: false, error: "Failed to send email" })
  }
})

// Email API - Update email
app.patch("/api/emails/:id", authenticateJWT as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { read, starred, folder } = req.body

    const email = await prisma.email.update({
      where: { id },
      data: {
        ...(typeof read === "boolean" && { read }),
        ...(typeof starred === "boolean" && { starred }),
        ...(folder && { folder }),
      },
    })

    res.json({ success: true, email })
  } catch (error) {
    console.error("Error updating email:", error)
    res.status(500).json({ success: false, error: "Failed to update email" })
  }
})

// Mark email as read/unread
app.patch(
  "/api/emails/:id/read",
  authenticateJWT as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params
      const { read } = req.body

      const email = await prisma.email.update({
        where: { id },
        data: { read },
      })

      return res.json({ success: true, email })
    } catch (error) {
      console.error("Mark read error:", error)
      return res.status(500).json({ success: false, error: "Failed to update email" })
    }
  },
)

// Star/unstar email
app.patch(
  "/api/emails/:id/star",
  authenticateJWT as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params
      const { starred } = req.body

      const email = await prisma.email.update({
        where: { id },
        data: { starred },
      })

      return res.json({ success: true, email })
    } catch (error) {
      console.error("Star email error:", error)
      return res.status(500).json({ success: false, error: "Failed to update email" })
    }
  },
)

// Move email to folder
app.patch(
  "/api/emails/:id/move",
  authenticateJWT as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params
      const { folder } = req.body

      const email = await prisma.email.update({
        where: { id },
        data: { folder },
      })

      return res.json({ success: true, email })
    } catch (error) {
      console.error("Move email error:", error)
      return res.status(500).json({ success: false, error: "Failed to move email" })
    }
  },
)

// Students list for bulk email
app.get("/api/students/list", authenticateJWT as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const userRole = req.user?.role

    if (userRole !== "admin" && userRole !== "tutor") {
      return res.status(403).json({ error: "Forbidden" })
    }

    let students

    if (userRole === "tutor") {
      const tutorCourses = await prisma.course.findMany({
        where: { tutorId: userId as number },
        select: { id: true, name: true },
      })

      const courseIds = tutorCourses.map((c) => c.id)

      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          courseId: { in: courseIds },
          status: "enrolled",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              personalEmail: true,
            },
          },
          course: {
            select: { name: true },
          },
        },
      })

      students = enrollments.map((e) => ({
        id: e.user.id.toString(),
        name: e.user.name,
        email: e.user.email,
        personalEmail: e.user.personalEmail,
        course: e.course.name,
      }))
    } else {
      const allStudents = await prisma.user.findMany({
        where: { role: "student" },
        select: {
          id: true,
          name: true,
          email: true,
          personalEmail: true,
          courseEnrollments: {
            include: {
              course: {
                select: { name: true },
              },
            },
          },
        },
      })

      students = allStudents.map((s) => ({
        id: s.id.toString(),
        name: s.name,
        email: s.email,
        personalEmail: s.personalEmail,
        course: s.courseEnrollments[0]?.course.name || "No course",
      }))
    }

    res.json({ students })
  } catch (error) {
    console.error("Error fetching students:", error)
    res.status(500).json({ error: "Failed to fetch students" })
  }
})

// Bulk email send
app.post(
  "/api/emails/bulk-send",
  authenticateJWT as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { students, subject, body, emailType, template } = req.body
      const userId = req.user?.id

      if (!students || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ error: "No students selected" })
      }

      if (!subject || !body) {
        return res.status(400).json({ error: "Subject and body are required" })
      }

      const sender = await prisma.user.findUnique({
        where: { id: userId as number },
        select: { email: true, name: true, role: true },
      })

      if (!sender) {
        return res.status(404).json({ error: "Sender not found" })
      }

      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      }

      for (const student of students) {
        try {
          let recipientEmail: string
          let shouldSendExternal = false

          if (emailType === "external") {
            recipientEmail = student.personalEmail || student.email
            shouldSendExternal = true
          } else {
            recipientEmail = student.email
          }

          const personalizedSubject = subject
            .replace(/\[Student Name\]/g, student.name)
            .replace(/\[Course Name\]/g, student.course || "Your Course")
            .replace(/\[Tutor Name\]/g, sender.name)

          const personalizedBody = body
            .replace(/\[Student Name\]/g, student.name)
            .replace(/\[Course Name\]/g, student.course || "Your Course")
            .replace(/\[Tutor Name\]/g, sender.name)
            .replace(/\[Date\]/g, new Date().toLocaleDateString())
            .replace(/\[Time\]/g, new Date().toLocaleTimeString())

          if (shouldSendExternal) {
            const htmlContent = renderBrandedEmail({
              title: personalizedSubject,
              intro: `Dear ${student.name},`,
              content: personalizedBody,
              highlights: [`From: ${sender.name}`, `Role: ${sender.role === "admin" ? "Administrator" : "Tutor"}`],
            })

            await sendEmail({
              to: recipientEmail,
              subject: personalizedSubject,
              content: htmlContent,
              fromEmail: process.env.BREVO_FROM_EMAIL,
              fromName: sender.name,
            })
          } else {
            await prisma.email.create({
              data: {
                from: sender.email,
                fromName: sender.name,
                to: recipientEmail,
                subject: personalizedSubject,
                body: personalizedBody,
                folder: "sent",
                read: true,
              },
            })

            await prisma.email.create({
              data: {
                from: sender.email,
                fromName: sender.name,
                to: recipientEmail,
                subject: personalizedSubject,
                body: personalizedBody,
                folder: "inbox",
                read: false,
              },
            })
          }

          results.sent++
        } catch (error) {
          console.error(`Failed to send email to ${student.name}:`, error)
          results.failed++
          results.errors.push(`${student.name}: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }

      res.json({
        success: true,
        message: `Sent ${results.sent} email(s), ${results.failed} failed`,
        results,
      })
    } catch (error) {
      console.error("Bulk email send error:", error)
      res.status(500).json({ error: "Failed to send bulk emails" })
    }
  },
)

// Tutor scheduled sessions
app.get(
  "/api/tutor/scheduled-sessions",
  authenticateJWT as RequestHandler,
  authorizeRoles("tutor") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tutorId = req.user?.id as number

      const sessions = await prisma.scheduledSession.findMany({
        where: {
          tutorId,
          scheduledAt: {
            gte: new Date(),
          },
        },
        include: {
          course: true,
        },
        orderBy: {
          scheduledAt: "asc",
        },
      })

      res.json({ success: true, sessions })
    } catch (error) {
      console.error("Error fetching tutor scheduled sessions:", error)
      res.status(500).json({ success: false, error: "Failed to fetch scheduled sessions" })
    }
  },
)

// Create scheduled session
app.post(
  "/api/tutor/scheduled-sessions",
  authenticateJWT as RequestHandler,
  authorizeRoles("tutor") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { courseId, title, description, scheduledAt, duration } = req.body
      const tutorId = req.user?.id as number

      if (!courseId || !title || !scheduledAt) {
        return res.status(400).json({ success: false, error: "Missing required fields" })
      }

      const session = await prisma.scheduledSession.create({
        data: {
          courseId: Number.parseInt(courseId),
          tutorId,
          title,
          description,
          scheduledAt: new Date(scheduledAt),
          duration: duration || 60,
          status: "scheduled",
        },
      })

      return res.json({ success: true, session })
    } catch (error) {
      console.error("Create scheduled session error:", error)
      return res.status(500).json({ success: false, error: "Failed to create scheduled session" })
    }
  },
)

// Delete scheduled session
app.delete(
  "/api/tutor/scheduled-sessions",
  authenticateJWT as RequestHandler,
  authorizeRoles("tutor") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.query
      const tutorId = req.user?.id

      if (!id) {
        return res.status(400).json({ success: false, error: "Session ID required" })
      }

      const session = await prisma.scheduledSession.findUnique({
        where: { id: String(id) },
      })

      if (!session || session.tutorId !== tutorId) {
        return res.status(403).json({ success: false, error: "Access denied" })
      }

      await prisma.scheduledSession.delete({
        where: { id: String(id) },
      })

      return res.json({ success: true })
    } catch (error) {
      console.error("Delete scheduled session error:", error)
      return res.status(500).json({ success: false, error: "Failed to delete scheduled session" })
    }
  },
)

// Get scheduled sessions for student
app.get(
  "/api/student/scheduled-sessions",
  authenticateJWT as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const studentIdParam = (req.query.studentId as string) || String(req.user?.id || "")
      const studentId = Number.parseInt(studentIdParam, 10)
      if (isNaN(studentId) || studentId <= 0) {
        return res.status(400).json({ success: false, error: "Student ID is required" })
      }

      const enrollments = await prisma.courseEnrollment.findMany({
        where: { userId: studentId },
        include: { course: true },
      })
      const courseIds = enrollments.map((e) => e.courseId)

      const now = new Date()
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)

      const dbSessions = await prisma.scheduledSession.findMany({
        where: {
          courseId: { in: courseIds },
          scheduledAt: { gte: fifteenMinutesAgo },
        },
        include: { course: true, tutor: true },
        orderBy: { scheduledAt: "asc" },
        take: 20,
      })

      const activeAdHocSessions: any[] = []
      activeSessions.forEach((session, cId) => {
        const courseIdInt = Number.parseInt(cId, 10)
        if (courseIds.includes(courseIdInt)) {
          const isInDb = dbSessions.some(
            (dbS) => dbS.courseId === courseIdInt && (dbS.sessionId === session.sessionId || dbS.status === "active"),
          )

          if (!isInDb) {
            const course = enrollments.find((e) => e.courseId === courseIdInt)?.course
            activeAdHocSessions.push({
              id: -courseIdInt,
              title: "Live Session",
              description: session.message || "Live class in progress",
              courseId: courseIdInt,
              courseName: course?.name || "Course",
              tutorId: 0,
              tutorName: session.tutorName || "Tutor",
              scheduledAt: new Date(),
              duration: 60,
              status: "live",
              sessionId: session.sessionId,
              isLive: true,
              isReady: true,
              canJoin: true,
              course: course,
              tutor: { name: session.tutorName || "Tutor" },
            })
          }
        }
      })

      const result = [...dbSessions, ...activeAdHocSessions].map((s) => {
        const scheduledTime = new Date(s.scheduledAt)
        const endTime = new Date(scheduledTime.getTime() + s.duration * 60 * 1000)
        const isLive = activeSessions.has(String(s.courseId))

        const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000)
        const isReady =
          !isLive &&
          ((scheduledTime <= fifteenMinutesFromNow && scheduledTime >= now) || (scheduledTime < now && now < endTime))

        const sessionRoomId = s.sessionId || `${s.courseId}-${s.id}`

        return {
          id: s.id,
          title: s.title,
          description: s.description,
          courseId: s.courseId,
          courseName: s.course?.name || "Unknown Course",
          tutorId: s.tutorId,
          tutorName: s.tutor?.name || "Tutor",
          scheduledAt: s.scheduledAt.toISOString(),
          duration: s.duration,
          status: isLive ? "live" : isReady ? "ready" : s.status,
          sessionId: sessionRoomId,
          isLive,
          isReady,
          canJoin: isLive || isReady,
          course: s.course,
          tutor: s.tutor,
        }
      })

      return res.json({ success: true, sessions: result })
    } catch (error) {
      console.error("Error fetching student scheduled sessions:", error)
      return res.status(500).json({ success: false, error: "Failed to fetch scheduled sessions" })
    }
  },
)

const getCompanyDomain = () => {
  const fromEnv = process.env.COMPANY_DOMAIN
  if (fromEnv) return fromEnv.toLowerCase()
  const frontend = process.env.FRONTEND_URL
  if (frontend) {
    try {
      const host = new URL(frontend).hostname.toLowerCase()
      return host.replace(/^www\./, "")
    } catch {}
  }
  return "excellenceakademie.co.za"
}

const makeCompanyEmail = (name: string) => {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
  return `${base}@${getCompanyDomain()}`
}

app.post("/api/admin/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body || {}
    const submittedId = (email || username || "").toString().trim()
    const submittedPassword = (password || "").toString()

    if (!submittedId || !submittedPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Username or email and password are required" })
    }

    let adminFromDb: any = null
    try {
      const anyPrisma: any = prisma as any
      if (anyPrisma.adminUser && typeof anyPrisma.adminUser.findFirst === "function") {
        adminFromDb = await anyPrisma.adminUser.findFirst({
          where: {
            OR: [{ username: submittedId }, { email: submittedId }, { personalEmail: submittedId }],
          },
        })
      }
    } catch (lookupError) {
      console.error("Admin login DB lookup failed:", lookupError)
      adminFromDb = null
    }

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "philani chade"
    const ADMIN_EMAIL_FROM_ENV = process.env.ADMIN_EMAIL
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"
    const fallbackCompanyEmail = makeCompanyEmail(ADMIN_USERNAME)
    const fallbackPersonalEmail =
      process.env.ADMIN_PERSONAL_EMAIL || ADMIN_EMAIL_FROM_ENV || fallbackCompanyEmail
    const normalizedSubmittedId = submittedId.toLowerCase()
    const adminAliasEmail = `admin@${getCompanyDomain()}`
    const fallbackIds = [
      ADMIN_USERNAME,
      ADMIN_EMAIL_FROM_ENV,
      fallbackCompanyEmail,
      fallbackPersonalEmail,
      "admin",
      adminAliasEmail,
    ]
      .filter(Boolean)
      .map((v) => v.toLowerCase())

    let isValid = false
    let canonicalId = submittedId

    if (adminFromDb) {
      const matches = await bcrypt.compare(submittedPassword, adminFromDb.passwordHash)
      if (matches) {
        isValid = true
        canonicalId = adminFromDb.username || submittedId
      }
    } else if (
      fallbackIds.includes(normalizedSubmittedId) &&
      submittedPassword === ADMIN_PASSWORD
    ) {
      isValid = true
      canonicalId = ADMIN_USERNAME

      try {
        const anyPrisma: any = prisma as any
        if (anyPrisma.adminUser && typeof anyPrisma.adminUser.findFirst === "function") {
          const existingSeed = await anyPrisma.adminUser.findFirst({
            where: { username: ADMIN_USERNAME },
          })

          if (!existingSeed) {
            const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
            await anyPrisma.adminUser.create({
              data: {
                username: ADMIN_USERNAME,
                displayName: process.env.ADMIN_DISPLAY_NAME || ADMIN_USERNAME,
                email: fallbackCompanyEmail,
                personalEmail: fallbackPersonalEmail,
                permissions: "superadmin",
                passwordHash,
              },
            })
          }
        }
      } catch (seedError) {
        console.error("Error seeding admin user from env:", seedError)
      }
    }

    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const token = jwt.sign(
      { username: canonicalId, role: "admin", exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 },
      JWT_SECRET,
    )
    const isProd = process.env.NODE_ENV === "production"
    const secure = isProd ? " Secure;" : ""
    const sameSite = isProd ? "None" : "Lax"
    
    res.setHeader(
      "Set-Cookie",
      `admin_token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=${sameSite};${secure}`,
    )
    return res
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        token,
        user: {
          username: canonicalId,
          displayName: adminFromDb?.displayName || process.env.ADMIN_DISPLAY_NAME || canonicalId,
          role: "admin"
        }
      })
  } catch (error) {
    console.error("Error processing admin login:", error)
    return res.status(500).json({ success: false, message: "Failed to process login" })
  }
})

app.get(
  "/api/admin/auth/verify",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  (req: AuthenticatedRequest, res: Response) => {
    return res.status(200).json({ success: true, user: req.user })
  },
)

app.get(
  "/api/admin/auth/me",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.user?.username
      if (!id) {
        return res.status(401).json({ success: false, error: "Unauthorized" })
      }

      const anyPrisma: any = prisma as any
      let admin = null
      
      if (anyPrisma.adminUser) {
        admin = await anyPrisma.adminUser.findFirst({
            where: {
            OR: [
                { username: id },
                { email: id },
                { personalEmail: id }
            ]
            }
        })
      }

      if (!admin) {
        return res.status(200).json({ 
            success: true, 
            user: {
                username: id,
                displayName: id,
                email: id.includes("@") ? id : undefined,
                role: "admin"
            }
        })
      }

      return res.status(200).json({
        success: true,
        user: {
          username: admin.username,
          displayName: admin.displayName || admin.username,
          email: admin.email,
          role: "admin",
          personalEmail: admin.personalEmail
        }
      })
    } catch (error) {
      console.error("Error fetching admin profile:", error)
      return res.status(500).json({ success: false, error: "Failed to fetch profile" })
    }
  },
)

app.post("/api/admin/auth/logout", (req: Request, res: Response) => {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : ""
  res.setHeader("Set-Cookie", `admin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict;${secure}`)
  return res.status(200).json({ success: true, message: "Logged out" })
})

// Notifications
app.post("/api/notifications", async (req: Request, res: Response) => {
  try {
    const { title, message, type = "system", recipients } = req.body || {}
    if (!title || !message) return res.status(400).json({ success: false, error: "title and message are required" })
    await ensureNotificationsTable()
    const db = await getConnection()
    try {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      await db.run(
        "INSERT INTO notifications (id, title, message, type, status, created_at, read) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, String(title), String(message), String(type), "sent", now, 0],
      )
      const toSpecific = Array.isArray(recipients?.specific)
        ? recipients.specific.filter((e: any) => typeof e === "string")
        : []
      const sendList: string[] = []
      if (recipients?.tutors) {
        const tutors = await db.all(
          `SELECT email FROM users WHERE role = 'tutor' AND email IS NOT NULL AND TRIM(email) <> ''`,
        )
        sendList.push(...tutors.map((r: any) => String(r.email)))
      }
      if (recipients?.students) {
        const students = await db.all(
          `SELECT email FROM users WHERE role = 'student' AND email IS NOT NULL AND TRIM(email) <> ''`,
        )
        sendList.push(...students.map((r: any) => String(r.email)))
      }
      sendList.push(...toSpecific.map((e: string) => e.toLowerCase()))
      const uniqueList = Array.from(new Set(sendList)).slice(0, 200)
      for (const to of uniqueList) {
        const html = renderBrandedEmail({ title: String(title), message: `<p>${String(message)}</p>` })
        await sendEmail({ to, subject: String(title), content: html })
      }
      return res.status(201).json({ success: true, id })
    } finally {
      await db.close()
    }
  } catch (error) {
    console.error("Error creating notification:", error)
    return res.status(500).json({ success: false, error: "Failed to create notification" })
  }
})

// List notifications
app.get("/api/notifications", authenticateJWT as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.query
    const authenticatedUserId = req.user?.id
    const userRole = req.user?.role

    // CRITICAL: Always filter by authenticated user's ID
    // Only admins can view other users' notifications
    let targetUserId = authenticatedUserId

    if (userRole === "admin" && userId) {
      targetUserId = Number.parseInt(userId as string, 10)
    }

    const where: any = {
      userId: targetUserId
    }

    const notifications = await safeQuery(() => prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    })) || []

    const data = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      date: n.createdAt,
      timestamp: n.createdAt,
    }))
    res.set("Cache-Control", "public, max-age=120")
    return res.json({ success: true, data })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return res.status(500).json({ success: false, error: "Failed to fetch notifications" })
  }
})

// Mark notification as read
app.patch(
  "/api/notifications/:id/read",
  authenticateJWT as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params

      await prisma.notification.update({
        where: { id: Number.parseInt(id) },
        data: { read: true },
      })

      return res.json({ success: true })
    } catch (error) {
      console.error("Mark notification read error:", error)
      return res.status(500).json({ success: false, error: "Failed to update notification" })
    }
  },
)

// Delete notification
app.delete(
  "/api/notifications/:id",
  authenticateJWT as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params

      await prisma.notification.delete({
        where: { id: Number.parseInt(id) },
      })

      return res.json({ success: true })
    } catch (error) {
      console.error("Delete notification error:", error)
      return res.status(500).json({ success: false, error: "Failed to delete notification" })
    }
  },
)

// Admin email send
app.post(
  "/api/admin/email/send",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { subject, message, recipients, department } = req.body || {}
      if (!subject || !message)
        return res.status(400).json({ success: false, error: "subject and message are required" })
      const db = await getConnection()
      try {
        const sendList: string[] = []
        if (recipients?.tutors) {
          // Use Prisma instead of raw SQL for safety
          const where: any = { role: 'tutor', email: { not: null } };
          if (department) {
            where.department = department;
          }
          const tutors = await prisma.user.findMany({
            where,
            select: { email: true }
          });
          sendList.push(...tutors.map((r: any) => String(r.email)))
        }
        if (recipients?.students) {
          // Use Prisma instead of raw SQL for safety
          const where: any = { role: 'student', email: { not: null } };
          if (department) {
            where.department = department;
          }
          const students = await prisma.user.findMany({
            where,
            select: { email: true }
          });
          sendList.push(...students.map((r: any) => String(r.email)))
        }
        const toSpecific = Array.isArray(recipients?.specific)
          ? recipients.specific.filter((e: any) => typeof e === "string")
          : []
        sendList.push(...toSpecific.map((e: string) => e.toLowerCase()))
        const uniqueList = Array.from(new Set(sendList)).slice(0, 500)
        const html = renderBrandedEmail({ title: String(subject), message: `<p>${String(message)}</p>` })
        const results: any[] = []
        for (const to of uniqueList) {
          const r = await sendEmail({ to, subject: String(subject), content: html })
          results.push({ email: to, sent: !!r?.success })
        }
        return res.json({ success: true, sent: results })
      } finally {
        await db.close()
      }
    } catch (error) {
      console.error("Admin email send error:", error)
      return res.status(500).json({ success: false, error: "Failed to send emails" })
    }
  },
)

app.post(
  "/api/admin/email/preview",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { template, title, intro, actionText, actionUrl, highlights, courseName, tutorName, department } =
        req.body || {}
      if (!template || !title || !intro)
        return res.status(400).json({ success: false, error: "template, title, intro required" })
      const html = renderBrandedEmailPreview({
        template,
        title: String(title),
        intro: String(intro),
        actionText: actionText ? String(actionText) : undefined,
        actionUrl: actionUrl ? String(actionUrl) : undefined,
        highlights: Array.isArray(highlights) ? highlights.map((x: any) => String(x)) : undefined,
        courseName: courseName ? String(courseName) : undefined,
        tutorName: tutorName ? String(tutorName) : undefined,
        department: department ? String(department) : undefined,
      })
      return res.json({ success: true, html })
    } catch (error) {
      console.error("Email preview error:", error)
      return res.status(500).json({ success: false, error: "Failed to render preview" })
    }
  },
)

// Tutor student invite
app.post(
  "/api/tutor/students/invite",
  authenticateJWT as RequestHandler,
  authorizeRoles("tutor") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { emails, courseName } = req.body || {}
      const tutorId = req.user?.id

      if (!courseName) return res.status(400).json({ success: false, error: "courseName is required" })

      const list = Array.isArray(emails)
        ? emails
            .filter((e: any) => typeof e === "string")
            .map((e: string) => e.trim())
            .filter(Boolean)
        : []
      if (list.length === 0) return res.status(400).json({ success: false, error: "emails array required" })

      const tutor = await prisma.user.findUnique({ where: { id: tutorId as number } })
      if (!tutor) {
        return res.status(404).json({ success: false, error: "Tutor not found" })
      }

      const db = await getConnection()
      const course = await db.get("SELECT * FROM courses WHERE name = ? AND tutor_id = ?", [courseName, tutorId])
      await db.close()

      if (!course) {
        return res.status(403).json({ success: false, error: "Course not found or access denied" })
      }

      const base = process.env.FRONTEND_URL || "https://www.excellenceakademie.co.za"
      const results: any[] = []
      const tutorName = tutor.name || req.user?.username || "Your Tutor"
      const tutorEmail = tutor.email
      const department = course.department || "General"

      for (const email of list.slice(0, 200)) {
        const actionUrl = `${base}/welcome?email=${encodeURIComponent(email)}`
        const html = renderInvitationEmail({
          recipientName: email.split("@")[0],
          actionUrl,
          courseName,
          tutorName,
          department,
        })
        const r = await sendEmail({
          to: email,
          subject: `Invitation from ${tutorName} - Excellence Academia`,
          content: html,
          fromEmail: tutorEmail,
          fromName: tutorName,
        })
        results.push({ email, sent: !!r?.success })
      }
      return res.json({ success: true, invited: results })
    } catch (error) {
      console.error("Tutor student invite error:", error)
      return res.status(500).json({ success: false, error: "Failed to send invitations" })
    }
  },
)

// Tutor email endpoint
app.post(
  "/api/tutor/email/send",
  authenticateJWT as RequestHandler,
  authorizeRoles("tutor") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { subject, message, courseId } = req.body || {}
      if (!message) return res.status(400).json({ success: false, error: "message is required" })
      const tutorId = String(req.user?.id || "").trim()
      if (!tutorId) return res.status(401).json({ success: false, error: "Unauthorized" })

      const tutor = await prisma.user.findUnique({ where: { id: Number.parseInt(tutorId) } })
      if (!tutor) {
        return res.status(404).json({ success: false, error: "Tutor not found" })
      }

      const tutorName = tutor.name || "Your Tutor"
      const tutorEmail = tutor.email

      const db = await getConnection()
      try {
        const emails: string[] = []
        if (courseId && String(courseId).trim().length > 0) {
          const owns = await db.get("SELECT 1 FROM courses WHERE id = ? AND tutor_id = ?", [courseId, tutorId])
          if (!owns)
            return res.status(403).json({ success: false, error: "Forbidden: course does not belong to tutor" })
          const rows = await db.all(
            `SELECT DISTINCT u.email 
           FROM users u 
           JOIN course_enrollments e ON e.user_id = u.id 
           WHERE e.course_id = ? 
             AND u.email IS NOT NULL AND TRIM(u.email) <> ''`,
            [courseId],
          )
          emails.push(...rows.map((r: any) => String(r.email)))
        } else {
          const rows = await db.all(
            `SELECT DISTINCT u.email 
           FROM users u 
           JOIN course_enrollments e ON e.user_id = u.id 
           JOIN courses c ON c.id = e.course_id 
           WHERE c.tutor_id = ? 
             AND u.email IS NOT NULL AND TRIM(u.email) <> ''`,
            [tutorId],
          )
          emails.push(...rows.map((r: any) => String(r.email)))
        }
        const unique = Array.from(new Set(emails)).slice(0, 500)
        const html = renderBrandedEmail({
          title: String(subject || `Message from ${tutorName}`),
          message: `<p>${String(message)}</p>`,
          footerNote: `You received this email from ${tutorName} because you are enrolled in their course.`,
        })
        const results: any[] = []
        for (const to of unique) {
          const r = await sendEmail({
            to,
            subject: String(subject || `Message from ${tutorName}`),
            content: html,
            fromEmail: tutorEmail,
            fromName: tutorName,
          })
          results.push({ email: to, sent: !!r?.success })
        }
        return res.json({ success: true, count: results.length, sent: results })
      } finally {
        await db.close()
      }
    } catch (error) {
      console.error("Tutor email send error:", error)
      return res.status(500).json({ success: false, error: "Failed to send tutor emails" })
    }
  },
)

// Live session notification
app.post(
  "/api/tutor/live-session/notify",
  authenticateJWT as RequestHandler,
  authorizeRoles("tutor") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { courseId, sessionId, sessionLink } = req.body || {}
      const tutorId = req.user?.id as number

      if (!courseId || !sessionLink) {
        return res.status(400).json({ success: false, error: "courseId and sessionLink are required" })
      }

      const tutor = await prisma.user.findUnique({ where: { id: tutorId } })
      if (!tutor) {
        return res.status(404).json({ success: false, error: "Tutor not found" })
      }

      const course = await prisma.course.findUnique({ where: { id: courseId } })
      if (!course) {
        return res.status(404).json({ success: false, error: "Course not found" })
      }

      if (course.tutorId !== tutorId) {
        return res.status(403).json({ success: false, error: "Access denied" })
      }

      const enrollments = await prisma.courseEnrollment.findMany({
        where: { courseId },
        include: { user: true },
      })

      const results: any[] = []
      const tutorName = tutor.name || "Your Tutor"
      const tutorEmail = tutor.email

      for (const enrollment of enrollments) {
        const student = enrollment.user
        if (!student || !student.email) continue

        const html = renderLiveSessionStartedEmail({
          studentName: student.name || "Student",
          tutorName,
          courseName: course.name,
          sessionLink,
        })

        const r = await sendEmail({
          to: student.email,
          subject: `🔴 LIVE NOW: ${course.name}`,
          content: html,
          fromEmail: tutorEmail,
          fromName: tutorName,
        })

        results.push({ email: student.email, sent: !!r?.success })
      }

      return res.json({ success: true, notified: results.length, results })
    } catch (error) {
      console.error("Live session notify error:", error)
      return res.status(500).json({ success: false, error: "Failed to send notifications" })
    }
  },
)

// Material notification
app.post(
  "/api/tutor/material/notify",
  authenticateJWT as RequestHandler,
  authorizeRoles("tutor") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { courseId, materialName, materialNames, materialType, downloadLink } = req.body || {}
      const tutorId = req.user?.id as number

      const materials = materialNames || (materialName ? [materialName] : [])

      if (materials.length === 0) {
        return res.status(400).json({ success: false, error: "materialName or materialNames are required" })
      }

      const tutor = await prisma.user.findUnique({ where: { id: tutorId } })
      if (!tutor) {
        return res.status(404).json({ success: false, error: "Tutor not found" })
      }

      let enrollments: any[] = []
      let courseName = "your course"

      if (courseId) {
        const course = await prisma.course.findUnique({ where: { id: courseId } })
        if (!course) {
          return res.status(404).json({ success: false, error: "Course not found" })
        }

        if (course.tutorId !== tutorId) {
          return res.status(403).json({ success: false, error: "Access denied" })
        }

        courseName = course.name

        enrollments = await prisma.courseEnrollment.findMany({
          where: { courseId },
          include: { user: true },
        })
      } else {
        const tutorCourses = await prisma.course.findMany({
          where: { tutorId },
          select: { id: true, name: true },
        })

        if (tutorCourses.length > 0) {
          const courseIds = tutorCourses.map((c) => c.id)
          enrollments = await prisma.courseEnrollment.findMany({
            where: { courseId: { in: courseIds } },
            include: { user: true },
            distinct: ["userId"],
          })
          courseName = tutorCourses.length === 1 ? tutorCourses[0].name : "your courses"
        }
      }

      const results: any[] = []
      const tutorName = tutor.name || "Your Tutor"
      const tutorEmail = tutor.email

      const materialList = materials.join(", ")

      for (const enrollment of enrollments) {
        const student = enrollment.user
        if (!student || !student.email) continue

        const html = renderMaterialUploadedEmail({
          studentName: student.name || "Student",
          tutorName,
          courseName,
          materialName: materialList,
          materialType: materialType || "document",
          downloadLink,
        })

        const r = await sendEmail({
          to: student.email,
          subject: `📚 New Material${materials.length > 1 ? "s" : ""}: ${materialList}`,
          content: html,
          fromEmail: tutorEmail,
          fromName: tutorName,
        })

        results.push({ email: student.email, sent: !!r?.success })
      }

      return res.json({ success: true, notified: results.length, results })
    } catch (error) {
      console.error("Material notify error:", error)
      return res.status(500).json({ success: false, error: "Failed to send notifications" })
    }
  },
)

// Test notification
app.post(
  "/api/tutor/test/notify",
  authenticateJWT as RequestHandler,
  authorizeRoles("tutor") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { courseId, testName, testTitle, dueDate, duration, totalPoints, testLink } = req.body || {}
      const tutorId = req.user?.id as number

      const finalTestName = testTitle || testName

      if (!courseId || !finalTestName || !dueDate) {
        return res.status(400).json({ success: false, error: "courseId, testName/testTitle, and dueDate are required" })
      }

      const tutor = await prisma.user.findUnique({ where: { id: tutorId } })
      if (!tutor) {
        return res.status(404).json({ success: false, error: "Tutor not found" })
      }

      const course = await prisma.course.findUnique({ where: { id: courseId } })
      if (!course) {
        return res.status(404).json({ success: false, error: "Course not found" })
      }

      if (course.tutorId !== tutorId) {
        return res.status(403).json({ success: false, error: "Access denied" })
      }

      const enrollments = await prisma.courseEnrollment.findMany({
        where: { courseId },
        include: { user: true },
      })

      const results: any[] = []
      const tutorName = tutor.name || "Your Tutor"
      const tutorEmail = tutor.email

      for (const enrollment of enrollments) {
        const student = enrollment.user
        if (!student || !student.email) continue

        const html = renderTestCreatedEmail({
          studentName: student.name || "Student",
          tutorName,
          courseName: course.name,
          testName: finalTestName,
          dueDate: new Date(dueDate),
          duration,
          totalPoints,
          testLink,
        })

        const r = await sendEmail({
          to: student.email,
          subject: `📝 New Test: ${finalTestName}`,
          content: html,
          fromEmail: tutorEmail,
          fromName: tutorName,
        })

        results.push({ email: student.email, sent: !!r?.success })
      }

      return res.json({ success: true, notified: results.length, results })
    } catch (error) {
      console.error("Test notify error:", error)
      return res.status(500).json({ success: false, error: "Failed to send notifications" })
    }
  },
)

// Student approval notification
app.post(
  "/api/tutor/student/approve-notify",
  authenticateJWT as RequestHandler,
  authorizeRoles("tutor") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { studentId, studentEmail, studentName, courseId } = req.body || {}
      const tutorId = req.user?.id as number

      const tutor = await prisma.user.findUnique({ where: { id: tutorId } })
      if (!tutor) {
        return res.status(404).json({ success: false, error: "Tutor not found" })
      }

      let student: any = null
      let finalStudentEmail = studentEmail
      let finalStudentName = studentName

      if (studentId) {
        student = await prisma.user.findUnique({ where: { id: studentId } })
        if (student) {
          finalStudentEmail = student.email
          finalStudentName = student.name || studentName
        }
      } else if (studentEmail) {
        student = await prisma.user.findUnique({ where: { email: studentEmail } })
        if (student) {
          finalStudentName = student.name || studentName
        }
      }

      if (!finalStudentEmail) {
        return res.status(400).json({ success: false, error: "Student email is required" })
      }

      const tutorName = tutor.name || "Your Tutor"
      const tutorEmail = tutor.email
      const frontendBase = process.env.FRONTEND_URL || "https://www.excellenceakademie.co.za"

      let courseName = "the course"
      let courseLink = `${frontendBase}/student/portal`

      if (courseId) {
        const course = await prisma.course.findUnique({ where: { id: courseId } })
        if (course) {
          courseName = course.name
          courseLink = `${frontendBase}/student/courses/${courseId}`
        }
      }

      const html = renderStudentApprovedEmail({
        studentName: finalStudentName || "Student",
        tutorName,
        courseName,
        courseLink,
      })

      const r = await sendEmail({
        to: finalStudentEmail,
        subject: `✅ Enrollment Approved - ${courseName}`,
        content: html,
        fromEmail: tutorEmail,
        fromName: tutorName,
      })

      return res.json({ success: true, sent: !!r?.success })
    } catch (error) {
      console.error("Approval notify error:", error)
      return res.status(500).json({ success: false, error: "Failed to send notification" })
    }
  },
)

// Student rejection notification
app.post(
  "/api/tutor/student/reject-notify",
  authenticateJWT as RequestHandler,
  authorizeRoles("tutor") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { studentId, studentEmail, studentName, courseId } = req.body || {}
      const tutorId = req.user?.id as number

      const tutor = await prisma.user.findUnique({ where: { id: tutorId } })
      if (!tutor) {
        return res.status(404).json({ success: false, error: "Tutor not found" })
      }

      let student: any = null
      let finalStudentEmail = studentEmail
      let finalStudentName = studentName

      if (studentId) {
        student = await prisma.user.findUnique({ where: { id: studentId } })
        if (student) {
          finalStudentEmail = student.email
          finalStudentName = student.name || studentName
        }
      } else if (studentEmail) {
        student = await prisma.user.findUnique({ where: { email: studentEmail } })
        if (student) {
          finalStudentName = student.name || studentName
        }
      }

      if (!finalStudentEmail) {
        return res.status(400).json({ success: false, error: "Student email is required" })
      }

      const tutorName = tutor.name || "Your Tutor"
      const tutorEmail = tutor.email

      let courseName = "the course"

      if (courseId) {
        const course = await prisma.course.findUnique({ where: { id: courseId } })
        if (course) {
          courseName = course.name
        }
      }

      const html = renderStudentRejectedEmail({
        studentName: finalStudentName || "Student",
        tutorName,
        courseName,
      })

      const r = await sendEmail({
        to: finalStudentEmail,
        subject: `Enrollment Status - ${courseName}`,
        content: html,
        fromEmail: tutorEmail,
        fromName: tutorName,
      })

      return res.json({ success: true, sent: !!r?.success })
    } catch (error) {
      console.error("Rejection notify error:", error)
      return res.status(500).json({ success: false, error: "Failed to send notification" })
    }
  },
)

// Materials endpoints
app.get("/api/materials", authenticateJWT as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.query
    const userId = req.user?.id
    const userRole = req.user?.role

    const where: any = {}

    // If tutor role, filter by tutor's courses only
    if (userRole === "tutor" && userId) {
      if (courseId) {
        // Verify the course belongs to this tutor
        const course = await prisma.course.findFirst({
          where: {
            id: Number.parseInt(courseId as string),
            tutorId: userId
          }
        })
        if (!course) {
          return res.status(403).json({ success: false, error: "Access denied to this course" })
        }
        where.courseId = Number.parseInt(courseId as string)
      } else {
        // Get all materials from tutor's courses
        const tutorCourses = await prisma.course.findMany({
          where: { tutorId: userId },
          select: { id: true }
        })
        const courseIds = tutorCourses.map(c => c.id)
        where.courseId = { in: courseIds }
      }
    } else if (courseId) {
      // Admin or student can filter by specific course
      where.courseId = Number.parseInt(courseId as string)
    }

    const materials = await prisma.courseMaterial.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: { id: true, name: true, tutorId: true },
        },
      },
    })

    return res.json({ success: true, materials })
  } catch (error) {
    console.error("Get materials error:", error)
    return res.status(500).json({ success: false, error: "Failed to fetch materials" })
  }
})

app.delete(
  "/api/materials/:id",
  authenticateJWT as RequestHandler,
  authorizeRoles("tutor", "admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params
      const userId = req.user?.id
      const userRole = req.user?.role

      // If tutor, verify they own the course this material belongs to
      if (userRole === "tutor" && userId) {
        const material = await prisma.courseMaterial.findUnique({
          where: { id },
          include: { course: true }
        })

        if (!material) {
          return res.status(404).json({ success: false, error: "Material not found" })
        }

        if (material.course.tutorId !== userId) {
          return res.status(403).json({ success: false, error: "Access denied: Material belongs to another tutor's course" })
        }
      }

      await prisma.courseMaterial.delete({
        where: { id },
      })

      return res.json({ success: true, message: "Material deleted successfully" })
    } catch (error) {
      console.error("Delete material error:", error)
      return res.status(500).json({ success: false, error: "Failed to delete material" })
    }
  },
)

// Query endpoint with validation
app.post("/api/query", async (req: Request, res: Response) => {
  try {
    const { query, params } = req.body

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        error: "Valid query string is required",
      })
    }

    const dangerousPatterns = /\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE)\b/i
    if (dangerousPatterns.test(query)) {
      return res.status(403).json({
        success: false,
        error: "Query contains restricted operations",
      })
    }

    const db = await getConnection()
    const result = await db.all(query, params || [])
    await db.close()

    res.json({
      success: true,
      data: result,
      count: Array.isArray(result) ? result.length : 1,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Query error:", error)
    res.status(500).json({
      success: false,
      error: "Database query failed",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// User routes
app.get("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id?.trim()) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      })
    }

    const db = await getConnection()
    const user = await db.get("SELECT * FROM users WHERE id = ?", [id])
    await db.close()

    if (user) {
      res.set("Cache-Control", "public, max-age=300")
      res.json({ success: true, data: user })
    } else {
      res.status(404).json({
        success: false,
        error: "User not found",
      })
    }
  } catch (error) {
    console.error("Error fetching user:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch user",
    })
  }
})

app.put("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, email, status } = req.body || {}
    if (!id?.trim()) {
      return res.status(400).json({ success: false, error: "User ID is required" })
    }

    const db = await getConnection()
    const existing = await db.get("SELECT * FROM users WHERE id = ?", [id])
    if (!existing) {
      await db.close()
      return res.status(404).json({ success: false, error: "User not found" })
    }

    const nextName = name !== undefined ? name : existing.name
    const nextEmail = email !== undefined ? email : existing.email
    const nextStatus = status !== undefined ? status : existing.status
    await db.run("UPDATE users SET name = ?, email = ?, status = ?, updated_at = ? WHERE id = ?", [
      nextName,
      nextEmail,
      nextStatus,
      new Date().toISOString(),
      id,
    ])
    const updated = await db.get("SELECT * FROM users WHERE id = ?", [id])
    await db.close()
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error("Error updating user:", error)
    return res.status(500).json({ success: false, error: "Failed to update user" })
  }
})

app.delete("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!id?.trim()) {
      return res.status(400).json({ success: false, error: "User ID is required" })
    }
    const db = await getConnection()
    const result = await db.run("UPDATE users SET status = ? WHERE id = ?", ["inactive", id])
    await db.close()
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: "User not found" })
    }
    return res.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return res.status(500).json({ success: false, error: "Failed to delete user" })
  }
})

// Course routes
app.get("/api/courses", authenticateJWT as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit, offset, category, all, tutorId } = req.query
    const userRole = req.user?.role
    const userId = req.user?.id

    // Build where clause
    const where: any = {}

    // CRITICAL: If tutor role, ALWAYS filter by their tutorId (ignore query param)
    if (userRole === "tutor" && userId) {
      where.tutorId = userId
    } else if (tutorId) {
      // Admin can filter by specific tutorId
      where.tutorId = Number.parseInt(tutorId as string, 10)
    }

    if (category) {
      where.category = String(category)
    }

    // If all=true, fetch everything (but still filtered by tutor if applicable)
    if (all === 'true') {
      const courses = await safeQuery(() => prisma.course.findMany({
        where,
        include: {
          materials: true,
          tests: true,
          courseEnrollments: true
        },
        orderBy: { createdAt: 'desc' }
      })) || []
      return res.json({
        success: true,
        data: courses,
        pagination: {
          limit: courses.length,
          offset: 0,
          count: courses.length,
          hasMore: false,
        },
      })
    }

    const limitInt = Math.min(Number.parseInt(limit as string) || 50, 100)
    const offsetInt = Math.max(Number.parseInt(offset as string) || 0, 0)

    const courses = await safeQuery(() => prisma.course.findMany({
      where,
      take: limitInt,
      skip: offsetInt,
      include: {
        materials: true,
        tests: true,
        courseEnrollments: true
      },
      orderBy: { createdAt: 'desc' }
    })) || []

    const count = await safeQuery(() => prisma.course.count({ where })) || 0

    res.set("Cache-Control", "public, max-age=60") // Reduced cache time for updates
    res.json({
      success: true,
      data: courses,
      pagination: {
        limit: limitInt,
        offset: offsetInt,
        count: count,
        hasMore: offsetInt + courses.length < count,
      },
    })
  } catch (error) {
    console.error("Error fetching courses:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch courses",
    })
  }
})

// Bulk Delete Endpoints
app.delete("/api/admin/courses/all", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Transactional delete to ensure consistency
    await prisma.$transaction(async (tx) => {
      // 1. Delete dependent records first
      await tx.timetableEntry.deleteMany({})
      await tx.scheduledSession.deleteMany({})
      await tx.courseEnrollment.deleteMany({})
      await tx.courseAnnouncement.deleteMany({})
      await tx.courseMaterial.deleteMany({})
      await tx.testSubmission.deleteMany({})
      
      // Delete tests and their questions (if not cascading)
      const tests = await tx.test.findMany({ select: { id: true } })
      if (tests.length > 0) {
        await tx.testQuestion.deleteMany({
          where: { testId: { in: tests.map(t => t.id) } }
        })
        await tx.test.deleteMany({})
      }

      // 2. Delete all courses
      await tx.course.deleteMany({})
    })

    const ioInstance = req.app.get("io") as Server | undefined
    if (ioInstance) {
      ioInstance.emit("timetable-updated")
      ioInstance.emit("courses-updated") // New event
    }

    res.json({ success: true, message: "All courses and related data deleted successfully" })
  } catch (error) {
    console.error("Bulk delete courses error:", error)
    res.status(500).json({ success: false, error: "Failed to delete all courses" })
  }
})

app.delete("/api/admin/tutors/all", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Unlink tutors from courses (set tutorId to null) or delete courses?
      // User asked to replace tutors, likely wants to clear them.
      // Safest is to set tutorId to null in courses, but user might want a clean slate.
      // However, if we delete tutors, we must handle foreign keys.
      
      // Update courses to remove tutor reference
      await tx.course.updateMany({
        data: { tutorId: null }
      })

      // Delete tutor-related data
      await tx.timetableEntry.deleteMany({
        where: { tutor: { role: 'tutor' } }
      })
      
      await tx.scheduledSession.deleteMany({
        where: { tutor: { role: 'tutor' } }
      })

      // Delete the tutors
      await tx.user.deleteMany({
        where: { role: 'tutor' }
      })
      
      // Also delete from 'tutors' table if it exists (schema has both User and Tutor model?)
      // Schema has `model Tutor` and `model User`. 
      // The `Tutor` model seems to be a separate table or legacy. 
      // The `User` model has `role`.
      // Let's delete from both to be sure.
      await tx.tutor.deleteMany({})
    })

    res.json({ success: true, message: "All tutors deleted successfully" })
  } catch (error) {
    console.error("Bulk delete tutors error:", error)
    res.status(500).json({ success: false, error: "Failed to delete all tutors" })
  }
})

app.delete("/api/admin/departments/all", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Delete all subjects (often mapped to departments)
    await prisma.subject.deleteMany({})
    
    // Also clear department field in courses?
    // Maybe not, as that might break course display. 
    // But user said "allow deleted depratment".
    // If they delete courses, departments are gone from the aggregation view.
    // If they want to just clear the department list (Subjects), this handles it.
    
    res.json({ success: true, message: "All departments/subjects deleted successfully" })
  } catch (error) {
    console.error("Bulk delete departments error:", error)
    res.status(500).json({ success: false, error: "Failed to delete all departments" })
  }
})

app.get("/api/courses/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Course ID is required",
      })
    }

    const db = await getConnection()
    const course = await db.get("SELECT * FROM courses WHERE id = ?", [id])
    await db.close()

    if (course) {
      res.set("Cache-Control", "public, max-age=300")
      res.json({ success: true, data: course })
    } else {
      res.status(404).json({
        success: false,
        error: "Course not found",
      })
    }
  } catch (error) {
    console.error("Error fetching course:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch course",
    })
  }
})

app.post("/api/courses", async (req: Request, res: Response) => {
  try {
    const { name, title, description, department, tutorId, startDate, endDate, category } = req.body
    const courseName = name || title

    if (!courseName || !description || !department || !tutorId) {
      return res.status(400).json({
        success: false,
        error: "name, description, department, and tutorId are required",
      })
    }

    
    const now = new Date().toISOString()
    const newCourse = await prisma.course.create({
        data: {
            name: courseName,
            description,
            department,
            tutorId: Number(tutorId),
            category: category || department,
            createdAt: now
        }
    })

    const io = req.app.get("io")
    io.emit("course-updated", { action: "create", course: newCourse })
    io.emit("admin-stats-updated")

    res.status(201).json({ success: true, data: newCourse })
  } catch (error) {
    console.error("Error creating course:", error)
    res.status(500).json({
      success: false,
      error: "Failed to create course",
    })
  }
})

app.delete("/api/courses/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Course ID is required",
      })
    }

    try {
        await prisma.course.delete({
            where: { id: Number(id) }
        })
    } catch (e) {
        return res.status(404).json({
            success: false,
            error: "Course not found",
        })
    }

    res.json({ success: true, message: "Course deleted successfully" })
  } catch (error) {
    console.error("Error deleting course:", error)
    res.status(500).json({
      success: false,
      error: "Failed to delete course",
    })
  }
})

// Tutors API
app.get("/api/tutors", async (req: Request, res: Response) => {
  try {
    const { subject, rating, limit = 20, offset = 0, search } = req.query

    const limitInt = Math.min(Number.parseInt(limit as string) || 20, 50)
    const offsetInt = Math.max(Number.parseInt(offset as string) || 0, 0)

    const whereConditions: any = { isActive: true }

    if (subject) {
      whereConditions.subjects = { contains: subject }
    }

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const tutors = await prisma.tutor.findMany({
      where: whereConditions,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: limitInt,
      skip: offsetInt,
    })

    const tutorsWithMetrics = tutors.map((tutor) => {
      let ratings: any[] = []
      let subjectsList: string[] = []

      try {
        ratings = typeof tutor.ratings === "string" ? JSON.parse(tutor.ratings) : tutor.ratings || []
        subjectsList = typeof tutor.subjects === "string" ? JSON.parse(tutor.subjects) : tutor.subjects || []
      } catch (e) {
        console.warn("JSON parse error for tutor:", tutor.id)
      }

      const avgRating =
        ratings.length > 0
          ? Math.round((ratings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / ratings.length) * 10) / 10
          : 0

      return {
        ...tutor,
        averageRating: avgRating,
        totalReviews: ratings.length,
        subjectsList,
        ratings: undefined,
      }
    })

    const filteredTutors = rating
      ? tutorsWithMetrics.filter((t) => t.averageRating >= Number.parseFloat(rating as string))
      : tutorsWithMetrics

    res.set("Cache-Control", "public, max-age=300")
    res.json({
      success: true,
      data: filteredTutors,
      pagination: {
        limit: limitInt,
        offset: offsetInt,
        count: filteredTutors.length,
        hasMore: filteredTutors.length === limitInt,
      },
    })
  } catch (error) {
    console.error("Error fetching tutors:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch tutors",
    })
  }
})

app.get("/api/tutors/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const tutor = await prisma.tutor.findUnique({
      where: { id },
    })

    if (!tutor) {
      return res.status(404).json({
        success: false,
        error: "Tutor not found",
      })
    }

    let ratings: any[] = []
    let subjectsList: string[] = []

    try {
      ratings = typeof tutor.ratings === "string" ? JSON.parse(tutor.ratings) : tutor.ratings || []
      subjectsList = typeof tutor.subjects === "string" ? JSON.parse(tutor.subjects) : tutor.subjects || []
    } catch (e) {
      console.warn("JSON parse error for tutor:", tutor.id)
    }

    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / ratings.length) * 10) / 10
        : 0

    const enhancedTutor = {
      ...tutor,
      averageRating: avgRating,
      totalReviews: ratings.length,
      subjectsList,
      ratingsList: ratings,
    }

    res.set("Cache-Control", "public, max-age=600")
    res.json({ success: true, data: enhancedTutor })
  } catch (error) {
    console.error("Error fetching tutor:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch tutor",
    })
  }
})

// Content API - Public endpoint (no authentication required for GET)
app.get("/api/admin/content/:type", async (req: Request, res: Response) => {
  try {
    const contentType = req.params.type
    let content

    const contentQueries: Record<string, () => Promise<any>> = {
      tutors: async () => {
        try {
          const tutors = await prisma.tutor.findMany({
            where: { isActive: true },
            orderBy: [{ order: "asc" }, { createdAt: "desc" }],
          })

          // Also fetch system users with role="tutor"
          const systemTutors = await prisma.user.findMany({
            where: { role: "tutor" },
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              subjects: true,
              createdAt: true,
            },
          })

          const allSubjects = await prisma.subject.findMany({
            where: { isActive: true },
            select: { name: true, category: true },
          })
          const subjMap = new Map(allSubjects.map((s) => [s.name, s.category]))

          const processedTutors = tutors.map((tutor) => {
            let ratings: any[] = []
            let subjects: string[] = []
            try {
              ratings = typeof tutor.ratings === "string" ? JSON.parse(tutor.ratings) : tutor.ratings || []
            } catch {
              console.warn("Ratings parse error:", tutor.id)
            }

            if (typeof tutor.subjects === "string") {
              const raw = tutor.subjects
              let parsed: unknown = null
              try {
                parsed = JSON.parse(raw)
              } catch {
                parsed = null
              }

              if (Array.isArray(parsed)) {
                subjects = parsed
                  .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
                  .map((s) => s.trim())
              } else if (
                parsed &&
                typeof parsed === "object" &&
                Array.isArray((parsed as { subjects?: unknown[] }).subjects)
              ) {
                const arr = (parsed as { subjects?: unknown[] }).subjects || []
                subjects = arr
                  .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
                  .map((s) => s.trim())
              } else {
                const parts = raw.split(/[|;,]/).map((s) => s.trim()).filter((s) => s.length > 0)
                if (parts.length > 0) {
                  subjects = parts
                } else if (raw.trim().length > 0) {
                  subjects = [raw.trim()]
                }
              }
            } else if (Array.isArray(tutor.subjects)) {
              subjects = tutor.subjects
                .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
                .map((s) => s.trim())
            } else {
              subjects = []
            }

            const departments = Array.from(new Set(subjects.map((n: string) => subjMap.get(n)).filter(Boolean)))

            const avgRating =
              ratings.length > 0
                ? Math.round((ratings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / ratings.length) * 10) /
                  10
                : 0

            return {
              ...tutor,
              subjects,
              departments,
              averageRating: avgRating,
              totalReviews: ratings.length,
              systemUserId: systemTutors.find(st => st.email === tutor.contactEmail || st.name === tutor.name)?.id || null,
              hasSystemAccount: systemTutors.some(st => st.email === tutor.contactEmail || st.name === tutor.name),
            }
          })

          return processedTutors
        } catch (e) {
          console.error('[Content API] Error fetching tutors:', e)
          return []
        }
      },
      "team-members": () =>
        safeQuery(() => prisma.teamMember.findMany({
          where: { isActive: true },
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        })).catch(() => []),
      "about-us": () =>
        safeQuery(() => prisma.aboutUsContent.findFirst({
          where: { isActive: true },
          orderBy: { updatedAt: "desc" },
        })).catch(() => null),
      hero: () =>
        safeQuery(() => prisma.heroContent.findFirst({
          orderBy: { updatedAt: "desc" },
        })).catch(() => null),
      features: () =>
        safeQuery(() => prisma.feature.findMany({
          where: { isActive: true },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        })).catch(() => []),
      announcements: () =>
        safeQuery(() => prisma.announcement
          .findMany({
            orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
          }))
          .catch(() => []),
      testimonials: () =>
        safeQuery(() => prisma.testimonial.findMany({
          where: { isActive: true },
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        })).catch(() => []),
      pricing: () =>
        safeQuery(() => prisma.pricingPlan.findMany({
          where: { isActive: true },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        })).catch(() => []),
      "site-settings": () =>
        safeQuery(() => prisma.siteSettings.findMany({
          orderBy: [{ category: "asc" }, { key: "asc" }],
        })).catch(() => []),
      events: async () => {
        // Events table might not exist in Prisma schema, return empty array
        return await safeQuery(() => prisma.$queryRaw`SELECT * FROM events ORDER BY date ASC`)
          .catch(() => []);
      },
      footer: () =>
        safeQuery(() => prisma.footerContent.findFirst({
          where: { isActive: true },
          orderBy: { updatedAt: "desc" },
        })).catch(() => null),
      subjects: () =>
        safeQuery(() => prisma.subject.findMany({
          where: { isActive: true },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        })).catch(() => []),
      navigation: () =>
        safeQuery(() => prisma.navigationItem.findMany({
          where: { isActive: true },
          select: { path: true, label: true, type: true },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        })).catch(() => []),
      "exam-rewrite": () =>
        safeQuery(() => prisma.examRewriteContent.findFirst({
          where: { isActive: true },
          orderBy: { updatedAt: "desc" },
        })).catch(() => null),
      "university-application": () =>
        safeQuery(() => prisma.universityApplicationContent.findFirst({
          where: { isActive: true },
          orderBy: { updatedAt: "desc" },
        })).catch(() => null),
      "contact-us": () =>
        safeQuery(() => prisma.contactUsContent.findFirst({
          where: { isActive: true },
          orderBy: { updatedAt: "desc" },
        })).catch(() => null),
      "become-tutor": () =>
        safeQuery(() => prisma.becomeTutorContent.findFirst({
          where: { isActive: true },
          orderBy: { updatedAt: "desc" },
        })).catch(() => null),
    }

    const queryFn = contentQueries[contentType]

    if (!queryFn) {
      return res.status(404).json({
        success: false,
        error: "Content type not found",
        availableTypes: Object.keys(contentQueries),
      })
    }

    content = await queryFn()

    if (content !== null && content !== undefined) {
      const listTypes = [
        "tutors",
        "team-members",
        "features",
        "testimonials",
        "pricing",
        "subjects",
        "announcements",
        "events",
        "navigation",
        "site-settings",
      ]

      res.set("Cache-Control", "no-store, no-cache, must-revalidate")
      res.json({
        success: true,
        data: content,
        type: contentType,
        isArray: listTypes.includes(contentType),
        count: Array.isArray(content) ? content.length : 1,
        timestamp: new Date().toISOString(),
      })
    } else {
      res.status(404).json({
        success: false,
        error: `${contentType} content not found`,
      })
    }
  } catch (error: any) {
    console.error(`Error fetching ${req.params.type} content:`, error)
    const message = process.env.NODE_ENV === "production" ? "Failed to fetch content" : error?.message
    res.status(500).json({
      success: false,
      error: `Failed to fetch ${req.params.type} content`,
      message,
    })
  }
})

// Content configuration for CRUD
const contentConfig: Record<string, { model: () => any; jsonFields: string[]; isSingleton: boolean; hasIsActive?: boolean }> = {
  features: { model: () => prisma.feature, jsonFields: ["benefits"], isSingleton: false, hasIsActive: true },
  testimonials: { model: () => prisma.testimonial, jsonFields: [], isSingleton: false, hasIsActive: true },
  "team-members": { model: () => prisma.teamMember, jsonFields: [], isSingleton: false, hasIsActive: true },
  pricing: { model: () => prisma.pricingPlan, jsonFields: ["features", "notIncluded"], isSingleton: false, hasIsActive: true },
  "site-settings": { model: () => prisma.siteSettings, jsonFields: [], isSingleton: false, hasIsActive: false },
  announcements: { model: () => prisma.announcement, jsonFields: [], isSingleton: false, hasIsActive: false },
  subjects: { model: () => prisma.subject, jsonFields: ["popularTopics", "difficulty"], isSingleton: false, hasIsActive: true },
  navigation: { model: () => prisma.navigationItem, jsonFields: [], isSingleton: false, hasIsActive: true },
  tutors: { model: () => prisma.tutor, jsonFields: ["subjects", "ratings"], isSingleton: false, hasIsActive: true },
  footer: {
    model: () => prisma.footerContent,
    jsonFields: ["socialLinks", "quickLinks", "resourceLinks"],
    isSingleton: true,
    hasIsActive: true,
  },
  hero: { model: () => prisma.heroContent, jsonFields: ["universities", "features"], isSingleton: true, hasIsActive: true },
  "about-us": { model: () => prisma.aboutUsContent, jsonFields: ["rolesResponsibilities"], isSingleton: true, hasIsActive: true },
  "contact-us": { model: () => prisma.contactUsContent, jsonFields: ["contactInfo"], isSingleton: true, hasIsActive: true },
  "exam-rewrite": {
    model: () => prisma.examRewriteContent,
    jsonFields: ["benefits", "process", "subjects", "pricingInfo"],
    isSingleton: true,
    hasIsActive: true,
  },
  "university-application": {
    model: () => prisma.universityApplicationContent,
    jsonFields: ["services", "process", "requirements", "pricing"],
    isSingleton: true,
    hasIsActive: true,
  },
  "become-tutor": {
    model: () => prisma.becomeTutorContent,
    jsonFields: ["requirements", "benefits"],
    isSingleton: true,
    hasIsActive: true,
  },
}

function stringifyJsonFields(data: Record<string, any>, fields: string[]): Record<string, any> {
  const out: Record<string, any> = { ...data }
  for (const f of fields) {
    if (out[f] !== undefined) out[f] = JSON.stringify(out[f])
  }
  return out
}

function parseJsonFields(entity: any, fields: string[]): any {
  if (!entity) return entity
  const out: any = { ...entity }
  for (const f of fields) {
    try {
      out[f] = entity[f] ? JSON.parse(entity[f]) : Array.isArray(out[f]) ? out[f] : (out[f] ?? null)
    } catch (e) {
      console.error(`Failed to parse JSON field ${f}:`, e);
      out[f] = entity[f]; // Keep original value if JSON parse fails
    }
  }
  return out
}

// Create content
app.post(
  "/api/admin/content/:type",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { type } = req.params
      const cfg = contentConfig[type]
      if (!cfg) return res.status(404).json({ success: false, error: "Content type not found" })
      const model = cfg.model()
      let rawPayload: Record<string, any> = req.body || {}

      if (type === "tutors") {
        const { systemUserId, hasSystemAccount, ...clean } = rawPayload
        rawPayload = clean
      }

      const payload = stringifyJsonFields(rawPayload, cfg.jsonFields)

      if (cfg.hasIsActive === false) {
        delete payload.isActive
      }

      if (type === "announcements") {
        delete payload.created_at

        const contentText = String(payload.content || "").trim()
        if (!payload.title) {
          payload.title = contentText.slice(0, 80) || "Announcement"
        }
        payload.authorId = 1
        if (payload.department === undefined) {
          payload.department = null
        }
      }

      if (type === "tutors") {
        const domain = (process.env.TUTOR_EMAIL_DOMAIN || "excellenceakademie.co.za").toString().toLowerCase()
        const baseName = String(payload.contactName || payload.name || "")
          .toLowerCase()
          .trim()
        const localPart =
          baseName
            .replace(/[^a-z0-9\s.-]/g, "")
            .replace(/\s+/g, ".")
            .replace(/\.+/g, ".")
            .replace(/^\./, "")
            .replace(/\.$/, "") || "tutor"
        if (!payload.contactEmail || !String(payload.contactEmail).includes("@")) {
          payload.contactEmail = `${localPart}@${domain}`
        }
      }

      let created
      if (cfg.isSingleton) {
        if (cfg.hasIsActive !== false) {
          await safeQuery(() => model.updateMany({ where: { isActive: true }, data: { isActive: false } }))
          created = await safeQuery(() => model.create({ data: { ...payload, isActive: true } }))
        } else {
          created = await safeQuery(() => model.create({ data: payload }))
        }
      } else {
        if (cfg.hasIsActive !== false) {
          created = await safeQuery(() => model.create({ data: { ...payload, isActive: true } }))
        } else {
          created = await safeQuery(() => model.create({ data: payload }))
        }
      }

      if (!created) throw new Error("Database create failed")

      const parsed = parseJsonFields(created, cfg.jsonFields)

      // Emit real-time update
      io.emit('content-updated', { type, action: 'create', data: parsed })

      return res.status(201).json({ success: true, data: parsed })
    } catch (error: any) {
      console.error(`Content create error for ${req.params.type}:`, error)
      const message = error instanceof Error ? error.message : "Unknown database error"
      return res.status(500).json({ 
        success: false, 
        error: "Failed to create content", 
        details: message,
        type: req.params.type
      })
    }
  },
)

// Update content
app.put(
  "/api/admin/content/:type",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { type } = req.params
      const cfg = contentConfig[type]
      if (!cfg) return res.status(404).json({ success: false, error: "Content type not found" })
      const model = cfg.model()
      const { id, createdAt, updatedAt, averageRating, totalReviews, departments, ...rest } = req.body || {}
      if (!id) return res.status(400).json({ success: false, error: "ID is required" })
      let updatePayload: Record<string, any> = rest

      if (type === "tutors") {
        const { systemUserId, hasSystemAccount, ...clean } = updatePayload
        updatePayload = clean
      }

      const data = stringifyJsonFields(updatePayload, cfg.jsonFields)

      if (cfg.hasIsActive === false) {
        delete data.isActive
      }

      // Special handling for announcements to remove frontend-only fields
      if (type === "announcements") {
        delete data.created_at
      }

      const updated = await safeQuery(() => model.update({ where: { id }, data }))
      if (!updated) throw new Error("Database update failed")
      const parsed = parseJsonFields(updated, cfg.jsonFields)

      // Emit real-time update
      io.emit('content-updated', { type, action: 'update', data: parsed })

      return res.json({ success: true, data: parsed })
    } catch (error: any) {
      console.error(`Content update error for ${req.params.type}:`, error)
      const message = error instanceof Error ? error.message : "Unknown database error"
      return res.status(500).json({ 
        success: false, 
        error: "Failed to update content",
        details: message 
      })
    }
  },
)

// Delete content
app.delete(
  "/api/admin/content/:type",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { type } = req.params
      const id = req.query.id as string
      if (!id) return res.status(400).json({ success: false, error: "ID is required" })
      
      const cfg = contentConfig[type]
      if (!cfg) return res.status(404).json({ success: false, error: "Content type not found" })
      const model = cfg.model()

      if (cfg.hasIsActive !== false) {
        // Soft delete
        await model.update({ where: { id }, data: { isActive: false } })
      } else {
        // Hard delete
        await model.delete({ where: { id } })
      }

      // Emit real-time update
      io.emit('content-updated', { type, action: 'delete', id })

      return res.json({ success: true })
    } catch (error: any) {
      console.error(`Content delete error for ${req.params.type}:`, error)
      return res.status(500).json({ success: false, error: "Failed to delete content", details: error.message })
    }
  },
)

// Delete content
app.delete(
  "/api/admin/content/:type",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { type } = req.params
      const cfg = contentConfig[type]
      if (!cfg) return res.status(404).json({ success: false, error: "Content type not found" })
      const model = cfg.model()
      const id = (req.query.id as string) || (req.body && req.body.id)
      if (!id) return res.status(400).json({ success: false, error: "ID is required" })
      
      if (cfg.hasIsActive !== false) {
        await model.update({ where: { id }, data: { isActive: false } })
      } else {
        await model.delete({ where: { id } })
      }

      // Emit real-time update
      io.emit('content-updated', { type, action: 'delete', id })

      return res.status(200).json({ success: true, message: "Deleted" })
    } catch (error: any) {
      console.error(`Content delete error for ${req.params.type}:`, error)
      const message = error instanceof Error ? error.message : "Unknown database error"
      return res.status(500).json({ success: false, error: "Failed to delete content", details: message })
    }
  },
)

// Create login for tutor
app.post(
  "/api/admin/tutors/create-login",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, name } = req.body
      if (!email) return res.status(400).json({ success: false, error: "Email is required" })

      await ensureCredentialsTable()
      const db = await getConnection()
      
      try {
        const userEmail = String(email).toLowerCase()
        const defaultPassword = "Welcome2025!" // Default password for manual creation
        
        // Check if user exists in Prisma
        let user = await prisma.user.findUnique({ where: { email: userEmail } })
        let isNew = false

        if (!user) {
          // Create user
          const hash = await hashPassword(defaultPassword)
          user = await prisma.user.create({
            data: {
              email: userEmail,
              name: name || userEmail.split("@")[0],
              role: "tutor",
              password_hash: hash,
            }
          })
          isNew = true
          
          // Add to user_credentials
          const now = new Date().toISOString()
          await db.run(
            "INSERT INTO user_credentials (email, user_id, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            [userEmail, user.id, hash, now, now]
          )
        } else {
          // Update user role to tutor if not already
          if (user.role !== "tutor" && user.role !== "admin") {
             await prisma.user.update({ where: { id: user.id }, data: { role: "tutor" } })
          }
          
          // Ensure credentials exist
          const row = await db.get("SELECT * FROM user_credentials WHERE email = ?", [userEmail])
          if (!row) {
             const hash = await hashPassword(defaultPassword)
             const now = new Date().toISOString()
             await db.run(
               "INSERT INTO user_credentials (email, user_id, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
               [userEmail, user.id, hash, now, now]
             )
             isNew = true // Treat as new login created (password reset to default)
          } else {
             // Login exists, do nothing (we don't reset password unless requested)
             return res.json({ success: true, message: "Login already exists", email: userEmail, exists: true })
          }
        }

        return res.json({ 
          success: true, 
          message: "Login created successfully", 
          email: userEmail, 
          password: defaultPassword,
          isNew: true 
        })
      } finally {
        await db.close()
      }

    } catch (error) {
      console.error("Create tutor login error:", error)
      return res.status(500).json({ success: false, error: "Failed to create login" })
    }
  }
)

// Normalize tutor emails
app.post(
  "/api/admin/tutors/normalize-emails",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const domain = (process.env.TUTOR_EMAIL_DOMAIN || "excellenceakademie.co.za").toString().toLowerCase()
      const tutors = await prisma.tutor.findMany({ where: { isActive: true } })
      let updatedCount = 0
      for (const t of tutors) {
        const baseName = String(t.contactName || t.name || "")
          .toLowerCase()
          .trim()
        const localPart =
          baseName
            .replace(/[^a-z0-9\s.-]/g, "")
            .replace(/\s+/g, ".")
            .replace(/\.+/g, ".")
            .replace(/^\./, "")
            .replace(/\.$/, "") || "tutor"
        const targetEmail = `${localPart}@${domain}`
        const current = String(t.contactEmail || "").toLowerCase()
        const needsUpdate = !current || !current.includes("@") || !current.endsWith(`@${domain}`)
        if (needsUpdate || current !== targetEmail) {
          await prisma.tutor.update({ where: { id: t.id }, data: { contactEmail: targetEmail } })
          updatedCount++
        }
      }
      return res.json({ success: true, updated: updatedCount, domain })
    } catch (error) {
      console.error("Normalize tutor emails error:", error)
      return res.status(500).json({ success: false, error: "Failed to normalize tutor emails" })
    }
  },
)

// Image upload endpoint
app.post(
  "/api/admin/upload",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { file, fileName } = req.body || {}
      if (!file || typeof file !== "string") {
        return res.status(400).json({ success: false, error: "file (base64) is required" })
      }

      const match =
        /^data:((image\/(png|jpeg|jpg|webp|svg\+xml))|(text\/(html|markdown|plain|x-markdown))|(application\/(json|pdf)));base64,(.+)$/i.exec(
          file,
        )
      if (!match)
        return res
          .status(400)
          .json({ success: false, error: "Invalid file data URL. Allowed types: Images, HTML, Markdown, PDF, JSON" })
      const mime = match[1]
      const base64 = match[match.length - 1]
      const buffer = Buffer.from(base64, "base64")

      if (mime.startsWith("image/") || mime.startsWith("video/")) {
        const resourceType = mime.startsWith("video/") ? "video" : "image"
        const uploadResult = await cloudinary.uploader.upload(`data:${mime};base64,${base64}`, {
          resource_type: resourceType,
          folder: "content-manager",
          public_id: fileName
            ?.toString()
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, "-"),
        })

        return res.status(201).json({
          success: true,
          url: uploadResult.secure_url,
          mime: mime,
          size: uploadResult.bytes,
          publicId: uploadResult.public_id,
          resourceType: uploadResult.resource_type,
        })
      }

      let ext = "bin"
      if (mime.includes("text/html")) {
        ext = "html"
      } else if (mime.includes("markdown") || mime.includes("text/plain")) {
        ext = "md"
      } else if (mime.includes("pdf")) {
        ext = "pdf"
      } else if (mime.includes("json")) {
        ext = "json"
      }

      await fs.mkdir(uploadsDir, { recursive: true })
      const safeBase =
        fileName
          ?.toString()
          .toLowerCase()
          .replace(/[^a-z0-9-_]/g, "-") || "file"
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const name = `${safeBase}-${unique}.${ext}`
      const fullPath = path.join(uploadsDir, name)
      await fs.writeFile(fullPath, buffer)

      const urlPath = `/uploads/${name}`
      return res.status(201).json({ success: true, url: urlPath, mime, size: buffer.length })
    } catch (error) {
      console.error("Upload error:", error)
      return res.status(500).json({ success: false, error: "Failed to upload image" })
    }
  },
)

app.post(
  "/api/cloudinary/delete",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { publicId, resourceType } = req.body || {}
      if (!publicId || typeof publicId !== "string") {
        return res.status(400).json({ success: false, error: "publicId is required" })
      }

      const type =
        resourceType === "video" || resourceType === "raw" ? resourceType : "image"

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: type,
      })

      if (result.result !== "ok" && result.result !== "not found") {
        return res
          .status(500)
          .json({ success: false, error: "Cloudinary delete failed", details: result })
      }

      return res.status(200).json({ success: true, result: result.result })
    } catch (error) {
      console.error("Cloudinary delete error:", error)
      return res.status(500).json({ success: false, error: "Failed to delete resource" })
    }
  },
)

// Contact email endpoint
app.post("/api/contact", async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body || {}
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: "name, email, and message are required" })
    }
    const to = process.env.CONTACT_EMAIL || "admin@excellenceacademia.com"
    const adminHtml = renderBrandedEmail({
      title: "New Contact Form Submission",
      message: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p>${(message || "").replace(/\n/g, "<br/>")}</p>
      `,
      footerNote: "A visitor submitted this message via the contact form.",
    })
    const adminSend = await sendEmail({ to, subject: subject || "New Contact Message", content: adminHtml })

    if (email) {
      const ackHtml = renderBrandedEmail({
        title: "We received your message",
        message: `
          <p>Hi ${name},</p>
          <p>We received your message and will get back to you shortly.</p>
          <p>Best regards,<br/>Excellence Academia</p>
        `,
      })
      try {
        await sendEmail({ to: email, subject: "We received your message", content: ackHtml })
      } catch {}
    }

    if (!adminSend.success) throw new Error("Email send failed")
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Contact email error:", error)
    return res.status(500).json({ success: false, error: "Failed to send message" })
  }
})

// Admin test email endpoint
app.post(
  "/api/admin/test-email",
  authenticateJWT as RequestHandler,
  authorizeRoles("admin") as RequestHandler,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const to = (req.body && req.body.to) || process.env.CONTACT_EMAIL || "admin@excellenceacademia.com"
      const html = renderBrandedEmail({
        title: "Test Email from Excellence Academia",
        message: "<p>This is a test email to verify your email delivery configuration.</p>",
      })
      const sent = await sendEmail({ to, subject: "Test Email", content: html })
      return res.status(200).json({ success: true, result: sent })
    } catch (error) {
      console.error("Test email error:", error)
      return res.status(500).json({ success: false, error: "Failed to send test email" })
    }
  },
)

// Bulk students creation
app.post("/api/students/bulk", async (req: Request, res: Response) => {
  try {
    const { emails } = req.body

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        error: "emails array is required",
      })
    }

    
    const ids: string[] = []

    for (const email of emails) {
      if (email && email.includes("@")) {
        const name = email
          .split("@")[0]
          .replace(/[.]/g, " ")
          .replace(/\b\w/g, (l: string) => l.toUpperCase())

        const newUser = await safeQuery(() => prisma.user.create({
            data: {
                name,
                email,
                role: "student",
                createdAt: new Date().toISOString()
            }
        }))
        if (newUser) {
          ids.push(newUser.id.toString())
        }
      }
    }

    res.status(201).json({ success: true, ids, count: ids.length })
  } catch (error) {
    console.error("Error creating bulk students:", error)
    res.status(500).json({
      success: false,
      error: "Failed to create students",
    })
  }
})

// Students list
app.get("/api/students", authenticateJWT as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role
    const userId = req.user?.id

    let where: any = { role: "student" }

    // CRITICAL: If tutor, only return THEIR students
    if (userRole === "tutor" && userId) {
      // Get tutor's courses
      const tutorCourses = await safeQuery(() => prisma.course.findMany({
        where: { tutorId: userId },
        select: { id: true }
      })) || []
      const courseIds = tutorCourses.map(c => c.id)

      // Get students enrolled in those courses
      const enrollments = await safeQuery(() => prisma.courseEnrollment.findMany({
        where: { courseId: { in: courseIds } },
        select: { userId: true },
        distinct: ['userId']
      })) || []
      const studentIds = enrollments.map(e => e.userId)

      where = {
        id: { in: studentIds },
        role: "student"
      }
    }

    const students = await prisma.user.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        courseEnrollments: { include: { course: true } },
      },
    })

    const result = students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      status: (s as any).status || "active",
      progress: Math.floor(Math.random() * 100),
      lastActivity: (s.updatedAt as Date).toISOString(),
      enrolledCourses: (s.courseEnrollments || []).map((e: any) => e.course?.id).filter(Boolean),
      joinDate: (s.createdAt as Date).toISOString(),
      totalAssignments: Math.floor(Math.random() * 12),
      completedAssignments: Math.floor(Math.random() * 12),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || "Student")}&background=random`,
    }))
    res.set("Cache-Control", "public, max-age=120")
    return res.json({ success: true, data: result })
  } catch (error) {
    console.error("Error fetching students:", error)
    return res.status(500).json({ success: false, error: "Failed to fetch students" })
  }
})

// Student Live Sessions
app.get("/api/student/live-sessions", authenticateJWT as RequestHandler, authorizeRoles("student", "admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = Number.parseInt((req.query.studentId as string) || (req as any).user?.id, 10)
    if (isNaN(studentId)) {
      return res.status(400).json({ success: false, error: "Student ID is required" })
    }

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: studentId },
      select: { courseId: true, course: true },
    })
    const courseIds = enrollments.map((e) => e.courseId)

    const liveSessions: any[] = []
    for (const courseId of courseIds) {
      const activeSession = activeSessions.get(String(courseId))
      if (activeSession) {
        const enrollment = enrollments.find((e) => e.courseId === courseId)
        liveSessions.push({
          ...activeSession,
          courseId,
          courseName: (enrollment?.course as any)?.name || "Course",
          isLive: true,
        })
      }
    }

    return res.json({ success: true, data: liveSessions })
  } catch (error) {
    console.error("Error fetching live sessions:", error)
    return res.status(500).json({ success: false, error: "Failed to fetch live sessions" })
  }
})

// Student Dashboard
app.get("/api/student/dashboard", authenticateJWT as RequestHandler, authorizeRoles("student", "admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawStudentId = (req.query.studentId as string) || (req as any).user?.id
    if (!rawStudentId) return res.status(400).json({ success: false, error: "Student ID is required" })

    const studentId = Number.parseInt(String(rawStudentId), 10)
    if (isNaN(studentId)) {
      return res.status(400).json({ success: false, error: "Invalid Student ID format" })
    }

    const student = await prisma.user.findUnique({ where: { id: studentId } })
    if (!student) return res.status(404).json({ success: false, error: "Student not found" })

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: studentId },
      include: {
        course: {
          include: {
            tutor: true,
            materials: true,
            announcements: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
            tests: {
              include: {
                submissions: { where: { userId: studentId } },
              },
            },
          },
        },
      },
    })

    const testSubmissions = await prisma.testSubmission.findMany({
      where: { userId: studentId },
      include: { test: { include: { course: true } } },
      orderBy: { createdAt: "desc" },
    })

    const notifications = await prisma.notification.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    const enrolledCourseIds = enrollments.map((e) => e.courseId)
    const scheduledSessions = await prisma.scheduledSession.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        scheduledAt: { gte: new Date() },
        status: { in: ["scheduled", "active"] },
      },
      include: { course: true, tutor: true },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    })

    const averageGrade =
      testSubmissions.length > 0
        ? testSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / testSubmissions.length
        : 0

    let timetable: any[] = []
    try {
      const timetableData = await fs.readFile(timetableFile, "utf-8")
      timetable = JSON.parse(timetableData)
    } catch (e) {}

    const getNextSession = (courseName: string) => {
      if (!courseName || timetable.length === 0) return null

      const courseEntries = timetable.filter((t: any) => t.courseName === courseName)
      if (courseEntries.length === 0) return null

      const daysMap: Record<string, number> = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      }

      const now = new Date()

      const upcomingSessions = courseEntries
        .map((entry: any) => {
          const dayIndex = daysMap[entry.day.toLowerCase().trim()]
          if (dayIndex === undefined) return null

          const [time, modifier] = entry.time.split(" ")
          let [hours, minutes] = time.split(":").map(Number)

          if (modifier) {
            if (modifier.toLowerCase() === "pm" && hours < 12) hours += 12
            if (modifier.toLowerCase() === "am" && hours === 12) hours = 0
          }

          const sessionDate = new Date(now)
          sessionDate.setHours(hours, minutes, 0, 0)

          let dayDiff = dayIndex - now.getDay()
          if (dayDiff < 0) dayDiff += 7

          if (dayDiff === 0 && now > sessionDate) {
            dayDiff = 7
          }

          sessionDate.setDate(now.getDate() + dayDiff)
          return { date: sessionDate, ...entry }
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())

      if (upcomingSessions.length === 0) return null

      const next = upcomingSessions[0]
      const formatted =
        next.date
          .toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
          .replace(",", "") + (next.type ? ` (${next.type})` : "")

      return { formatted, date: next.date }
    }

    const courses = enrollments.map((e) => {
      const course = e.course as any
      const courseTests = (course.tests || []) as any[]
      const completedTests = courseTests.filter((t) => t.submissions && t.submissions.length > 0)

      const activeSession = activeSessions.get(String(course.id))

      const nextSessionData = getNextSession(course.name)

      return {
        id: course.id,
        name: course.name,
        description: course.description,
        tutor: course.tutor?.name || "Tutor",
        tutorEmail: course.tutor?.email || "",
        nextSession: nextSessionData?.formatted || "TBA",
        nextSessionDate: nextSessionData?.date || null,
        progress: courseTests.length > 0 ? (completedTests.length / courseTests.length) * 100 : 0,
        isLive: !!activeSession,
        liveSessionId: activeSession?.sessionId,
        category: activeSession?.department,
        materials: (course.materials || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          type: m.type,
          url: m.url,
          dateAdded: m.createdAt,
          completed: false,
        })),
        tests: courseTests.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          questions: 10,
          totalPoints: 100,
          status: t.submissions && t.submissions.length > 0 ? "completed" : "upcoming",
          score: t.submissions && t.submissions.length > 0 ? t.submissions[0].score : null,
        })),
        color: "blue",
        announcements: (course.announcements || []).map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          date: a.createdAt,
          type: "info",
        })),
        grade: averageGrade,
        enrollmentDate: e.createdAt,
        status: e.status,
      }
    })

    const assignments = enrollments.flatMap((e) => {
      const course = e.course as any
      return (course.tests || [])
        .filter((t: any) => !t.submissions || t.submissions.length === 0)
        .map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || "Test/Assignment",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          courseId: course.id,
          status: "pending",
        }))
    })

    const recentActivities = testSubmissions.map((s) => ({
      id: s.id,
      type: "assignment_submitted",
      message: `Submitted ${s.test?.title || "Test"}`,
      timestamp: s.createdAt,
      courseName: s.test?.course?.name || "Course",
    }))

    const timetableSessions = timetable
      .filter((t: any) => enrollments.some((e) => e.course.name === t.courseName))
      .map((t: any, index: number) => ({
        id: `timetable-${index}`,
        courseName: t.courseName,
        tutorName: t.tutorName || "Tutor",
        date: new Date().toISOString(),
        time: `${t.day} ${t.time}`,
        duration: "60 minutes",
        type: t.type || "Class",
        location: "Online",
        source: "timetable",
      }))

    const dbSessions = scheduledSessions.map((s: any) => ({
      id: s.id,
      courseName: s.course?.name || s.title,
      tutorName: s.tutor?.name || "Tutor",
      date: s.scheduledAt.toISOString(),
      time: s.scheduledAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      duration: `${s.duration} minutes`,
      type: "Scheduled Session",
      location: "Online",
      sessionId: s.sessionId,
      status: s.status,
      source: "scheduled",
    }))

    const upcomingSessions = [...dbSessions, ...timetableSessions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10)

    const dashboardData = {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        avatar: `https://ui-avatars.com/api/?name=${student.name}&background=random`,
      },
      statistics: {
        totalCourses: enrollments.length,
        completedCourses: enrollments.filter((e) => e.status === "completed").length,
        activeCourses: enrollments.filter((e) => e.status === "enrolled").length,
        averageGrade: Math.round(averageGrade * 100) / 100,
        totalStudyHours: 0,
        streak: 0,
      },
      upcomingSessions: upcomingSessions,
      recentActivities: recentActivities.length > 0 ? recentActivities : [],
      courses,
      assignments,
      notifications: notifications.map((n) => ({
        id: n.id,
        message: n.message,
        read: n.read,
        date: (n.createdAt as Date).toISOString(),
        type: n.type || "course",
      })),
      achievements: [],
    }

    return res.status(200).json(dashboardData)
  } catch (error) {
    console.error("Error fetching student dashboard:", error)
    return res.status(500).json({ success: false, error: "Failed to fetch student dashboard" })
  }
})

// Tutor Dashboard
app.get("/api/tutor/dashboard", authenticateJWT as RequestHandler, authorizeRoles("tutor", "admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tutorIdParam = (req.query.tutorId as string) || (req as any).user?.id
    if (!tutorIdParam) return res.status(400).json({ success: false, error: "Tutor ID is required" })

    const tutorId = Number.parseInt(tutorIdParam, 10)
    if (isNaN(tutorId)) return res.status(400).json({ success: false, error: "Invalid tutor ID" })

    const tutorUser = await prisma.user.findFirst({
      where: { id: tutorId, role: "tutor" },
    })
    if (!tutorUser) return res.status(404).json({ success: false, error: "Tutor not found" })

    const courses = await prisma.course.findMany({
      where: { tutorId: tutorId },
      include: {
        courseEnrollments: { include: { user: true } },
        tests: { include: { submissions: true } },
      },
    })

    const studentMap = new Map()
    courses.forEach((course) => {
      course.courseEnrollments.forEach((enrollment) => {
        const student = enrollment.user
        if (student && student.role === "student") {
          if (!studentMap.has(student.id)) {
            studentMap.set(student.id, {
              ...student,
              enrolledCourses: [course],
            })
          } else {
            const existing = studentMap.get(student.id)
            if (!existing.enrolledCourses.find((c: any) => c.id === course.id)) {
              existing.enrolledCourses.push(course)
            }
          }
        }
      })
    })

    const students = Array.from(studentMap.values())

    const notifications = await prisma.notification.findMany({
      where: { userId: tutorId },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    const scheduledSessions = await prisma.scheduledSession.findMany({
      where: { tutorId: tutorId },
      include: { course: true },
      orderBy: { scheduledAt: "asc" },
    })

    const dashboardData = {
      tutor: {
        id: tutorUser.id,
        name: tutorUser.name,
        email: tutorUser.email,
        department: tutorUser.department || "General",
        subjects: parseArrayField(tutorUser.subjects),
        contactEmail: tutorUser.email,
        contactPhone: "",
        description: "",
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(tutorUser.name)}&background=random`,
      },
      statistics: {
        totalStudents: students.length,
        totalCourses: courses.length,
        activeStudents: students.length,
        completedSessions: scheduledSessions.filter((s) => s.status === "completed").length,
        averageRating: 4.8,
        totalEarnings: 0,
      },
      upcomingSessions: scheduledSessions
        .filter((s) => s.status === "scheduled" && new Date(s.scheduledAt) > new Date())
        .slice(0, 5)
        .map((s) => ({
          id: s.id,
          courseName: s.course?.name || s.title,
          studentName: "All Students",
          studentEmail: "",
          date: s.scheduledAt.toISOString(),
          time: s.scheduledAt.toLocaleTimeString(),
          duration: s.duration,
          type: "class",
          status: s.status,
          location: "Online",
          notes: s.description || "",
          materials: [],
        })),
      recentActivities: scheduledSessions
        .filter((s) => s.status === "completed")
        .slice(0, 5)
        .map((s) => ({
          id: s.id,
          type: "session_completed",
          message: `Completed session: ${s.title}`,
          timestamp: s.updatedAt.toISOString(),
          studentName: "Class",
        })),
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        progress: Math.floor(Math.random() * 100),
        lastActivity: s.updatedAt?.toISOString() || new Date().toISOString(),
        status: "active",
        enrolledCourses: s.enrolledCourses.map((c: any) => c.name),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`,
        grades: {},
        totalSessions: 0,
        nextSession: null,
      })),
      courses: courses.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        students: c.courseEnrollments.length,
        nextSession: null,
        progress: Math.floor(Math.random() * 100),
        materials: [],
        tests: c.tests.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          submissions: t.submissions.length,
          totalPoints: 100,
        })),
        color: "blue",
      })),
      notifications: notifications.map((n) => ({
        id: n.id,
        message: n.message,
        read: n.read,
        timestamp: n.createdAt.toISOString(),
      })),
      scheduledSessions: scheduledSessions.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        courseId: s.courseId,
        courseName: s.course?.name || "Unknown Course",
        scheduledAt: s.scheduledAt.toISOString(),
        duration: s.duration,
        status: s.status,
        sessionId: s.sessionId,
      })),
    }

    return res.status(200).json(dashboardData)
  } catch (error) {
    console.error("Error fetching tutor dashboard:", error)
    return res.status(500).json({ success: false, error: "Failed to fetch tutor dashboard" })
  }
})

// Tutor-specific stats for analytics (only shows data for the tutor's courses/students)
app.get("/api/tutor/stats", authenticateJWT as RequestHandler, authorizeRoles("tutor", "admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tutorIdParam = (req.query.tutorId as string) || (req as any).user?.id
    if (!tutorIdParam) return res.status(400).json({ success: false, error: "Tutor ID is required" })

    const tutorId = Number.parseInt(tutorIdParam, 10)
    if (isNaN(tutorId)) return res.status(400).json({ success: false, error: "Invalid tutor ID" })

    // Get tutor's courses
    const courses = await prisma.course.findMany({
      where: { tutorId: tutorId },
      include: {
        courseEnrollments: { include: { user: true } },
        tests: { include: { submissions: true } },
      },
    })

    // Get unique students enrolled in tutor's courses
    const studentSet = new Set<number>()
    courses.forEach((course) => {
      course.courseEnrollments.forEach((enrollment) => {
        if (enrollment.user && enrollment.user.role === "student") {
          studentSet.add(enrollment.user.id)
        }
      })
    })

    const totalStudents = studentSet.size
    const totalCourses = courses.length
    const activeStudents = Math.round(totalStudents * 0.8)

    // Calculate completion rate based on test submissions
    let totalSubmissions = 0
    let totalPossibleSubmissions = 0
    courses.forEach((course) => {
      const studentsInCourse = course.courseEnrollments.length
      course.tests.forEach((test) => {
        totalSubmissions += test.submissions.length
        totalPossibleSubmissions += studentsInCourse
      })
    })
    const completionRate = totalPossibleSubmissions > 0 
      ? Math.round((totalSubmissions / totalPossibleSubmissions) * 100) 
      : 0

    // Calculate average grade from submissions
    let totalGrades = 0
    let gradeCount = 0
    courses.forEach((course) => {
      course.tests.forEach((test) => {
        test.submissions.forEach((sub: any) => {
          if (sub.score !== null && sub.score !== undefined) {
            totalGrades += sub.score
            gradeCount++
          }
        })
      })
    })
    const averageGrade = gradeCount > 0 ? Math.round(totalGrades / gradeCount) : 0

    // Course stats for the tutor's courses only
    const courseStats = courses.map((course) => ({
      name: course.name,
      students: course.courseEnrollments.length,
      completion: Math.floor(Math.random() * 40) + 60, // Placeholder - would need actual progress tracking
    }))

    // Monthly data (simplified - would need actual tracking)
    const monthlyData = [
      { month: "Jan", students: Math.floor(totalStudents * 0.6), courses: Math.floor(totalCourses * 0.7) },
      { month: "Feb", students: Math.floor(totalStudents * 0.7), courses: Math.floor(totalCourses * 0.8) },
      { month: "Mar", students: Math.floor(totalStudents * 0.8), courses: Math.floor(totalCourses * 0.9) },
      { month: "Apr", students: Math.floor(totalStudents * 0.9), courses: totalCourses },
      { month: "May", students: totalStudents, courses: totalCourses },
    ]

    res.set("Cache-Control", "public, max-age=60")
    return res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        totalCourses,
        completionRate,
        averageGrade,
        monthlyGrowth: 8,
        courseStats,
        monthlyData,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Tutor stats error:", error)
    return res.status(500).json({ success: false, error: "Failed to load tutor stats" })
  }
})

// Database initialization
async function initializeDatabase(): Promise<void> {
  try {
    console.log("Initializing database schema (Prisma)...")
    // Prisma handles schema management via migrations or db push
    // No manual SQL execution needed here for Postgres
    console.log("✓ Database schema initialization completed (via Prisma)")
  } catch (e) {
    console.error("❌ Database initialization failed:", e)
    throw e
  }
}

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`Received ${signal}. Starting graceful shutdown...`)
  try {
    stopScheduledSessionChecker()
    await prisma.$disconnect()
    console.log("✓ Database connections closed")
    process.exit(0)
  } catch (error) {
    console.error("Error during shutdown:", error)
    process.exit(1)
  }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"))
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  process.exit(1)
})

// Helper functions for bulk upload
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

function parseArrayField(value: string | undefined): string[] {
  if (!value) return []
  if (value.startsWith("[") && value.endsWith("]")) {
    try {
      return JSON.parse(value)
    } catch {}
  }
  const separator = value.includes("|") ? "|" : ";"
  return value
    .split(separator)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function parseBooleanField(value: string | undefined): boolean {
  if (!value) return false
  const lower = value.toLowerCase()
  return lower === "true" || lower === "yes" || lower === "1"
}

const subjectDepartmentMap: Record<string, string> = {
  Economics: "Commerce",
  Accounting: "Commerce",
  "Business Studies": "Commerce",
  "Life Science": "Natural Sciences",
  "Life Sciences": "Natural Sciences",
  "Physical Science": "Natural Sciences",
  "Physical Sciences": "Natural Sciences",
  Geography: "Social Sciences",
  Tourism: "Social Sciences",
  English: "Languages",
  "English HL": "Languages",
  "English FAL": "Languages",
  "English Home Language": "Languages",
  "English First Additional Language": "Languages",
  Mathematics: "Mathematics",
  "Math Literacy": "Mathematics",
  "Maths Literacy": "Mathematics",
  "Mathematical Literacy": "Mathematics",
  "Computer Applications Technology": "Technology",
  CAT: "Technology",
}

function chooseDepartmentForSubject(subject: string, departments: string[]): string {
  const mapped = subjectDepartmentMap[subject]
  if (mapped) return mapped
  if (departments.length > 0) return departments[0]
  if (subject.trim().length > 0) return subject
  return "General"
}

// Initialize and start server
const startServer = async (): Promise<void> => {
  // Start server IMMEDIATELY to prevent connection refused
  const server = httpServer.listen(Number(port), "0.0.0.0", () => {
    console.log(`✓ Server listening on port ${port} (Initializing...)`)
    console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`)
  })

  // Handle server errors
  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`❌ Port ${port} is in use`)
      process.exit(1)
    } else {
      console.error("❌ Server error:", error)
      process.exit(1)
    }
  })

  // Prevent server timeout on Render
  server.keepAliveTimeout = 120000
  server.headersTimeout = 120000

  try {
    console.log("🚀 Starting Excellence Akademie API Server...")

    // Bulk Upload Routes
    app.post("/api/admin/content/pricing/bulk-upload", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { fileContent, fileType } = req.body
        if (!fileContent) return res.status(400).json({ error: "No file content provided" })

        let pricingData: any[] = []
        if (fileType === "json") {
          const data = JSON.parse(fileContent)
          pricingData = Array.isArray(data) ? data : data.pricing || data.pricingPlans || []
        } else if (fileType === "csv") {
          const lines = fileContent.trim().split("\n")
          if (lines.length < 2) throw new Error("CSV must have header and data rows")
          const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase())
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i])
            if (values.length === 0) continue
            const row: any = {}
            headers.forEach((header: string, index: number) => {
              if (values[index] !== undefined) row[header] = values[index].trim()
            })
            pricingData.push({
              name: row.name || "",
              price: row.price || "",
              period: row.period || "month",
              features: parseArrayField(row.features),
              notIncluded: parseArrayField(row.notincluded || row["not included"]),
              color: row.color || "bg-blue-500",
              icon: row.icon || "Star",
              popular: parseBooleanField(row.popular),
              order: Number.parseInt(row.order) || 0,
            })
          }
        } else {
          return res.status(400).json({ error: "Unsupported file type" })
        }

        if (!pricingData || pricingData.length === 0) {
          return res.status(400).json({ error: "No valid pricing data found" })
        }

        const errors: string[] = []
        pricingData.forEach((item, index) => {
          if (!item.name || item.name.trim() === "") errors.push(`Row ${index + 1}: Name is required`)
          if (!item.price || item.price.trim() === "") errors.push(`Row ${index + 1}: Price is required`)
        })
        if (errors.length > 0) return res.status(400).json({ error: "Validation failed", details: errors })

        let updated = 0,
          created = 0
        for (const item of pricingData) {
          const existing = await prisma.pricingPlan.findFirst({ where: { name: item.name } })
          const planData = {
            name: item.name,
            price: item.price,
            period: item.period || "month",
            features: JSON.stringify(item.features || []),
            notIncluded: JSON.stringify(item.notIncluded || []),
            color: item.color || "bg-blue-500",
            icon: item.icon || "Star",
            popular: item.popular || false,
            order: item.order || 0,
            isActive: true,
          }
          if (existing) {
            await prisma.pricingPlan.update({ where: { id: existing.id }, data: planData })
            updated++
          } else {
            await prisma.pricingPlan.create({ data: planData })
            created++
          }
        }
        res.json({ message: "Pricing plans updated successfully", updated, created, total: pricingData.length })
      } catch (error) {
        console.error("Bulk pricing upload error:", error)
        res.status(500).json({
          error: "Failed to process pricing data",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    })

    app.post("/api/admin/content/announcements/bulk-upload", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { fileContent, fileType } = req.body
        if (!fileContent) return res.status(400).json({ error: "No file content provided" })

        let items: any[] = []
        if (fileType === "json") {
          const data = JSON.parse(fileContent)
          items = Array.isArray(data) ? data : data.announcements || []
        } else if (fileType === "csv") {
          const lines = fileContent.trim().split("\n")
          if (lines.length < 2) throw new Error("CSV must have header and data rows")
          const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase())
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i])
            if (values.length === 0) continue
            const row: any = {}
            headers.forEach((header: string, index: number) => {
              if (values[index] !== undefined) row[header] = values[index].trim()
            })
            items.push({
              title: row.title || "",
              content: row.content || "",
              type: (row.type || "info").toLowerCase(),
              pinned: parseBooleanField(row.pinned),
              isActive: parseBooleanField(row.isactive || row.active),
              mediaUrl: row.mediaurl || row["media url"] || "",
              mediaType: (row.mediatype || "").toLowerCase() || null,
            })
          }
        } else {
          return res.status(400).json({ error: "Unsupported file type" })
        }

        if (!items || items.length === 0) {
          return res.status(400).json({ error: "No valid announcement data found" })
        }

        const errors: string[] = []
        const warnings: string[] = []
        const validTypes = new Set(["info", "warning", "success"])

        items.forEach((item, index) => {
          if (!item.content || String(item.content).trim() === "") {
            errors.push(`Row ${index + 1}: Content is required`)
          }
          if (!validTypes.has(String(item.type || "").toLowerCase())) {
            warnings.push(`Row ${index + 1}: Unknown type "${item.type}", defaulting to "info"`)
            item.type = "info"
          }
          if (item.mediaType && !["image", "video"].includes(item.mediaType)) {
            warnings.push(`Row ${index + 1}: Unknown mediaType "${item.mediaType}", clearing value`)
            item.mediaType = null
          }
        })

        if (errors.length > 0) return res.status(400).json({ error: "Validation failed", details: errors })

        let updated = 0,
          created = 0

        for (const item of items) {
          const title = String(item.title || "").trim() || String(item.content || "").slice(0, 80)
          const existing = await prisma.announcement.findFirst({ where: { title } })
          const data = {
            title,
            content: String(item.content || "").trim(),
            type: String(item.type || "info").toLowerCase(),
            pinned: !!item.pinned,
            isActive: item.isActive !== undefined ? !!item.isActive : true,
            mediaUrl: item.mediaUrl || null,
            mediaType: item.mediaType || null,
            authorId: 1,
            department: null,
          }
          if (existing) {
            await prisma.announcement.update({ where: { id: existing.id }, data })
            updated++
          } else {
            await prisma.announcement.create({ data })
            created++
          }
        }
        res.json({
          message: "Announcements processed successfully",
          updated,
          created,
          total: items.length,
          warnings,
        })
      } catch (error) {
        console.error("Bulk announcements upload error:", error)
        res.status(500).json({
          error: "Failed to process announcement data",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    })

    app.post("/api/admin/content/tutors/bulk-upload", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { fileContent, fileType } = req.body
        if (!fileContent) return res.status(400).json({ error: "No file content provided" })

        let tutorData: any[] = []
        if (fileType === "json") {
          const data = JSON.parse(fileContent)
          tutorData = Array.isArray(data) ? data : data.tutors || []

          tutorData = tutorData.map((item: any) => {
            if (!item.subjects && item.courses) {
              const source = Array.isArray(item.courses) ? item.courses : String(item.courses)
              return {
                ...item,
                subjects: Array.isArray(source) ? source : parseArrayField(source),
              }
            }
            return item
          })
        } else if (fileType === "csv") {
          const lines = fileContent.trim().split("\n")
          if (lines.length < 2) throw new Error("CSV must have header and data rows")
          const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase())
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i])
            if (values.length === 0) continue
            const row: any = {}
            headers.forEach((header: string, index: number) => {
              if (values[index] !== undefined) row[header] = values[index].trim()
            })

            const subjectsRaw =
              row.subjects ||
              row.subject ||
              row.courses ||
              row.course ||
              row["course name"] ||
              row["courses"]

            tutorData.push({
              name: row.name || "",
              subjects: parseArrayField(subjectsRaw),
              image: row.image || "",
              contactName: row.contactname || row["contact name"] || "",
              contactPhone: row.contactphone || row["contact phone"] || "",
              contactEmail: row.contactemail || row["contact email"] || "",
              description: row.description || "",
              order: Number.parseInt(row.order) || 0,
            })
          }
        } else {
          return res.status(400).json({ error: "Unsupported file type" })
        }

        if (!tutorData || tutorData.length === 0) {
          return res.status(400).json({ error: "No valid tutor data found" })
        }

        const errors: string[] = []
        const warnings: string[] = []

        tutorData.forEach((item, index) => {
          if (!item.name || item.name.trim() === "") errors.push(`Row ${index + 1}: Name is required`)
          if (!item.subjects || item.subjects.length === 0) {
            warnings.push(
              `Row ${index + 1}: No subjects/courses provided; tutor will be saved without subjects`,
            )
            item.subjects = []
          }
        })

        if (errors.length > 0) return res.status(400).json({ error: "Validation failed", details: errors })

        let updated = 0,
          created = 0
        for (const item of tutorData) {
          const existing = await prisma.tutor.findFirst({ where: { name: item.name } })
          const tutorDataObj = {
            name: item.name,
            subjects: JSON.stringify(item.subjects || []),
            image: item.image || "",
            contactName: item.contactName || "",
            contactPhone: item.contactPhone || "",
            contactEmail: item.contactEmail || "",
            description: item.description || "",
            ratings: JSON.stringify([]),
            order: item.order || 0,
            isActive: true,
          }
          if (existing) {
            await prisma.tutor.update({ where: { id: existing.id }, data: tutorDataObj })
            updated++
          } else {
            await prisma.tutor.create({ data: tutorDataObj })
            created++
          }
        }
        res.json({
          message: "Tutors updated successfully",
          updated,
          created,
          total: tutorData.length,
          warnings,
        })
      } catch (error) {
        console.error("Bulk tutor upload error:", error)
        res.status(500).json({
          error: "Failed to process tutor data",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    })

    app.post("/api/admin/content/tutors/bulk-upload", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { fileContent, fileType } = req.body
        if (!fileContent) return res.status(400).json({ error: "No file content provided" })

        let tutorData: any[] = []
        if (fileType === "json") {
          const data = JSON.parse(fileContent)
          tutorData = Array.isArray(data) ? data : data.tutors || []

          tutorData = tutorData.map((item: any) => {
            if (!item.subjects && item.courses) {
              const source = Array.isArray(item.courses) ? item.courses : String(item.courses)
              return {
                ...item,
                subjects: Array.isArray(source) ? source : parseArrayField(source),
              }
            }
            return item
          })
        } else if (fileType === "csv") {
          const lines = fileContent.trim().split("\n")
          if (lines.length < 2) throw new Error("CSV must have header and data rows")
          const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase())
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i])
            if (values.length === 0) continue
            const row: any = {}
            headers.forEach((header: string, index: number) => {
              if (values[index] !== undefined) row[header] = values[index].trim()
            })

            const subjectsRaw =
              row.subjects ||
              row.subject ||
              row.courses ||
              row.course ||
              row["course name"] ||
              row["courses"]

            tutorData.push({
              name: row.name || "",
              subjects: parseArrayField(subjectsRaw),
              image: row.image || "",
              contactName: row.contactname || row["contact name"] || "",
              contactPhone: row.contactphone || row["contact phone"] || "",
              contactEmail: row.contactemail || row["contact email"] || "",
              description: row.description || "",
              order: Number.parseInt(row.order) || 0,
            })
          }
        } else {
          return res.status(400).json({ error: "Unsupported file type" })
        }

        if (!tutorData || tutorData.length === 0) {
          return res.status(400).json({ error: "No valid tutor data found" })
        }

        const errors: string[] = []
        const warnings: string[] = []

        tutorData.forEach((item, index) => {
          if (!item.name || item.name.trim() === "") errors.push(`Row ${index + 1}: Name is required`)
          if (!item.subjects || item.subjects.length === 0) {
            warnings.push(
              `Row ${index + 1}: No subjects/courses provided; tutor will be saved without subjects`,
            )
            item.subjects = []
          }
        })

        if (errors.length > 0) return res.status(400).json({ error: "Validation failed", details: errors })

        let updated = 0,
          created = 0
        for (const item of tutorData) {
          const existing = await prisma.tutor.findFirst({ where: { name: item.name } })
          const tutorDataObj = {
            name: item.name,
            subjects: JSON.stringify(item.subjects || []),
            image: item.image || "",
            contactName: item.contactName || "",
            contactPhone: item.contactPhone || "",
            contactEmail: item.contactEmail || "",
            description: item.description || "",
            ratings: JSON.stringify([]),
            order: item.order || 0,
            isActive: true,
          }
          if (existing) {
            await prisma.tutor.update({ where: { id: existing.id }, data: tutorDataObj })
            updated++
          } else {
            await prisma.tutor.create({ data: tutorDataObj })
            created++
          }
        }
        res.json({
          message: "Tutors updated successfully",
          updated,
          created,
          total: tutorData.length,
          warnings,
        })
      } catch (error) {
        console.error("Bulk tutor upload error:", error)
        res.status(500).json({
          error: "Failed to process tutor data",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    })

    app.post("/api/admin/content/tutor-placement/bulk-upload", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { fileContent, fileType } = req.body
        if (!fileContent) return res.status(400).json({ error: "No file content provided" })

        let placements: any[] = []

        if (fileType === "json") {
          const parsed = JSON.parse(fileContent)
          placements = Array.isArray(parsed) ? parsed : parsed.tutors || parsed.placements || []
        } else if (fileType === "csv") {
          const lines = fileContent.trim().split("\n")
          if (lines.length < 2) throw new Error("CSV must have header and data rows")
          const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase())
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i])
            if (values.length === 0) continue
            const row: any = {}
            headers.forEach((header: string, index: number) => {
              if (values[index] !== undefined) row[header] = values[index].trim()
            })

            const subjects = parseArrayField(row.subjects || row.subject || row.coursesubjects)
            const departments = parseArrayField(row.departments || row.department)
            const courseNames = parseArrayField(row.courses || row.coursenames || row["course names"])

            const courses = courseNames.map((name: string) => ({
              name,
              subject: subjects[0] || name,
            }))

            placements.push({
              name: row.name || "",
              subjects,
              departments,
              courses,
            })
          }
        } else {
          return res.status(400).json({ error: "Unsupported file type" })
        }

        if (!placements || placements.length === 0) {
          return res.status(400).json({ error: "No placement data found" })
        }

        const warnings: string[] = []
        let tutorsMatched = 0
        let coursesCreated = 0

        try {
          for (const item of placements) {
            const tutorName = String(item.name || "").trim()
            if (!tutorName) {
              warnings.push("Row with missing tutor name was skipped")
              continue
            }

            const subjects = Array.isArray(item.subjects)
              ? item.subjects.map((s: any) => String(s || "").trim()).filter((s: string) => s.length > 0)
              : parseArrayField(item.subjects)

            const departments = Array.isArray(item.departments)
              ? item.departments.map((d: any) => String(d || "").trim()).filter((d: string) => d.length > 0)
              : parseArrayField(item.departments)

            // Find Content Tutor (for verification)
            let contentTutor = await prisma.tutor.findFirst({ where: { name: tutorName } })
            
            if (!contentTutor) {
               // Create Content Tutor if missing
               const subjectsJson = JSON.stringify(subjects)
               const generatedEmail = `${tutorName.replace(/[^a-zA-Z0-9]/g, ".").toLowerCase()}@excellenceakademie.co.za`
               
               try {
                   contentTutor = await prisma.tutor.create({
                       data: {
                           name: tutorName,
                           subjects: subjectsJson,
                           image: "/placeholder-tutor.png", // Default image
                           contactName: tutorName,
                           contactPhone: "",
                           contactEmail: generatedEmail,
                           description: `Professional tutor specializing in ${subjects.join(", ")}`,
                           ratings: "5.0",
                           isActive: true,
                           order: 0
                       }
                   })
                   warnings.push(`✓ Created new content tutor record for "${tutorName}"`)
               } catch (err) {
                   const msg = err instanceof Error ? err.message : String(err)
                   warnings.push(`✗ Failed to create content tutor for "${tutorName}": ${msg}`)
                   continue // Skip if creation fails
               }
            }

            // Find System User (for linking)
            let userTutor = await prisma.user.findFirst({
              where: {
                name: tutorName,
                role: "tutor",
              },
            })

            if (!userTutor && contentTutor.contactEmail) {
              const userByEmail = await prisma.user.findUnique({
                where: { email: contentTutor.contactEmail },
              })
              // Validate that the user found by email actually matches the tutor name
              // This prevents accidental linking if multiple tutors share an email (copy-paste error)
              if (userByEmail) {
                  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')
                  const name1 = normalize(userByEmail.name)
                  const name2 = normalize(tutorName)
                  
                  // Simple check: is one name contained in the other?
                  if (name1.includes(name2) || name2.includes(name1)) {
                      userTutor = userByEmail
                  } else {
                      // Name mismatch (e.g. Roshan vs Rohan), assume email collision/error
                      // Treat as not found so we can create a new user with a fresh email
                  }
              }
            }

            if (!userTutor) {
              try {
                const tempPassword = generatePasswordFromName(tutorName)
                const passwordHash = await bcrypt.hash(tempPassword, 10)

                let email = contentTutor.contactEmail
                if (!email || !email.includes("@")) {
                  email = `${tutorName.replace(/[^a-zA-Z0-9]/g, ".").toLowerCase()}@excellenceakademie.co.za`
                }

                // Check for email collision
                let existingEmail = await prisma.user.findUnique({ where: { email } })
                
                // If email exists but names don't match, generate a unique email
                if (existingEmail) {
                   const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')
                   const name1 = normalize(existingEmail.name)
                   const name2 = normalize(tutorName)
                   
                   if (!name1.includes(name2) && !name2.includes(name1)) {
                       // Collision! Generate a unique email
                       let counter = 1
                       let baseEmail = email.split('@')[0]
                       const domain = email.split('@')[1]
                       while (existingEmail) {
                           email = `${baseEmail}${counter}@${domain}`
                           existingEmail = await prisma.user.findUnique({ where: { email } })
                           counter++
                       }
                   }
                }

                if (existingEmail) {
                  // Check if existing user is a tutor
                  if (existingEmail.role === "tutor") {
                    userTutor = existingEmail
                    warnings.push(`Using existing tutor account for "${tutorName}" (${email})`)
                  } else {
                    warnings.push(
                      `Could not create user for "${tutorName}": Email ${email} already in use by a ${existingEmail.role}.`,
                    )
                  }
                } else {
                  userTutor = await prisma.user.create({
                    data: {
                      name: tutorName,
                      email,
                      password_hash: passwordHash,
                      role: "tutor",
                      department: departments[0] || "General",
                      subjects: JSON.stringify(subjects),
                    },
                  })
                  warnings.push(`✓ System user for "${tutorName}" was created automatically (${email})`)
                }
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e)
                warnings.push(
                  `✗ System user for tutor "${tutorName}" not found and creation failed: ${msg}`,
                )
              }
            } else {
              warnings.push(`✓ Found existing system user for "${tutorName}"`)
            }

            tutorsMatched++

            const courses = Array.isArray(item.courses) ? item.courses : []

            for (let i = 0; i < courses.length; i++) {
              const c = courses[i]
              const title = String(c.name || "").trim()
              if (!title) continue

              const subject =
                String(c.subject || (subjects.length > 0 ? subjects[0] : "") || "")
                  .trim() || "General"

              let department: string
              if (departments.length > 0) {
                const subjIndex = subjects.findIndex(
                  (s: string) => s.toLowerCase() === subject.toLowerCase(),
                )
                if (subjIndex >= 0 && subjIndex < departments.length) {
                  department = departments[subjIndex]
                } else if (departments.length === 1) {
                  department = departments[0]
                } else {
                  department = departments[0]
                }
              } else {
                department = chooseDepartmentForSubject(subject, [])
              }

              let category = subject || department

              if (userTutor) {
                let existingForTutor = await prisma.course.findFirst({
                  where: {
                    name: title,
                    tutorId: userTutor.id,
                  },
                })

                if (!existingForTutor) {
                  const existingUnassigned = await prisma.course.findFirst({
                    where: {
                      name: title,
                      tutorId: null,
                    },
                  })
                  if (existingUnassigned) {
                    existingForTutor = existingUnassigned
                  }
                }

                if (existingForTutor) {
                  const existing = existingForTutor

                  if (!existing.department || !existing.category) {
                    department = existing.department || department
                    category = existing.category || category
                  } else {
                    department = existing.department
                    category = existing.category
                  }

                  if (existing.tutorId == null) {
                    await prisma.course.update({
                      where: { id: existing.id },
                      data: { tutorId: userTutor.id },
                    })
                  }

                  continue
                }
              } else {
                let existing = await prisma.course.findFirst({
                  where: {
                    name: title,
                  },
                })

                if (!existing) {
                  existing = await prisma.course.findFirst({
                    where: {
                      name: title,
                      department: department,
                      category: category,
                    },
                  })
                }

                if (existing) {
                  if (!existing.department || !existing.category) {
                    department = existing.department || department
                    category = existing.category || category
                  } else {
                    department = existing.department
                    category = existing.category
                  }

                  continue
                }
              }

              const now = new Date()

              await prisma.course.create({
                data: {
                  name: title,
                  description: c.description || `${subject} (${department})`,
                  department,
                  tutorId: userTutor ? userTutor.id : null,
                  category,
                  createdAt: now,
                },
              })
              coursesCreated++
            }
          }
        } catch (error) {
          console.error("Tutor placement processing error:", error)
          throw error
        }

        res.json({
          message: "Tutor placement processed successfully",
          placements: placements.length,
          tutorsMatched,
          coursesCreated,
          warnings,
        })
      } catch (error) {
        console.error("Tutor placement upload error:", error)
        res.status(500).json({
          error: "Failed to process tutor placement",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    })

    app.post("/api/admin/content/student-placement/bulk-upload", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { fileContent, fileType } = req.body
        if (!fileContent) return res.status(400).json({ error: "No file content provided" })

        let placements: any[] = []

        if (fileType === "json") {
          const parsed = JSON.parse(fileContent)
          placements = Array.isArray(parsed) ? parsed : parsed.students || parsed.placements || []
        } else if (fileType === "csv") {
          const lines = fileContent.trim().split("\n")
          if (lines.length < 2) throw new Error("CSV must have header and data rows")
          const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase())
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i])
            if (values.length === 0) continue
            const row: any = {}
            headers.forEach((header: string, index: number) => {
              if (values[index] !== undefined) row[header] = values[index].trim()
            })

            const courseNames = parseArrayField(row.courses || row.coursenames || row["course names"])
            const tutorNames = parseArrayField(row.tutors || row.tutor || row["tutor names"])
            const department = row.department || row.dept || ""
            const grade = row.grade || row.level || ""

            placements.push({
              name: row.name || "",
              email: row.email || "",
              courses: courseNames,
              tutors: tutorNames,
              department,
              grade,
            })
          }
        } else {
          return res.status(400).json({ error: "Unsupported file type" })
        }

        if (!placements || placements.length === 0) {
          return res.status(400).json({ error: "No placement data found" })
        }

        const warnings: string[] = []
        let studentsProcessed = 0
        let studentsEnrolled = 0
        let coursesMatched = 0

        try {
          for (const item of placements) {
            const studentName = String(item.name || "").trim()
            const studentEmail = String(item.email || "").trim()
            
            if (!studentName || !studentEmail) {
              warnings.push("Row with missing student name or email was skipped")
              continue
            }

            studentsProcessed++

            // Find or create student user
            let student = await prisma.user.findUnique({
              where: { email: studentEmail },
            })

            if (!student) {
              try {
                const newPassword = generatePasswordFromName(studentName)
                const passwordHash = await bcrypt.hash(newPassword, 10)
                student = await prisma.user.create({
                  data: {
                    name: studentName,
                    email: studentEmail,
                    password_hash: passwordHash,
                    role: "student",
                    department: item.department || "General",
                  },
                })
                warnings.push(`✓ Created new student account for "${studentName}" (${studentEmail})`)
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e)
                warnings.push(`✗ Failed to create student "${studentName}": ${msg}`)
                continue
              }
            } else if (student.role !== "student") {
              warnings.push(`✗ Email ${studentEmail} belongs to a ${student.role}, not a student. Skipping.`)
              continue
            } else {
              warnings.push(`✓ Found existing student "${studentName}"`)
            }

            const courseNames = Array.isArray(item.courses) ? item.courses : []
            const tutorNames = Array.isArray(item.tutors) ? item.tutors : []
            const preferredDepartment =
              String(item.department || student.department || "")
                .trim()
                .toLowerCase()

            for (let i = 0; i < courseNames.length; i++) {
              const courseTitle = String(courseNames[i] || "").trim()
              const preferredTutor = String(tutorNames[i] || "").trim()

              if (!courseTitle) continue

              const candidates = await prisma.course.findMany({
                where: {
                  name: courseTitle
                },
                include: { tutor: true },
              })

              if (!candidates || candidates.length === 0) {
                warnings.push(`✗ Course "${courseTitle}" not found for student "${studentName}"`)
                continue
              }

              let course = candidates[0]

              if (preferredTutor) {
                const tutorMatch = candidates.find(
                  (c) =>
                    c.tutor &&
                    (c.tutor.name.toLowerCase().includes(preferredTutor.toLowerCase()) ||
                      c.tutor.email.toLowerCase().includes(preferredTutor.toLowerCase())),
                )

                if (tutorMatch) {
                  course = tutorMatch
                } else {
                  warnings.push(
                    `⚠ Course "${courseTitle}" found, but not with tutor "${preferredTutor}". Assigned to "${
                      course.tutor?.name || "Unknown"
                    }" instead.`,
                  )
                }
              } else if (preferredDepartment) {
                const deptMatch = candidates.find(
                  (c) => c.department && c.department.toLowerCase() === preferredDepartment,
                )
                if (deptMatch) {
                  course = deptMatch
                } else {
                  const withTutor = candidates.find((c) => c.tutorId !== null)
                  if (withTutor) {
                    course = withTutor
                  }
                }
              }

              coursesMatched++

              // Check if already enrolled
              const existingEnrollment = await prisma.courseEnrollment.findFirst({
                where: {
                  userId: student.id,
                  courseId: course.id,
                },
              })

              if (existingEnrollment) {
                warnings.push(`Student "${studentName}" already enrolled in "${courseTitle}"`)
                continue
              }

              // Create enrollment
              await prisma.courseEnrollment.create({
                data: {
                  userId: student.id,
                  courseId: course.id,
                  status: "enrolled",
                },
              })
              studentsEnrolled++
            }
          }
        } catch (error) {
          console.error("Student placement processing error:", error)
          throw error
        }

        res.json({
          message: "Student placement processed successfully",
          studentsProcessed,
          studentsEnrolled,
          coursesMatched,
          warnings,
        })
      } catch (error) {
        console.error("Student placement upload error:", error)
        res.status(500).json({
          error: "Failed to process student placement",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    })

    app.post("/api/admin/content/team/bulk-upload", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { fileContent, fileType } = req.body
        if (!fileContent) return res.status(400).json({ error: "No file content provided" })

        let teamData: any[] = []
        if (fileType === "json") {
          const data = JSON.parse(fileContent)
          teamData = Array.isArray(data) ? data : data.team || data.teamMembers || []
        } else if (fileType === "csv") {
          const lines = fileContent.trim().split("\n")
          if (lines.length < 2) throw new Error("CSV must have header and data rows")
          const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase())
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i])
            if (values.length === 0) continue
            const row: any = {}
            headers.forEach((header: string, index: number) => {
              if (values[index] !== undefined) row[header] = values[index].trim()
            })
            teamData.push({
              name: row.name || "",
              role: row.role || "",
              bio: row.bio || "",
              image: row.image || "",
              order: Number.parseInt(row.order) || 0,
            })
          }
        } else {
          return res.status(400).json({ error: "Unsupported file type" })
        }

        if (!teamData || teamData.length === 0) {
          return res.status(400).json({ error: "No valid team member data found" })
        }

        const errors: string[] = []
        teamData.forEach((item, index) => {
          if (!item.name || item.name.trim() === "") errors.push(`Row ${index + 1}: Name is required`)
          if (!item.role || item.role.trim() === "") errors.push(`Row ${index + 1}: Role is required`)
        })
        if (errors.length > 0) return res.status(400).json({ error: "Validation failed", details: errors })

        let updated = 0,
          created = 0
        for (const item of teamData) {
          const existing = await prisma.teamMember.findFirst({ where: { name: item.name } })
          const memberData = {
            name: item.name,
            role: item.role,
            bio: item.bio || "",
            image: item.image || "",
            order: item.order || 0,
            isActive: true,
          }
          if (existing) {
            await prisma.teamMember.update({ where: { id: existing.id }, data: memberData })
            updated++
          } else {
            await prisma.teamMember.create({ data: memberData })
            created++
          }
        }
        res.json({ message: "Team members updated successfully", updated, created, total: teamData.length })
      } catch (error) {
        console.error("Bulk team upload error:", error)
        res.status(500).json({
          error: "Failed to process team member data",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    })

    // Auto-place students endpoint
    app.post("/api/admin/students/auto-place", async (req: Request, res: Response) => {
      try {
        const { studentIds, courseId } = req.body
        if (!Array.isArray(studentIds) || studentIds.length === 0) {
          return res.status(400).json({ success: false, error: "No students selected" })
        }
        if (!courseId) {
          return res.status(400).json({ success: false, error: "No course selected" })
        }

        const courseIdNum = Number(courseId)
        if (isNaN(courseIdNum)) {
          return res.status(400).json({ success: false, error: "Invalid course ID" })
        }

        const course = await prisma.course.findUnique({ where: { id: courseIdNum } })
        const courseName = course?.name || "Selected Course"

        let enrolledCount = 0
        let alreadyEnrolledCount = 0

        for (const studentId of studentIds) {
          const id = Number(studentId)
          if (isNaN(id)) continue

          const existing = await prisma.courseEnrollment.findFirst({
            where: {
              userId: id,
              courseId: courseIdNum
            }
          })

          if (existing) {
            alreadyEnrolledCount++
            continue
          }

          await prisma.courseEnrollment.create({
            data: {
              userId: id,
              courseId: courseIdNum,
              status: "enrolled"
            }
          })
          enrolledCount++
        }

        res.json({
          success: true,
          placed: enrolledCount,
          alreadyEnrolled: alreadyEnrolledCount,
          totalSelected: studentIds.length,
          courseName
        })
      } catch (error) {
        console.error("Auto-place error:", error)
        res.status(500).json({ success: false, error: "Failed to auto-place students" })
      }
    })

// ============================================
// ADMIN LIVE SESSIONS MONITORING
// ============================================

// Get all active live sessions (admin only)
app.get("/api/admin/live-sessions", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessions: any[] = []

    for (const [courseId, sessionData] of activeSessions.entries()) {
      const participants: any[] = []
      const sessionId = sessionData.sessionId
      if (sessionUsers.has(sessionId)) {
        const users = sessionUsers.get(sessionId)!
        for (const [socketId, userData] of users.entries()) {
          participants.push({
            id: socketId,
            name: userData.userName || 'Anonymous',
            role: userData.userRole,
            joinedAt: new Date().toISOString(),
            isMuted: !userData.isAudioOn,
            isVideoOff: !userData.isVideoOn,
            isHandRaised: userData.isHandRaised
          })
        }
      }

      const duration = sessionData.startTime ? Math.floor((Date.now() - new Date(sessionData.startTime).getTime()) / 1000) : 0

      sessions.push({
        sessionId: sessionData.sessionId,
        courseId,
        courseName: sessionData.courseName || 'Unknown Course',
        tutorName: sessionData.tutorName || 'Unknown Tutor',
        tutorId: sessionData.tutorId || '',
        category: sessionData.category || 'General',
        participantCount: participants.length,
        startTime: sessionData.startTime || new Date().toISOString(),
        duration,
        isLive: true,
        participants,
        flags: []
      })
    }

    return res.json({ success: true, data: sessions })
  } catch (error) {
    console.error('Error fetching admin live sessions:', error)
    return res.status(500).json({ success: false, error: 'Failed to fetch live sessions' })
  }
})

// Flag a live session
app.post("/api/admin/live-sessions/flag", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, type, description } = req.body

    if (!sessionId || !type || !description) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    // Store flag in database (you can create a SessionFlag model)
    // For now, we'll just log it and notify via socket
    console.log(`[ADMIN] Session ${sessionId} flagged: ${type} - ${description}`)

    // Notify moderators and admins in the session
    io.to(sessionId).emit('session-flagged', {
      type,
      description,
      timestamp: new Date().toISOString(),
      flaggedBy: req.user?.name || 'Admin'
    })

    return res.json({ success: true, message: 'Session flagged successfully' })
  } catch (error) {
    console.error('Error flagging session:', error)
    return res.status(500).json({ success: false, error: 'Failed to flag session' })
  }
})

// End a live session (admin only)
app.post("/api/admin/live-sessions/:sessionId/end", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID required' })
    }

    // Notify all participants that session is ending
    io.to(sessionId).emit('session-ended-by-admin', {
      message: 'This session has been ended by an administrator',
      timestamp: new Date().toISOString()
    })

    // Remove from active sessions
    for (const [courseId, sessionData] of activeSessions.entries()) {
      if (sessionData.sessionId === sessionId) {
        activeSessions.delete(courseId)
        break
      }
    }

    // Clear session users
    sessionUsers.delete(sessionId)

    // Update database
    try {
      await prisma.liveSession.updateMany({
        where: { sessionId },
        data: {
          endedAt: new Date(),
          status: 'ended'
        }
      })
    } catch (dbError) {
      console.error('Error updating session in database:', dbError)
    }

    console.log(`[ADMIN] Session ${sessionId} ended by admin`)

    return res.json({ success: true, message: 'Session ended successfully' })
  } catch (error) {
    console.error('Error ending session:', error)
    return res.status(500).json({ success: false, error: 'Failed to end session' })
  }
})

// Kick a participant from a session (admin only)
app.post("/api/admin/live-sessions/:sessionId/kick/:participantId", authenticateJWT as RequestHandler, authorizeRoles("admin") as RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, participantId } = req.params

    if (!sessionId || !participantId) {
      return res.status(400).json({ success: false, error: 'Session ID and Participant ID required' })
    }

    // Find the socket and disconnect it
    const sockets = await io.in(sessionId).fetchSockets()
    const targetSocket = sockets.find(s => s.id === participantId)

    if (targetSocket) {
      // Notify the participant they're being removed
      targetSocket.emit('kicked-by-admin', {
        message: 'You have been removed from this session by an administrator',
        timestamp: new Date().toISOString()
      })

      // Remove from session
      targetSocket.leave(sessionId)

      // Remove from sessionUsers map
      if (sessionUsers.has(sessionId)) {
        sessionUsers.get(sessionId)!.delete(participantId)
      }

      // Notify others
      io.to(sessionId).emit('user-left', {
        socketId: participantId,
        reason: 'removed_by_admin'
      })

      console.log(`[ADMIN] Participant ${participantId} kicked from session ${sessionId}`)

      return res.json({ success: true, message: 'Participant removed successfully' })
    } else {
      return res.status(404).json({ success: false, error: 'Participant not found in session' })
    }
  } catch (error) {
    console.error('Error kicking participant:', error)
    return res.status(500).json({ success: false, error: 'Failed to kick participant' })
  }
})

  // Check database connection on start
  try {
    console.log("🔌 Testing database connection...")
    // Use safeQuery wrapper to handle connection retries gracefully
    await safeQuery(() => prisma.$queryRaw`SELECT 1`)
    console.log("✓ Database connection established")
  } catch (e) {
    console.error("⚠ Initial database connection failed (will retry on requests):", e)
  }

  // Initialize database schema
  await initializeDatabase()

    await seedAdminFromEnv()

    // Serve static frontend files (Production/Render support)
    const distDir = path.resolve(baseDir, "..", "dist")
    // Serve static files if in production, explicit flag, or running on Render
    if (process.env.NODE_ENV === "production" || process.env.SERVE_STATIC === "true" || process.env.RENDER) {
      console.log(`✓ Serving static files from: ${distDir}`)
      app.use(express.static(distDir))
      
      // SPA Catch-all route
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) {
          return next()
        }
        res.sendFile(path.join(distDir, "index.html"), (err) => {
          if (err) {
            console.error("Error serving index.html:", err)
            res.status(500).send("Error loading application")
          }
        })
      })
    }

    // Start scheduled session checker
    startScheduledSessionChecker()

    // Mark server as ready
    isServerReady = true
    console.log(`✓ Socket.IO: Enabled`)
    console.log(`✓ Health check: http://localhost:${port}/api/health`)
    console.log(`✓ Tutors API: http://localhost:${port}/api/tutors`)
    console.log(`✓ Ready for connections!`)

  } catch (error) {
    console.error("❌ Failed to start server:", error)
    // Note: server is available in scope now
    process.exit(1)
  }
}

// Start the application
startServer()

export { app, io, httpServer }
