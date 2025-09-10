"use client"

import React, { useState, useEffect } from "react"
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
  Clock,
  Star,
  TrendingUp,
  DollarSign,
  BarChart3,
  MessageSquare,
  Video,
  Download,
  Eye,
  Trash2
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
import { useToast } from "@/hooks/use-toast"

// Types
interface Tutor {
  id: string
  name: string
  subjects: string[]
  contactEmail: string
  contactPhone: string
  description: string
  image: string
}

interface Student {
  id: string
  name: string
  email: string
  progress: number
  lastActivity: string
  status: "active" | "pending" | "inactive"
  enrolledCourses: string[]
  avatar: string
  grades: Record<string, number>
  totalSessions: number
  nextSession: string
}

interface Course {
  id: string
  name: string
  description: string
  students: number
  nextSession: string
  progress: number
  materials: any[]
  tests: any[]
  color: string
}

interface Session {
  id: string
  courseName: string
  studentName: string
  studentEmail: string
  date: string
  time: string
  duration: number
  type: string
  status: string
  location: string
  notes: string
  materials: any[]
  feedback?: string
}

interface Activity {
  id: string
  type: string
  message: string
  timestamp: string
  studentName: string
}

interface Notification {
  id: string
  message: string
  read: boolean
  timestamp: string
}

interface DashboardData {
  tutor: Tutor
  statistics: {
    totalStudents: number
    totalCourses: number
    activeStudents: number
    completedSessions: number
    averageRating: number
    totalEarnings: number
  }
  upcomingSessions: Session[]
  recentActivities: Activity[]
  students: Student[]
  courses: Course[]
  notifications: Notification[]
}

const TutorDashboardEnhanced = () => {
  const { toast } = useToast()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showAddSession, setShowAddSession] = useState(false)
  const [newStudentEmail, setNewStudentEmail] = useState("")
  const [newSession, setNewSession] = useState({
    courseId: "",
    studentId: "",
    date: "",
    time: "",
    duration: 60,
    type: "1-on-1",
    location: "Online",
    notes: ""
  })

  // Mock tutor ID - in real app, this would come from authentication
  const tutorId = "tutor-1"

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tutor/dashboard?tutorId=${tutorId}`)
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      } else {
        // Fallback to mock data if API fails
        setDashboardData(getMockDashboardData())
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setDashboardData(getMockDashboardData())
    } finally {
      setLoading(false)
    }
  }

  const getMockDashboardData = (): DashboardData => ({
    tutor: {
      id: "tutor-1",
      name: "Dr. Sarah Johnson",
      subjects: ["Mathematics", "Physics", "Chemistry"],
      contactEmail: "sarah.johnson@example.com",
      contactPhone: "+1 (555) 123-4567",
      description: "Experienced tutor with 10+ years in STEM education",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    statistics: {
      totalStudents: 24,
      totalCourses: 8,
      activeStudents: 18,
      completedSessions: 156,
      averageRating: 4.8,
      totalEarnings: 12500
    },
    upcomingSessions: [
      {
        id: "1",
        courseName: "Mathematics Grade 12",
        studentName: "John Doe",
        studentEmail: "john@example.com",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        time: "10:00 AM",
        duration: 60,
        type: "1-on-1",
        status: "scheduled",
        location: "Online",
        notes: "Focus on calculus problems",
        materials: []
      }
    ],
    recentActivities: [
      {
        id: "1",
        type: "session_completed",
        message: "Completed session with John Doe - Mathematics",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        studentName: "John Doe"
      }
    ],
    students: [
      {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        progress: 75,
        lastActivity: new Date().toISOString(),
        status: "active",
        enrolledCourses: ["Mathematics Grade 12"],
        avatar: "https://ui-avatars.com/api/?name=John+Doe&background=random",
        grades: { "Mathematics": 85 },
        totalSessions: 12,
        nextSession: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    courses: [
      {
        id: "1",
        name: "Mathematics Grade 12",
        description: "Advanced mathematics for grade 12 students",
        students: 8,
        nextSession: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        progress: 65,
        materials: [],
        tests: [],
        color: "blue"
      }
    ],
    notifications: [
      {
        id: "1",
        message: "New student enrollment in Mathematics Grade 12",
        read: false,
        timestamp: new Date().toISOString()
      }
    ]
  })

  const handleAddStudent = async () => {
    try {
      const response = await fetch('/api/tutor/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId,
          studentEmail: newStudentEmail,
          courseId: "1" // Default course
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Student added successfully",
        })
        setNewStudentEmail("")
        setShowAddStudent(false)
        fetchDashboardData()
      } else {
        throw new Error('Failed to add student')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add student",
        variant: "destructive",
      })
    }
  }

  const handleAddSession = async () => {
    try {
      const response = await fetch('/api/tutor/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId,
          ...newSession
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Session created successfully",
        })
        setNewSession({
          courseId: "",
          studentId: "",
          date: "",
          time: "",
          duration: 60,
          type: "1-on-1",
          location: "Online",
          notes: ""
        })
        setShowAddSession(false)
        fetchDashboardData()
      } else {
        throw new Error('Failed to create session')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load dashboard data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Tutor Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {dashboardData.tutor.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {dashboardData.tutor.name}!
          </h2>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your tutoring today.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.statistics.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                +{dashboardData.statistics.activeStudents} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.statistics.totalCourses}</div>
              <p className="text-xs text-muted-foreground">
                Across all subjects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.statistics.completedSessions}</div>
              <p className="text-xs text-muted-foreground">
                This semester
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.statistics.averageRating}</div>
              <p className="text-xs text-muted-foreground">
                Out of 5.0
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Upcoming Sessions</span>
                    <Button size="sm" onClick={() => setShowAddSession(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Session
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.upcomingSessions.map((session) => (
                      <div key={session.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{session.courseName}</p>
                          <p className="text-sm text-gray-500">{session.studentName}</p>
                          <p className="text-xs text-gray-400">{session.date} at {session.time}</p>
                        </div>
                        <Badge variant="outline">{session.type}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>My Students ({dashboardData.students.length})</span>
                  <Button onClick={() => setShowAddStudent(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Student
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-gray-500">{student.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={student.progress} className="w-20" />
                            <span className="text-sm">{student.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {new Date(student.lastActivity).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule Session
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.courses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{course.name}</span>
                      <Badge variant="outline">{course.students} students</Badge>
                    </CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} />
                      </div>
                      <div className="text-sm text-gray-500">
                        Next session: {new Date(course.nextSession).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Course
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>All Sessions</span>
                  <Button onClick={() => setShowAddSession(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Session
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.upcomingSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.courseName}</TableCell>
                        <TableCell>{session.studentName}</TableCell>
                        <TableCell>
                          {new Date(session.date).toLocaleDateString()} at {session.time}
                        </TableCell>
                        <TableCell>{session.duration} min</TableCell>
                        <TableCell>
                          <Badge variant="outline">{session.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Video className="h-4 w-4 mr-2" />
                                Join Session
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Rating</span>
                      <span className="text-2xl font-bold">{dashboardData.statistics.averageRating}/5.0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Earnings</span>
                      <span className="text-2xl font-bold">${dashboardData.statistics.totalEarnings}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Students</span>
                      <span className="text-2xl font-bold">{dashboardData.statistics.activeStudents}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full ${notification.read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500">{notification.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Student Dialog */}
      <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Enter the student's email address to add them to your courses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Student Email</Label>
              <Input
                id="email"
                type="email"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
                placeholder="student@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStudent(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent}>
              Add Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Session Dialog */}
      <Dialog open={showAddSession} onOpenChange={setShowAddSession}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule New Session</DialogTitle>
            <DialogDescription>
              Create a new tutoring session with a student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newSession.date}
                  onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={newSession.time}
                  onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newSession.duration}
                  onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="type">Session Type</Label>
                <Select value={newSession.type} onValueChange={(value) => setNewSession({ ...newSession, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-on-1">1-on-1</SelectItem>
                    <SelectItem value="Group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newSession.notes}
                onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                placeholder="Session notes or objectives..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSession(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSession}>
              Schedule Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TutorDashboardEnhanced