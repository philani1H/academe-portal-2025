'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Send, Users, Mail, X, Eye } from 'lucide-react'

interface Student {
  id: string
  name: string
  email: string
  personalEmail?: string
  course?: string
}

interface BulkEmailComposerProps {
  userRole: 'admin' | 'tutor'
  open: boolean
  onClose: () => void
}

const EMAIL_TEMPLATES = {
  announcement: {
    name: 'General Announcement',
    subject: 'Important Announcement from Excellence Academia',
    body: `Dear [Student Name],

We hope this message finds you well.

[Your announcement here]

If you have any questions, please don't hesitate to reach out.

Best regards,
Excellence Academia Team`
  },
  update: {
    name: 'Course Update',
    subject: 'Course Update: [Course Name]',
    body: `Dear [Student Name],

We have an important update regarding your course: [Course Name]

[Update details here]

Please review this information at your earliest convenience.

Best regards,
[Tutor Name]
Excellence Academia`
  },
  reminder: {
    name: 'Session Reminder',
    subject: 'Reminder: Upcoming Session',
    body: `Dear [Student Name],

This is a friendly reminder about your upcoming session:

Course: [Course Name]
Date: [Date]
Time: [Time]

Please ensure you're prepared and join on time.

Best regards,
[Tutor Name]
Excellence Academia`
  },
  newsletter: {
    name: 'Newsletter',
    subject: 'Excellence Academia Newsletter - [Month Year]',
    body: `Dear [Student Name],

Welcome to this month's newsletter!

[Newsletter content here]

Stay tuned for more updates!

Best regards,
Excellence Academia Team`
  },
  achievement: {
    name: 'Achievement Congratulations',
    subject: 'Congratulations on Your Achievement!',
    body: `Dear [Student Name],

Congratulations! We're thrilled to celebrate your achievement:

[Achievement details]

Keep up the excellent work!

Best regards,
[Tutor Name]
Excellence Academia`
  }
}

export default function BulkEmailComposer({ userRole, open, onClose }: BulkEmailComposerProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [emailType, setEmailType] = useState<'internal' | 'external'>('internal')
  const [template, setTemplate] = useState<keyof typeof EMAIL_TEMPLATES>('announcement')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCourse, setFilterCourse] = useState<string>('all')
  const [sending, setSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (open) {
      loadStudents()
    }
  }, [open])

  useEffect(() => {
    const selectedTemplate = EMAIL_TEMPLATES[template]
    setSubject(selectedTemplate.subject)
    setBody(selectedTemplate.body)
  }, [template])

  const loadStudents = async () => {
    try {
      const response = await fetch('/api/students/list')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Failed to load students')
    }
  }

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const selectAll = () => {
    const filtered = getFilteredStudents()
    setSelectedStudents(new Set(filtered.map(s => s.id)))
  }

  const deselectAll = () => {
    setSelectedStudents(new Set())
  }

  const getFilteredStudents = () => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCourse = filterCourse === 'all' || student.course === filterCourse
      return matchesSearch && matchesCourse
    })
  }

  const handleSend = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student')
      return
    }

    if (!subject.trim() || !body.trim()) {
      toast.error('Please fill in subject and body')
      return
    }

    setSending(true)
    try {
      const selectedStudentsList = students.filter(s => selectedStudents.has(s.id))
      
      const response = await fetch('/api/emails/bulk-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          students: selectedStudentsList,
          subject,
          body,
          emailType, // 'internal' or 'external'
          template
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Email sent to ${selectedStudents.size} student(s)`)
        onClose()
        setSelectedStudents(new Set())
        setSubject('')
        setBody('')
      } else {
        throw new Error('Failed to send emails')
      }
    } catch (error) {
      console.error('Error sending emails:', error)
      toast.error('Failed to send emails')
    } finally {
      setSending(false)
    }
  }

  const courses = Array.from(new Set(students.map(s => s.course).filter(Boolean)))
  const filteredStudents = getFilteredStudents()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Compose Bulk Email
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Student Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Select Recipients ({selectedStudents.size} selected)
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onClick={deselectAll}>
                    Clear
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={filterCourse} onValueChange={setFilterCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map(course => (
                      <SelectItem key={course} value={course!}>{course}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredStudents.map(student => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => toggleStudent(student.id)}
                    >
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {emailType === 'external' && student.personalEmail 
                            ? student.personalEmail 
                            : student.email}
                        </p>
                        {student.course && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {student.course}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right: Email Composition */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Compose Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={emailType} onValueChange={(v) => setEmailType(v as any)}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="internal">
                    Internal Mailbox
                  </TabsTrigger>
                  <TabsTrigger value="external">
                    Personal Email (Gmail)
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={template} onValueChange={(v) => setTemplate(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMAIL_TEMPLATES).map(([key, tmpl]) => (
                      <SelectItem key={key} value={key}>
                        {tmpl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Email body"
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use [Student Name], [Course Name], [Tutor Name], [Date], [Time] as placeholders
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Email
              </Button>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || selectedStudents.size === 0}>
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Sending...' : `Send to ${selectedStudents.size} Student(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-6 bg-white">
            <div className="mb-4 pb-4 border-b">
              <p className="text-sm text-muted-foreground">Subject:</p>
              <p className="font-semibold">{subject}</p>
            </div>
            <div className="whitespace-pre-wrap">{body}</div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
