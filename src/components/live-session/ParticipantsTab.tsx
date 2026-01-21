import React from 'react'
import { Participant } from './types'
import { Button } from '@/components/ui/button'
import { Hand, Mic, MicOff, Video, VideoOff, Check, XCircle, User } from 'lucide-react'

interface ParticipantsTabProps {
  participants: Participant[]
  userRole: 'tutor' | 'student' | 'admin'
  currentUserId?: string
  onGrantShare: (uid: string | number) => void
  onRevokeShare: (uid: string | number) => void
  onMuteParticipant?: (uid: string | number) => void
  onRequestUnmute?: (uid: string | number) => void
  onKickParticipant?: (uid: string | number) => void
}

export function ParticipantsTab({
  participants,
  userRole,
  currentUserId,
  onGrantShare,
  onRevokeShare,
  onMuteParticipant,
  onRequestUnmute,
  onKickParticipant
}: ParticipantsTabProps) {
  const isCurrentUser = (uid: string | number) => String(currentUserId) === String(uid);

  // Separate current user and other participants
  const currentUser = participants.find(p => isCurrentUser(p.uid));
  const otherParticipants = participants.filter(p => !isCurrentUser(p.uid));

  return (
    <div className="flex-1 overflow-auto p-3 space-y-3 bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Current User - Always show first */}
      {currentUser && (
        <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-bold">
                    {currentUser.name || (currentUser.role === 'tutor' ? 'You (Tutor)' : currentUser.role === 'admin' ? 'You (Admin)' : 'You (Student)')}
                  </p>
                  <span className="bg-indigo-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    YOU
                  </span>
                </div>
                <p className="text-indigo-300 text-xs capitalize font-medium">{currentUser.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {currentUser.isHandRaised && (
                <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded">
                  <Hand className="h-4 w-4 text-yellow-400" />
                </div>
              )}
              <div className="flex gap-1.5 bg-gray-900/50 px-2 py-1 rounded">
                {currentUser.isAudioOn ? (
                  <Mic className="h-4 w-4 text-green-400" title="Microphone on" />
                ) : (
                  <MicOff className="h-4 w-4 text-red-400" title="Microphone off" />
                )}
                {currentUser.isVideoOn ? (
                  <Video className="h-4 w-4 text-green-400" title="Camera on" />
                ) : (
                  <VideoOff className="h-4 w-4 text-red-400" title="Camera off" />
                )}
              </div>
            </div>
          </div>
          
          {/* Status Info */}
          <div className="flex gap-2 flex-wrap text-xs text-indigo-200 bg-gray-900/40 rounded px-2 py-2">
            <span className="flex items-center gap-1">
              {currentUser.isAudioOn ? (
                <>
                  <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                  Microphone On
                </>
              ) : (
                <>
                  <span className="h-2 w-2 bg-red-400 rounded-full"></span>
                  Microphone Off
                </>
              )}
            </span>
            <span className="flex items-center gap-1">
              {currentUser.isVideoOn ? (
                <>
                  <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                  Camera On
                </>
              ) : (
                <>
                  <span className="h-2 w-2 bg-red-400 rounded-full"></span>
                  Camera Off
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Divider */}
      {otherParticipants.length > 0 && (
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
          <span className="text-xs text-indigo-300/60 font-medium">Other Participants ({otherParticipants.length})</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
        </div>
      )}

      {/* Other Participants */}
      {otherParticipants.map((participant) => (
        <div key={participant.uid} className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 hover:from-slate-800/80 hover:to-slate-900/80 rounded-xl p-3 transition-all duration-200 border border-indigo-500/10 hover:border-indigo-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm shadow-lg">
                {participant.name?.charAt(0).toUpperCase() || (participant.role === 'tutor' ? 'T' : 'S')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {participant.name || (participant.role === 'tutor' ? 'Tutor' : participant.role === 'admin' ? 'Admin' : 'Student')}
                </p>
                <p className="text-indigo-300/50 text-xs capitalize">{participant.role}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {participant.isHandRaised && (
                <div className="flex items-center justify-center bg-yellow-500/20 rounded-lg p-1.5 animate-bounce">
                  <Hand className="h-3.5 w-3.5 text-yellow-400" />
                </div>
              )}
              <div className="flex gap-1.5 bg-slate-900/50 rounded-lg p-1.5">
                {participant.isAudioOn ? (
                  <Mic className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <MicOff className="h-3.5 w-3.5 text-red-400" />
                )}
                {participant.isVideoOn ? (
                  <Video className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <VideoOff className="h-3.5 w-3.5 text-red-400" />
                )}
              </div>
            </div>
          </div>

          {/* Tutor Controls */}
          {(userRole === 'tutor' || userRole === 'admin') && participant.role === 'student' && (
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-indigo-500/10">
              <div className="flex gap-2">
                {participant.canShare ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onRevokeShare(participant.uid)}
                    className="flex-1 text-xs h-8"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Revoke Share
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onGrantShare(participant.uid)}
                    className="flex-1 text-xs h-8"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Allow Share
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {participant.isAudioOn ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onMuteParticipant?.(participant.uid)}
                    className="flex-1 text-xs h-8"
                  >
                    <MicOff className="h-3 w-3 mr-1" />
                    Mute
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRequestUnmute?.(participant.uid)}
                    className="flex-1 text-xs h-8"
                  >
                    <Mic className="h-3 w-3 mr-1" />
                    Ask Unmute
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onKickParticipant?.(participant.uid)}
                  className="flex-1 text-xs h-8"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Empty State */}
      {participants.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-3">
            <User className="h-7 w-7 text-indigo-400/50" />
          </div>
          <p className="text-indigo-300/60 text-sm">No participants yet</p>
          <p className="text-indigo-300/40 text-xs mt-1">Waiting for others to join...</p>
        </div>
      )}
    </div>
  )
}
