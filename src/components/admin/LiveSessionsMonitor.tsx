"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Video,
  Users,
  Clock,
  Eye,
  Flag,
  AlertTriangle,
  Shield,
  Play,
  Pause,
  XCircle,
  CheckCircle,
  UserX,
  MessageSquare,
  FileText,
  Download,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

interface LiveSession {
  sessionId: string
  courseId: string
  courseName: string
  tutorName: string
  tutorId: string
  category: string
  participantCount: number
  startTime: string
  duration: number
  isLive: boolean
  participants: Array<{
    id: string
    name: string
    role: string
    joinedAt: string
    isMuted: boolean
    isVideoOff: boolean
    isHandRaised: boolean
  }>
  flags: Array<{
    id: string
    type: string
    description: string
    reportedBy: string
    timestamp: string
  }>
}

interface FlagData {
  sessionId: string
  type: 'inappropriate_content' | 'harassment' | 'technical_issue' | 'other'
  description: string
}

export default function LiveSessionsMonitor() {
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null)
  const [showFlagDialog, setShowFlagDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [flagData, setFlagData] = useState<FlagData>({
    sessionId: '',
    type: 'inappropriate_content',
    description: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchActiveSessions()
    // Refresh every 10 seconds
    const interval = setInterval(fetchActiveSessions, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchActiveSessions = async () => {
    try {
      const response = await apiFetch<{ success: boolean; data: LiveSession[] }>('/api/admin/live-sessions')
      if (response.success && response.data) {
        setSessions(response.data)
      } else {
        setSessions([])
      }
    } catch (error) {
      console.error('Error fetching live sessions:', error)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const handleJoinAsModerator = (session: LiveSession) => {
    setSelectedSession(session)
    setShowJoinDialog(true)
  }

  const confirmJoinAsModerator = () => {
    if (!selectedSession) return

    // Navigate to live session with admin role
    navigate(`/live-session/${selectedSession.sessionId}?role=admin&courseId=${selectedSession.courseId}`)
    setShowJoinDialog(false)
  }

  const handleFlagSession = (session: LiveSession) => {
    setSelectedSession(session)
    setFlagData({
      sessionId: session.sessionId,
      type: 'inappropriate_content',
      description: ''
    })
    setShowFlagDialog(true)
  }

  const submitFlag = async () => {
    if (!flagData.description.trim()) {
      toast.error('Please provide a description for the flag')
      return
    }

    try {
      await apiFetch('/api/admin/live-sessions/flag', {
        method: 'POST',
        body: JSON.stringify(flagData)
      })

      toast.success('Session flagged successfully')
      setShowFlagDialog(false)
      fetchActiveSessions()
    } catch (error) {
      console.error('Error flagging session:', error)
      toast.error('Failed to flag session')
    }
  }

  const handleEndSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to end this session? This will disconnect all participants.')) {
      return
    }

    try {
      await apiFetch(`/api/admin/live-sessions/${sessionId}/end`, {
        method: 'POST'
      })

      toast.success('Session ended successfully')
      fetchActiveSessions()
    } catch (error) {
      console.error('Error ending session:', error)
      toast.error('Failed to end session')
    }
  }

  const handleKickParticipant = async (sessionId: string, participantId: string) => {
    if (!confirm('Are you sure you want to remove this participant?')) {
      return
    }

    try {
      await apiFetch(`/api/admin/live-sessions/${sessionId}/kick/${participantId}`, {
        method: 'POST'
      })

      toast.success('Participant removed successfully')
      fetchActiveSessions()
    } catch (error) {
      console.error('Error kicking participant:', error)
      toast.error('Failed to remove participant')
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const getSessionStatusColor = (session: LiveSession) => {
    if (session.flags && session.flags.length > 0) return 'destructive'
    if (session.participantCount > 50) return 'warning'
    return 'default'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Live Sessions Monitor</h2>
          <p className="text-sm text-gray-500 mt-1">Monitor and moderate all active live sessions</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg py-2 px-4">
            <Activity className="h-4 w-4 mr-2 animate-pulse text-green-500" />
            {sessions.length} Active {sessions.length === 1 ? 'Session' : 'Sessions'}
          </Badge>
          <Button onClick={fetchActiveSessions} variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{sessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {sessions.reduce((acc, s) => acc + s.participantCount, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Flagged Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {sessions.filter(s => s.flags && s.flags.length > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {sessions.length > 0
                ? formatDuration(Math.floor(sessions.reduce((acc, s) => acc + s.duration, 0) / sessions.length))
                : '0s'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Sessions</h3>
            <p className="text-sm text-gray-500">There are currently no live sessions in progress</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Active Live Sessions</CardTitle>
            <CardDescription>Real-time monitoring of all ongoing sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.sessionId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{session.courseName}</div>
                          <div className="text-xs text-gray-500">{session.category}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-indigo-600" />
                          {session.tutorName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          {session.participantCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          {formatDuration(session.duration)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSessionStatusColor(session)}>
                          {session.flags && session.flags.length > 0 ? (
                            <><AlertTriangle className="h-3 w-3 mr-1" /> Flagged</>
                          ) : (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleJoinAsModerator(session)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Join
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFlagSession(session)}
                          >
                            <Flag className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleEndSession(session.sessionId)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Join as Moderator Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join as Moderator</DialogTitle>
            <DialogDescription>
              You will join this session with moderator privileges, allowing you to monitor content and take action if needed.
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Course:</span>
                <span className="text-sm text-gray-900">{selectedSession.courseName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Tutor:</span>
                <span className="text-sm text-gray-900">{selectedSession.tutorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Participants:</span>
                <span className="text-sm text-gray-900">{selectedSession.participantCount}</span>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Moderator Responsibilities:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Monitor session content for policy violations</li>
                      <li>Flag inappropriate behavior</li>
                      <li>Assist with technical issues</li>
                      <li>End session if necessary</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmJoinAsModerator}>
              <Eye className="h-4 w-4 mr-2" />
              Join Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flag Session Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Session</DialogTitle>
            <DialogDescription>
              Report this session for review. Provide details about the issue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Flag Type</label>
              <Select
                value={flagData.type}
                onValueChange={(value: any) => setFlagData({ ...flagData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                  <SelectItem value="harassment">Harassment or Bullying</SelectItem>
                  <SelectItem value="technical_issue">Technical Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Provide details about why you're flagging this session..."
                value={flagData.description}
                onChange={(e) => setFlagData({ ...flagData, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitFlag} variant="destructive">
              <Flag className="h-4 w-4 mr-2" />
              Submit Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
