'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar, FileText, Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Assignment {
  id: string
  title: string
  description: string
  courseId: string
  courseName: string
  dueDate: string
  maxPoints: number
  attachments: string[]
  status: string
  submission?: {
    id: string
    content: string
    attachments: string[]
    score: number | null
    feedback: string | null
    status: string
    submittedAt: string
    gradedAt: string | null
  }
}

interface AssignmentSubmissionProps {
  assignment: Assignment
  onSubmit: () => void
  onClose: () => void
}

export function AssignmentSubmission({ assignment, onSubmit, onClose }: AssignmentSubmissionProps) {
  const [content, setContent] = useState(assignment.submission?.content || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Please enter your submission content')
      return
    }

    setIsSubmitting(true)

    try {
      // Get student ID from localStorage
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const studentId = user?.id

      if (!studentId) {
        toast.error('Student ID not found')
        setIsSubmitting(false)
        return
      }

      const response = await fetch('/api/student/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          assignmentId: assignment.id,
          content,
          attachments: [],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to submit assignment')
        setIsSubmitting(false)
        return
      }

      const result = await response.json()

      if (result.submission.isLate) {
        toast.warning('Assignment submitted late')
      } else {
        toast.success('Assignment submitted successfully')
      }

      onSubmit()
    } catch (error) {
      console.error('Error submitting assignment:', error)
      toast.error('Failed to submit assignment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isOverdue = new Date(assignment.dueDate) < new Date() && !assignment.submission
  const isSubmitted = !!assignment.submission

  const getStatusBadge = () => {
    if (assignment.submission) {
      switch (assignment.submission.status) {
        case 'graded':
          return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Graded</Badge>
        case 'late':
          return <Badge variant="destructive"><Clock className="h-3 w-3 mr-1" />Submitted Late</Badge>
        case 'submitted':
          return <Badge className="bg-blue-500"><FileText className="h-3 w-3 mr-1" />Submitted</Badge>
        default:
          return <Badge variant="outline">{assignment.submission.status}</Badge>
      }
    }
    if (isOverdue) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{assignment.title}</CardTitle>
              <CardDescription>{assignment.courseName}</CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>{assignment.description}</p>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Due: {new Date(assignment.dueDate).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Max Points: {assignment.maxPoints}</span>
            </div>
          </div>

          {assignment.attachments && assignment.attachments.length > 0 && (
            <div className="space-y-2">
              <Label>Assignment Files:</Label>
              <div className="flex flex-wrap gap-2">
                {assignment.attachments.map((file, index) => (
                  <Button key={index} variant="outline" size="sm" asChild>
                    <a href={file} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-1" />
                      Attachment {index + 1}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {isSubmitted && assignment.submission ? (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Your Submission</h4>

              <div className="space-y-2">
                <Label>Submission Content:</Label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{assignment.submission.content}</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Submitted: {new Date(assignment.submission.submittedAt).toLocaleString()}
              </div>

              {assignment.submission.score !== null && (
                <div className="space-y-2">
                  <Label>Grade:</Label>
                  <div className="text-2xl font-bold text-green-600">
                    {assignment.submission.score} / {assignment.maxPoints}
                  </div>
                </div>
              )}

              {assignment.submission.feedback && (
                <div className="space-y-2">
                  <Label>Feedback:</Label>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm">{assignment.submission.feedback}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Submit Your Work</h4>

              <div className="space-y-2">
                <Label htmlFor="submission-content">Your Answer/Work:</Label>
                <Textarea
                  id="submission-content"
                  placeholder="Enter your assignment submission here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  disabled={isSubmitted}
                  className="font-mono"
                />
              </div>

              {isOverdue && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>This assignment is past due. Late submissions may be penalized.</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            {isSubmitted ? 'Close' : 'Cancel'}
          </Button>
          {!isSubmitted && (
            <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
