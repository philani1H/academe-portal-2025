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
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Award,
  Bell,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface TutorStats {
  totalStudents: number
  activeCourses: number
  pendingGrading: number
  averageRating: number
  totalHours: number
  completedSessions: number
}

interface Student {
  id: string
  name: string
  email: string
  progress: number
  lastActivity: string
  status: 'active' | 'pending' | 'inactive'
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
  materials: number
  assignments: number
  tests: number
  status: 'active' | 'inactive' | 'draft'
}

interface Assignment {
  id: string
  title: string
  course: string
  dueDate: string
  submissions: number
  totalStudents: number
  status: 'draft' | 'published' | 'closed'
}

export default function TutorDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<TutorStats>({
    totalStudents: 0,
    activeCourses: 0,
    pendingGrading: 0,
    averageRating: 0,
    totalHours: 0,
    completedSessions: 0
  })
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Load dashboard data
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Mock data for now - replace with actual API calls
      const mockStats: TutorStats = {
        totalStudents: 45,
        activeCourses: 6,
        pendingGrading: 8,
        averageRating: 4.8,
        totalHours: 120,
        completedSessions: 85
      }

      const mockStudents: Student[] = [
        {
          id: '1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          progress: 85,
          lastActivity: '2024-01-10',
          status: 'active',
          enrolledCourses: ['Advanced Mathematics', 'Calculus'],
          grades: { 'Advanced Mathematics': 92, 'Calculus': 88 }
        },
        {
          id: '2',
          name: 'Bob Smith',
          email: 'bob@example.com',
          progress: 72,
          lastActivity: '2024-01-09',
          status: 'active',
          enrolledCourses: ['Web Development', 'Data Science'],
          grades: { 'Web Development': 85, 'Data Science': 90 }
        },
        {
          id: '3',
          name: 'Carol Davis',
          email: 'carol@example.com',
          progress: 95,
          lastActivity: '2024-01-11',
          status: 'active',
          enrolledCourses: ['Advanced Mathematics'],
          grades: { 'Advanced Mathematics': 96 }
        }
      ]

      const mockCourses: Course[] = [
        {
          id: '1',
          name: 'Advanced Mathematics',
          description: 'Comprehensive study of calculus and algebra',
          students: 25,
          nextSession: '2024-01-15',
          progress: 75,
          materials: 15,
          assignments: 8,
          tests: 3,
          status: 'active'
        },
        {
          id: '2',
          name: 'Web Development',
          description: 'Full-stack web development with React and Node.js',
          students: 20,
          nextSession: '2024-01-16',
          progress: 60,
          materials: 20,
          assignments: 12,
          tests: 4,
          status: 'active'
        },
        {
          id: '3',
          name: 'Data Science',
          description: 'Introduction to data analysis and machine learning',
          students: 18,
          nextSession: '2024-01-20',
          progress: 100,
          materials: 25,
          assignments: 15,
          tests: 5,
          status: 'active'
        }
      ]

      const mockAssignments: Assignment[] = [
        {
          id: '1',
          title: 'Calculus Problem Set 3',
          course: 'Advanced Mathematics',
          dueDate: '2024-01-20',
          submissions: 20,
          totalStudents: 25,
          status: 'published'
        },
        {
          id: '2',
          title: 'React Component Project',
          course: 'Web Development',
          dueDate: '2024-01-18',
          submissions: 15,
          totalStudents: 20,
          status: 'published'
        },
        {
          id: '3',
          title: 'Data Analysis Report',
          course: 'Data Science',
          dueDate: '2024-01-15',
          submissions: 18,
          totalStudents: 18,
          status: 'closed'
        }
      ]

      setStats(mockStats)
      setStudents(mockStudents)
      setCourses(mockCourses)
      setAssignments(mockAssignments)
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

  const handleGradeAssignment = (assignmentId: string) => {
    toast({
      title: "Assignment Graded",
      description: "Assignment has been graded successfully"
    })
    // Update assignment status
    setAssignments(assignments.map(a => 
      a.id === assignmentId ? { ...a, status: 'closed' } : a
    ))
  }

  const handleCreateCourse = () => {
    toast({
      title: "Course Created",
      description: "New course has been created successfully"
    })
  }

  const handleCreateAssignment = () => {
    toast({
      title: "Assignment Created",
      description: "New assignment has been created successfully"
    })
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeStudents = students.filter(s => s.status === 'active')
  const pendingGrading = assignments.filter(a => a.status === 'published')

  if (loading) {
    return (
      <ProtectedRoute requiredRole="tutor">
        <DashboardWrapper title="Tutor Dashboard" description="Manage your courses and students">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </DashboardWrapper>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="tutor">
      <DashboardWrapper title="Tutor Dashboard" description="Manage your courses and students">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
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
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalStudents}</div>
                    <p className="text-xs text-muted-foreground">
                      Across all courses
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
                    <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeCourses}</div>
                    <p className="text-xs text-muted-foreground">
                      Currently teaching
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
                    <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.pendingGrading}</div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting review
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
                    Pending Grading
                  </CardTitle>
                  <CardDescription>
                    Assignments that need to be graded
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingGrading.slice(0, 3).map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-gray-500">{assignment.course}</p>
                          <p className="text-xs text-gray-400">
                            {assignment.submissions}/{assignment.totalStudents} submitted
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleGradeAssignment(assignment.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Grade
                        </Button>
                      </div>
                    ))}
                    {pendingGrading.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No pending grading
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Overview
                  </CardTitle>
                  <CardDescription>
                    Your teaching performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Rating</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-yellow-600">{stats.averageRating}</span>
                        <Award className="h-4 w-4 text-yellow-600" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Hours</span>
                      <span className="text-sm text-gray-600">{stats.totalHours} hours</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Completed Sessions</span>
                      <span className="text-sm text-gray-600">{stats.completedSessions}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Students</CardTitle>
                    <CardDescription>
                      Manage and track your students' progress
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search students..."
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
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-gray-500">{student.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{student.progress}%</span>
                            </div>
                            <Progress value={student.progress} className="w-full" />
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(student.lastActivity).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={student.status === 'active' ? 'default' : 'outline'}
                          >
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
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
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Courses</CardTitle>
                    <CardDescription>
                      Manage your courses and track performance
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button onClick={handleCreateCourse} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Course
                    </Button>
                    <Button onClick={handleRefresh} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{course.name}</CardTitle>
                          <Badge
                            variant={course.status === 'active' ? 'default' : 'outline'}
                          >
                            {course.status}
                          </Badge>
                        </div>
                        <CardDescription>{course.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span>Students:</span>
                            <span className="font-medium">{course.students}</span>
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
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
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
                      Create and manage assignments
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button onClick={handleCreateAssignment} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assignment
                    </Button>
                    <Button onClick={handleRefresh} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{assignment.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>{assignment.course}</TableCell>
                        <TableCell>{assignment.dueDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{assignment.submissions}/{assignment.totalStudents}</span>
                            <Progress 
                              value={(assignment.submissions / assignment.totalStudents) * 100} 
                              className="w-16" 
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              assignment.status === 'published' ? 'default' :
                              assignment.status === 'closed' ? 'secondary' : 'outline'
                            }
                          >
                            {assignment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {assignment.status === 'published' && (
                              <Button
                                size="sm"
                                onClick={() => handleGradeAssignment(assignment.id)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Grade
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DashboardWrapper>
    </ProtectedRoute>
  )
}