"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Bell,
  Calendar,
  BookOpen,
  FileText,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Menu,
  Home,
  Clock,
  CheckSquare,
  GraduationCap,
  BarChart,
  Download,
  ExternalLink,
  Play,
  Eye,
  Search,
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
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { apiFetch } from "@/lib/api"
import { MaterialViewer } from "@/components/MaterialViewer"

// Types
interface Course {
  id: string
  name: string
  description: string
  tutor: string
  tutorEmail: string
  nextSession: string
  progress: number
  materials: Material[]
  tests: Test[]
  color: string
  announcements: Announcement[]
  grade?: number
}

interface Material {
  id: string
  name: string
  type: "pdf" | "video" | "document"
  url: string
  dateAdded: string
  size?: string
  description?: string
  completed?: boolean
}

interface Test {
  id: string
  title: string
  description: string
  dueDate: string
  questions: TestQuestion[] | number
  totalPoints: number
  status: "upcoming" | "in-progress" | "completed" | "missed"
  timeLimit?: number
  grade?: number
  submittedAt?: string
}

interface TestQuestion {
  id: string
  text: string
  type: "multiple-choice" | "true-false" | "short-answer" | "essay"
  options?: string[]
  answer?: string | string[]
  points: number
}

interface Notification {
  id: string
  message: string
  date: string
  type: "course" | "test" | "admin" | "grade"
  read: boolean
  courseId?: string
}

interface Announcement {
  id: string
  title: string
  content: string
  date: string
  courseId: string
}

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  courseId: string
  status: "pending" | "submitted" | "graded"
  grade?: number
}

interface UserType {
  id: string
  name: string
  email: string
  role: "student"
  enrolledCourses: string[]
  avatar?: string
}

// Mock data
const mockUser: UserType = {
  id: "s1",
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  role: "student",
  enrolledCourses: ["1", "2", "3"],
}

const mockCourses: Course[] = [
  {
    id: "1",
    name: "Mathematics 101",
    description: "Introduction to basic mathematical concepts and principles",
    tutor: "Dr. Smith",
    tutorEmail: "dr.smith@university.edu",
    nextSession: "2024-05-20 10:00",
    progress: 65,
    color: "#4f46e5",
    grade: 85,
    materials: [
      {
        id: "m1",
        name: "Introduction to Algebra",
        type: "pdf",
        url: "/materials/algebra.pdf",
        dateAdded: "2024-01-15",
        size: "2.4 MB",
        description: "Fundamental concepts of algebraic expressions and equations",
        completed: true,
      },
      {
        id: "m2",
        name: "Geometry Basics Video",
        type: "video",
        url: "/materials/geometry.mp4",
        dateAdded: "2024-01-20",
        size: "45 MB",
        description: "Visual explanation of geometric principles and theorems",
        completed: false,
      },
      {
        id: "m3",
        name: "Calculus Introduction",
        type: "pdf",
        url: "/materials/calculus.pdf",
        dateAdded: "2024-02-05",
        size: "3.1 MB",
        description: "Introduction to differential and integral calculus",
        completed: false,
      },
    ],
    tests: [
      {
        id: "t1",
        title: "Midterm Exam",
        description: "Covers chapters 1-5",
        dueDate: "2024-06-15",
        questions: [
          {
            id: "q1",
            text: "What is the derivative of f(x) = x²?",
            type: "multiple-choice",
            options: ["f'(x) = x", "f'(x) = 2x", "f'(x) = 2", "f'(x) = x²"],
            points: 10,
          },
          {
            id: "q2",
            text: "The integral of f(x) = 2x is F(x) = x² + C",
            type: "true-false",
            points: 5,
          },
        ],
        totalPoints: 100,
        status: "upcoming",
        timeLimit: 90,
      },
      {
        id: "t2",
        title: "Quiz 1",
        description: "Basic algebra concepts",
        dueDate: "2024-05-10",
        questions: 10,
        totalPoints: 50,
        status: "completed",
        grade: 45,
        submittedAt: "2024-05-10 14:30",
      },
    ],
    announcements: [
      {
        id: "a1",
        title: "Office Hours Change",
        content: "Office hours will be moved to Thursdays 2-4pm starting next week.",
        date: "2024-05-15",
        courseId: "1",
      },
      {
        id: "a2",
        title: "Midterm Preparation",
        content: "Review session for the midterm will be held on Monday at 5pm in Room 302.",
        date: "2024-05-12",
        courseId: "1",
      },
    ],
  },
  {
    id: "2",
    name: "Physics Advanced",
    description: "Advanced concepts in physics including mechanics and thermodynamics",
    tutor: "Prof. Johnson",
    tutorEmail: "prof.johnson@university.edu",
    nextSession: "2024-05-21 14:00",
    progress: 45,
    color: "#0ea5e9",
    grade: 78,
    materials: [
      {
        id: "m4",
        name: "Mechanics Lecture Notes",
        type: "pdf",
        url: "/materials/mechanics.pdf",
        dateAdded: "2024-01-25",
        size: "3.1 MB",
        description: "Comprehensive notes on Newtonian mechanics",
        completed: true,
      },
      {
        id: "m5",
        name: "Thermodynamics Overview",
        type: "document",
        url: "/materials/thermo.docx",
        dateAdded: "2024-02-01",
        size: "1.8 MB",
        description: "Introduction to the laws of thermodynamics",
        completed: false,
      },
      {
        id: "m6",
        name: "Wave Motion Video Lecture",
        type: "video",
        url: "/materials/waves.mp4",
        dateAdded: "2024-02-15",
        size: "120 MB",
        description: "Visual explanation of wave properties and behaviors",
        completed: false,
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
        status: "upcoming",
        timeLimit: 45,
      },
    ],
    announcements: [
      {
        id: "a3",
        title: "Lab Equipment Update",
        content: "New lab equipment has arrived. We will be using it in next week's session.",
        date: "2024-05-16",
        courseId: "2",
      },
    ],
  },
  {
    id: "3",
    name: "Computer Science Fundamentals",
    description: "Introduction to programming concepts, algorithms, and data structures",
    tutor: "Dr. Williams",
    tutorEmail: "dr.williams@university.edu",
    nextSession: "2024-05-22 09:00",
    progress: 30,
    color: "#10b981",
    grade: 92,
    materials: [
      {
        id: "m7",
        name: "Introduction to Programming",
        type: "pdf",
        url: "/materials/programming.pdf",
        dateAdded: "2024-02-10",
        size: "4.2 MB",
        description: "Basics of programming logic and syntax",
        completed: true,
      },
      {
        id: "m8",
        name: "Data Structures Tutorial",
        type: "video",
        url: "/materials/data-structures.mp4",
        dateAdded: "2024-02-15",
        size: "120 MB",
        description: "Visual guide to common data structures",
        completed: true,
      },
      {
        id: "m9",
        name: "Algorithm Design Principles",
        type: "document",
        url: "/materials/algorithms.docx",
        dateAdded: "2024-03-01",
        size: "2.5 MB",
        description: "Guide to designing efficient algorithms",
        completed: false,
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
        status: "in-progress",
      },
      {
        id: "t5",
        title: "Midterm Exam",
        description: "Covers programming fundamentals and basic algorithms",
        dueDate: "2024-06-25",
        questions: 30,
        totalPoints: 150,
        status: "upcoming",
        timeLimit: 120,
      },
    ],
    announcements: [
      {
        id: "a4",
        title: "Programming Contest",
        content: "Sign up for the upcoming programming contest by Friday. Great opportunity to practice your skills!",
        date: "2024-05-14",
        courseId: "3",
      },
      {
        id: "a5",
        title: "Project Groups",
        content: "Project groups have been assigned. Check the course page for your team members.",
        date: "2024-05-10",
        courseId: "3",
      },
    ],
  },
]

const mockNotifications: Notification[] = [
  {
    id: "1",
    message: "New announcement in Mathematics 101",
    date: "2024-05-19",
    type: "course",
    read: false,
    courseId: "1",
  },
  {
    id: "2",
    message: "Upcoming test: Midterm Exam in Mathematics 101",
    date: "2024-05-18",
    type: "test",
    read: false,
    courseId: "1",
  },
  {
    id: "3",
    message: "Your Quiz 1 has been graded in Mathematics 101",
    date: "2024-05-11",
    type: "grade",
    read: true,
    courseId: "1",
  },
  {
    id: "4",
    message: "New material added to Computer Science Fundamentals",
    date: "2024-05-10",
    type: "course",
    read: true,
    courseId: "3",
  },
]

const mockAssignments: Assignment[] = [
  {
    id: "a1",
    title: "Problem Set 3",
    description: "Complete problems 15-30 in Chapter 4",
    dueDate: "2024-05-25",
    courseId: "1",
    status: "pending",
  },
  {
    id: "a2",
    title: "Lab Report: Wave Motion",
    description: "Write up your findings from the wave motion experiment",
    dueDate: "2024-05-30",
    courseId: "2",
    status: "pending",
  },
  {
    id: "a3",
    title: "Programming Exercise 2",
    description: "Implement a linked list in your language of choice",
    dueDate: "2024-05-22",
    courseId: "3",
    status: "submitted",
  },
  {
    id: "a4",
    title: "Problem Set 2",
    description: "Complete problems 10-20 in Chapter 3",
    dueDate: "2024-05-10",
    courseId: "1",
    status: "graded",
    grade: 85,
  },
]

// Main component
export default function StudentPortal() {
  // State
  const [user, setUser] = useState<UserType>(mockUser)
  const [courses, setCourses] = useState<Course[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [testInProgress, setTestInProgress] = useState(false)
  const [currentTestAnswers, setCurrentTestAnswers] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [filterCourseId, setFilterCourseId] = useState<string | null>(null)

  // Derived state
  // user.enrolledCourses may be undefined if loaded from API; use safe fallback
  const enrolledCourses = courses.filter((course) => (user.enrolledCourses || []).includes(course.id))
  const upcomingTests = enrolledCourses.flatMap((course) =>
    course.tests
      .filter((test) => test.status === "upcoming")
      .map((test) => ({ ...test, courseName: course.name, courseId: course.id, courseColor: course.color })),
  )
  const pendingAssignments = assignments.filter((assignment) => assignment.status === "pending")

  // API fetching functions
  const fetchStudentData = async () => {
    try {
      setLoading(true)
      const storedUser = localStorage.getItem('user')
      const parsed = storedUser ? JSON.parse(storedUser) : null
      const studentId = parsed?.id
      const data = await apiFetch<any>(`/student/dashboard${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''}`)
      
      if (data?.student) setUser(data.student)
      if (data?.courses) setCourses(data.courses)
      if (data?.notifications) setNotifications(data.notifications)
      if (data?.assignments) setAssignments(data.assignments)
    } catch (e) {
      console.error('Failed to fetch student data:', e)
      // Fallback to mock data on error
      setCourses(mockCourses)
      setNotifications(mockNotifications)
      setAssignments(mockAssignments)
    } finally {
      setLoading(false)
    }
  }

  // Effects
  useEffect(() => {
    fetchStudentData()
  }, [])

  useEffect(() => {
    // Calculate unread notifications
    setUnreadCount(notifications.filter((n) => !n.read).length)
  }, [notifications])

  useEffect(() => {
    // Timer for test in progress
    if (testInProgress && timeRemaining !== null && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (testInProgress && timeRemaining === 0) {
      handleSubmitTest()
    }
  }, [testInProgress, timeRemaining])

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleCourseSelect = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId) || null
    setSelectedCourse(course)
  }

  const handleTestSelect = (courseId: string, testId: string) => {
    const course = courses.find((c) => c.id === courseId)
    if (!course) return

    const test = course.tests.find((t) => t.id === testId) || null
    setSelectedTest(test)
  }

  const handleStartTest = () => {
    if (!selectedTest) return

    // Only start the test if it has actual questions (not just a number)
    if (selectedTest && Array.isArray(selectedTest.questions)) {
      setTestInProgress(true)
      setTimeRemaining(selectedTest.timeLimit ? selectedTest.timeLimit * 60 : null)

      // Initialize answers
      const initialAnswers: Record<string, string> = {}
      selectedTest.questions.forEach((question) => {
        initialAnswers[question.id] = ""
      })
      setCurrentTestAnswers(initialAnswers)
    }
  }

  const handleSubmitTest = async () => {
    if (!selectedTest || !selectedCourse) return

    try {
      // Get the student ID from localStorage (assuming it's stored there after login)
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const studentId = user?.id

      if (!studentId) {
        console.error('Student ID not found')
        return
      }

      // Submit test to backend API
      const response = await fetch('/api/student/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          testId: selectedTest.id,
          answers: currentTestAnswers,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Test submission failed:', errorData.error)
        return
      }

      const result = await response.json()
      const calculatedScore = result.submission.score

      // Update the test status with real calculated score
      setCourses((prevCourses) =>
        prevCourses.map((course) => {
          if (course.id === selectedCourse.id) {
            return {
              ...course,
              tests: course.tests.map((test) => {
                if (test.id === selectedTest.id) {
                  return {
                    ...test,
                    status: "completed",
                    submittedAt: new Date().toISOString(),
                    grade: calculatedScore, // Real calculated grade from backend
                  }
                }
                return test
              }),
            }
          }
          return course
        }),
      )

      setTestInProgress(false)
      setTimeRemaining(null)
      setCurrentTestAnswers({})

      // Add a notification about the submitted test with score
      const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        message: `You've submitted "${selectedTest.title}" for ${selectedCourse.name}. Score: ${calculatedScore}%`,
        date: new Date().toISOString(),
        type: "test",
        read: false,
        courseId: selectedCourse.id,
      }
      setNotifications((prev) => [newNotification, ...prev])
    } catch (error) {
      console.error('Error submitting test:', error)
    }
  }

  const handleMarkMaterialComplete = (courseId: string, materialId: string, completed: boolean) => {
    setCourses((prevCourses) =>
      prevCourses.map((course) => {
        if (course.id === courseId) {
          return {
            ...course,
            materials: course.materials.map((material) => {
              if (material.id === materialId) {
                return { ...material, completed }
              }
              return material
            }),
          }
        }
        return course
      }),
    )
  }

  const handleMarkNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    )
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setCurrentTestAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  // Filtered data
  const filteredCourses = enrolledCourses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCourse = filterCourseId ? assignment.courseId === filterCourseId : true
    return matchesSearch && matchesCourse
  })

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
              <GraduationCap className={`h-6 w-6 text-indigo-600 ${!sidebarOpen && "mx-auto"}`} />
              {sidebarOpen && <span className="font-bold text-xl">Student Portal</span>}
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
                {sidebarOpen && <span>My Courses</span>}
              </button>

              <button
                onClick={() => setActiveTab("assignments")}
                className={`flex items-center ${
                  !sidebarOpen ? "justify-center" : "justify-start"
                } w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "assignments" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <CheckSquare className="h-5 w-5 mr-2 flex-shrink-0" />
                {sidebarOpen && <span>Assignments</span>}
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
                onClick={() => setActiveTab("grades")}
                className={`flex items-center ${
                  !sidebarOpen ? "justify-center" : "justify-start"
                } w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "grades" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <BarChart className="h-5 w-5 mr-2 flex-shrink-0" />
                {sidebarOpen && <span>Grades</span>}
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
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">My Courses</h3>
                  {enrolledCourses.map((course) => (
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
              <GraduationCap className="h-6 w-6 text-indigo-600 mr-2" />
              <span className="font-bold text-xl">Student Portal</span>
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
                  <span>My Courses</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("assignments")
                    setMobileMenuOpen(false)
                  }}
                  className={`flex items-center justify-start w-full px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "assignments" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <CheckSquare className="h-5 w-5 mr-2" />
                  <span>Assignments</span>
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
                    setActiveTab("grades")
                    setMobileMenuOpen(false)
                  }}
                  className={`flex items-center justify-start w-full px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "grades" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <BarChart className="h-5 w-5 mr-2" />
                  <span>Grades</span>
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
                  {activeTab === "courses" && "My Courses"}
                  {activeTab === "assignments" && "Assignments"}
                  {activeTab === "tests" && "Tests & Quizzes"}
                  {activeTab === "grades" && "Grades"}
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
              {/* Welcome Banner */}
              <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold">Welcome back, {user.name}!</h2>
                      <p className="mt-1 text-indigo-100">
                        You have {pendingAssignments.length} pending assignments and {upcomingTests.length} upcoming
                        tests.
                      </p>
                    </div>
                    <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                      <Calendar className="mr-2 h-4 w-4" />
                      View Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-l-4 border-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                      <BookOpen className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{enrolledCourses.length}</div>
                      <p className="text-xs text-muted-foreground">
                        {enrolledCourses.reduce((sum, course) => sum + course.materials.length, 0)} learning materials
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
                      <CardTitle className="text-sm font-medium">Upcoming Tests</CardTitle>
                      <FileText className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{upcomingTests.length}</div>
                      <p className="text-xs text-muted-foreground">Next: {upcomingTests[0]?.title || "None"}</p>
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
                        {enrolledCourses.length > 0
                          ? new Date(enrolledCourses[0]?.nextSession).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {enrolledCourses.length > 0
                          ? `${enrolledCourses[0]?.name} - ${new Date(
                              enrolledCourses[0]?.nextSession,
                            ).toLocaleDateString()}`
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
                      <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                      <BarChart className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {enrolledCourses.length > 0
                          ? Math.round(
                              enrolledCourses.reduce((sum, course) => sum + (course.grade || 0), 0) /
                                enrolledCourses.filter((c) => c.grade).length,
                            )
                          : "N/A"}
                        %
                      </div>
                      <p className="text-xs text-muted-foreground">Across all courses</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Upcoming Tests */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Tests</CardTitle>
                    <CardDescription>Tests and quizzes scheduled in the next 30 days</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("tests")}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  {upcomingTests.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">No upcoming tests</div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingTests.slice(0, 3).map((test) => (
                        <div
                          key={test.id}
                          className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="h-10 w-1 rounded-full flex-shrink-0 mt-1"
                              style={{ backgroundColor: test.courseColor }}
                            />
                            <div>
                              <h3 className="font-medium">{test.title}</h3>
                              <p className="text-sm text-muted-foreground">{test.courseName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {test.totalPoints} points
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Due: {new Date(test.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              handleCourseSelect(test.courseId)
                              handleTestSelect(test.courseId, test.id)
                              setActiveTab("tests")
                            }}
                          >
                            View Test
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Assignments */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Pending Assignments</CardTitle>
                    <CardDescription>Assignments that need your attention</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("assignments")}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  {pendingAssignments.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">No pending assignments</div>
                  ) : (
                    <div className="space-y-4">
                      {pendingAssignments.slice(0, 3).map((assignment) => {
                        const course = courses.find((c) => c.id === assignment.courseId)
                        return (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="h-10 w-1 rounded-full flex-shrink-0 mt-1"
                                style={{ backgroundColor: course?.color }}
                              />
                              <div>
                                <h3 className="font-medium">{assignment.title}</h3>
                                <p className="text-sm text-muted-foreground">{course?.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button size="sm" onClick={() => setActiveTab("assignments")}>
                              Start Assignment
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Notifications */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Notifications</CardTitle>
                    <CardDescription>Latest updates and announcements</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("notifications")}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.slice(0, 3).map((notification) => (
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
                <h2 className="text-2xl font-bold">My Courses</h2>
                <div className="relative">
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full md:w-64 pl-10"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
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
                          <div className="flex items-center text-sm">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Tutor: {course.tutor}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Next Session: {new Date(course.nextSession).toLocaleString()}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{course.progress}%</span>
                            </div>
                            <Progress value={course.progress} className="h-2" />
                          </div>
                          {course.grade && (
                            <div className="flex items-center justify-between text-sm">
                              <span>Current Grade</span>
                              <Badge
                                className={
                                  course.grade >= 90
                                    ? "bg-green-100 text-green-800"
                                    : course.grade >= 80
                                      ? "bg-blue-100 text-blue-800"
                                      : course.grade >= 70
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                }
                              >
                                {course.grade}%
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full" onClick={() => handleCourseSelect(course.id)}>
                          View Course
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}

                {filteredCourses.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">No courses found</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {searchTerm ? "Try a different search term" : "You are not enrolled in any courses yet"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === "assignments" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-2xl font-bold">Assignments</h2>
                <div className="flex gap-2">
                  <Select onValueChange={(value) => setFilterCourseId(value === "all" ? null : value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {enrolledCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Input
                      placeholder="Search assignments..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full md:w-64 pl-10"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <Tabs defaultValue="pending">
                <TabsList>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="submitted">Submitted</TabsTrigger>
                  <TabsTrigger value="graded">Graded</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Assignments</CardTitle>
                      <CardDescription>Assignments that need your attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {filteredAssignments.filter((a) => a.status === "pending").length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">No pending assignments</div>
                      ) : (
                        <div className="space-y-4">
                          {filteredAssignments
                            .filter((a) => a.status === "pending")
                            .map((assignment) => {
                              const course = courses.find((c) => c.id === assignment.courseId)
                              return (
                                <div
                                  key={assignment.id}
                                  className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm"
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className="h-10 w-1 rounded-full flex-shrink-0 mt-1"
                                      style={{ backgroundColor: course?.color }}
                                    />
                                    <div>
                                      <h3 className="font-medium">{assignment.title}</h3>
                                      <p className="text-sm text-muted-foreground">{course?.name}</p>
                                      <p className="text-sm mt-1">{assignment.description}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <Button>Start Assignment</Button>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="submitted" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Submitted Assignments</CardTitle>
                      <CardDescription>Assignments you've submitted and are waiting for grades</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {filteredAssignments.filter((a) => a.status === "submitted").length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">No submitted assignments</div>
                      ) : (
                        <div className="space-y-4">
                          {filteredAssignments
                            .filter((a) => a.status === "submitted")
                            .map((assignment) => {
                              const course = courses.find((c) => c.id === assignment.courseId)
                              return (
                                <div
                                  key={assignment.id}
                                  className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm"
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className="h-10 w-1 rounded-full flex-shrink-0 mt-1"
                                      style={{ backgroundColor: course?.color }}
                                    />
                                    <div>
                                      <h3 className="font-medium">{assignment.title}</h3>
                                      <p className="text-sm text-muted-foreground">{course?.name}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Submitted</Badge>
                                        <span className="text-xs text-muted-foreground">
                                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <Button variant="outline">View Submission</Button>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="graded" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Graded Assignments</CardTitle>
                      <CardDescription>Assignments that have been graded</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {filteredAssignments.filter((a) => a.status === "graded").length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">No graded assignments</div>
                      ) : (
                        <div className="space-y-4">
                          {filteredAssignments
                            .filter((a) => a.status === "graded")
                            .map((assignment) => {
                              const course = courses.find((c) => c.id === assignment.courseId)
                              return (
                                <div
                                  key={assignment.id}
                                  className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm"
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className="h-10 w-1 rounded-full flex-shrink-0 mt-1"
                                      style={{ backgroundColor: course?.color }}
                                    />
                                    <div>
                                      <h3 className="font-medium">{assignment.title}</h3>
                                      <p className="text-sm text-muted-foreground">{course?.name}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge
                                          className={
                                            assignment.grade && assignment.grade >= 90
                                              ? "bg-green-100 text-green-800"
                                              : assignment.grade && assignment.grade >= 80
                                                ? "bg-blue-100 text-blue-800"
                                                : assignment.grade && assignment.grade >= 70
                                                  ? "bg-yellow-100 text-yellow-800"
                                                  : "bg-red-100 text-red-800"
                                          }
                                        >
                                          Grade: {assignment.grade}%
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <Button variant="outline">View Feedback</Button>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Tests Tab */}
          {activeTab === "tests" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Tests & Quizzes</h2>
                <div className="relative">
                  <Input
                    placeholder="Search tests..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full md:w-64 pl-10"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <Tabs defaultValue="upcoming">
                <TabsList>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Upcoming Tests</CardTitle>
                      <CardDescription>Tests and quizzes scheduled in the next 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {upcomingTests.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">No upcoming tests</div>
                      ) : (
                        <div className="space-y-4">
                          {upcomingTests.map((test) => (
                            <div
                              key={test.id}
                              className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm"
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className="h-10 w-1 rounded-full flex-shrink-0 mt-1"
                                  style={{ backgroundColor: test.courseColor }}
                                />
                                <div>
                                  <h3 className="font-medium">{test.title}</h3>
                                  <p className="text-sm text-muted-foreground">{test.courseName}</p>
                                  <p className="text-sm mt-1">{test.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {test.totalPoints} points
                                    </Badge>
                                    {test.timeLimit && (
                                      <Badge variant="outline" className="text-xs">
                                        {test.timeLimit} minutes
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      Due: {new Date(test.dueDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                onClick={() => {
                                  handleCourseSelect(test.courseId)
                                  handleTestSelect(test.courseId, test.id)
                                }}
                              >
                                View Test
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="in-progress" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tests In Progress</CardTitle>
                      <CardDescription>Tests you've started but not yet submitted</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-6 text-muted-foreground">No tests in progress</div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="completed" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Completed Tests</CardTitle>
                      <CardDescription>Tests you've submitted and received grades for</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {enrolledCourses.flatMap((course) =>
                          course.tests
                            .filter((test) => test.status === "completed")
                            .map((test) => (
                              <div
                                key={test.id}
                                className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm"
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className="h-10 w-1 rounded-full flex-shrink-0 mt-1"
                                    style={{ backgroundColor: course.color }}
                                  />
                                  <div>
                                    <h3 className="font-medium">{test.title}</h3>
                                    <p className="text-sm text-muted-foreground">{course.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge
                                        className={
                                          test.grade && test.grade >= 90
                                            ? "bg-green-100 text-green-800"
                                            : test.grade && test.grade >= 80
                                              ? "bg-blue-100 text-blue-800"
                                              : test.grade && test.grade >= 70
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                        }
                                      >
                                        Grade: {test.grade}%
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        Submitted: {test.submittedAt && new Date(test.submittedAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    handleCourseSelect(course.id)
                                    handleTestSelect(course.id, test.id)
                                  }}
                                >
                                  View Results
                                </Button>
                              </div>
                            )),
                        )}

                        {!enrolledCourses.some((course) =>
                          course.tests.some((test) => test.status === "completed"),
                        ) && <div className="text-center py-6 text-muted-foreground">No completed tests</div>}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Grades Tab */}
          {activeTab === "grades" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Grades</h2>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Grade Summary</CardTitle>
                  <CardDescription>Your current grades across all courses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {enrolledCourses.map((course) => (
                      <div key={course.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: course.color }} />
                            <h3 className="font-medium">{course.name}</h3>
                          </div>
                          <Badge
                            className={
                              course.grade && course.grade >= 90
                                ? "bg-green-100 text-green-800"
                                : course.grade && course.grade >= 80
                                  ? "bg-blue-100 text-blue-800"
                                  : course.grade && course.grade >= 70
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                            }
                          >
                            {course.grade}%
                          </Badge>
                        </div>
                        <Progress
                          value={course.grade}
                          className="h-2"
                          indicatorClassName={
                            course.grade && course.grade >= 90
                              ? "bg-green-500"
                              : course.grade && course.grade >= 80
                                ? "bg-blue-500"
                                : course.grade && course.grade >= 70
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                          }
                        />
                        <div className="text-xs text-muted-foreground">
                          Grade based on {course.tests.filter((t) => t.status === "completed").length} completed tests
                          and {assignments.filter((a) => a.courseId === course.id && a.status === "graded").length}{" "}
                          graded assignments
                        </div>
                      </div>
                    ))}

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Overall Average</h3>
                      <Badge className="text-lg">
                        {enrolledCourses.length > 0
                          ? Math.round(
                              enrolledCourses.reduce((sum, course) => sum + (course.grade || 0), 0) /
                                enrolledCourses.filter((c) => c.grade).length,
                            )
                          : "N/A"}
                        %
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grade Details</CardTitle>
                  <CardDescription>Detailed breakdown of your grades by assignment and test</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {enrolledCourses.map((course) => (
                      <AccordionItem key={course.id} value={course.id}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: course.color }} />
                            <span>{course.name}</span>
                            <Badge
                              className={
                                course.grade && course.grade >= 90
                                  ? "bg-green-100 text-green-800 ml-2"
                                  : course.grade && course.grade >= 80
                                    ? "bg-blue-100 text-blue-800 ml-2"
                                    : course.grade && course.grade >= 70
                                      ? "bg-yellow-100 text-yellow-800 ml-2"
                                      : "bg-red-100 text-red-800 ml-2"
                              }
                            >
                              {course.grade}%
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Tests</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Test</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Grade</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {course.tests.map((test) => (
                                    <TableRow key={test.id}>
                                      <TableCell className="font-medium">{test.title}</TableCell>
                                      <TableCell>
                                        {test.status === "completed" && test.submittedAt
                                          ? new Date(test.submittedAt).toLocaleDateString()
                                          : new Date(test.dueDate).toLocaleDateString()}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant={test.status === "completed" ? "default" : "outline"}
                                          className={
                                            test.status === "completed"
                                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                                              : ""
                                          }
                                        >
                                          {test.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {test.grade ? `${test.grade}%` : "-"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Assignments</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Assignment</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Grade</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {assignments
                                    .filter((a) => a.courseId === course.id)
                                    .map((assignment) => (
                                      <TableRow key={assignment.id}>
                                        <TableCell className="font-medium">{assignment.title}</TableCell>
                                        <TableCell>{new Date(assignment.dueDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={assignment.status === "graded" ? "default" : "outline"}
                                            className={
                                              assignment.status === "graded"
                                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                : assignment.status === "submitted"
                                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                                  : ""
                                            }
                                          >
                                            {assignment.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {assignment.grade ? `${assignment.grade}%` : "-"}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Notifications</h2>
                <Button
                  variant="outline"
                  onClick={() => setNotifications(notifications.map((n) => ({ ...n, read: true })))}
                >
                  Mark All as Read
                </Button>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="course">Course</TabsTrigger>
                  <TabsTrigger value="test">Test</TabsTrigger>
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
                                  <Badge
                                    variant="outline"
                                    className={
                                      notification.type === "course"
                                        ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-100"
                                        : notification.type === "test"
                                          ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                          : notification.type === "grade"
                                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                                            : ""
                                    }
                                  >
                                    {notification.type}
                                  </Badge>
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
      {selectedCourse && !selectedTest && (
        <Dialog open={!!selectedCourse && !selectedTest} onOpenChange={() => setSelectedCourse(null)}>
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
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="materials">Materials</TabsTrigger>
                  <TabsTrigger value="tests">Tests</TabsTrigger>
                  <TabsTrigger value="announcements">Announcements</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Course Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Tutor:</span>
                        <span>{selectedCourse.tutor}</span>
                        <span className="text-muted-foreground">Email:</span>
                        <span>{selectedCourse.tutorEmail}</span>
                        <span className="text-muted-foreground">Next Session:</span>
                        <span>{new Date(selectedCourse.nextSession).toLocaleString()}</span>
                        <span className="text-muted-foreground">Progress:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedCourse.progress} className="h-2 w-20" />
                          <span>{selectedCourse.progress}%</span>
                        </div>
                        {selectedCourse.grade && (
                          <>
                            <span className="text-muted-foreground">Current Grade:</span>
                            <Badge
                              className={
                                selectedCourse.grade >= 90
                                  ? "bg-green-100 text-green-800"
                                  : selectedCourse.grade >= 80
                                    ? "bg-blue-100 text-blue-800"
                                    : selectedCourse.grade >= 70
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                              }
                            >
                              {selectedCourse.grade}%
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">Course Stats</h3>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{selectedCourse.materials.length}</div>
                            <p className="text-xs text-muted-foreground">Learning Materials</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{selectedCourse.tests.length}</div>
                            <p className="text-xs text-muted-foreground">Tests & Quizzes</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">
                              {selectedCourse.materials.filter((m) => m.completed).length}
                            </div>
                            <p className="text-xs text-muted-foreground">Completed Materials</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">
                              {selectedCourse.tests.filter((t) => t.status === "completed").length}
                            </div>
                            <p className="text-xs text-muted-foreground">Completed Tests</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="materials" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Course Materials</h3>
                    </div>
                    {selectedCourse.materials.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">No materials available</div>
                    ) : (
                      <div className="space-y-2">
                        {selectedCourse.materials.map((material) => (
                          <div
                            key={material.id}
                            className="flex justify-between items-center p-4 border rounded-md bg-white shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              {material.type === "pdf" && <FileText className="h-5 w-5 text-red-500" />}
                              {material.type === "video" && <Play className="h-5 w-5 text-blue-500" />}
                              {material.type === "document" && <FileText className="h-5 w-5 text-green-500" />}
                              <div>
                                <h4 className="font-medium">{material.name}</h4>
                                <p className="text-sm text-muted-foreground">{material.description}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <span>{material.size}</span>
                                  <span>Added: {new Date(material.dateAdded).toLocaleDateString()}</span>
                                  <Badge
                                    variant={material.completed ? "default" : "outline"}
                                    className={
                                      material.completed ? "bg-green-100 text-green-800 hover:bg-green-100" : ""
                                    }
                                  >
                                    {material.completed ? "Completed" : "Not Completed"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => setSelectedMaterial(material)}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                              <Button
                                variant={material.completed ? "outline" : "default"}
                                size="sm"
                                onClick={() =>
                                  handleMarkMaterialComplete(selectedCourse.id, material.id, !material.completed)
                                }
                              >
                                <CheckSquare className="h-4 w-4 mr-1" />
                                {material.completed ? "Mark Incomplete" : "Mark Complete"}
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
                      <h3 className="font-medium">Tests & Quizzes</h3>
                    </div>
                    {selectedCourse.tests.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">No tests available</div>
                    ) : (
                      <div className="space-y-4">
                        {selectedCourse.tests.map((test) => (
                          <div key={test.id} className="p-4 border rounded-md bg-white shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{test.title}</h4>
                                <p className="text-sm text-muted-foreground">{test.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge
                                    variant={test.status === "completed" ? "default" : "outline"}
                                    className={
                                      test.status === "completed"
                                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                                        : test.status === "in-progress"
                                          ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                          : test.status === "missed"
                                            ? "bg-red-100 text-red-800 hover:bg-red-100"
                                            : ""
                                    }
                                  >
                                    {test.status}
                                  </Badge>
                                  <span className="text-sm">Due: {new Date(test.dueDate).toLocaleDateString()}</span>
                                  {test.timeLimit && (
                                    <span className="text-sm">Time Limit: {test.timeLimit} minutes</span>
                                  )}
                                </div>
                                {test.status === "completed" && test.grade && (
                                  <div className="mt-2">
                                    <Badge
                                      className={
                                        test.grade >= 90
                                          ? "bg-green-100 text-green-800"
                                          : test.grade >= 80
                                            ? "bg-blue-100 text-blue-800"
                                            : test.grade >= 70
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-red-100 text-red-800"
                                      }
                                    >
                                      Grade: {test.grade}%
                                    </Badge>
                                  </div>
                                )}
                              </div>
                              <div>
                                {test.status === "upcoming" && (
                                  <Button onClick={() => handleTestSelect(selectedCourse.id, test.id)}>
                                    Start Test
                                  </Button>
                                )}
                                {test.status === "in-progress" && (
                                  <Button onClick={() => handleTestSelect(selectedCourse.id, test.id)}>
                                    Continue Test
                                  </Button>
                                )}
                                {test.status === "completed" && (
                                  <Button
                                    variant="outline"
                                    onClick={() => handleTestSelect(selectedCourse.id, test.id)}
                                  >
                                    View Results
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="announcements" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">Course Announcements</h3>
                    {selectedCourse.announcements.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">No announcements</div>
                    ) : (
                      <div className="space-y-4">
                        {selectedCourse.announcements.map((announcement) => (
                          <Card key={announcement.id}>
                            <CardHeader>
                              <CardTitle className="text-lg">{announcement.title}</CardTitle>
                              <CardDescription>
                                Posted on {new Date(announcement.date).toLocaleDateString()}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p>{announcement.content}</p>
                            </CardContent>
                          </Card>
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

      {/* Test Detail Dialog */}
      {selectedTest && selectedCourse && (
        <Dialog
          open={!!selectedTest && !!selectedCourse}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTest(null)
              if (testInProgress) {
                // Confirm before closing if test is in progress
                if (window.confirm("Are you sure you want to exit the test? Your progress will be lost.")) {
                  setTestInProgress(false)
                  setTimeRemaining(null)
                  setCurrentTestAnswers({})
                } else {
                  return
                }
              }
            }
          }}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedCourse.color }} />
                <DialogTitle>{selectedTest.title}</DialogTitle>
              </div>
              <DialogDescription>{selectedTest.description}</DialogDescription>
            </DialogHeader>

            {testInProgress ? (
              <div className="py-4">
                <div className="sticky top-0 bg-white p-2 border-b mb-4 flex justify-between items-center">
                  <h3 className="font-medium">
                    {selectedCourse.name} - {selectedTest.title}
                  </h3>
                  {timeRemaining !== null && (
                    <Badge variant="outline" className={timeRemaining < 300 ? "bg-red-100 text-red-800" : ""}>
                      <Clock className="h-4 w-4 mr-1" />
                      Time Remaining: {formatTimeRemaining(timeRemaining)}
                    </Badge>
                  )}
                </div>

                <div className="space-y-8">
                  {Array.isArray(selectedTest.questions) &&
                    selectedTest.questions.map((question, index) => (
                      <div key={question.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between mb-2">
                          <h4 className="font-medium">Question {index + 1}</h4>
                          <Badge variant="outline">{question.points}</Badge>
                        </div>
                        <p className="mb-4">{question.text}</p>

                        {question.type === "multiple-choice" && question.options && (
                          <RadioGroup
                            value={currentTestAnswers[question.id]}
                            onValueChange={(value) => handleAnswerChange(question.id, value)}
                          >
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value={optionIndex.toString()}
                                    id={`q${question.id}-o${optionIndex}`}
                                  />
                                  <Label htmlFor={`q${question.id}-o${optionIndex}`}>{option}</Label>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        )}

                        {question.type === "true-false" && (
                          <RadioGroup
                            value={currentTestAnswers[question.id]}
                            onValueChange={(value) => handleAnswerChange(question.id, value)}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id={`q${question.id}-true`} />
                                <Label htmlFor={`q${question.id}-true`}>True</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id={`q${question.id}-false`} />
                                <Label htmlFor={`q${question.id}-false`}>False</Label>
                              </div>
                            </div>
                          </RadioGroup>
                        )}

                        {question.type === "short-answer" && (
                          <Input
                            placeholder="Your answer"
                            value={currentTestAnswers[question.id] || ""}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          />
                        )}

                        {question.type === "essay" && (
                          <Textarea
                            placeholder="Your answer"
                            rows={5}
                            value={currentTestAnswers[question.id] || ""}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSubmitTest}>Submit Test</Button>
                </div>
              </div>
            ) : selectedTest.status === "completed" ? (
              <div className="py-4">
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Test Results</h3>
                      <p className="text-sm text-muted-foreground">
                        Submitted: {selectedTest.submittedAt && new Date(selectedTest.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      className={
                        selectedTest.grade && selectedTest.grade >= 90
                          ? "bg-green-100 text-green-800"
                          : selectedTest.grade && selectedTest.grade >= 80
                            ? "bg-blue-100 text-blue-800"
                            : selectedTest.grade && selectedTest.grade >= 70
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                      }
                    >
                      Grade: {selectedTest.grade}%
                    </Badge>
                  </div>
                </div>

                <div className="text-center py-6">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">Test Completed</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You've completed this test. Your grade is {selectedTest.grade}%.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-medium">Test Information</h3>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <span className="text-muted-foreground">Course:</span>
                      <span>{selectedCourse.name}</span>
                      <span className="text-muted-foreground">Due Date:</span>
                      <span>{new Date(selectedTest.dueDate).toLocaleString()}</span>
                      <span className="text-muted-foreground">Total Points:</span>
                      <span>{selectedTest.totalPoints}</span>
                      <span className="text-muted-foreground">Questions:</span>
                      <span>
                        {typeof selectedTest.questions === "number"
                          ? selectedTest.questions
                          : selectedTest.questions.length}
                      </span>
                      {selectedTest.timeLimit && (
                        <>
                          <span className="text-muted-foreground">Time Limit:</span>
                          <span>{selectedTest.timeLimit} minutes</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                      <div>
                        <h4 className="font-medium text-blue-800">Before You Begin</h4>
                        <ul className="mt-2 text-sm text-blue-700 space-y-1">
                          <li>Make sure you have a stable internet connection</li>
                          <li>Ensure you have enough time to complete the test</li>
                          <li>Once started, the timer cannot be paused</li>
                          <li>Your answers are automatically saved as you progress</li>
                          <li>Submit your test before the time expires</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={handleStartTest}>Start Test</Button>
                </div>
              </div>
            )}

            <DialogFooter>
              {!testInProgress && (
                <Button variant="outline" onClick={() => setSelectedTest(null)}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Material Viewer */}
      {selectedMaterial && (
        <MaterialViewer
          material={{
            id: selectedMaterial.id,
            title: selectedMaterial.name,
            type: selectedMaterial.type,
            url: selectedMaterial.url,
          }}
          onClose={() => setSelectedMaterial(null)}
        />
      )}
    </div>
  )
}
