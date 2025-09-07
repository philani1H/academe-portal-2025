"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Bell, Calendar, Users, BookOpen, Upload, Plus, Search, FileText,
  CheckCircle, AlertCircle, MoreHorizontal, Send, ChevronDown, Mail,
  Check, X, Edit, User, Settings, LogOut, Menu, Home, Clock, Star,
  TrendingUp, DollarSign, BarChart3, MessageSquare, Video, Download,
  Eye, Trash2, Target, Award, Activity, Zap, Globe, Smartphone,
  Monitor, PieChart, LineChart, BarChart4, MessageCircle, Phone,
  MapPin, GraduationCap, BookMarked, Timer, CheckSquare, AlertTriangle,
  ThumbsUp, ThumbsDown, Filter, RefreshCw, ExternalLink, Copy,
  Share2, Heart, Flag, Archive, Tag, Layers, Grid, List, Maximize2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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

// Enhanced Types
interface TutorStats {
  totalStudents: number
  activeStudents: number
  totalSessions: number
  completedSessions: number
  totalEarnings: number
  monthlyEarnings: number
  averageRating: number
  satisfactionRate: number
  studentGrowth: number
  earningsGrowth: number
  sessionCompletion: number
  responseTime: number
}

interface Student {
  id: string
  name: string
  email: string
  avatar?: string
  course: string
  progress: number
  lastSession: string
  nextSession: string
  totalSessions: number
  rating: number
  status: "active" | "inactive" | "pending"
  phone?: string
  location?: string
  goals: string[]
  strengths: string[]
  areasForImprovement: string[]
  notes: string
}

interface Session {
  id: string
  studentId: string
  studentName: string
  course: string
  date: string
  time: string
  duration: number
  status: "scheduled" | "completed" | "cancelled" | "rescheduled"
  type: "online" | "in-person"
  location?: string
  meetingLink?: string
  notes: string
  materials: string[]
  objectives: string[]
  outcomes: string[]
  rating?: number
  feedback?: string
}

interface Course {
  id: string
  name: string
  description: string
  subject: string
  level: string
  students: number
  maxStudents: number
  status: "active" | "inactive" | "completed"
  startDate: string
  endDate: string
  price: number
  rating: number
  completionRate: number
  materials: string[]
  assignments: number
  tests: number
}

interface Notification {
  id: string
  title: string
  message: string
  type: "session" | "student" | "payment" | "system" | "reminder"
  priority: "low" | "medium" | "high"
  date: string
  read: boolean
  actionRequired: boolean
}

interface RecentActivity {
  id: string
  type: "session_completed" | "student_registered" | "payment_received" | "rating_received" | "message_received"
  description: string
  timestamp: string
  student?: string
  amount?: number
  rating?: number
}

const TutorDashboardUltimate = () => {
  const [activeTab, setActiveTab] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [stats, setStats] = useState<TutorStats>({
    totalStudents: 0,
    activeStudents: 0,
    totalSessions: 0,
    completedSessions: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    averageRating: 0,
    satisfactionRate: 0,
    studentGrowth: 0,
    earningsGrowth: 0,
    sessionCompletion: 0,
    responseTime: 0
  })
  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCourse, setFilterCourse] = useState<string>("all")

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch stats
      const statsResponse = await fetch('/api/tutor/dashboard/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch students
      const studentsResponse = await fetch('/api/tutor/students')
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        setStudents(studentsData)
      }

      // Fetch sessions
      const sessionsResponse = await fetch('/api/tutor/sessions')
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        setSessions(sessionsData)
      }

      // Fetch courses
      const coursesResponse = await fetch('/api/tutor/courses')
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        setCourses(coursesData)
      }

      // Fetch notifications
      const notificationsResponse = await fetch('/api/tutor/notifications')
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json()
        setNotifications(notificationsData)
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/tutor/activity')
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || student.status === filterStatus
    const matchesCourse = filterCourse === "all" || student.course === filterCourse
    return matchesSearch && matchesStatus && matchesCourse
  })

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.course.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: Home, color: "text-blue-600" },
    { id: "students", label: "Students", icon: Users, color: "text-green-600" },
    { id: "sessions", label: "Sessions", icon: Calendar, color: "text-purple-600" },
    { id: "courses", label: "Courses", icon: BookOpen, color: "text-orange-600" },
    { id: "analytics", label: "Analytics", icon: BarChart3, color: "text-indigo-600" },
    { id: "messages", label: "Messages", icon: MessageSquare, color: "text-pink-600" },
    { id: "earnings", label: "Earnings", icon: DollarSign, color: "text-green-600" },
    { id: "settings", label: "Settings", icon: Settings, color: "text-gray-600" }
  ]

  const StatCard = ({ title, value, change, icon: Icon, color, format = "number" }: {
    title: string
    value: number
    change: number
    icon: any
    color: string
    format?: "number" | "currency" | "percentage" | "time"
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case "currency":
          return `$${val.toLocaleString()}`
        case "percentage":
          return `${val}%`
        case "time":
          return `${val}min`
        default:
          return val.toLocaleString()
      }
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
            <Icon className={`h-4 w-4 ${color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatValue(value)}</div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
                {change >= 0 ? "+" : ""}{change}% from last month
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          change={stats.studentGrowth}
          icon={Users}
          color="text-blue-600"
        />
        <StatCard
          title="Monthly Earnings"
          value={stats.monthlyEarnings}
          change={stats.earningsGrowth}
          icon={DollarSign}
          color="text-green-600"
          format="currency"
        />
        <StatCard
          title="Average Rating"
          value={stats.averageRating}
          change={stats.satisfactionRate}
          icon={Star}
          color="text-yellow-600"
        />
        <StatCard
          title="Response Time"
          value={stats.responseTime}
          change={stats.sessionCompletion}
          icon={Clock}
          color="text-purple-600"
          format="time"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center space-y-2">
              <Plus className="h-6 w-6" />
              <span className="text-sm">New Session</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">Add Student</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <BookOpen className="h-6 w-6" />
              <span className="text-sm">Create Course</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <MessageSquare className="h-6 w-6" />
              <span className="text-sm">Send Message</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>Your sessions for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.filter(session => 
              new Date(session.date).toDateString() === new Date().toDateString()
            ).slice(0, 5).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{session.studentName}</p>
                    <p className="text-sm text-gray-500">{session.course} • {session.time}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'}>
                    {session.status}
                  </Badge>
                  <Button size="sm" variant="outline">
                    <Video className="h-4 w-4 mr-2" />
                    Join
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest activities and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Activity className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
                {activity.amount && (
                  <Badge variant="outline">${activity.amount}</Badge>
                )}
                {activity.rating && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-medium">{activity.rating}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const StudentsTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Student Management</CardTitle>
          <CardDescription>Manage your students and their progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.name}>{course.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{student.name}</CardTitle>
                    <CardDescription>{student.course}</CardDescription>
                  </div>
                </div>
                <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                  {student.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{student.progress}%</span>
                  </div>
                  <Progress value={student.progress} className="h-2" />
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Sessions:</span>
                  <span className="font-medium">{student.totalSessions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Rating:</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="font-medium">{student.rating}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Last Session:</span>
                  <span className="font-medium">{new Date(student.lastSession).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex space-x-2 w-full">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )

  const SessionsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>Manage your tutoring sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{session.studentName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{session.studentName}</p>
                        <p className="text-sm text-gray-500">{session.course}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{session.course}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{new Date(session.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">{session.time}</p>
                    </div>
                  </TableCell>
                  <TableCell>{session.duration} min</TableCell>
                  <TableCell>
                    <Badge variant={session.type === 'online' ? 'default' : 'secondary'}>
                      {session.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      session.status === 'completed' ? 'default' :
                      session.status === 'scheduled' ? 'secondary' :
                      session.status === 'cancelled' ? 'destructive' : 'outline'
                    }>
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
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Session
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Video className="h-4 w-4 mr-2" />
                          Join Session
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancel Session
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
    </div>
  )

  const CoursesTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Course Management</CardTitle>
          <CardDescription>Manage your courses and materials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{course.name}</CardTitle>
                      <CardDescription>{course.subject} • {course.level}</CardDescription>
                    </div>
                    <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                      {course.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{course.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Students:</span>
                      <span className="font-medium">{course.students}/{course.maxStudents}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Price:</span>
                      <span className="font-medium">${course.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Rating:</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="font-medium">{course.rating}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Completion:</span>
                      <span className="font-medium">{course.completionRate}%</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex space-x-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const AnalyticsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Your teaching performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Session Completion Rate</span>
                  <span>{stats.sessionCompletion}%</span>
                </div>
                <Progress value={stats.sessionCompletion} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Student Satisfaction</span>
                  <span>{stats.satisfactionRate}%</span>
                </div>
                <Progress value={stats.satisfactionRate} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Average Rating</span>
                  <span>{stats.averageRating}/5</span>
                </div>
                <Progress value={(stats.averageRating / 5) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Earnings Overview</CardTitle>
            <CardDescription>Your financial performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Earnings Chart</p>
                <p className="text-sm text-gray-400">Interactive chart will be displayed here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Progress</CardTitle>
          <CardDescription>Track student performance across courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Progress Chart</p>
              <p className="text-sm text-gray-400">Interactive chart will be displayed here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const MessagesTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>Communicate with your students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {students.slice(0, 5).map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.course}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const EarningsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Earnings</CardTitle>
            <CardDescription>All time earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${stats.totalEarnings.toLocaleString()}
            </div>
            <div className="flex items-center text-sm text-gray-500 mt-2">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-green-600">+{stats.earningsGrowth}% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Earnings</CardTitle>
            <CardDescription>This month's earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              ${stats.monthlyEarnings.toLocaleString()}
            </div>
            <div className="flex items-center text-sm text-gray-500 mt-2">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Current month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average per Session</CardTitle>
            <CardDescription>Average earnings per session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              ${Math.round(stats.totalEarnings / Math.max(stats.completedSessions, 1))}
            </div>
            <div className="flex items-center text-sm text-gray-500 mt-2">
              <Target className="h-4 w-4 mr-1" />
              <span>Per session</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
          <CardDescription>Track your earnings over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart4 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Earnings History Chart</p>
              <p className="text-sm text-gray-400">Interactive chart will be displayed here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                {sidebarItems.find(item => item.id === activeTab)?.label || "Tutor Dashboard"}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-5 w-5 mr-2" />
                    Dr. Sarah Wilson
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-sm transition-all duration-300 ease-in-out`}>
          <div className="p-4">
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center ${
                      !sidebarOpen ? "justify-center" : "justify-start"
                    } w-full px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === item.id ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2 flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "students" && <StudentsTab />}
            {activeTab === "sessions" && <SessionsTab />}
            {activeTab === "courses" && <CoursesTab />}
            {activeTab === "analytics" && <AnalyticsTab />}
            {activeTab === "messages" && <MessagesTab />}
            {activeTab === "earnings" && <EarningsTab />}
            {activeTab === "settings" && (
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>Manage your tutor profile and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Settings panel will be implemented here.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default TutorDashboardUltimate