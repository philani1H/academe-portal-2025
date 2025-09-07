"use client"

import React, { useState, useEffect } from "react"
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
  Star,
  TrendingUp,
  Award,
  Target,
  MessageSquare,
  Video,
  Upload
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
import { useToast } from "@/hooks/use-toast"

// Types
interface Student {
  id: string
  name: string
  email: string
  avatar: string
}

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
  enrollmentDate: string
  status: string
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
  questions: number
  totalPoints: number
  status: "upcoming" | "in-progress" | "completed" | "missed"
  score?: number
  timeLimit: number
}

interface Announcement {
  id: string
  title: string
  content: string
  date: string
  type: "info" | "warning" | "success"
}

interface Session {
  id: string
  courseName: string
  tutorName: string
  date: string
  time: string
  duration: string
  type: string
  location: string
}

interface Activity {
  id: string
  type: string
  message: string
  timestamp: string
  courseName: string
}

interface Notification {
  id: string
  message: string
  read: boolean
  timestamp: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  date: string
}

interface DashboardData {
  student: Student
  statistics: {
    totalCourses: number
    completedCourses: number
    activeCourses: number
    averageGrade: number
    totalStudyHours: number
    streak: number
  }
  upcomingSessions: Session[]
  recentActivities: Activity[]
  courses: Course[]
  notifications: Notification[]
  achievements: Achievement[]
}

const StudentDashboardEnhanced = () => {
  const { toast } = useToast()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showEnrollCourse, setShowEnrollCourse] = useState(false)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({})

  // Mock student ID - in real app, this would come from authentication
  const studentId = "student-1"

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/student/dashboard?studentId=${studentId}`)
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
    student: {
      id: "student-1",
      name: "John Doe",
      email: "john.doe@example.com",
      avatar: "https://ui-avatars.com/api/?name=John+Doe&background=random"
    },
    statistics: {
      totalCourses: 4,
      completedCourses: 1,
      activeCourses: 3,
      averageGrade: 85.5,
      totalStudyHours: 45,
      streak: 7
    },
    upcomingSessions: [
      {
        id: "1",
        courseName: "Mathematics Grade 12",
        tutorName: "Dr. Smith",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        time: "10:00 AM",
        duration: "60 minutes",
        type: "1-on-1",
        location: "Online"
      }
    ],
    recentActivities: [
      {
        id: "1",
        type: "assignment_submitted",
        message: "Submitted Mathematics assignment",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        courseName: "Mathematics Grade 12"
      }
    ],
    courses: [
      {
        id: "1",
        name: "Mathematics Grade 12",
        description: "Advanced mathematics for grade 12 students",
        tutor: "Dr. Smith",
        tutorEmail: "dr.smith@example.com",
        nextSession: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        progress: 65,
        materials: [
          {
            id: "1",
            name: "Course Syllabus",
            type: "pdf",
            url: "/materials/syllabus.pdf",
            dateAdded: new Date().toISOString(),
            completed: true,
            description: "Course overview and requirements"
          }
        ],
        tests: [
          {
            id: "1",
            title: "Midterm Exam",
            description: "Test covering chapters 1-5",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            questions: 20,
            totalPoints: 100,
            status: "upcoming",
            timeLimit: 90
          }
        ],
        color: "blue",
        announcements: [
          {
            id: "1",
            title: "Important: Midterm Exam Next Week",
            content: "Please prepare for the midterm exam scheduled for next Tuesday.",
            date: new Date().toISOString(),
            type: "info"
          }
        ],
        grade: 85,
        enrollmentDate: new Date().toISOString(),
        status: "enrolled"
      }
    ],
    notifications: [
      {
        id: "1",
        message: "New assignment posted in Mathematics Grade 12",
        read: false,
        timestamp: new Date().toISOString()
      }
    ],
    achievements: [
      {
        id: "1",
        title: "First Assignment",
        description: "Completed your first assignment",
        icon: "🎯",
        unlocked: true,
        date: new Date().toISOString()
      }
    ]
  })

  const handleEnrollCourse = async (courseId: string) => {
    try {
      const response = await fetch('/api/student/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          courseId
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Successfully enrolled in course",
        })
        setShowEnrollCourse(false)
        fetchDashboardData()
      } else {
        throw new Error('Failed to enroll in course')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive",
      })
    }
  }

  const handleSubmitTest = async () => {
    if (!selectedTest) return

    try {
      const response = await fetch('/api/student/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          testId: selectedTest.id,
          answers: testAnswers
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test submitted successfully",
        })
        setShowTestDialog(false)
        setTestAnswers({})
        setSelectedTest(null)
        fetchDashboardData()
      } else {
        throw new Error('Failed to submit test')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit test",
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
              <h1 className="text-xl font-semibold text-gray-900">Student Dashboard</h1>
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
                    {dashboardData.student.name}
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
            Welcome back, {dashboardData.student.name}!
          </h2>
          <p className="text-gray-600 mt-1">
            Keep up the great work! You're making excellent progress.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.statistics.activeCourses}</div>
              <p className="text-xs text-muted-foreground">
                Out of {dashboardData.statistics.totalCourses} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.statistics.averageGrade}%</div>
              <p className="text-xs text-muted-foreground">
                Great job!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.statistics.streak} days</div>
              <p className="text-xs text-muted-foreground">
                Keep it up!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.statistics.totalStudyHours}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Sessions</CardTitle>
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
                          <p className="text-sm text-gray-500">with {session.tutorName}</p>
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
                          <p className="text-xs text-gray-500">{activity.courseName}</p>
                          <p className="text-xs text-gray-400">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dashboardData.achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div>
                        <p className="font-medium">{achievement.title}</p>
                        <p className="text-sm text-gray-500">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">My Courses</h3>
              <Button onClick={() => setShowEnrollCourse(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Enroll in Course
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.courses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{course.name}</span>
                      <Badge variant="outline">{course.status}</Badge>
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
                        <p>Tutor: {course.tutor}</p>
                        <p>Next session: {new Date(course.nextSession).toLocaleDateString()}</p>
                        {course.grade && <p>Current grade: {course.grade}%</p>}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => setSelectedCourse(course)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Course
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assignments & Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {dashboardData.courses.map((course) => (
                    <div key={course.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">{course.name}</h4>
                      <div className="space-y-3">
                        {course.materials.map((material) => (
                          <div key={material.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                {material.type === 'pdf' && <FileText className="h-5 w-5 text-red-500" />}
                                {material.type === 'video' && <Play className="h-5 w-5 text-blue-500" />}
                                {material.type === 'document' && <FileText className="h-5 w-5 text-gray-500" />}
                              </div>
                              <div>
                                <p className="font-medium">{material.name}</p>
                                <p className="text-sm text-gray-500">{material.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {material.completed && (
                                <Badge variant="default">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tests & Exams</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.courses.flatMap(course => 
                      course.tests.map(test => (
                        <TableRow key={test.id}>
                          <TableCell className="font-medium">{test.title}</TableCell>
                          <TableCell>{course.name}</TableCell>
                          <TableCell>{new Date(test.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={
                              test.status === 'completed' ? 'default' : 
                              test.status === 'upcoming' ? 'secondary' : 'destructive'
                            }>
                              {test.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {test.score ? `${test.score}%` : '-'}
                          </TableCell>
                          <TableCell>
                            {test.status === 'upcoming' ? (
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  setSelectedTest(test)
                                  setShowTestDialog(true)
                                }}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Take Test
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                View Results
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.courses.map((course) => (
                      <div key={course.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{course.name}</span>
                          <span className="text-sm text-gray-500">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Grade</span>
                      <span className="text-2xl font-bold">{dashboardData.statistics.averageGrade}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Study Streak</span>
                      <span className="text-2xl font-bold">{dashboardData.statistics.streak} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Study Hours</span>
                      <span className="text-2xl font-bold">{dashboardData.statistics.totalStudyHours}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Enroll Course Dialog */}
      <Dialog open={showEnrollCourse} onOpenChange={setShowEnrollCourse}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll in Course</DialogTitle>
            <DialogDescription>
              Choose a course to enroll in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Available Courses</Label>
              <div className="space-y-2">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">Physics Grade 11</h4>
                  <p className="text-sm text-gray-500">Comprehensive physics course for grade 11 students</p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => handleEnrollCourse("physics-11")}
                  >
                    Enroll
                  </Button>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">Chemistry Grade 12</h4>
                  <p className="text-sm text-gray-500">Advanced chemistry course for grade 12 students</p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => handleEnrollCourse("chemistry-12")}
                  >
                    Enroll
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnrollCourse(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTest?.title}</DialogTitle>
            <DialogDescription>
              {selectedTest?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedTest && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Time Limit:</span> {selectedTest.timeLimit} minutes
                  </div>
                  <div>
                    <span className="font-medium">Questions:</span> {selectedTest.questions}
                  </div>
                  <div>
                    <span className="font-medium">Total Points:</span> {selectedTest.totalPoints}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-6">
                  {/* Mock questions */}
                  {[1, 2, 3].map((questionNum) => (
                    <div key={questionNum} className="space-y-3">
                      <h4 className="font-medium">Question {questionNum}</h4>
                      <p className="text-sm text-gray-600">
                        What is the correct answer to this question?
                      </p>
                      <RadioGroup
                        value={testAnswers[`q${questionNum}`] || ""}
                        onValueChange={(value) => setTestAnswers({...testAnswers, [`q${questionNum}`]: value})}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="a" id={`q${questionNum}-a`} />
                          <Label htmlFor={`q${questionNum}-a`}>Option A</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="b" id={`q${questionNum}-b`} />
                          <Label htmlFor={`q${questionNum}-b`}>Option B</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="c" id={`q${questionNum}-c`} />
                          <Label htmlFor={`q${questionNum}-c`}>Option C</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="d" id={`q${questionNum}-d`} />
                          <Label htmlFor={`q${questionNum}-d`}>Option D</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitTest}>
              Submit Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StudentDashboardEnhanced