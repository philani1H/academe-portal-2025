"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bell, Calendar, Users, BookOpen, Upload, Plus, Search, FileText, CheckCircle, AlertCircle, MoreHorizontal, Send, ChevronDown, Mail, Check, X, Edit, User, Settings, LogOut, Menu, Home, Shield, BarChart4, UserPlus, Trash2, Building, GraduationCap, UserCheck, Filter, RefreshCw, Eye, Download, Layout } from 'lucide-react'

import ContentManagement from './ContentManagement'

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"

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
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Types
interface User {
  id: string
  name: string
  email: string
  role: "admin" | "tutor" | "student"
  status: "active" | "pending" | "inactive" | "rejected"
  createdAt: string
  lastActive?: string
  department?: string
  specialization?: string
  avatar?: string
}

interface Tutor extends User {
  role: "tutor"
  department: string
  specialization: string
  courses: string[]
  rating?: number
  students?: number
}

interface Student extends User {
  role: "student"
  enrolledCourses: string[]
  progress?: number
  grade?: number
}

interface Course {
  id: string
  name: string
  description: string
  department: string
  tutorId: string
  status: "active" | "pending" | "inactive"
  students: number
  createdAt: string
  startDate: string
  endDate: string
  color: string
}

interface Notification {
  id: string
  title: string
  message: string
  date: string
  type: "system" | "course" | "user" | "approval"
  status: "sent" | "draft"
  recipients: {
    tutors: boolean
    students: boolean
    specific?: string[]
  }
  read: boolean
}

interface Department {
  id: string
  name: string
  courses: number
  tutors: number
  students: number
  color: string
}

interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalCourses: number
  activeCourses: number
  newUsersToday: number
  activeStudents: number
  activeTutors: number
  pendingApprovals: number
}

// Mock data removed — Admin dashboard now fetches live data from the API / database on mount.
// If an API endpoint is unavailable the UI will gracefully fall back to empty lists.

// Main component
export default function AdminDashboard() {
  // State
  const [user, setUser] = useState({ name: "Admin User", email: "admin@university.edu", role: "admin" })
  const [tutors, setTutors] = useState<Tutor[]>([])  // Initialize with empty array to prevent null
  const [students, setStudents] = useState<Student[]>([])  // Initialize with empty array to prevent null
  const [courses, setCourses] = useState<Course[]>([])  // Initialize with empty array to prevent null
  const [notifications, setNotifications] = useState<Notification[]>([])  // Initialize with empty array to prevent null
  const [departments, setDepartments] = useState<Department[]>([])  // Initialize with empty array to prevent null
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
    activeCourses: 0,
    newUsersToday: 0,
    activeStudents: 0,
    activeTutors: 0,
    pendingApprovals: 0,
  })
  
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  
  const [newTutor, setNewTutor] = useState({
    name: "",
    email: "",
    department: "",
    specialization: "",
  })
  
  const [newCourse, setNewCourse] = useState({
    name: "",
    description: "",
    department: "",
    tutorId: "",
    startDate: "",
    endDate: "",
  })
  
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "system",
    recipients: {
      tutors: false,
      students: false,
      specific: [] as string[],
    },
  })
  
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    color: "#4f46e5",
  })
  
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showContentManager, setShowContentManager] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteTarget, setInviteTarget] = useState<'students' | 'tutors'>('students')
  const [inviteEmails, setInviteEmails] = useState('')
  const [inviteCourseName, setInviteCourseName] = useState('')
  const [inviteTutorName, setInviteTutorName] = useState('')
  const [inviteDepartment, setInviteDepartment] = useState('')
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const { toast } = useToast()
  
  const [filterRole, setFilterRole] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterDepartment, setFilterDepartment] = useState<string | null>(null)
  
  const [isCreatingTutor, setIsCreatingTutor] = useState(false)
  const [isCreatingCourse, setIsCreatingCourse] = useState(false)
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false)
  const [isSendingNotification, setIsSendingNotification] = useState(false)
  const [isContentManagerOpen, setIsContentManagerOpen] = useState(false)

  // Effects
  // Collapse sidebar by default on small screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [])
  useEffect(() => {
    // Calculate unread notifications
    setUnreadCount(notifications.filter((n) => !n.read).length)
  }, [notifications])

  // Fetch data from API via centralized helper (respects VITE_API_URL)
  const fetchTutors = async () => {
    try {
      const data = await apiFetch<any[]>(`/api/admin/content/tutors`)
      setTutors(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to fetch tutors:', e)
      setTutors([])
    }
  }

  const fetchStudents = async () => {
    try {
      const data = await apiFetch<any>(`/api/query`, {
        method: 'POST',
        body: JSON.stringify({
          query: 'SELECT id, name, email, role, created_at as createdAt, last_active as lastActive FROM users WHERE role = "student" ORDER BY created_at DESC'
        })
      })
      const rows = (data && (data as any).data) ? (data as any).data : data
      setStudents(Array.isArray(rows) ? rows : [])
    } catch (e) {
      console.error('Failed to fetch students:', e)
      setStudents([])
    }
  }

  const fetchCourses = async () => {
    try {
      const data = await apiFetch<any[]>(`/api/courses`)
      setCourses(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to fetch courses:', e)
      setCourses([])
    }
  }

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch<any>(`/api/query`, {
        method: 'POST',
        body: JSON.stringify({
          query: 'SELECT id, title, message, type, status, created_at as date, read FROM notifications ORDER BY created_at DESC LIMIT 20'
        })
      })
      const rows = (data && (data as any).data) ? (data as any).data : data
      const mapped = Array.isArray(rows) ? rows.map((n: any) => ({
        id: n.id?.toString() || `${Date.now()}`,
        title: n.title || 'Notification',
        message: n.message || '',
        date: n.date || '',
        type: n.type || 'system',
        status: n.status || 'sent',
        recipients: { tutors: true, students: true },
        read: !!n.read
      })) : []
      setNotifications(mapped)
    } catch (e) {
      console.error('Failed to fetch notifications:', e)
      setNotifications([])
    }
  }

  const fetchDepartmentsAndStats = async () => {
    try {
      const deptResp = await apiFetch<any>(`/api/query`, {
        method: 'POST',
        body: JSON.stringify({
          query: 'SELECT category as name, COUNT(*) as courses FROM subjects WHERE isActive = 1 GROUP BY category'
        })
      })
      const deptList = (deptResp && (deptResp as any).data) ? (deptResp as any).data : deptResp
      const departments = Array.isArray(deptList) ? deptList.map((d: any, i: number) => ({
        id: d.name?.toLowerCase().replace(/\s+/g, '-') || `dept-${i}`,
        name: d.name || `Department ${i+1}`,
        courses: Number(d.courses || 0),
        tutors: 0,
        students: 0,
        color: ['#4f46e5', '#059669', '#dc2626', '#7c3aed', '#ea580c'][i % 5]
      })) : []
      setDepartments(departments)

      const stats = await apiFetch<any>(`/api/admin/stats`)
      const s = (stats && (stats as any).data) ? (stats as any).data : stats
      setSystemStats({
        totalUsers: s?.totalUsers || 0,
        totalTutors: s?.tutors || 0,
        totalStudents: s?.students || 0,
        totalCourses: s?.courses || 0,
        totalDepartments: departments.length,
        activeUsers: Math.floor((s?.totalUsers || 0) * 0.8),
        systemUptime: '99.9%',
        lastBackup: new Date().toISOString()
      })
    } catch (e) {
      console.error('Failed to fetch departments/stats:', e)
      setDepartments([])
      setSystemStats({
        totalUsers: 0,
        totalTutors: 0,
        totalStudents: 0,
        totalCourses: 0,
        totalDepartments: 0,
        activeUsers: 0,
        systemUptime: '0%',
        lastBackup: new Date().toISOString()
      })
    }
  }

  useEffect(() => {
    // Load all admin data on mount
    fetchTutors()
    fetchStudents()
    fetchCourses()
    fetchNotifications()
    fetchDepartmentsAndStats()
  }, [])

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleTutorSelect = (tutorId: string) => {
    const tutor = tutors.find((t) => t.id === tutorId) || null
    setSelectedTutor(tutor)
  }

  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s) => s.id === studentId) || null
    setSelectedStudent(student)
  }

  const handleCourseSelect = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId) || null
    setSelectedCourse(course)
  }

  const handleCreateTutor = async () => {
    setIsCreatingTutor(true)

    try {
      // Create tutor via API
      const data: any = await apiFetch('/api/admin/content/tutors', {
        method: 'POST',
        body: JSON.stringify({
          name: newTutor.name,
          email: newTutor.email,
          department: newTutor.department,
          specialization: newTutor.specialization,
          subjects: [],
          contactName: newTutor.name,
          contactPhone: '',
          contactEmail: newTutor.email,
          description: `Tutor specializing in ${newTutor.specialization}`,
          ratings: []
        })
      })

      const newTutorData: Tutor = {
        id: data.id || `t-${Date.now()}`,
        name: newTutor.name,
        email: newTutor.email,
        role: "tutor",
        status: "active",
        department: newTutor.department,
        specialization: newTutor.specialization,
        courses: [],
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        students: 0,
      }

      setTutors((prev) => [...prev, newTutorData])
      
      // Update department stats
      setDepartments((prev) =>
        prev.map((dept) =>
          dept.name === newTutor.department ? { ...dept, tutors: dept.tutors + 1 } : dept
        )
      )
      
      // Notify tutor via email (invite/added)
      try {
        await apiFetch('/api/notifications', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Welcome to Excellence Academia',
            message: `${newTutor.name}, your tutor profile has been created in the ${newTutor.department} department. You can now log in and start setting up your courses.`,
            type: 'user',
            recipients: { tutors: false, students: false, specific: [newTutor.email] },
          })
        })
      } catch (e) { console.warn('Invite email failed:', e) }

      const notificationData: Notification = {
        id: `n-${Date.now()}`,
        title: "New Tutor Added",
        message: `${newTutor.name} has been added as a tutor in the ${newTutor.department} department.`,
        date: new Date().toISOString(),
        type: "system",
        status: "sent",
        recipients: {
          tutors: true,
          students: false,
        },
        read: false,
      }

      setNotifications((prev) => [notificationData, ...prev])

      setNewTutor({
        name: '',
        email: '',
        department: '',
        specialization: '',
      })

      console.log("Tutor created successfully")
    } catch (error) {
      console.error("Failed to create tutor", error)
    } finally {
      setIsCreatingTutor(false)
    }
  }

  const handleCreateCourse = async () => {
    setIsCreatingCourse(true)

    try {
      // Create course via API
      const data: any = await apiFetch('/api/courses', {
        method: 'POST',
        body: JSON.stringify({
          title: newCourse.name,
          description: newCourse.description,
          department: newCourse.department,
          tutorId: newCourse.tutorId,
          startDate: newCourse.startDate,
          endDate: newCourse.endDate,
          category: newCourse.department
        })
      })

      const colors = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]
      const randomColor = colors[Math.floor(Math.random() * colors.length)]

      const newCourseData: Course = {
        id: data.id || `c-${Date.now()}`,
        name: newCourse.name,
        description: newCourse.description,
        department: newCourse.department,
        tutorId: newCourse.tutorId,
        status: "active",
        students: 0,
        createdAt: new Date().toISOString(),
        startDate: newCourse.startDate,
        endDate: newCourse.endDate,
        color: randomColor,
      }

      setCourses((prev) => [...prev, newCourseData])
      
      // Update tutor's courses
      setTutors((prev) =>
        prev.map((tutor) =>
          tutor.id === newCourse.tutorId
            ? { ...tutor, courses: [...tutor.courses, newCourseData.id] }
            : tutor
        )
      )
      
      // Update department stats
      setDepartments((prev) =>
        prev.map((dept) =>
          dept.name === newCourse.department ? { ...dept, courses: dept.courses + 1 } : dept
        )
      )
      
      setNewCourse({
        name: "",
        description: "",
        department: "",
        tutorId: "",
        startDate: "",
        endDate: "",
      })

      // Create notification
      const notificationData: Notification = {
        id: `n-${Date.now()}`,
        title: "New Course Created",
        message: `A new course "${newCourse.name}" has been created in the ${newCourse.department} department.`,
        date: new Date().toISOString(),
        type: "course",
        status: "sent",
        recipients: {
          tutors: true,
          students: true,
          specific: [newCourse.tutorId],
        },
        read: false,
      }

      setNotifications((prev) => [notificationData, ...prev])

      console.log("Course created successfully")
    } catch (error) {
      console.error("Failed to create course", error)
    } finally {
      setIsCreatingCourse(false)
    }
  }

  const handleCreateDepartment = async () => {
    setIsCreatingDepartment(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newDepartmentData: Department = {
        id: `d-${Date.now()}`,
        name: newDepartment.name,
        courses: 0,
        tutors: 0,
        students: 0,
        color: newDepartment.color,
      }

      setDepartments((prev) => [...prev, newDepartmentData])
      setNewDepartment({
        name: "",
        color: "#4f46e5",
      })

      console.log("Department created successfully")
    } catch (error) {
      console.error("Failed to create department", error)
    } finally {
      setIsCreatingDepartment(false)
    }
  }

  const handleSendNotification = async () => {
    setIsSendingNotification(true)

    try {
      // Send notification via API
      const data: any = await apiFetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          recipients: newNotification.recipients
        })
      })

      const notificationData: Notification = {
        id: data.id || `n-${Date.now()}`,
        title: newNotification.title,
        message: newNotification.message,
        date: new Date().toISOString(),
        type: newNotification.type as "system" | "course" | "user" | "approval",
        status: "sent",
        recipients: {
          tutors: newNotification.recipients.tutors,
          students: newNotification.recipients.students,
          specific: newNotification.recipients.specific,
        },
        read: false,
      }

      setNotifications((prev) => [notificationData, ...prev])
      setNewNotification({
        title: "",
        message: "",
        type: "system",
        recipients: {
          tutors: false,
          students: false,
          specific: [],
        },
      })

      console.log("Notification sent successfully")
    } catch (error) {
      console.error("Failed to send notification", error)
    } finally {
      setIsSendingNotification(false)
    }
  }

  const handleApproveTutor = async (tutorId: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setTutors((prev) =>
        prev.map((tutor) => (tutor.id === tutorId ? { ...tutor, status: "active" } : tutor))
      )

      // Email the tutor
      const tutor = tutors.find((t) => t.id === tutorId)
      if (tutor) {
        try {
          await apiFetch('/api/notifications', {
            method: 'POST',
            body: JSON.stringify({
              title: 'Tutor Application Approved',
              message: `Hi ${tutor.name}, your application has been approved. Welcome aboard!`,
              type: 'approval',
              recipients: { tutors: false, students: false, specific: [tutor.email] },
            })
          })
        } catch (e) { console.warn('Approve email failed:', e) }

        const notificationData: Notification = {
          id: `n-${Date.now()}`,
          title: "Tutor Approved",
          message: `${tutor.name} has been approved as a tutor.`,
          date: new Date().toISOString(),
          type: "approval",
          status: "sent",
          recipients: {
            tutors: false,
            students: false,
            specific: [tutorId],
          },
          read: false,
        }

        setNotifications((prev) => [notificationData, ...prev])
      }

      console.log("Tutor approved successfully")
    } catch (error) {
      console.error("Failed to approve tutor", error)
    }
  }

  const handleRejectTutor = async (tutorId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      setTutors((prev) =>
        prev.map((tutor) => (tutor.id === tutorId ? { ...tutor, status: "rejected" } : tutor))
      )

      // Email the tutor
      const tutor = tutors.find((t) => t.id === tutorId)
      if (tutor) {
        try {
          await apiFetch('/api/notifications', {
            method: 'POST',
            body: JSON.stringify({
              title: 'Tutor Application Update',
              message: `Hi ${tutor.name}, we appreciate your interest. Unfortunately, your application was not approved at this time.`,
              type: 'approval',
              recipients: { tutors: false, students: false, specific: [tutor.email] },
            })
          })
        } catch (e) { console.warn('Reject email failed:', e) }

        const notificationData: Notification = {
          id: `n-${Date.now()}`,
          title: "Tutor Application Rejected",
          message: `${tutor.name}'s application to become a tutor has been rejected.`,
          date: new Date().toISOString(),
          type: "approval",
          status: "sent",
          recipients: {
            tutors: false,
            students: false,
            specific: [tutorId],
          },
          read: false,
        }

        setNotifications((prev) => [notificationData, ...prev])
      }

      console.log("Tutor rejected successfully")
    } catch (error) {
      console.error("Failed to reject tutor", error)
    }
  }

  const handleApproveStudent = async (studentId: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setStudents((prev) =>
        prev.map((student) => (student.id === studentId ? { ...student, status: "active" } : student))
      )

      // Create notification
      const student = students.find((s) => s.id === studentId)
      if (student) {
        const notificationData: Notification = {
          id: `n-${Date.now()}`,
          title: "Student Approved",
          message: `${student.name} has been approved as a student.`,
          date: new Date().toISOString(),
          type: "approval",
          status: "sent",
          recipients: {
            tutors: false,
            students: false,
            specific: [studentId],
          },
          read: false,
        }

        setNotifications((prev) => [notificationData, ...prev])
      }

      console.log("Student approved successfully")
    } catch (error) {
      console.error("Failed to approve student", error)
    }
  }

  const handleApproveCourse = async (courseId: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setCourses((prev) =>
        prev.map((course) => (course.id === courseId ? { ...course, status: "active" } : course))
      )

      // Create notification
      const course = courses.find((c) => c.id === courseId)
      if (course) {
        const notificationData: Notification = {
          id: `n-${Date.now()}`,
          title: "Course Approved",
          message: `The course "${course.name}" has been approved and is now active.`,
          date: new Date().toISOString(),
          type: "course",
          status: "sent",
          recipients: {
            tutors: true,
            students: true,
            specific: [course.tutorId],
          },
          read: false,
        }

        setNotifications((prev) => [notificationData, ...prev])
      }

      console.log("Course approved successfully")
    } catch (error) {
      console.error("Failed to approve course", error)
    }
  }

  const handleMarkNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification))
    )
  }

  const handleDeleteTutor = async (tutorId: string) => {
    try {
      // Delete tutor via API
      const res = await fetch(`/api/admin/content/tutors?id=${tutorId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

      const tutorToDelete = tutors.find((t) => t.id === tutorId)
      if (!tutorToDelete) return

      // Update courses to remove this tutor
      setCourses((prev) =>
        prev.map((course) =>
          course.tutorId === tutorId ? { ...course, status: "inactive", tutorId: "" } : course
        )
      )

      // Update department stats
      setDepartments((prev) =>
        prev.map((dept) =>
          dept.name === tutorToDelete.department ? { ...dept, tutors: Math.max(0, dept.tutors - 1) } : dept
        )
      )

      // Remove the tutor
      setTutors((prev) => prev.filter((tutor) => tutor.id !== tutorId))

      console.log("Tutor deleted successfully")
    } catch (error) {
      console.error("Failed to delete tutor", error)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    try {
      // Delete course via API
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

      const courseToDelete = courses.find((c) => c.id === courseId)
      if (!courseToDelete) return

      // Update students to remove this course
      setStudents((prev) =>
        prev.map((student) => ({
          ...student,
          enrolledCourses: student.enrolledCourses.filter((c) => c !== courseId),
        }))
      )

      // Update tutor's courses
      setTutors((prev) =>
        prev.map((tutor) => ({
          ...tutor,
          courses: tutor.courses.filter((c) => c !== courseId),
        }))
      )

      // Update department stats
      setDepartments((prev) =>
        prev.map((dept) =>
          dept.name === courseToDelete.department ? { ...dept, courses: Math.max(0, dept.courses - 1) } : dept
        )
      )

      // Remove the course
      setCourses((prev) => prev.filter((course) => course.id !== courseId))

      console.log("Course deleted successfully")
    } catch (error) {
      console.error("Failed to delete course", error)
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Remove the student
      setStudents((prev) => prev.filter((student) => student.id !== studentId))

      console.log("Student deleted successfully")
    } catch (error) {
      console.error("Failed to delete student", error)
    }
  }

  // Filtered data
  const filteredTutors = tutors.filter((tutor) => {
    const matchesSearch =
      tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutor.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus ? tutor.status === filterStatus : true
    const matchesDepartment = filterDepartment ? tutor.department === filterDepartment : true

    return matchesSearch && matchesStatus && matchesDepartment
  })

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus ? student.status === filterStatus : true

    return matchesSearch && matchesStatus
  })

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus ? course.status === filterStatus : true
    const matchesDepartment = filterDepartment ? course.department === filterDepartment : true

    return matchesSearch && matchesStatus && matchesDepartment
  })

  const pendingTutors = tutors.filter((tutor) => tutor.status === "pending")
  const pendingStudents = students.filter((student) => student.status === "pending")
  const pendingCourses = courses.filter((course) => course.status === "pending")

  // Render
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
              <Shield className={`h-6 w-6 text-indigo-600 ${!sidebarOpen && "mx-auto"}`} />
              {sidebarOpen && <span className="font-bold text-xl">Admin Panel</span>}
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
                onClick={() => setActiveTab("tutors")}
                className={`flex items-center ${
                  !sidebarOpen ? "justify-center" : "justify-start"
                } w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "tutors" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <User className="h-5 w-5 mr-2 flex-shrink-0" />
                {sidebarOpen && (
                  <div className="flex justify-between items-center w-full">
                    <span>Tutors</span>
                    {pendingTutors.length > 0 && (
                      <Badge className="bg-amber-500 text-white">{pendingTutors.length}</Badge>
                    )}
                  </div>
                )}
                {!sidebarOpen && pendingTutors.length > 0 && (
                  <Badge className="absolute top-0 right-0 -mt-1 -mr-1 bg-amber-500 text-white">
                    {pendingTutors.length}
                  </Badge>
                )}
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
                {sidebarOpen && (
                  <div className="flex justify-between items-center w-full">
                    <span>Students</span>
                    {pendingStudents.length > 0 && (
                      <Badge className="bg-amber-500 text-white">{pendingStudents.length}</Badge>
                    )}
                  </div>
                )}
                {!sidebarOpen && pendingStudents.length > 0 && (
                  <Badge className="absolute top-0 right-0 -mt-1 -mr-1 bg-amber-500 text-white">
                    {pendingStudents.length}
                  </Badge>
                )}
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
                {sidebarOpen && (
                  <div className="flex justify-between items-center w-full">
                    <span>Courses</span>
                    {pendingCourses.length > 0 && (
                      <Badge className="bg-amber-500 text-white">{pendingCourses.length}</Badge>
                    )}
                  </div>
                )}
                {!sidebarOpen && pendingCourses.length > 0 && (
                  <Badge className="absolute top-0 right-0 -mt-1 -mr-1 bg-amber-500 text-white">
                    {pendingCourses.length}
                  </Badge>
                )}
              </button>

              <button
                onClick={() => setActiveTab("departments")}
                className={`flex items-center ${
                  !sidebarOpen ? "justify-center" : "justify-start"
                } w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "departments" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Building className="h-5 w-5 mr-2 flex-shrink-0" />
                {sidebarOpen && <span>Departments</span>}
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

              <button
                onClick={() => setActiveTab("content")}
                className={`flex items-center ${
                  !sidebarOpen ? "justify-center" : "justify-start"
                } w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "content" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Layout className="h-5 w-5 mr-2 flex-shrink-0" />
                {sidebarOpen && <span>Content</span>}
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center ${
                  !sidebarOpen ? "justify-center" : "justify-start"
                } w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "settings" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Settings className="h-5 w-5 mr-2 flex-shrink-0" />
                {sidebarOpen && <span>Settings</span>}
              </button>
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
              <Shield className="h-6 w-6 text-indigo-600 mr-2" />
              <span className="font-bold text-xl">Admin Panel</span>
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
                    setActiveTab("tutors")
                    setMobileMenuOpen(false)
                  }}
                  className={`flex items-center justify-start w-full px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "tutors" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <User className="h-5 w-5 mr-2" />
                  <div className="flex justify-between items-center w-full">
                    <span>Tutors</span>
                    {pendingTutors.length > 0 && (
                      <Badge className="bg-amber-500 text-white">{pendingTutors.length}</Badge>
                    )}
                  </div>
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
                  <div className="flex justify-between items-center w-full">
                    <span>Students</span>
                    {pendingStudents.length > 0 && (
                      <Badge className="bg-amber-500 text-white">{pendingStudents.length}</Badge>
                    )}
                  </div>
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
                  <div className="flex justify-between items-center w-full">
                    <span>Courses</span>
                    {pendingCourses.length > 0 && (
                      <Badge className="bg-amber-500 text-white">{pendingCourses.length}</Badge>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("departments")
                    setMobileMenuOpen(false)
                  }}
                  className={`flex items-center justify-start w-full px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "departments" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Building className="h-5 w-5 mr-2" />
                  <span>Departments</span>
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

                <button
                  onClick={() => {
                    setActiveTab("settings")
                    setMobileMenuOpen(false)
                  }}
                  className={`flex items-center justify-start w-full px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "settings" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  <span>Settings</span>
                </button>
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
          <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(true)} className="lg:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
                <div>
                  <h2 className="text-lg font-semibold capitalize">{activeTab}</h2>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "dashboard" && "Overview of your teaching activities"}
                    {activeTab === "courses" && "Manage your courses and content"}
                    {activeTab === "students" && "Track student progress and enrollment"}
                    {activeTab === "tests" && "Create and manage assessments"}
                    {activeTab === "notifications" && "Communication and alerts"}
                    {activeTab === "analytics" && "Performance insights and metrics"}
                    {activeTab === "materials" && "Upload and organize course materials"}
                    {activeTab === "settings" && "Configure your preferences"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button size="sm" onClick={() => setInviteOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" /> Invite
                </Button>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="relative">
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                            {unreadCount}
                          </Badge>
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
          </header>
        </header>

          {/* Invite Dialog */}
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Send Invitations</DialogTitle>
                <DialogDescription>
                  Invite students or tutors by email. Separate multiple emails with commas or new lines.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant={inviteTarget === 'students' ? 'default' : 'outline'} onClick={() => setInviteTarget('students')}>Students</Button>
                  <Button variant={inviteTarget === 'tutors' ? 'default' : 'outline'} onClick={() => setInviteTarget('tutors')}>Tutors</Button>
                </div>
                <div className="space-y-2">
                  <Label>Emails</Label>
                  <Textarea value={inviteEmails} onChange={(e) => setInviteEmails(e.target.value)} placeholder="one@example.com, two@example.com" rows={3} />
                </div>
                {inviteTarget === 'students' && (
                  <>
                    <div className="space-y-2">
                      <Label>Course Name</Label>
                      <Input value={inviteCourseName} onChange={(e) => setInviteCourseName(e.target.value)} placeholder="e.g., Advanced Mathematics" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tutor Name</Label>
                      <Input value={inviteTutorName} onChange={(e) => setInviteTutorName(e.target.value)} placeholder="e.g., Ms. Smith" />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={inviteDepartment} onChange={(e) => setInviteDepartment(e.target.value)} placeholder="e.g., Mathematics" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                  <Button disabled={inviteSubmitting} onClick={async () => {
                    const emails = inviteEmails.split(/[,\n]/).map(e => e.trim()).filter(Boolean)
                    if (emails.length === 0) {
                      toast({ title: 'No emails', description: 'Please enter at least one email', variant: 'destructive' })
                      return
                    }
                    setInviteSubmitting(true)
                    try {
                      if (inviteTarget === 'students') {
                        const res = await apiFetch<any>('/api/admin/students/invite', {
                          method: 'POST',
                          body: JSON.stringify({ emails, courseName: inviteCourseName || undefined, tutorName: inviteTutorName || undefined, department: inviteDepartment || undefined })
                        })
                        const invited = Array.isArray(res?.invited) ? res.invited : []
                        const sent = invited.filter((x: any) => x.sent).length
                        toast({ title: 'Invitations sent', description: `${sent}/${emails.length} emails queued` })
                      } else {
                        const res = await apiFetch<any>('/api/admin/tutors/invite', {
                          method: 'POST',
                          body: JSON.stringify({ emails, tutorName: inviteTutorName || undefined, department: inviteDepartment || undefined })
                        })
                        const invited = Array.isArray(res?.invited) ? res.invited : []
                        const sent = invited.filter((x: any) => x.sent).length
                        toast({ title: 'Tutor invitations sent', description: `${sent}/${emails.length} emails queued` })
                      }
                      setInviteOpen(false)
                      setInviteEmails('')
                      setInviteCourseName('')
                      setInviteTutorName('')
                      setInviteDepartment('')
                    } catch (e: any) {
                      toast({ title: 'Failed to send invitations', description: e?.message || 'Try again later', variant: 'destructive' })
                    } finally {
                      setInviteSubmitting(false)
                    }
                  }}>{inviteSubmitting ? 'Sending...' : 'Send Invitations'}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
                      <p className="text-xs text-muted-foreground">
                        {systemStats.activeUsers} active ({Math.round((systemStats.activeUsers / systemStats.totalUsers) * 100)}%)
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
                      <div className="text-2xl font-bold">{systemStats.activeCourses}</div>
                      <p className="text-xs text-muted-foreground">
                        {departments.length} departments
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
                      <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                      <GraduationCap className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemStats.activeStudents}</div>
                      <p className="text-xs text-muted-foreground">
                        {pendingStudents.length} pending approval
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
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemStats.pendingApprovals}</div>
                      <p className="text-xs text-muted-foreground">
                        Tutors, students, and courses
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Department Overview */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Department Overview</CardTitle>
                    <CardDescription>Statistics across all departments</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("departments")}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departments.map((department) => (
                      <div key={department.id} className="flex items-center">
                        <div className="h-3 w-3 rounded-full mr-3" style={{ backgroundColor: department.color }} />
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-medium truncate">{department.name}</p>
                            <p className="text-sm text-muted-foreground">{department.students} students</p>
                          </div>
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{department.courses} courses</span>
                            <span>{department.tutors} tutors</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pending Approvals and Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pending Approvals */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Pending Approvals</CardTitle>
                    <CardDescription>Items waiting for your approval</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingTutors.length === 0 && pendingStudents.length === 0 && pendingCourses.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">No pending approvals</div>
                    ) : (
                      <div className="space-y-4">
                        {pendingTutors.slice(0, 2).map((tutor) => (
                          <div
                            key={tutor.id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Tutor</Badge>
                                <h3 className="font-medium">{tutor.name}</h3>
                              </div>
                              <p className="text-sm text-muted-foreground">{tutor.email}</p>
                              <div className="flex items-center gap-2 mt-1 text-sm">
                                <span>{tutor.department}</span>
                                <span>•</span>
                                <span>{tutor.specialization}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleApproveTutor(tutor.id)}>
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleRejectTutor(tutor.id)}>
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}

                        {pendingStudents.slice(0, 2).map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Student</Badge>
                                <h3 className="font-medium">{student.name}</h3>
                              </div>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                              <div className="flex items-center gap-2 mt-1 text-sm">
                                <span>Registered: {new Date(student.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleApproveStudent(student.id)}>
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteStudent(student.id)}>
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}

                        {pendingCourses.slice(0, 2).map((course) => (
                          <div
                            key={course.id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Course</Badge>
                                <h3 className="font-medium">{course.name}</h3>
                              </div>
                              <p className="text-sm text-muted-foreground">{course.description}</p>
                              <div className="flex items-center gap-2 mt-1 text-sm">
                                <span>{course.department}</span>
                                <span>•</span>
                                <span>Tutor: {tutors.find(t => t.id === course.tutorId)?.name || "Unknown"}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleApproveCourse(course.id)}>
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteCourse(course.id)}>
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}

                        {systemStats.pendingApprovals > 4 && (
                          <Button variant="link" className="w-full" onClick={() => setActiveTab("tutors")}>
                            View All Pending Approvals
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
                    <CardDescription>Common administrative tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-start" variant="outline">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add New Tutor
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Tutor</DialogTitle>
                          <DialogDescription>
                            Create a new tutor account. They will receive an email with login instructions.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="tutor-name">Full Name</Label>
                            <Input
                              id="tutor-name"
                              placeholder="e.g., Dr. Jane Smith"
                              value={newTutor.name}
                              onChange={(e) => setNewTutor({ ...newTutor, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tutor-email">Email</Label>
                            <Input
                              id="tutor-email"
                              type="email"
                              placeholder="e.g., jane.smith@university.edu"
                              value={newTutor.email}
                              onChange={(e) => setNewTutor({ ...newTutor, email: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="tutor-department">Department</Label>
                              <Select
                                onValueChange={(value) => setNewTutor({ ...newTutor, department: value })}
                                value={newTutor.department}
                              >
                                <SelectTrigger id="tutor-department">
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.name}>
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tutor-specialization">Specialization</Label>
                              <Input
                                id="tutor-specialization"
                                placeholder="e.g., Quantum Physics"
                                value={newTutor.specialization}
                                onChange={(e) => setNewTutor({ ...newTutor, specialization: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateTutor} disabled={isCreatingTutor || !newTutor.name.trim() || !newTutor.email.trim() || !newTutor.department || !newTutor.specialization.trim()}>
                            {isCreatingTutor ? "Creating..." : "Create Tutor"}
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
                            Create a new course and assign it to a tutor.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="course-name">Course Name</Label>
                            <Input
                              id="course-name"
                              placeholder="e.g., Advanced Physics"
                              value={newCourse.name}
                              onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="course-description">Description</Label>
                            <Textarea
                              id="course-description"
                              placeholder="Brief description of the course"
                              rows={3}
                              value={newCourse.description}
                              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="course-department">Department</Label>
                              <Select
                                onValueChange={(value) => setNewCourse({ ...newCourse, department: value })}
                                value={newCourse.department}
                              >
                                <SelectTrigger id="course-department">
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.name}>
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="course-tutor">Tutor</Label>
                              <Select
                                onValueChange={(value) => setNewCourse({ ...newCourse, tutorId: value })}
                                value={newCourse.tutorId}
                              >
                                <SelectTrigger id="course-tutor">
                                  <SelectValue placeholder="Select tutor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {tutors
                                    .filter((tutor) => tutor.status === "active" && (!newCourse.department || tutor.department === newCourse.department))
                                    .map((tutor) => (
                                      <SelectItem key={tutor.id} value={tutor.id}>
                                        {tutor.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="course-start">Start Date</Label>
                              <Input
                                id="course-start"
                                type="date"
                                value={newCourse.startDate}
                                onChange={(e) => setNewCourse({ ...newCourse, startDate: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="course-end">End Date</Label>
                              <Input
                                id="course-end"
                                type="date"
                                value={newCourse.endDate}
                                onChange={(e) => setNewCourse({ ...newCourse, endDate: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateCourse} disabled={isCreatingCourse || !newCourse.name.trim() || !newCourse.description.trim() || !newCourse.department || !newCourse.tutorId || !newCourse.startDate || !newCourse.endDate}>
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
                            Send a notification to tutors, students, or specific users.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="notification-title">Title</Label>
                            <Input
                              id="notification-title"
                              placeholder="e.g., System Maintenance"
                              value={newNotification.title}
                              onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                            />
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
                          <div className="space-y-2">
                            <Label htmlFor="notification-type">Type</Label>
                            <Select
                              onValueChange={(value) => setNewNotification({ ...newNotification, type: value })}
                              value={newNotification.type}
                            >
                              <SelectTrigger id="notification-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="system">System</SelectItem>
                                <SelectItem value="course">Course</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Recipients</Label>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="recipients-tutors"
                                  checked={newNotification.recipients.tutors}
                                  onCheckedChange={(checked) =>
                                    setNewNotification({
                                      ...newNotification,
                                      recipients: {
                                        ...newNotification.recipients,
                                        tutors: checked as boolean,
                                      },
                                    })
                                  }
                                />
                                <Label htmlFor="recipients-tutors">All Tutors</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="recipients-students"
                                  checked={newNotification.recipients.students}
                                  onCheckedChange={(checked) =>
                                    setNewNotification({
                                      ...newNotification,
                                      recipients: {
                                        ...newNotification.recipients,
                                        students: checked as boolean,
                                      },
                                    })
                                  }
                                />
                                <Label htmlFor="recipients-students">All Students</Label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={handleSendNotification}
                            disabled={
                              isSendingNotification ||
                              !newNotification.title.trim() ||
                              !newNotification.message.trim() ||
                              (!newNotification.recipients.tutors && !newNotification.recipients.students && !newNotification.recipients.specific.length)
                            }
                          >
                            {isSendingNotification ? "Sending..." : "Send Notification"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-start" variant="outline">
                          <Building className="h-4 w-4 mr-2" />
                          Add Department
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Department</DialogTitle>
                          <DialogDescription>
                            Create a new academic department.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="department-name">Department Name</Label>
                            <Input
                              id="department-name"
                              placeholder="e.g., Computer Science"
                              value={newDepartment.name}
                              onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="department-color">Department Color</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="department-color"
                                type="color"
                                className="w-12 h-8 p-1"
                                value={newDepartment.color}
                                onChange={(e) => setNewDepartment({ ...newDepartment, color: e.target.value })}
                              />
                              <div
                                className="w-8 h-8 rounded-full"
                                style={{ backgroundColor: newDepartment.color }}
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateDepartment} disabled={isCreatingDepartment || !newDepartment.name.trim()}>
                            {isCreatingDepartment ? "Creating..." : "Create Department"}
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
                    <CardDescription>Latest system notifications and alerts</CardDescription>
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
                          <div>
                            <h3 className="font-medium">{notification.title}</h3>
                            <p className="text-sm">{notification.message}</p>
                          </div>
                          <Badge variant={notification.read ? "outline" : "default"} className="ml-2">
                            {notification.read ? "Read" : "New"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{new Date(notification.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {notification.type}
                          </Badge>
                          <span>•</span>
                          <span>
                            To: {notification.recipients.tutors && notification.recipients.students
                              ? "All Users"
                              : notification.recipients.tutors
                                ? "All Tutors"
                                : notification.recipients.students
                                  ? "All Students"
                                  : "Specific Users"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tutors Tab */}
          {activeTab === "tutors" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-2xl font-bold">Tutors Management</h2>
                <div className="flex flex-col md:flex-row gap-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" /> Add Tutor
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Tutor</DialogTitle>
                        <DialogDescription>
                          Create a new tutor account. They will receive an email with login instructions.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="tutor-name">Full Name</Label>
                          <Input
                            id="tutor-name"
                            placeholder="e.g., Dr. Jane Smith"
                            value={newTutor.name}
                            onChange={(e) => setNewTutor({ ...newTutor, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tutor-email">Email</Label>
                          <Input
                            id="tutor-email"
                            type="email"
                            placeholder="e.g., jane.smith@university.edu"
                            value={newTutor.email}
                            onChange={(e) => setNewTutor({ ...newTutor, email: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="tutor-department">Department</Label>
                            <Select
                              onValueChange={(value) => setNewTutor({ ...newTutor, department: value })}
                              value={newTutor.department}
                            >
                              <SelectTrigger id="tutor-department">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.name}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tutor-specialization">Specialization</Label>
                            <Input
                              id="tutor-specialization"
                              placeholder="e.g., Quantum Physics"
                              value={newTutor.specialization}
                              onChange={(e) => setNewTutor({ ...newTutor, specialization: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateTutor} disabled={isCreatingTutor || !newTutor.name.trim() || !newTutor.email.trim() || !newTutor.department || !newTutor.specialization.trim()}>
                          {isCreatingTutor ? "Creating..." : "Create Tutor"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <div className="flex gap-2">
                    <Select onValueChange={(value) => setFilterDepartment(value === "all" ? null : value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
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
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Tutor Management</CardTitle>
                  <CardDescription>View and manage all tutors across departments</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Courses</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTutors.map((tutor) => (
                        <TableRow key={tutor.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                  {tutor.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {tutor.name}
                            </div>
                          </TableCell>
                          <TableCell>{tutor.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    departments.find((d) => d.name === tutor.department)?.color || "#ccc",
                                }}
                              />
                              {tutor.department}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                tutor.status === "active"
                                  ? "default"
                                  : tutor.status === "pending"
                                    ? "outline"
                                    : "secondary"
                              }
                              className={
                                tutor.status === "active"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : tutor.status === "pending"
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                    : tutor.status === "rejected"
                                      ? "bg-red-100 text-red-800 hover:bg-red-100"
                                      : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                              }
                            >
                              {tutor.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{tutor.courses?.length ?? 0}</TableCell>
                          <TableCell>{tutor.students || 0}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {tutor.status === "pending" && (
                                <>
                                  <Button size="sm" onClick={() => handleApproveTutor(tutor.id)}>
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRejectTutor(tutor.id)}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button variant="outline" size="sm" onClick={() => handleTutorSelect(tutor.id)}>
                                View
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleTutorSelect(tutor.id)}>
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                  <DropdownMenuItem>Send Message</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDeleteTutor(tutor.id)}
                                  >
                                    Delete Tutor
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {filteredTutors.length === 0 && (
                    <div className="text-center py-12">
                      <User className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No tutors found</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {searchTerm || filterDepartment || filterStatus
                          ? "Try adjusting your filters"
                          : "Add a tutor to get started"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === "students" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-2xl font-bold">Students Management</h2>
                <div className="flex gap-2">
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

              <Card>
                <CardHeader>
                  <CardTitle>Student Management</CardTitle>
                  <CardDescription>View and manage all students</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enrolled Courses</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-green-100 text-green-600">
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
                          <TableCell>{student.enrolledCourses?.length ?? 0}</TableCell>
                          <TableCell>
                            {student.progress !== undefined ? (
                              <div className="flex items-center gap-2">
                                <Progress value={student.progress} className="h-2 w-20" />
                                <span className="text-xs">{student.progress}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>{new Date(student.createdAt).toLocaleDateString()}</TableCell>
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
                                  <DropdownMenuItem onClick={() => handleStudentSelect(student.id)}>
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                  <DropdownMenuItem>Send Message</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDeleteStudent(student.id)}
                                  >
                                    Delete Student
                                  </DropdownMenuItem>
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
                        {searchTerm || filterStatus
                          ? "Try adjusting your filters"
                          : "No students registered yet"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Content Management Tab */}
          {activeTab === "content" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-2xl font-bold">Content Management</h2>
              </div>
              <ContentManagement />
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === "courses" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-2xl font-bold">Courses Management</h2>
                <div className="flex flex-col md:flex-row gap-4">
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
                          Create a new course and assign it to a tutor.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="course-name">Course Name</Label>
                          <Input
                            id="course-name"
                            placeholder="e.g., Advanced Physics"
                            value={newCourse.name}
                            onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="course-description">Description</Label>
                          <Textarea
                            id="course-description"
                            placeholder="Brief description of the course"
                            rows={3}
                            value={newCourse.description}
                            onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="course-department">Department</Label>
                            <Select
                              onValueChange={(value) => setNewCourse({ ...newCourse, department: value })}
                              value={newCourse.department}
                            >
                              <SelectTrigger id="course-department">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.name}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="course-tutor">Tutor</Label>
                            <Select
                              onValueChange={(value) => setNewCourse({ ...newCourse, tutorId: value })}
                              value={newCourse.tutorId}
                            >
                              <SelectTrigger id="course-tutor">
                                <SelectValue placeholder="Select tutor" />
                              </SelectTrigger>
                              <SelectContent>
                                {tutors
                                  .filter((tutor) => tutor.status === "active" && (!newCourse.department || tutor.department === newCourse.department))
                                  .map((tutor) => (
                                    <SelectItem key={tutor.id} value={tutor.id}>
                                      {tutor.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="course-start">Start Date</Label>
                            <Input
                              id="course-start"
                              type="date"
                              value={newCourse.startDate}
                              onChange={(e) => setNewCourse({ ...newCourse, startDate: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="course-end">End Date</Label>
                            <Input
                              id="course-end"
                              type="date"
                              value={newCourse.endDate}
                              onChange={(e) => setNewCourse({ ...newCourse, endDate: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateCourse} disabled={isCreatingCourse || !newCourse.name.trim() || !newCourse.description.trim() || !newCourse.department || !newCourse.tutorId || !newCourse.startDate || !newCourse.endDate}>
                          {isCreatingCourse ? "Creating..." : "Create Course"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <div className="flex gap-2">
                    <Select onValueChange={(value) => setFilterDepartment(value === "all" ? null : value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
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
                  <CardTitle>Course Management</CardTitle>
                  <CardDescription>View and manage all courses</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Tutor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses.map((course) => {
                        const tutor = tutors.find((t) => t.id === course.tutorId)
                        return (
                          <TableRow key={course.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: course.color }}
                                />
                                {course.name}
                              </div>
                            </TableCell>
                            <TableCell>{course.department}</TableCell>
                            <TableCell>
                              {tutor ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs">
                                      {tutor.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{tutor.name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  course.status === "active"
                                    ? "default"
                                    : course.status === "pending"
                                      ? "outline"
                                      : "secondary"
                                }
                                className={
                                  course.status === "active"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : course.status === "pending"
                                      ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                      : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                }
                              >
                                {course.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{course.students}</TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <div>{new Date(course.startDate).toLocaleDateString()}</div>
                                <div>to {new Date(course.endDate).toLocaleDateString()}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {course.status === "pending" && (
                                  <Button size="sm" onClick={() => handleApproveCourse(course.id)}>
                                    Approve
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={() => handleCourseSelect(course.id)}>
                                  View
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleCourseSelect(course.id)}>
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>Edit Course</DropdownMenuItem>
                                    <DropdownMenuItem>Manage Students</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleDeleteCourse(course.id)}
                                    >
                                      Delete Course
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  {filteredCourses.length === 0 && (
                    <div className="text-center py-12">
                      <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No courses found</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {searchTerm || filterDepartment || filterStatus
                          ? "Try adjusting your filters"
                          : "Create a course to get started"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Departments Tab */}
          {activeTab === "departments" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Departments</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Department
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Department</DialogTitle>
                      <DialogDescription>
                        Create a new academic department.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="department-name">Department Name</Label>
                        <Input
                          id="department-name"
                          placeholder="e.g., Computer Science"
                          value={newDepartment.name}
                          onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department-color">Department Color</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="department-color"
                            type="color"
                            className="w-12 h-8 p-1"
                            value={newDepartment.color}
                            onChange={(e) => setNewDepartment({ ...newDepartment, color: e.target.value })}
                          />
                          <div
                            className="w-8 h-8 rounded-full"
                            style={{ backgroundColor: newDepartment.color }}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateDepartment} disabled={isCreatingDepartment || !newDepartment.name.trim()}>
                        {isCreatingDepartment ? "Creating..." : "Create Department"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((department) => (
                  <Card key={department.id} className="border-t-4" style={{ borderTopColor: department.color }}>
                    <CardHeader>
                      <CardTitle>{department.name}</CardTitle>
                      <CardDescription>Department Statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold">{department.courses}</p>
                            <p className="text-xs text-muted-foreground">Courses</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{department.tutors}</p>
                            <p className="text-xs text-muted-foreground">Tutors</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{department.students}</p>
                            <p className="text-xs text-muted-foreground">Students</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Department</DropdownMenuItem>
                          <DropdownMenuItem>View Courses</DropdownMenuItem>
                          <DropdownMenuItem>View Tutors</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Delete Department</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardFooter>
                  </Card>
                ))}
              </div>
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
                        Send a notification to tutors, students, or specific users.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="notification-title">Title</Label>
                        <Input
                          id="notification-title"
                          placeholder="e.g., System Maintenance"
                          value={newNotification.title}
                          onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                        />
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
                      <div className="space-y-2">
                        <Label htmlFor="notification-type">Type</Label>
                        <Select
                          onValueChange={(value) => setNewNotification({ ...newNotification, type: value })}
                          value={newNotification.type}
                        >
                          <SelectTrigger id="notification-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system">System</SelectItem>
                            <SelectItem value="course">Course</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Recipients</Label>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="recipients-tutors"
                              checked={newNotification.recipients.tutors}
                              onCheckedChange={(checked) =>
                                setNewNotification({
                                  ...newNotification,
                                  recipients: {
                                    ...newNotification.recipients,
                                    tutors: checked as boolean,
                                  },
                                })
                              }
                            />
                            <Label htmlFor="recipients-tutors">All Tutors</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="recipients-students"
                              checked={newNotification.recipients.students}
                              onCheckedChange={(checked) =>
                                setNewNotification({
                                  ...newNotification,
                                  recipients: {
                                    ...newNotification.recipients,
                                    students: checked as boolean,
                                  },
                                })
                              }
                            />
                            <Label htmlFor="recipients-students">All Students</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleSendNotification}
                        disabled={
                          isSendingNotification ||
                          !newNotification.title.trim() ||
                          !newNotification.message.trim() ||
                          (!newNotification.recipients.tutors && !newNotification.recipients.students && !newNotification.recipients.specific.length)
                        }
                      >
                        {isSendingNotification ? "Sending..." : "Send Notification"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="system">System</TabsTrigger>
                  <TabsTrigger value="course">Course</TabsTrigger>
                  <TabsTrigger value="approval">Approvals</TabsTrigger>
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
                                <h3 className="font-medium">{notification.title}</h3>
                                <p className="text-sm mt-1">{notification.message}</p>
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                  <Badge
                                    variant="outline"
                                    className={
                                      notification.type === "system"
                                        ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-100"
                                        : notification.type === "course"
                                          ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                          : notification.type === "approval"
                                            ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                            : "bg-green-100 text-green-800 hover:bg-green-100"
                                    }
                                  >
                                    {notification.type}
                                  </Badge>
                                  <span>{new Date(notification.date).toLocaleString()}</span>
                                  <span>•</span>
                                  <span>
                                    To: {notification.recipients.tutors && notification.recipients.students
                                      ? "All Users"
                                      : notification.recipients.tutors
                                        ? "All Tutors"
                                        : notification.recipients.students
                                          ? "All Students"
                                          : "Specific Users"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
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
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>Resend</DropdownMenuItem>
                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
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

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">System Settings</h2>

              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure system-wide settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Allow User Registration</h3>
                        <p className="text-sm text-muted-foreground">
                          Enable or disable new user registrations
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Require Email Verification</h3>
                        <p className="text-sm text-muted-foreground">
                          Require users to verify their email before accessing the platform
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Auto-Approve Tutors</h3>
                        <p className="text-sm text-muted-foreground">
                          Automatically approve new tutor registrations
                        </p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Auto-Approve Students</h3>
                        <p className="text-sm text-muted-foreground">
                          Automatically approve new student registrations
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">System Email</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email-from">From Email</Label>
                        <Input id="email-from" defaultValue="noreply@university.edu" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-name">From Name</Label>
                        <Input id="email-name" defaultValue="University Learning Platform" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Maintenance Mode</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Enable maintenance mode to prevent users from accessing the platform
                        </p>
                      </div>
                      <Switch />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maintenance-message">Maintenance Message</Label>
                      <Textarea
                        id="maintenance-message"
                        defaultValue="The system is currently undergoing scheduled maintenance. Please check back later."
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Settings</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Backup</CardTitle>
                  <CardDescription>Manage system backups and data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Automatic Backups</h3>
                      <p className="text-sm text-muted-foreground">
                        Create automatic backups of the system data
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backup-frequency">Backup Frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger id="backup-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backup-retention">Backup Retention (days)</Label>
                    <Input id="backup-retention" type="number" defaultValue="30" />
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Create Backup Now
                    </Button>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download Latest Backup
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Tutor Detail Dialog */}
      {selectedTutor && (
        <Dialog open={!!selectedTutor} onOpenChange={() => setSelectedTutor(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-indigo-100 text-indigo-600">
                    {selectedTutor.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <DialogTitle>{selectedTutor.name}</DialogTitle>
              </div>
              <DialogDescription>{selectedTutor.email}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Tabs defaultValue="overview">
                <div className="w-full overflow-x-auto">
                  <TabsList className="flex min-w-max gap-2">
                    <TabsTrigger className="whitespace-nowrap" value="overview">Overview</TabsTrigger>
                    <TabsTrigger className="whitespace-nowrap" value="courses">Courses</TabsTrigger>
                    <TabsTrigger className="whitespace-nowrap" value="students">Students</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Tutor Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Department:</span>
                        <span>{selectedTutor.department}</span>
                        <span className="text-muted-foreground">Specialization:</span>
                        <span>{selectedTutor.specialization}</span>
                        <span className="text-muted-foreground">Status:</span>
                        <Badge
                          variant={
                            selectedTutor.status === "active"
                              ? "default"
                              : selectedTutor.status === "pending"
                                ? "outline"
                                : "secondary"
                          }
                          className={
                            selectedTutor.status === "active"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : selectedTutor.status === "pending"
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                : selectedTutor.status === "rejected"
                                  ? "bg-red-100 text-red-800 hover:bg-red-100"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {selectedTutor.status}
                        </Badge>
                        <span className="text-muted-foreground">Joined:</span>
                        <span>{new Date(selectedTutor.createdAt).toLocaleDateString()}</span>
                        <span className="text-muted-foreground">Last Active:</span>
                        <span>
                          {selectedTutor.lastActive
                            ? new Date(selectedTutor.lastActive).toLocaleString()
                            : "Never"}
                        </span>
                        {selectedTutor.rating && (
                          <>
                            <span className="text-muted-foreground">Rating:</span>
                            <span>{selectedTutor.rating} / 5</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">Stats</h3>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{selectedTutor.courses?.length ?? 0}</div>
                            <p className="text-xs text-muted-foreground">Courses</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{selectedTutor.students || 0}</div>
                            <p className="text-xs text-muted-foreground">Students</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="courses" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Assigned Courses</h3>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Assign Course
                      </Button>
                    </div>
                    {(selectedTutor.courses?.length ?? 0) === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">No courses assigned</div>
                    ) : (
                      <div className="space-y-2">
                        {courses
                          .filter((course) => (selectedTutor.courses || []).includes(course.id))
                          .map((course) => (
                            <div
                              key={course.id}
                              className="flex justify-between items-center p-4 border rounded-md bg-white shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: course.color }}
                                />
                                <div>
                                  <h4 className="font-medium">{course.name}</h4>
                                  <p className="text-sm text-muted-foreground">{course.department}</p>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    <Badge
                                      variant={
                                        course.status === "active"
                                          ? "default"
                                          : course.status === "pending"
                                            ? "outline"
                                            : "secondary"
                                      }
                                      className={
                                        course.status === "active"
                                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                                          : course.status === "pending"
                                            ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                      }
                                    >
                                      {course.status}
                                    </Badge>
                                    <span>{course.students} students</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleCourseSelect(course.id)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="students" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">Students</h3>
                    {selectedTutor.students === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">No students enrolled</div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-muted-foreground">
                          This tutor has {selectedTutor.students} students across {selectedTutor.courses?.length ?? 0} courses.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTutor(null)}>
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
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-green-100 text-green-600">
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
                  <TabsTrigger value="grades">Grades</TabsTrigger>
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
                        <span className="text-muted-foreground">Joined:</span>
                        <span>{new Date(selectedStudent.createdAt).toLocaleDateString()}</span>
                        <span className="text-muted-foreground">Last Active:</span>
                        <span>
                          {selectedStudent.lastActive
                            ? new Date(selectedStudent.lastActive).toLocaleString()
                            : "Never"}
                        </span>
                        {selectedStudent.progress !== undefined && (
                          <>
                            <span className="text-muted-foreground">Progress:</span>
                            <div className="flex items-center gap-2">
                              <Progress value={selectedStudent.progress} className="h-2 w-20" />
                              <span>{selectedStudent.progress}%</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">Stats</h3>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{selectedStudent.enrolledCourses?.length ?? 0}</div>
                            <p className="text-xs text-muted-foreground">Enrolled Courses</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{selectedStudent.grade || "N/A"}</div>
                            <p className="text-xs text-muted-foreground">Average Grade</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="courses" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Enrolled Courses</h3>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Enroll in Course
                      </Button>
                    </div>
                    {(selectedStudent.enrolledCourses?.length ?? 0) === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">Not enrolled in any courses</div>
                    ) : (
                      <div className="space-y-2">
                        {courses
                          .filter((course) => (selectedStudent.enrolledCourses || []).includes(course.id))
                          .map((course) => (
                            <div
                              key={course.id}
                              className="flex justify-between items-center p-4 border rounded-md bg-white shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: course.color }}
                                />
                                <div>
                                  <h4 className="font-medium">{course.name}</h4>
                                  <p className="text-sm text-muted-foreground">{course.department}</p>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    <span>Tutor: {tutors.find((t) => t.id === course.tutorId)?.name || "Unassigned"}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleCourseSelect(course.id)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="grades" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">Grades</h3>
                    {(selectedStudent.enrolledCourses?.length ?? 0) === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">No grades available</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Course</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Tutor</TableHead>
                            <TableHead className="text-right">Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {courses
                            .filter((course) => (selectedStudent.enrolledCourses || []).includes(course.id))
                            .map((course) => (
                              <TableRow key={course.id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="h-3 w-3 rounded-full"
                                      style={{ backgroundColor: course.color }}
                                    />
                                    {course.name}
                                  </div>
                                </TableCell>
                                <TableCell>{course.department}</TableCell>
                                <TableCell>{tutors.find((t) => t.id === course.tutorId)?.name || "Unassigned"}</TableCell>
                                <TableCell className="text-right">
                                  {selectedStudent.grade ? (
                                    <Badge
                                      className={
                                        selectedStudent.grade >= 90
                                          ? "bg-green-100 text-green-800"
                                          : selectedStudent.grade >= 80
                                            ? "bg-blue-100 text-blue-800"
                                            : selectedStudent.grade >= 70
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-red-100 text-red-800"
                                      }
                                    >
                                      {selectedStudent.grade}%
                                    </Badge>
                                  ) : (
                                    "N/A"
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
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
                  <TabsTrigger value="students">Students</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Course Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Department:</span>
                        <span>{selectedCourse.department}</span>
                        <span className="text-muted-foreground">Tutor:</span>
                        <span>{tutors.find((t) => t.id === selectedCourse.tutorId)?.name || "Unassigned"}</span>
                        <span className="text-muted-foreground">Status:</span>
                        <Badge
                          variant={
                            selectedCourse.status === "active"
                              ? "default"
                              : selectedCourse.status === "pending"
                                ? "outline"
                                : "secondary"
                          }
                          className={
                            selectedCourse.status === "active"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : selectedCourse.status === "pending"
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {selectedCourse.status}
                        </Badge>
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(selectedCourse.createdAt).toLocaleDateString()}</span>
                        <span className="text-muted-foreground">Start Date:</span>
                        <span>{new Date(selectedCourse.startDate).toLocaleDateString()}</span>
                        <span className="text-muted-foreground">End Date:</span>
                        <span>{new Date(selectedCourse.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">Stats</h3>
                      <div className="grid grid-cols-1 gap-4 text-center">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{selectedCourse.students}</div>
                            <p className="text-xs text-muted-foreground">Enrolled Students</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="students" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Enrolled Students</h3>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Add Student
                      </Button>
                    </div>
                    {selectedCourse.students === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">No students enrolled</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students
                            .filter((student) => student.enrolledCourses.includes(selectedCourse.id))
                            .map((student) => (
                              <TableRow key={student.id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-green-100 text-green-600">
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
                                  {student.progress !== undefined ? (
                                    <div className="flex items-center gap-2">
                                      <Progress value={student.progress} className="h-2 w-20" />
                                      <span className="text-xs">{student.progress}%</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="outline" size="sm" onClick={() => handleStudentSelect(student.id)}>
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="schedule" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">Course Schedule</h3>
                    <div className="text-center py-6 text-muted-foreground">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No schedule available</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Course schedule has not been set up yet
                      </p>
                    </div>
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
    </div>
  )
}