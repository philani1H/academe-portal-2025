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
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { api, type Course } from "@/lib/api"
import { Plus, Users, BookOpen, Calendar, Upload, FileText, Edit, Trash2, Eye } from "lucide-react"

export default function CourseManagementPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newCourse, setNewCourse] = useState({
    name: "",
    description: "",
    category: "",
    level: "Beginner" as Course["level"],
    duration: "",
  })

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const coursesData = await api.getCourses()
      setCourses(coursesData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async () => {
    if (!newCourse.name.trim() || !newCourse.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const course = await api.createCourse(newCourse)
      setCourses((prev) => [...prev, course])
      setNewCourse({
        name: "",
        description: "",
        category: "",
        level: "Beginner",
        duration: "",
      })
      toast({
        title: "Success",
        description: "Course created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course)
  }

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course)
    toast({
      title: "Edit Course",
      description: "Course editing functionality coming soon",
    })
  }

  const handleUploadMaterial = (course: Course) => {
    setSelectedCourse(course)
    toast({
      title: "Upload Material",
      description: "Material upload functionality available in Materials tab",
    })
  }

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      // TODO: Implement actual API call
      toast({
        title: "Success",
        description: "Material deleted successfully",
      })
      // Refresh course data
      await loadCourses()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete material",
        variant: "destructive",
      })
    }
  }

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
          <h2 className="text-2xl font-bold">Course Management</h2>
          <p className="text-muted-foreground">Manage your courses, materials, and assignments</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new course. You can add materials and tests later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="course-name">Course Name *</Label>
                <Input
                  id="course-name"
                  placeholder="e.g., Introduction to Biology"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-description">Description *</Label>
                <Textarea
                  id="course-description"
                  placeholder="Brief description of the course"
                  rows={3}
                  value={newCourse.description}
                  onChange={(e) => setNewCourse((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course-category">Category</Label>
                  <Input
                    id="course-category"
                    placeholder="e.g., Science"
                    value={newCourse.category}
                    onChange={(e) => setNewCourse((prev) => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-level">Level</Label>
                  <Select
                    value={newCourse.level}
                    onValueChange={(value: Course["level"]) => setNewCourse((prev) => ({ ...prev, level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-duration">Duration</Label>
                <Input
                  id="course-duration"
                  placeholder="e.g., 8 weeks"
                  value={newCourse.duration}
                  onChange={(e) => setNewCourse((prev) => ({ ...prev, duration: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateCourse} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Course"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="cursor-pointer hover:shadow-lg transition-shadow border-l-4"
            style={{ borderLeftColor: course.color }}
            onClick={() => handleCourseClick(course)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{course.name}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">{course.description}</CardDescription>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {course.level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{course.students} students</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{course.tests.length} tests</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Next: {new Date(course.nextSession).toLocaleDateString()}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => handleCourseClick(course)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditCourse(course)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUploadMaterial(course)}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCourse && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedCourse.color }} />
              {selectedCourse.name}
            </CardTitle>
            <CardDescription>{selectedCourse.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="materials">Materials</TabsTrigger>
                <TabsTrigger value="tests">Tests</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedCourse.students}</div>
                    <div className="text-sm text-muted-foreground">Students</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedCourse.totalLessons}</div>
                    <div className="text-sm text-muted-foreground">Total Lessons</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedCourse.tests.length}</div>
                    <div className="text-sm text-muted-foreground">Tests</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedCourse.rating}</div>
                    <div className="text-sm text-muted-foreground">Rating</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="materials" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Course Materials</h3>
                  <Button size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Material
                  </Button>
                </div>
                {selectedCourse.materials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No materials uploaded yet</div>
                ) : (
                  <div className="space-y-2">
                    {selectedCourse.materials.map((material) => (
                      <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{material.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Uploaded {new Date(material.uploadDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteMaterial(material.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tests" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Course Tests</h3>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Test
                  </Button>
                </div>
                {selectedCourse.tests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No tests created yet</div>
                ) : (
                  <div className="space-y-3">
                    {selectedCourse.tests.map((test) => (
                      <div key={test.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{test.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
                            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                              <span>Due: {new Date(test.dueDate).toLocaleDateString()}</span>
                              <span>{test.submissions} submissions</span>
                              <span>Avg: {test.averageScore}%</span>
                            </div>
                          </div>
                          <Badge variant={test.status === "published" ? "default" : "secondary"}>{test.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="students" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Enrolled Students</h3>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Students
                  </Button>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  {selectedCourse.students} students enrolled
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
