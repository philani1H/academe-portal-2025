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
  Share2, Heart, Flag, Archive, Tag, Layers, Grid, List, Maximize2,
  Play, Pause, RotateCcw, BookOpenCheck, Brain, Lightbulb, Trophy,
  TrendingDown, ArrowUp, ArrowDown, Minus, Plus as PlusIcon
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
interface StudentStats {
  totalCourses: number
  activeCourses: number
  completedCourses: number
  totalSessions: number
  completedSessions: number
  averageGrade: number
  improvementRate: number
  studyHours: number
  weeklyGoal: number
  streak: number
  achievements: number
  nextExam: string
  overallProgress: number
}

interface Course {
  id: string
  name: string
  description: string
  subject: string
  level: string
  tutor: string
  tutorAvatar?: string
  progress: number
  status: "active" | "completed" | "paused"
  startDate: string
  endDate: string
  nextSession: string
  totalSessions: number
  completedSessions: number
  assignments: number
  completedAssignments: number
  tests: number
  completedTests: number
  grade: number
  color: string
  materials: string[]
  announcements: string[]
}

interface Assignment {
  id: string
  title: string
  description: string
  course: string
  dueDate: string
  status: "pending" | "in_progress" | "completed" | "late"
  priority: "low" | "medium" | "high"
  type: "homework" | "project" | "essay" | "presentation"
  grade?: number
  feedback?: string
  materials: string[]
  instructions: string[]
}

interface Test {
  id: string
  title: string
  course: string
  date: string
  duration: number
  status: "upcoming" | "in_progress" | "completed" | "missed"
  score?: number
  totalQuestions: number
  answeredQuestions: number
  timeRemaining?: number
  instructions: string[]
  topics: string[]
}

interface Session {
  id: string
  course: string
  tutor: string
  date: string
  time: string
  duration: number
  status: "scheduled" | "completed" | "cancelled"
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

interface Notification {
  id: string
  title: string
  message: string
  type: "assignment" | "test" | "session" | "grade" | "announcement"
  priority: "low" | "medium" | "high"
  date: string
  read: boolean
  actionRequired: boolean
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  date: string
  category: "academic" | "participation" | "improvement" | "milestone"
  points: number
  rarity: "common" | "rare" | "epic" | "legendary"
}

const StudentDashboardUltimate = () => {
  const [activeTab, setActiveTab] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [stats, setStats] = useState<StudentStats>({
    totalCourses: 0,
    activeCourses: 0,
    completedCourses: 0,
    totalSessions: 0,
    completedSessions: 0,
    averageGrade: 0,
    improvementRate: 0,
    studyHours: 0,
    weeklyGoal: 0,
    streak: 0,
    achievements: 0,
    nextExam: "",
    overallProgress: 0
  })
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
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
      const statsResponse = await fetch('/api/student/dashboard/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch courses
      const coursesResponse = await fetch('/api/student/courses')
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        setCourses(coursesData)
      }

      // Fetch assignments
      const assignmentsResponse = await fetch('/api/student/assignments')
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        setAssignments(assignmentsData)
      }

      // Fetch tests
      const testsResponse = await fetch('/api/student/tests')
      if (testsResponse.ok) {
        const testsData = await testsResponse.json()
        setTests(testsData)
      }

      // Fetch sessions
      const sessionsResponse = await fetch('/api/student/sessions')
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        setSessions(sessionsData)
      }

      // Fetch notifications
      const notificationsResponse = await fetch('/api/student/notifications')
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json()
        setNotifications(notificationsData)
      }

      // Fetch achievements
      const achievementsResponse = await fetch('/api/student/achievements')
      if (achievementsResponse.ok) {
        const achievementsData = await achievementsResponse.json()
        setAchievements(achievementsData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || course.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.course.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || assignment.status === filterStatus
    const matchesCourse = filterCourse === "all" || assignment.course === filterCourse
    return matchesSearch && matchesStatus && matchesCourse
  })

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: Home, color: "text-blue-600" },
    { id: "courses", label: "Courses", icon: BookOpen, color: "text-green-600" },
    { id: "assignments", label: "Assignments", icon: FileText, color: "text-purple-600" },
    { id: "tests", label: "Tests", icon: CheckSquare, color: "text-orange-600" },
    { id: "sessions", label: "Sessions", icon: Calendar, color: "text-indigo-600" },
    { id: "progress", label: "Progress", icon: TrendingUp, color: "text-pink-600" },
    { id: "achievements", label: "Achievements", icon: Trophy, color: "text-yellow-600" },
    { id: "messages", label: "Messages", icon: MessageSquare, color: "text-red-600" }
  ]

  const StatCard = ({ title, value, change, icon: Icon, color, format = "number" }: {
    title: string
    value: number
    change: number
    icon: any
    color: string
    format?: "number" | "percentage" | "time" | "grade"
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case "percentage":
          return `${val}%`
        case "time":
          return `${val}h`
        case "grade":
          return `${val}%`
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
              {change >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
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
          title="Active Courses"
          value={stats.activeCourses}
          change={stats.improvementRate}
          icon={BookOpen}
          color="text-blue-600"
        />
        <StatCard
          title="Average Grade"
          value={stats.averageGrade}
          change={stats.improvementRate}
          icon={Star}
          color="text-yellow-600"
          format="grade"
        />
        <StatCard
          title="Study Hours"
          value={stats.studyHours}
          change={stats.improvementRate}
          icon={Clock}
          color="text-green-600"
          format="time"
        />
        <StatCard
          title="Achievements"
          value={stats.achievements}
          change={stats.improvementRate}
          icon={Trophy}
          color="text-purple-600"
        />
      </div>

      {/* Study Streak */}
      <Card>
        <CardHeader>
          <CardTitle>Study Streak</CardTitle>
          <CardDescription>Keep your learning momentum going!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">{stats.streak}</div>
                <div className="text-sm text-gray-500">Days in a row</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Weekly Goal</div>
              <div className="text-lg font-semibold">{stats.studyHours}/{stats.weeklyGoal} hours</div>
              <Progress value={(stats.studyHours / stats.weeklyGoal) * 100} className="w-32 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tasks</CardTitle>
          <CardDescription>Your next assignments and tests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.filter(a => a.status === 'pending').slice(0, 3).map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-sm text-gray-500">{assignment.course} • Due {new Date(assignment.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <Badge variant={assignment.priority === 'high' ? 'destructive' : assignment.priority === 'medium' ? 'default' : 'secondary'}>
                  {assignment.priority}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
          <CardDescription>Your latest accomplishments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.slice(0, 6).map((achievement) => (
              <div key={achievement.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{achievement.title}</p>
                  <p className="text-xs text-gray-500">{achievement.category}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const CoursesTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
          <CardDescription>Track your course progress and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search courses..."
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>{course.tutor.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <CardDescription>{course.subject} • {course.level}</CardDescription>
                  </div>
                </div>
                <Badge variant={course.status === 'active' ? 'default' : course.status === 'completed' ? 'secondary' : 'outline'}>
                  {course.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Sessions:</span>
                    <span className="font-medium ml-1">{course.completedSessions}/{course.totalSessions}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Grade:</span>
                    <span className="font-medium ml-1">{course.grade}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Assignments:</span>
                    <span className="font-medium ml-1">{course.completedAssignments}/{course.assignments}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tests:</span>
                    <span className="font-medium ml-1">{course.completedTests}/{course.tests}</span>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Next Session:</span>
                  <span className="font-medium ml-1">{new Date(course.nextSession).toLocaleDateString()}</span>
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
                  <Play className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )

  const AssignmentsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
          <CardDescription>Track your assignments and deadlines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search assignments..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="late">Late</SelectItem>
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
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-gray-500">{assignment.type}</p>
                    </div>
                  </TableCell>
                  <TableCell>{assignment.course}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{new Date(assignment.dueDate).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">{new Date(assignment.dueDate).toLocaleTimeString()}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={assignment.priority === 'high' ? 'destructive' : assignment.priority === 'medium' ? 'default' : 'secondary'}>
                      {assignment.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      assignment.status === 'completed' ? 'default' :
                      assignment.status === 'in_progress' ? 'secondary' :
                      assignment.status === 'late' ? 'destructive' : 'outline'
                    }>
                      {assignment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {assignment.grade ? (
                      <span className="font-medium">{assignment.grade}%</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
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
                          Submit Work
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download Materials
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

  const TestsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tests & Exams</CardTitle>
          <CardDescription>Track your upcoming tests and exam results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <Card key={test.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{test.title}</CardTitle>
                      <CardDescription>{test.course}</CardDescription>
                    </div>
                    <Badge variant={
                      test.status === 'completed' ? 'default' :
                      test.status === 'in_progress' ? 'secondary' :
                      test.status === 'upcoming' ? 'outline' : 'destructive'
                    }>
                      {test.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Date:</span>
                      <span className="font-medium">{new Date(test.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Duration:</span>
                      <span className="font-medium">{test.duration} minutes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Questions:</span>
                      <span className="font-medium">{test.answeredQuestions}/{test.totalQuestions}</span>
                    </div>
                    {test.score && (
                      <div className="flex justify-between text-sm">
                        <span>Score:</span>
                        <span className="font-medium text-green-600">{test.score}%</span>
                      </div>
                    )}
                    {test.timeRemaining && (
                      <div className="flex justify-between text-sm">
                        <span>Time Remaining:</span>
                        <span className="font-medium text-orange-600">{test.timeRemaining} min</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex space-x-2 w-full">
                    {test.status === 'upcoming' && (
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    )}
                    {test.status === 'in_progress' && (
                      <Button size="sm" className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Continue Test
                      </Button>
                    )}
                    {test.status === 'completed' && (
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        View Results
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const SessionsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
          <CardDescription>Your scheduled tutoring sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.filter(session => session.status === 'scheduled').map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{session.course}</p>
                    <p className="text-sm text-gray-500">with {session.tutor}</p>
                    <p className="text-sm text-gray-500">{new Date(session.date).toLocaleDateString()} at {session.time}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={session.type === 'online' ? 'default' : 'secondary'}>
                    {session.type}
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
    </div>
  )

  const ProgressTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>Your learning journey overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Progress</span>
                  <span>{stats.overallProgress}%</span>
                </div>
                <Progress value={stats.overallProgress} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Course Completion</span>
                  <span>{Math.round((stats.completedCourses / stats.totalCourses) * 100)}%</span>
                </div>
                <Progress value={(stats.completedCourses / stats.totalCourses) * 100} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Session Attendance</span>
                  <span>{Math.round((stats.completedSessions / stats.totalSessions) * 100)}%</span>
                </div>
                <Progress value={(stats.completedSessions / stats.totalSessions) * 100} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grade Trends</CardTitle>
            <CardDescription>Your academic performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Grade Trends Chart</p>
                <p className="text-sm text-gray-400">Interactive chart will be displayed here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Study Analytics</CardTitle>
          <CardDescription>Your study habits and patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="font-semibold text-blue-800">Study Hours</p>
              <p className="text-sm text-blue-600">{stats.studyHours} hours this week</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-800">Study Streak</p>
              <p className="text-sm text-green-600">{stats.streak} days in a row</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="font-semibold text-purple-800">Improvement</p>
              <p className="text-sm text-purple-600">+{stats.improvementRate}% this month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const AchievementsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Your accomplishments and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="relative">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      achievement.rarity === 'legendary' ? 'bg-yellow-100' :
                      achievement.rarity === 'epic' ? 'bg-purple-100' :
                      achievement.rarity === 'rare' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Trophy className={`h-6 w-6 ${
                        achievement.rarity === 'legendary' ? 'text-yellow-600' :
                        achievement.rarity === 'epic' ? 'text-purple-600' :
                        achievement.rarity === 'rare' ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{achievement.title}</CardTitle>
                      <CardDescription>{achievement.category}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">{achievement.rarity}</Badge>
                    <span className="text-sm text-gray-500">{new Date(achievement.date).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
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
          <CardDescription>Communicate with your tutors and peers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courses.slice(0, 5).map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>{course.tutor.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{course.tutor}</p>
                    <p className="text-sm text-gray-500">{course.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button size="sm" variant="outline">
                    <Video className="h-4 w-4 mr-2" />
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
                {sidebarItems.find(item => item.id === activeTab)?.label || "Student Dashboard"}
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
                    John Doe
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
            {activeTab === "courses" && <CoursesTab />}
            {activeTab === "assignments" && <AssignmentsTab />}
            {activeTab === "tests" && <TestsTab />}
            {activeTab === "sessions" && <SessionsTab />}
            {activeTab === "progress" && <ProgressTab />}
            {activeTab === "achievements" && <AchievementsTab />}
            {activeTab === "messages" && <MessagesTab />}
          </div>
        </main>
      </div>
    </div>
  )
}

export default StudentDashboardUltimate