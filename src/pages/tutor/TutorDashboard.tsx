"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { apiFetch } from "@/lib/api"
import { Loading } from "@/components/ui/loading"
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  Bell,
  BarChart3,
  Settings,
  Menu,
  X,
  Plus,
  Target,
  Award,
  CheckCircle,
  AlertCircle,
  Eye,
  Check,
  Upload,
  Trash2,
  MoreHorizontal,
  Download,
  UserPlus,
} from "lucide-react"

// Import page components
import AnalyticsDashboardPage from "./analytics-dashboard"
import CourseManagementPage from "./course-management"
import StudentManagementPage from "./student-management"
import TestManagementPage from "./test-management"
import NotificationSystemPage from "./notification-system"
import FileUploadPage from "./file-upload"

// Types
interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  department: string
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
  category: string
  duration: string
  level: "Beginner" | "Intermediate" | "Advanced"
  rating: number
  totalLessons: number
  completedLessons: number
}

interface Student {
  id: string
  name: string
  email: string
  progress: number
  lastActivity: string
  status: "active" | "inactive" | "pending"
  enrolledCourses: string[]
  joinDate: string
  totalAssignments: number
  completedAssignments: number
  avatar?: string
}

interface Test {
  id: string
  title: string
  description: string
  courseId: string
  dueDate: string
  status: "draft" | "published" | "closed"
  questions: Question[]
  totalPoints: number
  submissions: number
  averageScore: number
}

interface Question {
  id: string
  text: string
  type: "multiple-choice" | "true-false" | "short-answer" | "essay"
  options?: string[]
  correctAnswer: string
  points: number
  explanation?: string
}

interface Material {
  id: string
  name: string
  type: string
  uploadDate: string
  size?: number
  url?: string
}

interface Notification {
  id: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  timestamp: string
  priority: "low" | "medium" | "high"
}

interface Analytics {
  totalStudents: number
  activeStudents: number
  totalCourses: number
  completionRate: number
  averageGrade: number
  monthlyGrowth: number
}

// Mock data (used as graceful fallback)
const mockCourses: Course[] = [
  {
    id: "course-1",
    name: "Advanced Mathematics",
    description: "Comprehensive course covering calculus, algebra, and statistics",
    students: 24,
    nextSession: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 75,
    materials: [
      {
        id: "mat-1",
        name: "Calculus Fundamentals.pdf",
        type: "pdf",
        uploadDate: new Date().toISOString(),
        size: 2048000,
      },
      {
        id: "mat-2",
        name: "Practice Problems.docx",
        type: "document",
        uploadDate: new Date().toISOString(),
        size: 1024000,
      },
    ],
    tests: [
      {
        id: "test-1",
        title: "Midterm Exam",
        description: "Comprehensive midterm covering chapters 1-5",
        courseId: "course-1",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "published",
        questions: [
          {
            id: "q1",
            text: "What is the derivative of x²?",
            type: "multiple-choice",
            options: ["2x", "x", "2", "x²"],
            correctAnswer: "2x",
            points: 10,
            explanation: "Using the power rule: d/dx(x²) = 2x",
          },
        ],
        totalPoints: 100,
        submissions: 18,
        averageScore: 85.5,
      },
    ],
    color: "#be123c",
    category: "Mathematics",
    duration: "12 weeks",
    level: "Advanced",
    rating: 4.8,
    totalLessons: 24,
    completedLessons: 18,
  },
  {
    id: "course-2",
    name: "Introduction to Physics",
    description: "Basic physics concepts including mechanics and thermodynamics",
    students: 18,
    nextSession: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 60,
    materials: [],
    tests: [],
    color: "#ec4899",
    category: "Science",
    duration: "10 weeks",
    level: "Beginner",
    rating: 4.6,
    totalLessons: 20,
    completedLessons: 12,
  },
]

const mockStudents: Student[] = [
  {
    id: "student-1",
    name: "Alice Johnson",
    email: "alice.johnson@email.com",
    progress: 85,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "active",
    enrolledCourses: ["course-1", "course-2"],
    joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    totalAssignments: 12,
    completedAssignments: 10,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "student-2",
    name: "Bob Smith",
    email: "bob.smith@email.com",
    progress: 72,
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    enrolledCourses: ["course-1"],
    joinDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    totalAssignments: 8,
    completedAssignments: 6,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "student-3",
    name: "Carol Davis",
    email: "carol.davis@email.com",
    progress: 45,
    lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    enrolledCourses: [],
    joinDate: new Date().toISOString(),
    totalAssignments: 0,
    completedAssignments: 0,
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    message: "New student Alice Johnson has joined Advanced Mathematics",
    type: "info",
    read: false,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    priority: "medium",
  },
  {
    id: "notif-2",
    message: "Test 'Midterm Exam' has been submitted by 5 students",
    type: "success",
    read: false,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    priority: "high",
  },
  {
    id: "notif-3",
    message: "Course material 'Chapter 5 Notes' uploaded successfully",
    type: "success",
    read: true,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "low",
  },
]

export default function TutorDashboard() {
  // State
  const [user, setUser] = useState<User | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Fetch data
  useEffect(() => {
    let canceled = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        // Resolve current user from backend (preferred), fallback to localStorage if needed
        let tutorId: string | undefined
        try {
          const me = await apiFetch<any>('/api/auth/me')
          const role = (me?.user?.role || me?.role || '').toString().toLowerCase()
          if (role === 'tutor') {
            tutorId = me?.user?.id || me?.id
          }
        } catch {}
        if (!tutorId) {
          const storedUser = localStorage.getItem('user')
          const parsed = storedUser ? JSON.parse(storedUser) : null
          tutorId = parsed?.id
        }
        const data = await apiFetch<any>(`/tutor/dashboard${tutorId ? `?tutorId=${encodeURIComponent(tutorId)}` : ''}`)
        if (canceled) return
        // Normalize
        const stats: Analytics = {
          totalStudents: data?.statistics?.totalStudents ?? 0,
          activeStudents: data?.statistics?.activeStudents ?? 0,
          totalCourses: data?.statistics?.totalCourses ?? 0,
          completionRate: Math.round((data?.statistics?.completionRate ?? 0) * 10) / 10,
          averageGrade: Math.round((data?.statistics?.averageRating ?? 0) * 10) / 10,
          monthlyGrowth: 0,
        }
        setAnalytics(stats)
        setUser({
          id: data?.tutor?.id ?? 'tutor',
          name: data?.tutor?.name ?? 'Tutor',
          email: data?.tutor?.contactEmail ?? '',
          role: 'Tutor',
          avatar: data?.tutor?.image ?? undefined,
          department: (data?.tutor?.subjects?.[0] ?? 'Education'),
        })
        setCourses((data?.courses || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          students: c.students ?? (c.enrollments?.length ?? 0),
          nextSession: c.nextSession,
          progress: Math.min(100, Math.max(0, Math.round(c.progress ?? 0))),
          materials: c.materials ?? [],
          tests: c.tests ?? [],
          color: c.color ?? '#4f46e5',
          category: c.category ?? 'General',
          duration: c.duration ?? '',
          level: 'Beginner',
          rating: 0,
          totalLessons: 0,
          completedLessons: 0,
        })))
        setStudents((data?.students || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          progress: Math.min(100, Math.max(0, Math.round(s.progress ?? 0))),
          lastActivity: s.lastActivity ?? new Date().toISOString(),
          status: (s.status as any) ?? 'active',
          enrolledCourses: s.enrolledCourses ?? [],
          joinDate: new Date().toISOString(),
          totalAssignments: 0,
          completedAssignments: 0,
          avatar: s.avatar,
        })))
        setNotifications((data?.notifications || []).map((n: any) => ({
          id: n.id,
          message: n.message,
          type: (n.type as any) ?? 'info',
          read: !!n.read,
          timestamp: n.timestamp,
          priority: 'low',
        })))
      } catch (e: any) {
        console.error('Failed to load tutor dashboard:', e)
        setError(e?.message || 'Failed to load tutor dashboard')
        // Fallback to mock so UI stays useful
        setUser({ id: 'tutor-1', name: 'Dr. Sarah Wilson', email: 'dr.wilson@university.edu', role: 'Tutor', avatar: '/placeholder.svg?height=64&width=64', department: 'Mathematics & Science' })
        setCourses(mockCourses)
        setStudents(mockStudents)
        setNotifications(mockNotifications)
        setAnalytics({ totalStudents: 74, activeStudents: 68, totalCourses: 8, completionRate: 87.5, averageGrade: 84.2, monthlyGrowth: 12.5 })
      } finally {
        if (!canceled) setLoading(false)
      }
    }
    load()
    return () => { canceled = true }
  }, [])

  // Effects
  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length)
  }, [notifications])

  // Computed values
  const activeStudents = students.filter((s) => s.status === "active")
  const pendingStudents = students.filter((s) => s.status === "pending")

  // Handlers
  const handleMarkNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    )
  }

  const handleFileUpload = (files: File[]) => {
    // In real app, upload files to server
    console.log("Uploading files:", files)
    toast({
      title: "Success",
      description: `${files.length} file(s) uploaded successfully`,
    })
  }

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "students", label: "Students", icon: Users },
    { id: "tests", label: "Tests", icon: FileText },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "materials", label: "Materials", icon: Upload },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  if (loading) {
    return <Loading message="Loading tutor dashboard..." className="min-h-[60vh]" />
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className={`
          fixed top-0 left-0 z-50 h-full bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "w-64" : "w-16"}
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
              {sidebarOpen && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="font-bold text-sidebar-foreground">EduTutor</h1>
                    <p className="text-xs text-sidebar-foreground/70">Teaching Platform</p>
                  </div>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:flex hidden">
                <Menu className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)} className="lg:hidden">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className={`w-full justify-start ${!sidebarOpen && "px-2"}`}
                    onClick={() => {
                      setActiveTab(item.id)
                      setMobileMenuOpen(false)
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {sidebarOpen && (
                      <>
                        <span className="ml-2">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <Badge variant="destructive" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Button>
                )
              })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-sidebar-border">
              <div className={`flex items-center gap-3 ${!sidebarOpen && "justify-center"}`}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                    <p className="text-xs text-sidebar-foreground/70 truncate">{user.role}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-16"}`}>
          {/* Top Bar */}
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
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                {user && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-6">
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Welcome back, {user?.name || 'Tutor'}!</h2>
                      <p className="text-muted-foreground mt-1">Here's what's happening with your courses today.</p>
                    </div>
                    <div className="hidden md:block">
                      {user && (
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-l-4 border-l-primary">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analytics?.totalStudents ?? 0}</div>
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
                    <Card className="border-l-4 border-l-accent">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-accent" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analytics?.totalCourses ?? 0}</div>
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
                    <Card className="border-l-4 border-l-chart-2">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <Target className="h-4 w-4 text-chart-2" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analytics?.completionRate ?? 0}%</div>
                        <p className="text-xs text-muted-foreground">+{analytics?.monthlyGrowth ?? 0}% from last month</p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <Card className="border-l-4 border-l-chart-4">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                        <Award className="h-4 w-4 text-chart-4" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analytics?.averageGrade ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Across all courses</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Course Overview and Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Course Overview */}
                  <Card className="lg:col-span-2">
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
                        {courses.slice(0, 4).map((course) => (
                          <div key={course.id} className="flex items-center">
                            <div className="h-3 w-3 rounded-full mr-3" style={{ backgroundColor: course.color }} />
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-sm font-medium truncate">{course.name}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">{course.students} students</span>
                                  <span className="text-sm text-muted-foreground">{course.progress}%</span>
                                </div>
                              </div>
                              <Progress value={course.progress} className="h-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Common tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        className="w-full justify-start bg-transparent"
                        variant="outline"
                        onClick={() => setActiveTab("students")}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Students
                      </Button>

                      <Button
                        className="w-full justify-start bg-transparent"
                        variant="outline"
                        onClick={() => setActiveTab("courses")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Course
                      </Button>

                      <Button
                        className="w-full justify-start bg-transparent"
                        variant="outline"
                        onClick={() => setActiveTab("tests")}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Create Test
                      </Button>

                      <Button
                        className="w-full justify-start bg-transparent"
                        variant="outline"
                        onClick={() => setActiveTab("materials")}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Materials
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Pending Approvals */}
                {pendingStudents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Student Approvals</CardTitle>
                      <CardDescription>Students waiting for your approval</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {pendingStudents.slice(0, 3).map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-medium">{student.name}</h3>
                                <p className="text-sm text-muted-foreground">{student.email}</p>
                                <p className="text-xs text-muted-foreground">
                                  Applied {new Date(student.joinDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm">
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
                            View All {pendingStudents.length} Pending Students
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates from your courses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {notifications.slice(0, 5).map((notification) => (
                        <div key={notification.id} className="flex items-start space-x-3">
                          <div
                            className={`p-2 rounded-full ${
                              notification.type === "success"
                                ? "bg-chart-2/20 text-chart-2"
                                : notification.type === "warning"
                                  ? "bg-chart-4/20 text-chart-4"
                                  : notification.type === "error"
                                    ? "bg-destructive/20 text-destructive"
                                    : "bg-primary/20 text-primary"
                            }`}
                          >
                            {notification.type === "success" && <CheckCircle className="h-4 w-4" />}
                            {notification.type === "warning" && <AlertCircle className="h-4 w-4" />}
                            {notification.type === "error" && <X className="h-4 w-4" />}
                            {notification.type === "info" && <Bell className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{notification.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkNotificationAsRead(notification.id)}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Other Tabs */}
            {activeTab === "courses" && <CourseManagementPage />}
            {activeTab === "students" && <StudentManagementPage />}
            {activeTab === "tests" && <TestManagementPage />}
            {activeTab === "notifications" && <NotificationSystemPage />}
            {activeTab === "analytics" && <AnalyticsDashboardPage />}

            {/* Materials Tab */}
            {activeTab === "materials" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Course Materials</h2>
                    <p className="text-muted-foreground">Upload and manage files for your courses</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* File Upload */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Upload New Materials</CardTitle>
                      <CardDescription>
                        Upload documents, presentations, videos, and other course materials
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-2">
                        <FileUploadPage />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Uploads */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Uploads</CardTitle>
                      <CardDescription>Recently uploaded course materials</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {courses
                          .flatMap((course) => course.materials)
                          .slice(0, 5)
                          .map((material) => (
                            <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded">
                                  <FileText className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{material.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {material.size && `${(material.size / 1024 / 1024).toFixed(1)} MB • `}
                                    {new Date(material.uploadDate).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        {courses.flatMap((course) => course.materials).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">No materials uploaded yet</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Materials by Course */}
                <Card>
                  <CardHeader>
                    <CardTitle>Materials by Course</CardTitle>
                    <CardDescription>Organize materials by course</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue={courses[0]?.id} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        {courses.slice(0, 2).map((course) => (
                          <TabsTrigger key={course.id} value={course.id}>
                            {course.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {courses.map((course) => (
                        <TabsContent key={course.id} value={course.id} className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">{course.name}</h3>
                            <Button size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload to Course
                            </Button>
                          </div>
                          {course.materials.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No materials for this course yet
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {course.materials.map((material) => (
                                <div key={material.id} className="p-4 border rounded-lg">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-muted rounded">
                                        <FileText className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <div className="font-medium">{material.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {material.size && `${(material.size / 1024 / 1024).toFixed(1)} MB • `}
                                          {new Date(material.uploadDate).toLocaleDateString()}
                                        </div>
                                      </div>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Settings</h2>
                  <p className="text-muted-foreground">Manage your account and preferences</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Settings</CardTitle>
                      <CardDescription>Update your personal information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <Button variant="outline">Change Photo</Button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input value={user.name} readOnly />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input value={user.email} readOnly />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Department</label>
                        <Input value={user.department} readOnly />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Preferences</CardTitle>
                      <CardDescription>Customize your experience</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center py-8 text-muted-foreground">Settings panel coming soon...</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>

        <Toaster />
      </div>
    </TooltipProvider>
  )
}
