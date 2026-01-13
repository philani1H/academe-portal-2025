'use client'

import React, { useState, useEffect } from 'react'
import AgoraRTC, {
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Users,
  MessageSquare,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'

interface LiveSessionProps {
  sessionId: string
  sessionName: string
  userRole: 'tutor' | 'student'
  onLeave: () => void
}

// Agora configuration - Replace with your actual App ID
const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || 'your_agora_app_id_here'

export function LiveSession({ sessionId, sessionName, userRole, onLeave }: LiveSessionProps) {
  const [isJoined, setIsJoined] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null)
  const [client] = useState(() =>
    AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
  )

  useEffect(() => {
    // Setup event listeners
    client.on('user-published', handleUserPublished)
    client.on('user-unpublished', handleUserUnpublished)
    client.on('user-left', handleUserLeft)

    // Join the channel
    joinChannel()

    return () => {
      leaveChannel()
    }
  }, [])

  const joinChannel = async () => {
    try {
      // Generate a token (in production, get this from your server)
      // For development, you can use null if you haven't enabled token authentication
      const token = null

      // Join the channel
      const uid = await client.join(APP_ID, sessionId, token, null)

      // Create local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()

      setLocalAudioTrack(audioTrack)
      setLocalVideoTrack(videoTrack)

      // Play local video track
      if (videoTrack) {
        videoTrack.play('local-player')
      }

      // Publish local tracks
      await client.publish([audioTrack, videoTrack])

      setIsJoined(true)
      toast.success(`Joined session: ${sessionName}`)
    } catch (error) {
      console.error('Error joining channel:', error)
      toast.error('Failed to join session. Please check your camera and microphone permissions.')
    }
  }

  const leaveChannel = async () => {
    try {
      // Stop local tracks
      if (localAudioTrack) {
        localAudioTrack.stop()
        localAudioTrack.close()
      }
      if (localVideoTrack) {
        localVideoTrack.stop()
        localVideoTrack.close()
      }

      // Leave the channel
      await client.leave()

      setIsJoined(false)
      setRemoteUsers([])
    } catch (error) {
      console.error('Error leaving channel:', error)
    }
  }

  const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    await client.subscribe(user, mediaType)

    if (mediaType === 'video') {
      setRemoteUsers((prev) => {
        const exists = prev.find((u) => u.uid === user.uid)
        if (exists) return prev
        return [...prev, user]
      })

      // Play remote video
      setTimeout(() => {
        user.videoTrack?.play(`remote-player-${user.uid}`)
      }, 100)
    }

    if (mediaType === 'audio') {
      user.audioTrack?.play()
    }
  }

  const handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (mediaType === 'video') {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid))
    }
  }

  const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
    setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid))
  }

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoOn)
      setIsVideoOn(!isVideoOn)
    }
  }

  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioOn)
      setIsAudioOn(!isAudioOn)
    }
  }

  const handleLeave = async () => {
    await leaveChannel()
    onLeave()
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-white text-xl font-bold">{sessionName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-white border-white">
              <Users className="h-3 w-3 mr-1" />
              {remoteUsers.length + 1} Participants
            </Badge>
            {userRole === 'tutor' && (
              <Badge className="bg-blue-500">Tutor</Badge>
            )}
          </div>
        </div>
        <div className="text-white text-sm">
          {isJoined ? (
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </span>
          ) : (
            <span className="text-gray-400">Connecting...</span>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div className={`grid gap-4 h-full ${remoteUsers.length === 0 ? 'grid-cols-1' : remoteUsers.length === 1 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
          {/* Local Video */}
          <Card className="relative overflow-hidden bg-gray-800 border-gray-700">
            <div id="local-player" className="w-full h-full min-h-[300px]"></div>
            {!isVideoOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <VideoOff className="h-12 w-12 text-gray-500" />
              </div>
            )}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
              <Badge className="bg-black/50 text-white">You</Badge>
              <div className="flex gap-2">
                {!isAudioOn && <MicOff className="h-4 w-4 text-red-500" />}
              </div>
            </div>
          </Card>

          {/* Remote Videos */}
          {remoteUsers.map((user) => (
            <Card key={user.uid} className="relative overflow-hidden bg-gray-800 border-gray-700">
              <div id={`remote-player-${user.uid}`} className="w-full h-full min-h-[300px]"></div>
              <div className="absolute bottom-4 left-4">
                <Badge className="bg-black/50 text-white">
                  Participant {user.uid}
                </Badge>
              </div>
            </Card>
          ))}

          {/* Empty state when alone */}
          {remoteUsers.length === 0 && (
            <Card className="flex items-center justify-center bg-gray-800 border-gray-700 min-h-[300px]">
              <div className="text-center text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <p>Waiting for others to join...</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            variant={isAudioOn ? 'default' : 'destructive'}
            onClick={toggleAudio}
            className="rounded-full w-14 h-14"
          >
            {isAudioOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>

          <Button
            size="lg"
            variant={isVideoOn ? 'default' : 'destructive'}
            onClick={toggleVideo}
            className="rounded-full w-14 h-14"
          >
            {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>

          <Button
            size="lg"
            variant="destructive"
            onClick={handleLeave}
            className="rounded-full w-14 h-14"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}
