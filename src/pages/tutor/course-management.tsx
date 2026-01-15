"use client"

import { useState, useEffect, useRef } from "react"
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
import { Plus, Users, BookOpen, Calendar, Upload, FileText, Edit, Trash2, Eye, Video, Clock } from "lucide-react"
import * as XLSX from 'xlsx';

export default function CourseManagementPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)
  
  const [inviteEmails, setInviteEmails] = useState("")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("courses")
  const [courseDetailsTab, setCourseDetailsTab] = useState("overview")
  const materialInputRef = useRef<HTMLInputElement>(null)

  // Scheduling dialog state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [schedulingCourse, setSchedulingCourse] = useState<Course | null>(null)
  const [sessionTitle, setSessionTitle] = useState("")
  const [sessionDescription, setSessionDescription] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [sessionDuration, setSessionDuration] = useState("60")
  const [isScheduling, setIsScheduling] = useState(false)

  // Scheduled sessions state
  const [scheduledSessions, setScheduledSessions] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  useEffect(() => {
    loadCourses()
    loadScheduledSessions()
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  }

  const loadCourses = async () => {
    try {
      setLoading(true)
      // Get tutor ID from localStorage to filter courses
      let tutorId: string | undefined
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const parsed = JSON.parse(storedUser)
          if (parsed.role === 'tutor') {
            tutorId = String(parsed.id)
          }
        }
      } catch {}
      const coursesData = await api.getCourses(tutorId)
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

  const loadScheduledSessions = async () => {
    try {
      setLoadingSessions(true)
      const response = await fetch('/api/tutor/scheduled-sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setScheduledSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load scheduled sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const extractedEmails = data
          .map((row: any) => row.Email || row.email || row.EMAIL)
          .filter((email: any) => email && typeof email === 'string' && email.includes('@'));

        if (extractedEmails.length > 0) {
          setInviteEmails(prev => {
            const existing = prev ? prev.split(/[,\n]/).map(e => e.trim()).filter(Boolean) : [];
            const unique = Array.from(new Set([...existing, ...extractedEmails]));
            return unique.join(', ');
          });
          toast({
            title: 'Emails Imported',
            description: `Found ${extractedEmails.length} emails from file.`,
          });
        } else {
          toast({
            title: 'No Emails Found',
            description: 'Could not find an "email" column or valid emails in the uploaded file.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Excel parse error:', error);
        toast({
          title: 'Import Failed',
          description: 'Could not parse the Excel file.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleInvite = async () => {
    if (!inviteEmails.trim() || !selectedCourse) {
      toast({
        title: "Error",
        description: "Please enter emails to invite",
        variant: "destructive",
      })
      return
    }

    setIsInviting(true)
    try {
      const emails = inviteEmails.split(/[,\n]/).map(e => e.trim()).filter(Boolean)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/tutor/students/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          emails, 
          courseName: selectedCourse.name,
        })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: `Invited ${data.invited?.length || 0} students successfully`,
        })
        setInviteEmails("")
        setInviteDialogOpen(false)
      } else {
        throw new Error(data.error || 'Failed to invite students')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to invite students",
        variant: "destructive",
      })
    } finally {
      setIsInviting(false)
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

  const handleStartLiveSession = async (course: Course) => {
    const sessionId = `${course.id}-${Date.now()}`;
    const tutorName = user?.name || 'Tutor';
    const params = new URLSearchParams({
        courseId: course.id,
        courseName: course.name,
        sessionName: `${course.name} Live Session`,
        category: course.category || '',
        tutorName: tutorName,
        fromTutor: 'true'
    });
    const sessionLink = `${window.location.origin}/live-session/${sessionId}?${params.toString()}`;
    
    // Send email notifications to students
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/tutor/live-session/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: course.id,
          sessionId,
          sessionLink,
          tutorName: tutorName
        })
      });
      
      toast({
        title: "Students Notified",
        description: "All enrolled students have been notified about the live session",
      });
    } catch (error) {
      console.error('Failed to notify students:', error);
    }
    
    // Navigate to live session
    window.location.href = sessionLink;
  }

  const handleScheduleSession = (course: Course) => {
    setSchedulingCourse(course);
    setSessionTitle(`${course.name} Live Session`);
    setSessionDescription(`Scheduled live session for ${course.name}`);
    setScheduledDate("");
    setScheduledTime("");
    setSessionDuration("60");
    setScheduleDialogOpen(true);
  }

  const handleCreateScheduledSession = async () => {
    if (!schedulingCourse || !sessionTitle || !scheduledDate || !scheduledTime || !sessionDuration) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsScheduling(true);

      // Combine date and time
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);

      if (scheduledAt <= new Date()) {
        toast({
          title: "Error",
          description: "Scheduled time must be in the future",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/tutor/scheduled-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          courseId: schedulingCourse.id,
          title: sessionTitle,
          description: sessionDescription,
          scheduledAt: scheduledAt.toISOString(),
          duration: parseInt(sessionDuration)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to schedule session');
      }

      // Send email notifications to students
      try {
        await fetch('/api/tutor/live-session/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            courseId: schedulingCourse.id,
            sessionId: `scheduled-${Date.now()}`,
            sessionLink: `${window.location.origin}/student/courses/${schedulingCourse.id}`,
            isScheduled: true,
            scheduledDate: scheduledAt.toISOString(),
            duration: parseInt(sessionDuration)
          })
        });
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError);
      }

      toast({
        title: "Success",
        description: "Session scheduled and students notified successfully",
      });

      setScheduleDialogOpen(false);
      setSchedulingCourse(null);
      
      // Reload scheduled sessions
      loadScheduledSessions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule session",
        variant: "destructive",
      });
    } finally {
      setIsScheduling(false);
    }
  }

  const handleDeleteScheduledSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled session?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tutor/scheduled-sessions?id=${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      toast({
        title: "Success",
        description: "Scheduled session deleted successfully",
      });

      // Reload scheduled sessions
      loadScheduledSessions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete scheduled session",
        variant: "destructive",
      });
    }
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
      await api.deleteMaterial(materialId)
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="sessions">Scheduled Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-6">
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
                      variant="default"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartLiveSession(course);
                      }}
                      title="Start Live Session"
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScheduleSession(course);
                      }}
                      title="Schedule Live Session"
                    >
                      <Clock className="h-4 w-4" />
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
            <Card className="mt-6" id="course-details">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedCourse.color }} />
                  {selectedCourse.name}
                </CardTitle>
                <CardDescription>{selectedCourse.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={courseDetailsTab} onValueChange={setCourseDetailsTab} className="w-full">
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
                      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Students
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Invite Students</DialogTitle>
                            <DialogDescription>
                              Enter email addresses separated by commas or new lines, or upload an Excel file.
                              Students will be enrolled in <strong>{selectedCourse?.name}</strong>.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Email Addresses</Label>
                              <Textarea
                                placeholder="student@example.com, another@example.com"
                                value={inviteEmails}
                                onChange={(e) => setInviteEmails(e.target.value)}
                                rows={5}
                              />
                            </div>
                            <div>
                              <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileUpload}
                              />
                              <Button
                                variant="outline"
                                type="button"
                                className="w-full"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Import from Excel
                              </Button>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleInvite} disabled={isInviting}>
                              {isInviting ? "Inviting..." : "Send Invitations"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="text-center py-8 text-muted-foreground">
                      {selectedCourse.students} students enrolled
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Scheduled Sessions</h3>
              <Button onClick={() => setScheduleDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Clock className="h-4 w-4 mr-2" />
                Schedule New Session
              </Button>
            </div>

            {loadingSessions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : scheduledSessions.length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Scheduled Sessions</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't scheduled any live sessions yet.
                </p>
                <Button onClick={() => setScheduleDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule Your First Session
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {scheduledSessions.map((session) => (
                  <Card key={session.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{session.title}</h4>
                        <p className="text-sm text-muted-foreground">{session.course.name}</p>
                        {session.description && (
                          <p className="text-sm mt-1">{session.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(session.scheduledAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>{session.duration} minutes</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                        {session.status === 'scheduled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteScheduledSession(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Schedule Session Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Live Session</DialogTitle>
            <DialogDescription>
              Schedule a live session that will automatically start at the specified time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="session-title">Session Title</Label>
              <Input
                id="session-title"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="Enter session title"
              />
            </div>
            <div>
              <Label htmlFor="session-description">Description (Optional)</Label>
              <Textarea
                id="session-description"
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                placeholder="Enter session description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduled-date">Date</Label>
                <Input
                  id="scheduled-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="scheduled-time">Time</Label>
                <Input
                  id="scheduled-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="session-duration">Duration (minutes)</Label>
              <Select value={sessionDuration} onValueChange={setSessionDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateScheduledSession} disabled={isScheduling}>
              {isScheduling ? "Scheduling..." : "Schedule Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}