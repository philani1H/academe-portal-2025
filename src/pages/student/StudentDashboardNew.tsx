"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardWrapper from '@/components/DashboardWrapper'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import dashboardService from '@/services/dashboardService'
import {
  BookOpen,
  Calendar,
  FileText,
  Clock,
  TrendingUp,
  Award,
  Bell,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Play
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface StudentStats {
  enrolledCourses: number
  completedAssignments: number
  upcomingTests: number
  averageGrade: number
  totalHours: number
  certificates: number
}

interface Course {
  id: string
  name: string
  description: string
  tutor: string
  progress: number
  nextSession: string
  status: 'active' | 'completed' | 'pending'
  materials: number
  assignments: number
  tests: number
}

interface Assignment {
  id: string
  title: string
  course: string
  dueDate: string
  status: 'pending' | 'submitted' | 'graded'
  grade?: number
  description: string
}

interface Test {
  id: string
  title: string
  course: string
  date: string
  duration: number
  status: 'upcoming' | 'in-progress' | 'completed'
  score?: number
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StudentStats>({
    enrolledCourses: 0,
    completedAssignments: 0,
    upcomingTests: 0,
    averageGrade: 0,
    totalHours: 0,
    certificates: 0
  })
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Load dashboard data
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Mock data for now - replace with actual API calls
      const mockStats: StudentStats = {
        enrolledCourses: 4,
        completedAssignments: 12,
        upcomingTests: 3,
        averageGrade: 87.5,
        totalHours: 45,
        certificates: 2
      }

      const mockCourses: Course[] = [
        {
          id: '1',
          name: 'Advanced Mathematics',
          description: 'Comprehensive study of calculus and algebra',
          tutor: 'Dr. Sarah Johnson',
          progress: 75,
          nextSession: '2024-01-15',
          status: 'active',
          materials: 15,
          assignments: 8,
          tests: 3
        },
        {
          id: '2',
          name: 'Web Development',
          description: 'Full-stack web development with React and Node.js',
          tutor: 'Prof. Mike Chen',
          progress: 60,
          nextSession: '2024-01-16',
          status: 'active',
          materials: 20,
          assignments: 12,
          tests: 4
        },
        {
          id: '3',
          name: 'Data Science',
          description: 'Introduction to data analysis and machine learning',
          tutor: 'Dr. Emily Davis',
          progress: 100,
          nextSession: '2024-01-20',
          status: 'completed',
          materials: 25,
          assignments: 15,
          tests: 5
        }
      ]

      const mockAssignments: Assignment[] = [
        {
          id: '1',
          title: 'Calculus Problem Set 3',
          course: 'Advanced Mathematics',
          dueDate: '2024-01-20',
          status: 'pending',
          description: 'Solve problems 1-20 from chapter 5'
        },
        {
          id: '2',
          title: 'React Component Project',
          course: 'Web Development',
          dueDate: '2024-01-18',
          status: 'submitted',
          description: 'Build a todo app with React hooks'
        },
        {
          id: '3',
          title: 'Data Analysis Report',
          course: 'Data Science',
          dueDate: '2024-01-15',
          status: 'graded',
          grade: 92,
          description: 'Analyze the provided dataset and write a report'
        }
      ]

      const mockTests: Test[] = [
        {
          id: '1',
          title: 'Mathematics Midterm',
          course: 'Advanced Mathematics',
          date: '2024-01-25',
          duration: 120,
          status: 'upcoming'
        },
        {
          id: '2',
          title: 'Web Development Quiz',
          course: 'Web Development',
          date: '2024-01-22',
          duration: 60,
          status: 'upcoming'
        },
        {
          id: '3',
          title: 'Data Science Final',
          course: 'Data Science',
          date: '2024-01-10',
          duration: 180,
          status: 'completed',
          score: 88
        }
      ]

      setStats(mockStats)
      setCourses(mockCourses)
      setAssignments(mockAssignments)
      setTests(mockTests)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadDashboardData()
    toast({
      title: "Data Refreshed",
      description: "Dashboard data has been updated"
    })
  }

  const handleSubmitAssignment = (assignmentId: string) => {
    toast({
      title: "Assignment Submitted",
      description: "Your assignment has been submitted successfully"
    })
    // Update assignment status
    setAssignments(assignments.map(a => 
      a.id === assignmentId ? { ...a, status: 'submitted' } : a
    ))
  }

  const handleStartTest = (testId: string) => {
    toast({
      title: "Test Started",
      description: "Good luck with your test!"
    })
    // Update test status
    setTests(tests.map(t => 
      t.id === testId ? { ...t, status: 'in-progress' } : t
    ))
  }

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const upcomingAssignments = assignments.filter(a => a.status === 'pending')
  const upcomingTests = tests.filter(t => t.status === 'upcoming')

  if (loading) {
    return (
      <ProtectedRoute requiredRole="student">
        <DashboardWrapper title="Student Dashboard" description="Your learning journey">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </DashboardWrapper>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="student">
      <DashboardWrapper title="Student Dashboard" description="Your learning journey">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.enrolledCourses}</div>
                    <p className="text-xs text-muted-foreground">
                      Active courses
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Tests</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.upcomingTests}</div>
                    <p className="text-xs text-muted-foreground">
                      Next 7 days
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.averageGrade}%</div>
                    <p className="text-xs text-muted-foreground">
                      Overall performance
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Upcoming Assignments
                  </CardTitle>
                  <CardDescription>
                    Assignments due soon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingAssignments.slice(0, 3).map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-gray-500">{assignment.course}</p>
                          <p className="text-xs text-gray-400">Due: {assignment.dueDate}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSubmitAssignment(assignment.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Submit
                        </Button>
                      </div>
                    ))}
                    {upcomingAssignments.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No upcoming assignments
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Tests
                  </CardTitle>
                  <CardDescription>
                    Tests scheduled soon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingTests.slice(0, 3).map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{test.title}</p>
                          <p className="text-sm text-gray-500">{test.course}</p>
                          <p className="text-xs text-gray-400">
                            {test.date} • {test.duration} min
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleStartTest(test.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      </div>
                    ))}
                    {upcomingTests.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No upcoming tests
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Courses</CardTitle>
                    <CardDescription>
                      Track your course progress and access materials
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                    <Button onClick={handleRefresh} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{course.name}</CardTitle>
                          <Badge
                            variant={course.status === 'active' ? 'default' : 'secondary'}
                          >
                            {course.status}
                          </Badge>
                        </div>
                        <CardDescription>{course.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span>Tutor:</span>
                            <span className="font-medium">{course.tutor}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{course.progress}%</span>
                            </div>
                            <Progress value={course.progress} className="w-full" />
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-center text-sm">
                            <div>
                              <p className="font-medium">{course.materials}</p>
                              <p className="text-gray-500">Materials</p>
                            </div>
                            <div>
                              <p className="font-medium">{course.assignments}</p>
                              <p className="text-gray-500">Assignments</p>
                            </div>
                            <div>
                              <p className="font-medium">{course.tests}</p>
                              <p className="text-gray-500">Tests</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" className="flex-1">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Download className="h-4 w-4 mr-1" />
                              Materials
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Assignments</CardTitle>
                    <CardDescription>
                      Track and submit your assignments
                    </CardDescription>
                  </div>
                  <Button onClick={handleRefresh} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{assignment.title}</p>
                            <p className="text-sm text-gray-500">{assignment.course}</p>
                            <p className="text-xs text-gray-400">{assignment.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">Due: {assignment.dueDate}</p>
                          <Badge
                            variant={
                              assignment.status === 'graded' ? 'default' :
                              assignment.status === 'submitted' ? 'secondary' : 'outline'
                            }
                          >
                            {assignment.status}
                          </Badge>
                          {assignment.grade && (
                            <p className="text-sm text-green-600 font-medium">
                              Grade: {assignment.grade}%
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {assignment.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleSubmitAssignment(assignment.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Submit
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tests & Quizzes</CardTitle>
                    <CardDescription>
                      Take tests and view your results
                    </CardDescription>
                  </div>
                  <Button onClick={handleRefresh} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{test.title}</p>
                            <p className="text-sm text-gray-500">{test.course}</p>
                            <p className="text-xs text-gray-400">
                              {test.date} • {test.duration} minutes
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <Badge
                            variant={
                              test.status === 'completed' ? 'default' :
                              test.status === 'in-progress' ? 'secondary' : 'outline'
                            }
                          >
                            {test.status}
                          </Badge>
                          {test.score && (
                            <p className="text-sm text-green-600 font-medium">
                              Score: {test.score}%
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {test.status === 'upcoming' && (
                            <Button
                              size="sm"
                              onClick={() => handleStartTest(test.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Start
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DashboardWrapper>
    </ProtectedRoute>
  )
}