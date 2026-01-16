import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Clock, PanelRight, PanelRightClose, Share2, Copy, Radio } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface LiveSessionHeaderProps {
  sessionName: string
  participantCount: number
  userRole: 'tutor' | 'student'
  sessionTime: number
  isJoined: boolean
  isRecording: boolean
  isUploading?: boolean
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  category?: string
  courseName?: string
  onLeave?: () => void
  tutorName?: string
  onCopyLink?: () => void
  onShareLink?: () => void
  connectionStatus?: 'connecting' | 'connected' | 'disconnected'
}

export function LiveSessionHeader({
  sessionName,
  participantCount,
  userRole,
  sessionTime,
  isJoined,
  isRecording,
  isUploading,
  isSidebarOpen,
  onToggleSidebar,
  category,
  courseName,
  onLeave,
  tutorName,
  onCopyLink,
  onShareLink,
  connectionStatus = 'connected'
}: LiveSessionHeaderProps) {
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 px-3 sm:px-5 py-3 sm:py-4 flex justify-between items-center border-b border-indigo-500/20 shadow-xl">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-white text-sm sm:text-xl font-bold truncate">{sessionName}</h2>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 flex-wrap">
            {category && (
              <Badge className="bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] sm:text-xs py-0.5 px-2">
                {category}
              </Badge>
            )}
            <Badge className="bg-slate-800/80 text-indigo-200 border border-indigo-500/30 text-[10px] sm:text-xs py-0.5 px-2 flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{participantCount}</span>
            </Badge>
            {/* Show tutor name for both tutors and students */}
            {tutorName && (
              <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] sm:text-xs py-0.5 px-2 hidden sm:inline-flex border-0">
                {userRole === 'tutor' ? `You: ${tutorName}` : `Tutor: ${tutorName}`}
              </Badge>
            )}
            <Badge className="bg-slate-800/80 text-indigo-200 border border-indigo-500/30 text-[10px] sm:text-xs py-0.5 px-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="hidden sm:inline font-mono">{formatTime(sessionTime)}</span>
              <span className="sm:hidden font-mono">{formatTime(sessionTime).substring(3)}</span>
            </Badge>
            {isJoined && (
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] sm:text-xs py-0.5 px-2 flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                <span className="hidden sm:inline">Live</span>
              </Badge>
            )}
            {!isJoined && userRole === 'tutor' && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] sm:text-xs py-0.5 px-2 flex items-center gap-1">
                <span className="h-2 w-2 bg-yellow-400 rounded-full"></span>
                <span className="hidden sm:inline">Ready</span>
              </Badge>
            )}
            {/* Connection Status */}
            {connectionStatus === 'connecting' && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] sm:text-xs py-0.5 px-2 flex items-center gap-1">
                <div className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">Connecting...</span>
              </Badge>
            )}
            {connectionStatus === 'disconnected' && (
              <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] sm:text-xs py-0.5 px-2 flex items-center gap-1">
                <span className="h-2 w-2 bg-red-400 rounded-full"></span>
                <span className="hidden sm:inline">Disconnected</span>
              </Badge>
            )}
          </div>
        </div>

        {isRecording && (
          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/20 rounded-full border border-red-500/50 flex-shrink-0">
            <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-red-400 text-[10px] sm:text-xs font-bold">REC</span>
          </div>
        )}

        {isUploading && (
          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500/20 rounded-full border border-blue-500/50 flex-shrink-0">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-400 text-[10px] sm:text-xs font-bold">SAVING...</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
        {/* Share Button (Tutor only) */}
        {userRole === 'tutor' && (onCopyLink || onShareLink) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 h-8 w-8 sm:h-10 sm:w-10 p-0 hidden sm:flex rounded-full transition-all duration-200"
                title="Share Session"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-indigo-500/30">
              {onCopyLink && (
                <DropdownMenuItem onClick={onCopyLink} className="flex items-center gap-2 cursor-pointer text-indigo-200 focus:bg-indigo-500/20 focus:text-white">
                  <Copy className="h-4 w-4" />
                  Copy Link
                </DropdownMenuItem>
              )}
              {onShareLink && (
                <DropdownMenuItem onClick={onShareLink} className="flex items-center gap-2 cursor-pointer text-indigo-200 focus:bg-indigo-500/20 focus:text-white">
                  <Share2 className="h-4 w-4" />
                  Share via Email
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onLeave && (
          <Button
            size="sm"
            onClick={onLeave}
            className="bg-red-500 hover:bg-red-600 text-white text-[10px] sm:text-sm px-3 sm:px-4 h-8 sm:h-10 rounded-full font-semibold transition-all duration-200 shadow-lg"
          >
            <span className="hidden sm:inline">{userRole === 'tutor' ? 'End Session' : 'Leave'}</span>
            <span className="sm:hidden">{userRole === 'tutor' ? 'End' : 'Leave'}</span>
          </Button>
        )}
        <Button
          size="sm"
          onClick={onToggleSidebar}
          className={`h-8 w-8 sm:h-10 sm:w-10 p-0 flex-shrink-0 rounded-full transition-all duration-200 ${
            isSidebarOpen
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30'
          }`}
        >
          {isSidebarOpen ? <PanelRightClose className="h-4 w-4 sm:h-5 sm:w-5" /> : <PanelRight className="h-4 w-4 sm:h-5 sm:w-5" />}
        </Button>
      </div>
    </div>
  )
}
