"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { api, type Student, type Course } from "@/lib/api"
import {
  Users,
  UserPlus,
  Search,
  Check,
  X,
  Mail,
  Activity,
  BookOpen,
  Award,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"

export default function StudentManagementPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCourse, setFilterCourse] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [emailsToUpload, setEmailsToUpload] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      // Pass tutor ID to filter students
      const userId = user?.id ? String(user.id) : undefined
      const [studentsData, coursesData] = await Promise.all([
        api.getStudents(userId), 
        api.getCourses()
      ])
      setStudents(studentsData)
      setCourses(coursesData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUploadEmails = async () => {
    if (!emailsToUpload.trim()) {
      toast({
        title: "Error",
        description: "Please enter email addresses",
        variant: "destructive",
      })
      return
    }

    if (!selectedCourseId) {
      toast({
        title: "Error",
        description: "Please select a course",
        variant: "destructive",
      })
      return
    }

    const selectedCourse = courses.find(c => c.id === selectedCourseId)
    if (!selectedCourse) {
       toast({
        title: "Error",
        description: "Invalid course selected",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const emails = emailsToUpload
        .split(/[\n,]/)
        .map((email) => email.trim())
        .filter((email) => email.includes("@"))

      if (emails.length === 0) {
        throw new Error("No valid emails found")
      }

      // Use tutor invite endpoint instead of admin addStudents
      const response = await api.tutorInviteStudents({
        emails,
        courseName: selectedCourse.name
      })

      if (response.success) {
        toast({
          title: "Success",
          description: `${response.invited.length} student(s) invited successfully`,
        })
        setEmailsToUpload("")
        setSelectedCourseId("")
        // Reload data to show updated list
        await loadData()
      } else {
         throw new Error("Failed to invite students")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload emails",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleApproveStudent = async (studentId: string) => {
    try {
      const updatedStudent = await api.updateStudent(studentId, { status: "active" })
      setStudents((prev) => prev.map((student) => (student.id === studentId ? updatedStudent : student)))
      
      // Send approval email notification
      try {
        const token = localStorage.getItem("auth_token")
        await fetch("/api/tutor/student/approve-notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            studentId: updatedStudent.id,
            studentEmail: updatedStudent.email,
            studentName: updatedStudent.name,
          }),
        })
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError)
      }
      
      toast({
        title: "Success",
        description: "Student approved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve student",
        variant: "destructive",
      })
    }
  }

  const handleRejectStudent = async (studentId: string) => {
    try {
      const student = students.find(s => s.id === studentId)
      
      await api.deleteStudent(studentId)
      setStudents((prev) => prev.filter((student) => student.id !== studentId))
      
      // Send rejection email notification
      if (student) {
        try {
          const token = localStorage.getItem("auth_token")
          await fetch("/api/tutor/student/reject-notify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              studentEmail: student.email,
              studentName: student.name,
            }),
          })
        } catch (emailError) {
          console.error("Failed to send rejection email:", emailError)
        }
      }
      
      toast({
        title: "Success",
        description: "Student rejected",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject student",
        variant: "destructive",
      })
    }
  }

  const handleDeactivateStudent = async (studentId: string) => {
    try {
      const updatedStudent = await api.updateStudent(studentId, { status: "inactive" })
      setStudents((prev) => prev.map((student) => (student.id === studentId ? updatedStudent : student)))
      toast({
        title: "Success",
        description: "Student deactivated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate student",
        variant: "destructive",
      })
    }
  }

  // Filter and sort students
  const filteredStudents = students
    .filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filterStatus === "all" || student.status === filterStatus

      const matchesCourse = filterCourse === "all" || student.enrolledCourses.includes(filterCourse)

      return matchesSearch && matchesStatus && matchesCourse
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy as keyof Student]
      let bValue: any = b[sortBy as keyof Student]

      if (sortBy === "lastActivity") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const activeStudents = students.filter((s) => s.status === "active")
  const pendingStudents = students.filter((s) => s.status === "pending")
  const inactiveStudents = students.filter((s) => s.status === "inactive")

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Student Management</h2>
          <p className="text-muted-foreground">Manage student enrollments and track progress</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Students
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Student Emails</DialogTitle>
              <DialogDescription>
                Enter student emails separated by commas or new lines. They will be invited to join your courses.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="course">Select Course</Label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course..." />
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeStudents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingStudents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveStudents.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Course" />
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
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="lastActivity">Last Activity</SelectItem>
                  <SelectItem value="joinDate">Join Date</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      {pendingStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Student Approvals</CardTitle>
            <CardDescription>Students waiting for your approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
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
                    <Button size="sm" onClick={() => handleApproveStudent(student.id)}>
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRejectStudent(student.id)}>
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>All Students ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{student.name}</h3>
                      <Badge
                        variant={
                          student.status === "active"
                            ? "default"
                            : student.status === "pending"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {student.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>{student.enrolledCourses.length} courses</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        <span>{student.progress}% progress</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        <span>Last active {new Date(student.lastActivity).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {student.completedAssignments}/{student.totalAssignments}
                    </div>
                    <div className="text-xs text-muted-foreground">assignments</div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedStudent(student)}>
                        <Edit className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Message
                      </DropdownMenuItem>
                      {student.status === "active" && (
                        <DropdownMenuItem onClick={() => handleDeactivateStudent(student.id)}>
                          <X className="h-4 w-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onClick={() => handleRejectStudent(student.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No students found matching your criteria</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Details Dialog */}
      {selectedStudent && (
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedStudent.avatar || "/placeholder.svg"} alt={selectedStudent.name} />
                  <AvatarFallback>{selectedStudent.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div>{selectedStudent.name}</div>
                  <div className="text-sm text-muted-foreground font-normal">{selectedStudent.email}</div>
                </div>
              </DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Badge variant={selectedStudent.status === "active" ? "default" : "secondary"}>
                      {selectedStudent.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Join Date</Label>
                    <div className="text-sm">{new Date(selectedStudent.joinDate).toLocaleDateString()}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Progress</Label>
                    <div className="text-sm">{selectedStudent.progress}%</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Last Activity</Label>
                    <div className="text-sm">{new Date(selectedStudent.lastActivity).toLocaleDateString()}</div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="courses" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Enrolled in {selectedStudent.enrolledCourses.length} courses
                </div>
                {selectedStudent.enrolledCourses.map((courseId) => {
                  const course = courses.find((c) => c.id === courseId)
                  return course ? (
                    <div key={courseId} className="p-3 border rounded-lg">
                      <div className="font-medium">{course.name}</div>
                      <div className="text-sm text-muted-foreground">{course.description}</div>
                    </div>
                  ) : null
                })}
              </TabsContent>
              <TabsContent value="activity" className="space-y-4">
                <div className="text-sm text-muted-foreground">Recent activity and assignments</div>
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm">Completed Assignment: Math Quiz #3</div>
                    <div className="text-xs text-muted-foreground">2 days ago</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm">Joined course: Advanced Mathematics</div>
                    <div className="text-xs text-muted-foreground">1 week ago</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
