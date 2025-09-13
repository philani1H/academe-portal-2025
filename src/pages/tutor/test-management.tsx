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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { api, type Test, type Question, type Course } from "@/lib/api"
import {
  Plus,
  FileText,
  Users,
  BarChart3,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  CheckCircle,
  Calendar,
  Target,
} from "lucide-react"

export default function TestManagementPage() {
  const [tests, setTests] = useState<Test[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newTest, setNewTest] = useState({
    title: "",
    description: "",
    courseId: "",
    dueDate: "",
    questions: [] as Question[],
  })
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    type: "multiple-choice" as Question["type"],
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 10,
    explanation: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [testsData, coursesData] = await Promise.all([api.getTests(), api.getCourses()])
      setTests(testsData)
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

  const handleCreateTest = async () => {
    if (!newTest.title.trim() || !newTest.courseId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const test = await api.createTest(newTest)
      setTests((prev) => [...prev, test])
      setNewTest({
        title: "",
        description: "",
        courseId: "",
        dueDate: "",
        questions: [],
      })
      toast({
        title: "Success",
        description: "Test created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create test",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddQuestion = () => {
    if (!newQuestion.text.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question",
        variant: "destructive",
      })
      return
    }

    const question: Question = {
      id: `q-${Date.now()}`,
      text: newQuestion.text,
      type: newQuestion.type,
      options: newQuestion.type === "multiple-choice" ? newQuestion.options.filter((o) => o.trim()) : undefined,
      correctAnswer: newQuestion.correctAnswer,
      points: newQuestion.points,
      explanation: newQuestion.explanation,
    }

    setNewTest((prev) => ({
      ...prev,
      questions: [...prev.questions, question],
    }))

    setNewQuestion({
      text: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 10,
      explanation: "",
    })

    toast({
      title: "Success",
      description: "Question added to test",
    })
  }

  const handleRemoveQuestion = (questionId: string) => {
    setNewTest((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }))
  }

  const handlePublishTest = async (testId: string) => {
    try {
      // In real app, make API call to publish test
      setTests((prev) => prev.map((test) => (test.id === testId ? { ...test, status: "published" as const } : test)))
      toast({
        title: "Success",
        description: "Test published successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish test",
        variant: "destructive",
      })
    }
  }

  const handleCloseTest = async (testId: string) => {
    try {
      setTests((prev) => prev.map((test) => (test.id === testId ? { ...test, status: "closed" as const } : test)))
      toast({
        title: "Success",
        description: "Test closed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to close test",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: Test["status"]) => {
    switch (status) {
      case "draft":
        return <Edit className="h-4 w-4 text-yellow-500" />
      case "published":
        return <Play className="h-4 w-4 text-green-500" />
      case "closed":
        return <CheckCircle className="h-4 w-4 text-gray-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Test["status"]) => {
    switch (status) {
      case "draft":
        return "secondary"
      case "published":
        return "default"
      case "closed":
        return "outline"
      default:
        return "secondary"
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
          <h2 className="text-2xl font-bold">Test Management</h2>
          <p className="text-muted-foreground">Create and manage tests for your courses</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Test</DialogTitle>
              <DialogDescription>Create a comprehensive test with multiple question types</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Test Details</TabsTrigger>
                <TabsTrigger value="questions">Questions ({newTest.questions.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-title">Test Title *</Label>
                    <Input
                      id="test-title"
                      placeholder="e.g., Midterm Exam"
                      value={newTest.title}
                      onChange={(e) => setNewTest((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-course">Course *</Label>
                    <Select
                      value={newTest.courseId}
                      onValueChange={(value) => setNewTest((prev) => ({ ...prev, courseId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-description">Description</Label>
                  <Textarea
                    id="test-description"
                    placeholder="Brief description of the test"
                    rows={3}
                    value={newTest.description}
                    onChange={(e) => setNewTest((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-due-date">Due Date</Label>
                  <Input
                    id="test-due-date"
                    type="datetime-local"
                    value={newTest.dueDate}
                    onChange={(e) => setNewTest((prev) => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </TabsContent>

              <TabsContent value="questions" className="space-y-4">
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold">Add New Question</h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="question-text">Question Text *</Label>
                      <Textarea
                        id="question-text"
                        placeholder="Enter your question here..."
                        rows={3}
                        value={newQuestion.text}
                        onChange={(e) => setNewQuestion((prev) => ({ ...prev, text: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="question-type">Question Type</Label>
                        <Select
                          value={newQuestion.type}
                          onValueChange={(value: Question["type"]) =>
                            setNewQuestion((prev) => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                            <SelectItem value="true-false">True/False</SelectItem>
                            <SelectItem value="short-answer">Short Answer</SelectItem>
                            <SelectItem value="essay">Essay</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="question-points">Points</Label>
                        <Input
                          id="question-points"
                          type="number"
                          min="1"
                          value={newQuestion.points}
                          onChange={(e) =>
                            setNewQuestion((prev) => ({ ...prev, points: Number.parseInt(e.target.value) || 10 }))
                          }
                        />
                      </div>
                    </div>

                    {newQuestion.type === "multiple-choice" && (
                      <div className="space-y-2">
                        <Label>Answer Options</Label>
                        {newQuestion.options.map((option, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder={`Option ${index + 1}`}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...newQuestion.options]
                                newOptions[index] = e.target.value
                                setNewQuestion((prev) => ({ ...prev, options: newOptions }))
                              }}
                            />
                            <Button
                              type="button"
                              variant={newQuestion.correctAnswer === option ? "default" : "outline"}
                              size="sm"
                              onClick={() => setNewQuestion((prev) => ({ ...prev, correctAnswer: option }))}
                            >
                              {newQuestion.correctAnswer === option ? "Correct" : "Mark Correct"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {newQuestion.type === "true-false" && (
                      <div className="space-y-2">
                        <Label>Correct Answer</Label>
                        <Select
                          value={newQuestion.correctAnswer}
                          onValueChange={(value) => setNewQuestion((prev) => ({ ...prev, correctAnswer: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select correct answer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {(newQuestion.type === "short-answer" || newQuestion.type === "essay") && (
                      <div className="space-y-2">
                        <Label htmlFor="correct-answer">Sample Answer/Keywords</Label>
                        <Textarea
                          id="correct-answer"
                          placeholder="Enter sample answer or keywords for grading..."
                          rows={2}
                          value={newQuestion.correctAnswer}
                          onChange={(e) => setNewQuestion((prev) => ({ ...prev, correctAnswer: e.target.value }))}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="question-explanation">Explanation (Optional)</Label>
                      <Textarea
                        id="question-explanation"
                        placeholder="Explain the correct answer..."
                        rows={2}
                        value={newQuestion.explanation}
                        onChange={(e) => setNewQuestion((prev) => ({ ...prev, explanation: e.target.value }))}
                      />
                    </div>

                    <Button onClick={handleAddQuestion} disabled={!newQuestion.text.trim()}>
                      Add Question
                    </Button>
                  </div>
                </div>

                {newTest.questions.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Questions ({newTest.questions.length})</h3>
                      <div className="text-sm text-muted-foreground">
                        Total Points: {newTest.questions.reduce((sum, q) => sum + q.points, 0)}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {newTest.questions.map((question, index) => (
                        <div key={question.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">Q{index + 1}</Badge>
                                <Badge variant="secondary">{question.type}</Badge>
                                <Badge variant="outline">{question.points} pts</Badge>
                              </div>
                              <p className="font-medium mb-2">{question.text}</p>
                              {question.options && (
                                <div className="space-y-1">
                                  {question.options.map((option, optIndex) => (
                                    <div
                                      key={optIndex}
                                      className={`text-sm p-2 rounded ${
                                        option === question.correctAnswer
                                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                          : "bg-muted"
                                      }`}
                                    >
                                      {String.fromCharCode(65 + optIndex)}. {option}
                                      {option === question.correctAnswer && " ✓"}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {question.explanation && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  <strong>Explanation:</strong> {question.explanation}
                                </p>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveQuestion(question.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button onClick={handleCreateTest} disabled={isCreating || !newTest.title.trim() || !newTest.courseId}>
                {isCreating ? "Creating..." : "Create Test"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tests.filter((t) => t.status === "published").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Edit className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{tests.filter((t) => t.status === "draft").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {tests.reduce((sum, test) => sum + test.submissions, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tests List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => {
          const course = courses.find((c) => c.id === test.courseId)
          return (
            <Card key={test.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{test.title}</CardTitle>
                    <CardDescription className="mt-1">{course?.name || "Unknown Course"}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <Badge variant={getStatusColor(test.status)}>{test.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {test.description && <p className="text-sm text-muted-foreground line-clamp-2">{test.description}</p>}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>{test.totalPoints} pts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{test.questions.length} questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{test.submissions} submissions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span>{test.averageScore}% avg</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {new Date(test.dueDate).toLocaleDateString()}</span>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {test.status === "draft" && (
                    <Button size="sm" onClick={() => handlePublishTest(test.id)}>
                      <Play className="h-4 w-4 mr-1" />
                      Publish
                    </Button>
                  )}
                  {test.status === "published" && (
                    <Button size="sm" variant="outline" onClick={() => handleCloseTest(test.id)}>
                      <Pause className="h-4 w-4 mr-1" />
                      Close
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {tests.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tests created yet</h3>
            <p className="text-muted-foreground mb-4">Create your first test to start assessing your students</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Test
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
