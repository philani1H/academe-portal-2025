"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Bell,
  Calendar,
  Users,
  BookOpen,
  Upload,
  Plus,
  Search,
  FileText,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Send,
  ChevronDown,
  Mail,
  Check,
  X,
  Edit,
  User,
  Settings,
  LogOut,
  Menu,
  Home,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Types
interface Student {
  id: string
  name: string
  email: string
  progress: number
  lastActivity: string
  status: "active" | "pending" | "inactive"
  enrolledCourses: string[]
  avatar?: string
  grades?: Record<string, number>
}

interface Course {
  id: string
  name: string
  description: string
  students: number
  nextSession: string
  progress: number
  materials: Material[]
  tests: Test[]
  color: string
}

interface Material {
  id: string
  name: string
  type: "pdf" | "video" | "document"
  url: string
  dateAdded: string
  size?: string
}

interface Test {
  id: string
  title: string
  description: string
  dueDate: string
  questions: number
  totalPoints: number
  status: "draft" | "published" | "closed"
  submissions?: number
}

interface Notification {
  id: string
  message: string
  date: string
  type: "course" | "student" | "admin" | "test"
  read: boolean
  courseId?: string
  studentId?: string
}

interface Question {
  id: string
  text: string
  type: "multiple-choice" | "true-false" | "short-answer" | "essay"
  options?: string[]
  correctAnswer?: string | string[]
  points: number
}

// Live data will be loaded from the API. Fallback to empty lists.

const mockCourses: Course[] = [
  {
    id: "1",
    name: "Mathematics 101",
    description: "Introduction to basic mathematical concepts and principles",
    students: 15,
    nextSession: "2024-05-20 10:00",
    progress: 65,
    color: "#4f46e5",
    materials: [
      {
        id: "m1",
        name: "Introduction to Algebra",
        type: "pdf",
        url: "/materials/algebra.pdf",
        dateAdded: "2024-01-15",
        size: "2.4 MB",
      },
      {
        id: "m2",
        name: "Geometry Basics Video",
        type: "video",
        url: "/materials/geometry.mp4",
        dateAdded: "2024-01-20",
        size: "45 MB",
      },
    ],
    tests: [
      {
        id: "t1",
        title: "Midterm Exam",
        description: "Covers chapters 1-5",
        dueDate: "2024-06-15",
        questions: 25,
        totalPoints: 100,
        status: "published",
        submissions: 12,
      },
      {
        id: "t2",
        title: "Final Exam",
        description: "Comprehensive exam covering all material",
        dueDate: "2024-07-20",
        questions: 50,
        totalPoints: 200,
        status: "draft",
      },
    ],
  },
  {
    id: "2",
    name: "Physics Advanced",
    description: "Advanced concepts in physics including mechanics and thermodynamics",
    students: 12,
    nextSession: "2024-05-21 14:00",
    progress: 45,
    color: "#0ea5e9",
    materials: [
      {
        id: "m3",
        name: "Mechanics Lecture Notes",
        type: "pdf",
        url: "/materials/mechanics.pdf",
        dateAdded: "2024-01-25",
        size: "3.1 MB",
      },
      {
        id: "m4",
        name: "Thermodynamics Overview",
        type: "document",
        url: "/materials/thermo.docx",
        dateAdded: "2024-02-01",
        size: "1.8 MB",
      },
    ],
    tests: [
      {
        id: "t3",
        title: "Quiz 1",
        description: "Mechanics basics",
        dueDate: "2024-05-28",
        questions: 10,
        totalPoints: 50,
        status: "published",
        submissions: 8,
      },
    ],
  },
  {
    id: "3",
    name: "Computer Science Fundamentals",
    description: "Introduction to programming concepts, algorithms, and data structures",
    students: 20,
    nextSession: "2024-05-22 09:00",
    progress: 30,
    color: "#10b981",
    materials: [
      {
        id: "m5",
        name: "Introduction to Programming",
        type: "pdf",
        url: "/materials/programming.pdf",
        dateAdded: "2024-02-10",
        size: "4.2 MB",
      },
      {
        id: "m6",
        name: "Data Structures Tutorial",
        type: "video",
        url: "/materials/data-structures.mp4",
        dateAdded: "2024-02-15",
        size: "120 MB",
      },
    ],
    tests: [
      {
        id: "t4",
        title: "Programming Assignment 1",
        description: "Basic programming concepts",
        dueDate: "2024-06-05",
        questions: 5,
        totalPoints: 100,
        status: "published",
        submissions: 15,
      },
      {
        id: "t5",
        title: "Midterm Exam",
        description: "Covers programming fundamentals and basic algorithms",
        dueDate: "2024-06-25",
        questions: 30,
        totalPoints: 150,
        status: "draft",
      },
    ],
  },
]

const mockNotifications: Notification[] = [
  {
    id: "1",
    message: "New student enrolled in Mathematics 101",
    date: "2024-05-19",
    type: "course",
    read: false,
    courseId: "1",
  },
  {
    id: "2",
    message: "Upcoming session in 30 minutes",
    date: "2024-05-19",
    type: "course",
    read: false,
    courseId: "1",
  },
  {
    id: "3",
    message: 'Student John Doe submitted test "Midterm Exam"',
    date: "2024-05-18",
    type: "test",
    read: true,
    courseId: "1",
    studentId: "1",
  },
  {
    id: "4",
    message: "Admin approved your new course request",
    date: "2024-05-17",
    type: "admin",
    read: true,
  },
]

// Main component
export default function TutorDashboard() {
  // State
  const [user, setUser] = useState({ name: "Dr. Smith", email: "dr.smith@university.edu", role: "tutor" })
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [newCourse, setNewCourse] = useState({ name: "", description: "" })
  const [newTest, setNewTest] = useState({
    title: "",
    description: "",
    dueDate: "",
    courseId: "",
    questions: [] as Question[],
  })
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    type: "multiple-choice" as Question["type"],
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 10,
  })
  const [newNotification, setNewNotification] = useState({
    message: "",
    courseId: "",
    studentIds: [] as string[],
  })
  const [emailsToUpload, setEmailsToUpload] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isCreatingCourse, setIsCreatingCourse] = useState(false)
  const [isCreatingTest, setIsCreatingTest] = useState(false)
  const [isSendingNotification, setIsSendingNotification] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [filterCourse, setFilterCourse] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  // Effects
  useEffect(() => {
    // Calculate unread notifications
    setUnreadCount(notifications.filter((n) => !n.read).length)
  }, [notifications])

  // Load live data from API
  const apiBase = ''

  const fetchTutorData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${apiBase}/api/tutor/dashboard`)
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()
      
      if (data.tutor) setUser(data.tutor)
      if (data.students) setStudents(data.students)
      if (data.courses) setCourses(data.courses)
      if (data.notifications) setNotifications(data.notifications)
    } catch (e) {
      console.error('Failed to fetch tutor data:', e)
      // Fallback to mock data on error
      setCourses(mockCourses)
      setNotifications(mockNotifications)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTutorData()
  }, [])

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(`${apiBase}/api/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'SELECT id, name, email, created_at as createdAt FROM users WHERE role = "student"' }) })
        if (res.ok) {
          const data = await res.json()
          const mapped = Array.isArray(data) ? data.map((s: any) => ({ id: s.id?.toString(), name: s.name, email: s.email, progress: 0, lastActivity: s.createdAt, status: 'active', enrolledCourses: [] })) : []
          setStudents(mapped)
        }
      } catch (e) {
        console.error('Failed to fetch students', e)
      }
    }

    const fetchCourses = async () => {
      try {
        const res = await fetch(`${apiBase}/api/courses`)
        if (res.ok) {
          const data = await res.json()
          const mapped = Array.isArray(data) ? data.map((c: any) => ({ id: c.id?.toString(), name: c.title || c.name || 'Course', description: c.description || '', students: 0, nextSession: '', progress: 0, materials: [], tests: [], color: '#4f46e5' })) : []
          setCourses(mapped)
        }
      } catch (e) {
        console.error('Failed to fetch courses', e)
      }
    }

    fetchStudents()
    fetchCourses()
  }, [])

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleCourseSelect = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId) || null
    setSelectedCourse(course)
  }

  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s) => s.id === studentId) || null
    setSelectedStudent(student)
  }

  const handleCreateCourse = async () => {
    setIsCreatingCourse(true)

    try {
      // Create course via API
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCourse.name,
          description: newCourse.description,
          department: 'General',
          tutorId: user.id || 'tutor-1',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'General'
        })
      })

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()

      const colors = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]
      const randomColor = colors[Math.floor(Math.random() * colors.length)]

      const newCourseData: Course = {
        id: data.id || `course-${Date.now()}`,
        name: newCourse.name,
        description: newCourse.description,
        students: 0,
        nextSession: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 0,
        materials: [],
        tests: [],
        color: randomColor,
      }

      setCourses((prev) => [...prev, newCourseData])
      setNewCourse({ name: "", description: "" })

      console.log("Course created successfully")
    } catch (error) {
      console.error("Failed to create course", error)
    } finally {
      setIsCreatingCourse(false)
    }
  }

  const handleCreateTest = async () => {
    setIsCreatingTest(true)

    try {
      // Create test via API
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTest.title,
          description: newTest.description,
          dueDate: newTest.dueDate,
          courseId: newTest.courseId,
          questions: newTest.questions,
          totalPoints: newTest.questions.reduce((sum, q) => sum + q.points, 0)
        })
      })

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()

      const newTestData: Test = {
        id: data.id || `test-${Date.now()}`,
        title: newTest.title,
        description: newTest.description,
        dueDate: newTest.dueDate,
        questions: newTest.questions.length,
        totalPoints: newTest.questions.reduce((sum, q) => sum + q.points, 0),
        status: "draft",
      }

      setCourses((prev) =>
        prev.map((course) =>
          course.id === newTest.courseId ? { ...course, tests: [...course.tests, newTestData] } : course,
        ),
      )

      setNewTest({
        title: "",
        description: "",
        dueDate: "",
        courseId: "",
        questions: [],
      })

      console.log("Test created successfully")
    } catch (error) {
      console.error("Failed to create test", error)
    } finally {
      setIsCreatingTest(false)
    }
  }

  const handleAddQuestion = () => {
    setNewTest((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `q-${Date.now()}`,
          text: newQuestion.text,
          type: newQuestion.type,
          options: newQuestion.type === "multiple-choice" ? newQuestion.options : undefined,
          correctAnswer: newQuestion.correctAnswer,
          points: newQuestion.points,
        },
      ],
    }))

    setNewQuestion({
      text: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 10,
    })
  }

  const handleSendNotification = async () => {
    setIsSendingNotification(true)

    try {
      // Send notification via API
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Course Notification',
          message: newNotification.message,
          type: 'course',
          recipients: {
            tutors: false,
            students: true,
            specific: newNotification.studentIds
          }
        })
      })

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()

      const newNotificationData: Notification = {
        id: data.id || `notif-${Date.now()}`,
        message: newNotification.message,
        date: new Date().toISOString(),
        type: "course",
        read: false,
        courseId: newNotification.courseId,
      }

      setNotifications((prev) => [newNotificationData, ...prev])
      setNewNotification({
        message: "",
        courseId: "",
        studentIds: [],
      })

      console.log("Notification sent successfully")
    } catch (error) {
      console.error("Failed to send notification", error)
    } finally {
      setIsSendingNotification(false)
    }
  }

  const handleUploadEmails = async () => {
    setIsUploading(true)

    try {
      // Parse emails (assuming comma or newline separated)
      const emails = emailsToUpload
        .split(/[\n,]/)
        .map((email) => email.trim())
        .filter((email) => email.includes("@"))

      if (emails.length === 0) {
        throw new Error("No valid emails found")
      }

      // Create students via API
      const res = await fetch('/api/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails })
      })

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()

      // Create new pending students
      const newStudents = emails.map((email, index) => ({
        id: data.ids?.[index] || `student-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: email
          .split("@")[0]
          .replace(/[.]/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        email,
        progress: 0,
        lastActivity: new Date().toISOString(),
        status: "pending" as const,
        enrolledCourses: [],
      }))

      setStudents((prev) => [...prev, ...newStudents])
      setEmailsToUpload("")

      console.log(`${emails.length} student email(s) uploaded successfully`)
    } catch (error) {
      console.error("Failed to upload emails", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleApproveStudent = async (studentId: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setStudents((prev) =>
        prev.map((student) => (student.id === studentId ? { ...student, status: "active" } : student)),
      )

      console.log("Student approved successfully")
    } catch (error) {
      console.error("Failed to approve student", error)
    }
  }

  const handlePublishTest = async (courseId: string, testId: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? {
                ...course,
                tests: course.tests.map((test) => (test.id === testId ? { ...test, status: "published" } : test)),
              }
            : course,
        ),
      )

      console.log("Test published successfully")
    } catch (error) {
      console.error("Failed to publish test", error)
    }
  }

  const handleMarkNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    )
  }

  // Filtered data
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())

    // enrolledCourses may be undefined when loaded from API; guard with fallback
    const matchesCourse = filterCourse ? (student.enrolledCourses || []).includes(filterCourse) : true

    const matchesStatus = filterStatus ? student.status === filterStatus : true

    return matchesSearch && matchesCourse && matchesStatus
  })

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const pendingStudents = students.filter((student) => student.status === "pending")
  const activeStudents = students.filter((student) => student.status === "active")

  // Render
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-200 fixed inset-y-0 z-50 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "left-0 w-64" : "-left-64 w-64 md:left-0 md:w-20"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className={`h-6 w-6 text-indigo-600 ${!sidebarOpen && "mx-auto"}`} />
              {sidebarOpen && <span className="font-bold text-xl">EduPlatform</span>}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-gray-700 md:block hidden"
            >
              <ChevronDown className={`h-5 w-5 transition-transform ${!sidebarOpen ? "rotate-90" : "rotate-270"}`} />
            </button>
          </div>

          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-2">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center ${
                  !sidebarOpen ? "justify-center" : "justify-start"
                } w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "dashboard" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Home className="h-5 w-5 mr-2 flex-shrink-0" />
                {sidebarOpen && <span>Dashboard</span>}
              </button>

              <button
                onClick={() => setActiveTab("courses")}
                className={`flex items-center ${
                  !sidebarOpen ? "justify-center" : "justify-start"
                } w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "courses" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <BookOpen className="h-5 w-5 mr-2 flex-shrink-0" />
                {sidebarOpen && <span>Courses</span>}
              </button>

              <button
                onClick={() => setActiveTab("students")}
                className={`flex items-center ${
                  !sidebarOpen ? "justify-center" : "justify-start"
                } w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "students" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Users className="h-5 w-5 mr-2 flex-shrink-0" />
                {sidebarOpen && <span>Students</span>}
              </button>

              <button
                onClick={() => setActiveTab("tests")}
                className={`flex items-center ${
                  !sidebarOpen ? "justify-center" : "justify-start"
                } w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "tests" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FileText className="h-5 w-5 mr-2 flex-shrink-0" />
                {sidebarOpen && <span>Tests</span>}
              </button>

              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex items-center ${
                  !sidebarOpen ? "justify-center" : "justify-start"
                } w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "notifications" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Bell className="h-5 w-5 mr-2 flex-shrink-0" />
                {sidebarOpen && (
                  <div className="flex justify-between items-center w-full">
                    <span>Notifications</span>
                    {unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount}</Badge>}
                  </div>
                )}
                {!sidebarOpen && unreadCount > 0 && (
                  <Badge className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white">{unreadCount}</Badge>
                )}
              </button>

              {sidebarOpen && (
                <>
                  <Separator className="my-4" />
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Courses</h3>
                  {courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => {
                        setActiveTab("courses")
                        handleCourseSelect(course.id)
                      }}
                      className="flex items-center justify-start w-full px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
                    >
                      <div
                        className="h-3 w-3 rounded-full mr-2 flex-shrink-0"
                        style={{ backgroundColor: course.color }}
                      />
                      <span className="truncate">{course.name}</span>
                    </button>
                  ))}
                </>
              )}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t border-gray-200">
            <div className={`flex ${!sidebarOpen ? "justify-center" : "justify-start items-center"}`}>
              {sidebarOpen ? (
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-indigo-600 text-white">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.role}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-indigo-600 text-white">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 flex items-center">
              <BookOpen className="h-6 w-6 text-indigo-600 mr-2" />
              <span className="font-bold text-xl">EduPlatform</span>
            </div>

            <ScrollArea className="flex-1 py-4">
              <nav className="space-y-1 px-2">
                <button
                  onClick={() => {
                    setActiveTab("dashboard")
                    setMobileMenuOpen(false)
                  }}
                  className={`flex items-center justify-start w-full px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "dashboard" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Home className="h-5 w-5 mr-2" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("courses")
                    setMobileMenuOpen(false)
                  }}
                  className={`flex items-center justify-start w-full px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "courses" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  <span>Courses</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("students")
                    setMobileMenuOpen(false)
                  }}
                  className={`flex items-center justify-start w-full px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "students" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Users className="h-5 w-5 mr-2" />
                  <span>Students</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("tests")
                    setMobileMenuOpen(false)
                  }}
                  className={`flex items-center justify-start w-full px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "tests" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  <span>Tests</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("notifications")
                    setMobileMenuOpen(false)
                  }}
                  className={`flex items-center justify-start w-full px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "notifications" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Bell className="h-5 w-5 mr-2" />
                  <div className="flex justify-between items-center w-full">
                    <span>Notifications</span>
                    {unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount}</Badge>}
                  </div>
                </button>

                <Separator className="my-4" />
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Courses</h3>
                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => {
                      setActiveTab("courses")
                      handleCourseSelect(course.id)
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center justify-start w-full px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: course.color }} />
                    <span className="truncate">{course.name}</span>
                  </button>
                ))}
              </nav>
            </ScrollArea>

            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-indigo-600 text-white">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ease-in-out ${sidebarOpen ? "md:ml-64" : "md:ml-20"}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center md:hidden">
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
                  <Menu className="h-6 w-6" />
                </Button>
              </div>
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900 hidden md:block">
                  {activeTab === "dashboard" && "Dashboard"}
                  {activeTab === "courses" && "Courses"}
                  {activeTab === "students" && "Students"}
                  {activeTab === "tests" && "Tests & Assessments"}
                  {activeTab === "notifications" && "Notifications"}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full md:w-64 pl-10"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            {unreadCount}
                          </span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>You have {unreadCount} unread notifications</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-indigo-600 text-white">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline-block">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-l-4 border-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                      <Users className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{students.length}</div>
                      <p className="text-xs text-muted-foreground">
                        {activeStudents.length} active, {pendingStudents.length} pending
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card className="border-l-4 border-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                      <BookOpen className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{courses.length}</div>
                      <p className="text-xs text-muted-foreground">
                        {courses.reduce((sum, course) => sum + course.tests.length, 0)} tests created
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Card className="border-l-4 border-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Next Session</CardTitle>
                      <Calendar className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {courses.length > 0
                          ? new Date(courses[0]?.nextSession).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {courses.length > 0
                          ? `${courses[0]?.name} - ${new Date(courses[0]?.nextSession).toLocaleDateString()}`
                          : "No upcoming sessions"}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Card className="border-l-4 border-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                      <Mail className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{pendingStudents.length}</div>
                      <p className="text-xs text-muted-foreground">Student enrollments</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Course Overview */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Course Overview</CardTitle>
                    <CardDescription>Progress across all your active courses</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("courses")}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <div key={course.id} className="flex items-center">
                        <div className="h-3 w-3 rounded-full mr-3" style={{ backgroundColor: course.color }} />
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-medium truncate">{course.name}</p>
                            <p className="text-sm text-muted-foreground">{course.progress}%</p>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions and Pending Approvals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pending Approvals */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Pending Student Approvals</CardTitle>
                    <CardDescription>Students waiting for your approval</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingStudents.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">No pending approvals</div>
                    ) : (
                      <div className="space-y-4">
                        {pendingStudents.slice(0, 3).map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                          >
                            <div>
                              <h3 className="font-medium">{student.name}</h3>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleApproveStudent(student.id)}>
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="outline">
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                        {pendingStudents.length > 3 && (
                          <Button variant="link" className="w-full" onClick={() => setActiveTab("students")}>
                            View All Pending Students
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-start" variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Student Emails
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload Student Emails</DialogTitle>
                          <DialogDescription>
                            Enter student emails separated by commas or new lines. They will be invited to join your
                            courses.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="emails">Student Emails</Label>
                            <Textarea
                              id="emails"
                              placeholder="student1@example.com, student2@example.com"
                              rows={6}
                              value={emailsToUpload}
                              onChange={(e) => setEmailsToUpload(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleUploadEmails} disabled={isUploading || !emailsToUpload.trim()}>
                            {isUploading ? "Uploading..." : "Upload Emails"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-start" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Course
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Course</DialogTitle>
                          <DialogDescription>
                            Fill in the details to create a new course. You can add materials and tests later.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="course-name">Course Name</Label>
                            <Input
                              id="course-name"
                              placeholder="e.g., Introduction to Biology"
                              value={newCourse.name}
                              onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="course-description">Description</Label>
                            <Textarea
                              id="course-description"
                              placeholder="Brief description of the course"
                              rows={4}
                              value={newCourse.description}
                              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateCourse} disabled={isCreatingCourse || !newCourse.name.trim()}>
                            {isCreatingCourse ? "Creating..." : "Create Course"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-start" variant="outline">
                          <Send className="h-4 w-4 mr-2" />
                          Send Notification
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Send Notification</DialogTitle>
                          <DialogDescription>
                            Send a notification to students in a specific course or to individual students.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="notification-course">Course</Label>
                            <Select
                              onValueChange={(value) => setNewNotification({ ...newNotification, courseId: value })}
                              value={newNotification.courseId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a course" />
                              </SelectTrigger>
                              <SelectContent>
                                {courses.map((course) => (
                                  <SelectItem key={course.id} value={course.id}>
                                    {course.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="notification-message">Message</Label>
                            <Textarea
                              id="notification-message"
                              placeholder="Enter your notification message"
                              rows={4}
                              value={newNotification.message}
                              onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={handleSendNotification}
                            disabled={
                              isSendingNotification || !newNotification.message.trim() || !newNotification.courseId
                            }
                          >
                            {isSendingNotification ? "Sending..." : "Send Notification"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Notifications */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Notifications</CardTitle>
                    <CardDescription>Latest updates and alerts</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("notifications")}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg ${notification.read ? "bg-gray-50" : "bg-blue-50 border-l-4 border-blue-500"}`}
                        onClick={() => handleMarkNotificationAsRead(notification.id)}
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-sm">{notification.message}</p>
                          <Badge variant={notification.read ? "outline" : "default"} className="ml-2">
                            {notification.read ? "Read" : "New"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === "courses" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Courses</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Create Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Course</DialogTitle>
                      <DialogDescription>
                        Fill in the details to create a new course. You can add materials and tests later.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="course-name">Course Name</Label>
                        <Input
                          id="course-name"
                          placeholder="e.g., Introduction to Biology"
                          value={newCourse.name}
                          onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="course-description">Description</Label>
                        <Textarea
                          id="course-description"
                          placeholder="Brief description of the course"
                          rows={4}
                          value={newCourse.description}
                          onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateCourse} disabled={isCreatingCourse || !newCourse.name.trim()}>
                        {isCreatingCourse ? "Creating..." : "Create Course"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`border-t-4`} style={{ borderTopColor: course.color }}>
                      <CardHeader>
                        <CardTitle>{course.name}</CardTitle>
                        <CardDescription>{course.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold">{course.students}</p>
                              <p className="text-xs text-muted-foreground">Students</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{course.materials.length}</p>
                              <p className="text-xs text-muted-foreground">Materials</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{course.tests.length}</p>
                              <p className="text-xs text-muted-foreground">Tests</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{course.progress}%</span>
                            </div>
                            <Progress value={course.progress} className="h-2" />
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Next: {new Date(course.nextSession).toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline" size="sm" onClick={() => handleCourseSelect(course.id)}>
                          View Details
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit Course</DropdownMenuItem>
                            <DropdownMenuItem>Add Material</DropdownMenuItem>
                            <DropdownMenuItem>Create Test</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Delete Course</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}

                {filteredCourses.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">No courses found</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {searchTerm ? "Try a different search term" : "Create your first course to get started"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === "students" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-2xl font-bold">Students</h2>
                <div className="flex flex-col md:flex-row gap-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Upload className="mr-2 h-4 w-4" /> Upload Emails
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Student Emails</DialogTitle>
                        <DialogDescription>
                          Enter student emails separated by commas or new lines. They will be invited to join your
                          courses.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="emails">Student Emails</Label>
                          <Textarea
                            id="emails"
                            placeholder="student1@example.com, student2@example.com"
                            rows={6}
                            value={emailsToUpload}
                            onChange={(e) => setEmailsToUpload(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleUploadEmails} disabled={isUploading || !emailsToUpload.trim()}>
                          {isUploading ? "Uploading..." : "Upload Emails"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <div className="flex gap-2">
                    <Select onValueChange={(value) => setFilterCourse(value === "all" ? null : value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select onValueChange={(value) => setFilterStatus(value === "all" ? null : value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Student Management</CardTitle>
                  <CardDescription>View and manage all students across your courses</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Courses</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                  {student.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {student.name}
                            </div>
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                student.status === "active"
                                  ? "default"
                                  : student.status === "pending"
                                    ? "outline"
                                    : "secondary"
                              }
                              className={
                                student.status === "active"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : student.status === "pending"
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                              }
                            >
                              {student.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={student.progress} className="h-2 w-20" />
                              <span className="text-xs">{student.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(student.enrolledCourses || []).map((courseId) => {
                                const course = courses.find((c) => c.id === courseId)
                                return course ? (
                                  <Badge key={courseId} variant="outline" className="text-xs">
                                    {course.name}
                                  </Badge>
                                ) : null
                              })}
                              {(student.enrolledCourses?.length ?? 0) === 0 && (
                                <span className="text-xs text-muted-foreground">None</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(student.lastActivity).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {student.status === "pending" && (
                                <Button size="sm" onClick={() => handleApproveStudent(student.id)}>
                                  Approve
                                </Button>
                              )}
                              <Button variant="outline" size="sm" onClick={() => handleStudentSelect(student.id)}>
                                View
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Send Message</DropdownMenuItem>
                                  <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">Remove Student</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {filteredStudents.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No students found</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {searchTerm || filterCourse || filterStatus
                          ? "Try adjusting your filters"
                          : "Upload student emails to get started"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tests Tab */}
          {activeTab === "tests" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Tests & Assessments</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Create Test
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Create New Test</DialogTitle>
                      <DialogDescription>Create a new test or assessment for your students.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="test-title">Test Title</Label>
                          <Input
                            id="test-title"
                            placeholder="e.g., Midterm Exam"
                            value={newTest.title}
                            onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="test-course">Course</Label>
                          <Select
                            onValueChange={(value) => setNewTest({ ...newTest, courseId: value })}
                            value={newTest.courseId}
                          >
                            <SelectTrigger id="test-course">
                              <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                            <SelectContent>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="test-description">Description</Label>
                        <Textarea
                          id="test-description"
                          placeholder="Brief description of the test"
                          rows={2}
                          value={newTest.description}
                          onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="test-due-date">Due Date</Label>
                        <Input
                          id="test-due-date"
                          type="datetime-local"
                          value={newTest.dueDate}
                          onChange={(e) => setNewTest({ ...newTest, dueDate: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2 mt-6">
                        <div className="flex justify-between items-center">
                          <Label>Questions ({newTest.questions.length})</Label>
                          <Badge variant="outline">
                            Total Points: {newTest.questions.reduce((sum, q) => sum + q.points, 0)}
                          </Badge>
                        </div>

                        {newTest.questions.length > 0 && (
                          <div className="space-y-4 mt-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                            {newTest.questions.map((question, index) => (
                              <div key={question.id} className="p-3 border rounded-md bg-gray-50">
                                <div className="flex justify-between">
                                  <span className="font-medium">Question {index + 1}</span>
                                  <Badge variant="outline">{question.points} pts</Badge>
                                </div>
                                <p className="mt-1">{question.text}</p>
                                <div className="mt-2 text-sm text-muted-foreground">Type: {question.type}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        <Card className="mt-4">
                          <CardHeader>
                            <CardTitle>Add Question</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="question-text">Question Text</Label>
                                <Textarea
                                  id="question-text"
                                  placeholder="Enter your question"
                                  value={newQuestion.text}
                                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="question-type">Question Type</Label>
                                  <Select
                                    onValueChange={(value) =>
                                      setNewQuestion({
                                        ...newQuestion,
                                        type: value as Question["type"],
                                        options: value === "multiple-choice" ? ["", "", "", ""] : undefined,
                                      })
                                    }
                                    value={newQuestion.type}
                                  >
                                    <SelectTrigger id="question-type">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                      <SelectItem value="true-false">True/False</SelectItem>
                                      <SelectItem value="short-answer">Short Answer</SelectItem>
                                      <SelectItem value="essay">Essay</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="question-points">Points</Label>
                                  <Input
                                    id="question-points"
                                    type="number"
                                    min="1"
                                    value={newQuestion.points}
                                    onChange={(e) =>
                                      setNewQuestion({ ...newQuestion, points: Number.parseInt(e.target.value) || 1 })
                                    }
                                  />
                                </div>
                              </div>

                              {newQuestion.type === "multiple-choice" && newQuestion.options && (
                                <div className="space-y-3">
                                  <Label>Options</Label>
                                  {newQuestion.options.map((option, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <Checkbox
                                        id={`option-${index}`}
                                        checked={newQuestion.correctAnswer === index.toString()}
                                        onCheckedChange={() =>
                                          setNewQuestion({ ...newQuestion, correctAnswer: index.toString() })
                                        }
                                      />
                                      <Input
                                        placeholder={`Option ${index + 1}`}
                                        value={option}
                                        onChange={(e) => {
                                          const newOptions = [...newQuestion.options!]
                                          newOptions[index] = e.target.value
                                          setNewQuestion({ ...newQuestion, options: newOptions })
                                        }}
                                      />
                                    </div>
                                  ))}
                                  <div className="text-sm text-muted-foreground">Check the correct answer(s)</div>
                                </div>
                              )}

                              {newQuestion.type === "true-false" && (
                                <div className="space-y-3">
                                  <Label>Correct Answer</Label>
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id="true-option"
                                        checked={newQuestion.correctAnswer === "true"}
                                        onCheckedChange={() =>
                                          setNewQuestion({ ...newQuestion, correctAnswer: "true" })
                                        }
                                      />
                                      <Label htmlFor="true-option">True</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id="false-option"
                                        checked={newQuestion.correctAnswer === "false"}
                                        onCheckedChange={() =>
                                          setNewQuestion({ ...newQuestion, correctAnswer: "false" })
                                        }
                                      />
                                      <Label htmlFor="false-option">False</Label>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button onClick={handleAddQuestion} disabled={!newQuestion.text.trim()}>
                              Add Question
                            </Button>
                          </CardFooter>
                        </Card>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleCreateTest}
                        disabled={
                          isCreatingTest ||
                          !newTest.title.trim() ||
                          !newTest.courseId ||
                          !newTest.dueDate ||
                          newTest.questions.length === 0
                        }
                      >
                        {isCreatingTest ? "Creating..." : "Create Test"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Tabs defaultValue="upcoming">
                <TabsList>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="mt-4 space-y-6">
                  {courses.map((course) => {
                    const upcomingTests = course.tests.filter((test) => test.status === "published")
                    if (upcomingTests.length === 0) return null

                    return (
                      <Card key={course.id} className="mb-6">
                        <CardHeader className="flex flex-row items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: course.color }} />
                          <div>
                            <CardTitle>{course.name}</CardTitle>
                            <CardDescription>Upcoming tests and assessments</CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {upcomingTests.map((test) => (
                              <div key={test.id} className="p-4 border rounded-lg bg-white shadow-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-medium">{test.title}</h3>
                                    <p className="text-sm text-muted-foreground">{test.description}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                        Published
                                      </Badge>
                                      <span className="text-sm">
                                        Due: {new Date(test.dueDate).toLocaleDateString()}
                                      </span>
                                      <span className="text-sm">
                                        {test.questions} questions ({test.totalPoints} pts)
                                      </span>
                                      {test.submissions && (
                                        <span className="text-sm text-muted-foreground">
                                          {test.submissions} submissions
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                      <Edit className="h-4 w-4 mr-1" />
                                      Edit
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-600">
                                      <X className="h-4 w-4 mr-1" />
                                      Close
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                  {!courses.some((course) => course.tests.some((test) => test.status === "published")) && (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No upcoming tests</h3>
                      <p className="mt-2 text-sm text-muted-foreground">Create and publish tests to see them here</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="drafts" className="mt-4 space-y-6">
                  {courses.map((course) => {
                    const draftTests = course.tests.filter((test) => test.status === "draft")
                    if (draftTests.length === 0) return null

                    return (
                      <Card key={course.id} className="mb-6">
                        <CardHeader className="flex flex-row items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: course.color }} />
                          <div>
                            <CardTitle>{course.name}</CardTitle>
                            <CardDescription>Draft tests and assessments</CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {draftTests.map((test) => (
                              <div key={test.id} className="p-4 border rounded-lg bg-white shadow-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-medium">{test.title}</h3>
                                    <p className="text-sm text-muted-foreground">{test.description}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                      <Badge variant="outline">Draft</Badge>
                                      <span className="text-sm">
                                        Due: {new Date(test.dueDate).toLocaleDateString()}
                                      </span>
                                      <span className="text-sm">
                                        {test.questions} questions ({test.totalPoints} pts)
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handlePublishTest(course.id, test.id)}>
                                      <Check className="h-4 w-4 mr-1" />
                                      Publish
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Edit className="h-4 w-4 mr-1" />
                                      Edit
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                  {!courses.some((course) => course.tests.some((test) => test.status === "draft")) && (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No draft tests</h3>
                      <p className="mt-2 text-sm text-muted-foreground">Create new tests to see them here</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="past" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Past Tests</CardTitle>
                      <CardDescription>Tests that have been completed and are now closed.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                        <h3 className="mt-4 text-lg font-medium">No past tests</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Tests that have passed their due date will appear here
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Notifications</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Send className="mr-2 h-4 w-4" /> Send Notification
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Notification</DialogTitle>
                      <DialogDescription>
                        Send a notification to students in a specific course or to individual students.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="notification-course">Course</Label>
                        <Select
                          onValueChange={(value) => setNewNotification({ ...newNotification, courseId: value })}
                          value={newNotification.courseId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notification-message">Message</Label>
                        <Textarea
                          id="notification-message"
                          placeholder="Enter your notification message"
                          rows={4}
                          value={newNotification.message}
                          onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleSendNotification}
                        disabled={isSendingNotification || !newNotification.message.trim() || !newNotification.courseId}
                      >
                        {isSendingNotification ? "Sending..." : "Send Notification"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="all">All Notifications</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="sent">Sent by Me</TabsTrigger>
                </TabsList>
                <div className="mt-4">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No notifications</h3>
                      <p className="mt-2 text-sm text-muted-foreground">You don't have any notifications yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <Card
                          key={notification.id}
                          className={`${notification.read ? "bg-white" : "bg-blue-50 border-l-4 border-blue-500"}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{notification.message}</p>
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                  <Badge variant="outline">{notification.type}</Badge>
                                  <span>{new Date(notification.date).toLocaleString()}</span>
                                </div>
                                {notification.courseId && (
                                  <p className="text-sm mt-1">
                                    Course: {courses.find((c) => c.id === notification.courseId)?.name || "Unknown"}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMarkNotificationAsRead(notification.id)}
                                disabled={notification.read}
                              >
                                {notification.read ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </Tabs>
            </div>
          )}
        </div>
      </main>

      {/* Course Detail Dialog */}
      {selectedCourse && (
        <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedCourse.color }} />
                <DialogTitle>{selectedCourse.name}</DialogTitle>
              </div>
              <DialogDescription>{selectedCourse.description}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="materials">Materials</TabsTrigger>
                  <TabsTrigger value="tests">Tests</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Course Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Students:</span>
                        <span>{selectedCourse.students}</span>
                        <span className="text-muted-foreground">Next Session:</span>
                        <span>{new Date(selectedCourse.nextSession).toLocaleString()}</span>
                        <span className="text-muted-foreground">Progress:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedCourse.progress} className="h-2 w-20" />
                          <span>{selectedCourse.progress}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">Enrolled Students</h3>
                      <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                        {students
                          .filter((student) => student.enrolledCourses.includes(selectedCourse.id))
                          .map((student) => (
                            <div key={student.id} className="flex justify-between">
                              <span>{student.name}</span>
                              <span className="text-muted-foreground">{student.progress}%</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="materials" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Course Materials</h3>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Add Material
                      </Button>
                    </div>
                    {selectedCourse.materials.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">No materials added yet</div>
                    ) : (
                      <div className="space-y-2">
                        {selectedCourse.materials.map((material) => (
                          <div key={material.id} className="flex justify-between items-center p-3 border rounded-md">
                            <div className="flex items-center gap-2">
                              {material.type === "pdf" && <FileText className="h-4 w-4" />}
                              {material.type === "video" && <FileText className="h-4 w-4" />}
                              {material.type === "document" && <FileText className="h-4 w-4" />}
                              <span>{material.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{material.size}</span>
                              <span>Added: {new Date(material.dateAdded).toLocaleDateString()}</span>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="tests" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Tests & Assessments</h3>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Create Test
                      </Button>
                    </div>
                    {selectedCourse.tests.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">No tests created yet</div>
                    ) : (
                      <div className="space-y-2">
                        {selectedCourse.tests.map((test) => (
                          <div key={test.id} className="p-3 border rounded-md">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{test.title}</h4>
                                <p className="text-sm text-muted-foreground">{test.description}</p>
                                <div className="flex items-center gap-2 mt-1 text-sm">
                                  <Badge
                                    variant={
                                      test.status === "published"
                                        ? "default"
                                        : test.status === "draft"
                                          ? "outline"
                                          : "secondary"
                                    }
                                    className={
                                      test.status === "published"
                                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                                        : ""
                                    }
                                  >
                                    {test.status}
                                  </Badge>
                                  <span>Due: {new Date(test.dueDate).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {test.status === "draft" && (
                                  <Button size="sm" onClick={() => handlePublishTest(selectedCourse.id, test.id)}>
                                    Publish
                                  </Button>
                                )}
                                <Button variant="outline" size="sm">
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedCourse(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Student Detail Dialog */}
      {selectedStudent && (
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-indigo-100 text-indigo-600">
                    {selectedStudent.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <DialogTitle>{selectedStudent.name}</DialogTitle>
              </div>
              <DialogDescription>{selectedStudent.email}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="courses">Courses</TabsTrigger>
                  <TabsTrigger value="tests">Test Results</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Student Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge
                          variant={
                            selectedStudent.status === "active"
                              ? "default"
                              : selectedStudent.status === "pending"
                                ? "outline"
                                : "secondary"
                          }
                          className={
                            selectedStudent.status === "active"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : selectedStudent.status === "pending"
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {selectedStudent.status}
                        </Badge>
                        <span className="text-muted-foreground">Last Activity:</span>
                        <span>{new Date(selectedStudent.lastActivity).toLocaleString()}</span>
                        <span className="text-muted-foreground">Progress:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedStudent.progress} className="h-2 w-20" />
                          <span>{selectedStudent.progress}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">Enrolled Courses</h3>
                      <div className="text-sm space-y-1">
                        {selectedStudent.enrolledCourses.length === 0 ? (
                          <p className="text-muted-foreground">Not enrolled in any courses</p>
                        ) : (
                          courses
                            .filter((course) => selectedStudent.enrolledCourses.includes(course.id))
                            .map((course) => (
                              <div key={course.id} className="flex justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: course.color }} />
                                  <span>{course.name}</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleCourseSelect(course.id)}>
                                  View
                                </Button>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="courses" className="mt-4">
                  <div className="space-y-4">
                    {selectedStudent.enrolledCourses.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">Not enrolled in any courses</div>
                    ) : (
                      <div className="space-y-4">
                        {courses
                          .filter((course) => selectedStudent.enrolledCourses.includes(course.id))
                          .map((course) => (
                            <Card key={course.id} className="border-l-4" style={{ borderLeftColor: course.color }}>
                              <CardHeader>
                                <CardTitle>{course.name}</CardTitle>
                                <CardDescription>{course.description}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Progress</span>
                                    <span>{selectedStudent.progress}%</span>
                                  </div>
                                  <Progress value={selectedStudent.progress} />
                                  <div className="text-sm text-muted-foreground">
                                    Last activity: {new Date(selectedStudent.lastActivity).toLocaleString()}
                                  </div>
                                  {selectedStudent.grades && selectedStudent.grades[course.id] && (
                                    <div className="mt-4">
                                      <h4 className="text-sm font-medium mb-1">Current Grade</h4>
                                      <div className="flex items-center gap-2">
                                        <div className="text-lg font-bold">{selectedStudent.grades[course.id]}%</div>
                                        <Badge
                                          className={
                                            selectedStudent.grades[course.id] >= 90
                                              ? "bg-green-100 text-green-800"
                                              : selectedStudent.grades[course.id] >= 80
                                                ? "bg-blue-100 text-blue-800"
                                                : selectedStudent.grades[course.id] >= 70
                                                  ? "bg-yellow-100 text-yellow-800"
                                                  : "bg-red-100 text-red-800"
                                          }
                                        >
                                          {selectedStudent.grades[course.id] >= 90
                                            ? "A"
                                            : selectedStudent.grades[course.id] >= 80
                                              ? "B"
                                              : selectedStudent.grades[course.id] >= 70
                                                ? "C"
                                                : selectedStudent.grades[course.id] >= 60
                                                  ? "D"
                                                  : "F"}
                                        </Badge>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="tests" className="mt-4">
                  <div className="text-center py-6 text-muted-foreground">No test results available</div>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
