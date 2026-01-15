import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Clock, PanelRight, PanelRightClose, Share2, Copy } from 'lucide-react'
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
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  category?: string
  onLeave?: () => void
  tutorName?: string
  onCopyLink?: () => void
  onShareLink?: () => void
}

export function LiveSessionHeader({
  sessionName,
  participantCount,
  userRole,
  sessionTime,
  isJoined,
  isRecording,
  isSidebarOpen,
  onToggleSidebar,
  category,
  onLeave,
  tutorName,
  onCopyLink,
  onShareLink
}: LiveSessionHeaderProps) {
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center border-b border-gray-700 shadow-lg">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-white text-sm sm:text-xl font-bold truncate">{sessionName}</h2>
          <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
            {category && (
              <Badge variant="outline" className="text-white border-white bg-indigo-500/20 text-[10px] sm:text-sm py-0 sm:py-0.5 px-1.5 sm:px-2">
                {category}
              </Badge>
            )}
            <Badge variant="outline" className="text-white border-white text-[10px] sm:text-sm py-0 sm:py-0.5 px-1.5 sm:px-2 flex items-center gap-0.5 sm:gap-1">
              <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span>{participantCount}</span>
            </Badge>
            {userRole === 'tutor' && (
              <Badge className="bg-indigo-600 text-[10px] sm:text-sm py-0 sm:py-0.5 px-1.5 sm:px-2 hidden sm:inline-flex">
                {tutorName ? `Tutor: ${tutorName}` : 'Tutor'}
              </Badge>
            )}
            <Badge variant="outline" className="text-white border-white text-[10px] sm:text-sm py-0 sm:py-0.5 px-1.5 sm:px-2 flex items-center gap-0.5 sm:gap-1">
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span className="hidden sm:inline">{formatTime(sessionTime)}</span>
              <span className="sm:hidden">{formatTime(sessionTime).substring(3)}</span>
            </Badge>
            {isJoined && (
              <span className="flex items-center gap-0.5 sm:gap-1 text-green-400 text-[10px] sm:text-sm font-medium">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="hidden sm:inline">Live</span>
              </span>
            )}
            {!isJoined && userRole === 'tutor' && (
              <span className="flex items-center gap-0.5 sm:gap-1 text-yellow-400 text-[10px] sm:text-sm font-medium">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-yellow-400 rounded-full"></span>
                <span className="hidden sm:inline">Ready</span>
              </span>
            )}
          </div>
        </div>
        
        {isRecording && (
          <div className="flex items-center gap-1 px-1.5 sm:px-3 py-0.5 sm:py-1 bg-red-500/20 rounded-full border border-red-500 flex-shrink-0">
            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-red-500 text-[10px] sm:text-sm font-bold">REC</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
        {/* Share Button (Tutor only) */}
        {userRole === 'tutor' && (onCopyLink || onShareLink) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-white border-gray-600 hover:bg-gray-700 h-7 w-7 sm:h-9 sm:w-9 p-0 hidden sm:flex"
                title="Share Session"
              >
                <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onCopyLink && (
                <DropdownMenuItem onClick={onCopyLink} className="flex items-center gap-2 cursor-pointer">
                  <Copy className="h-4 w-4" />
                  Copy Link
                </DropdownMenuItem>
              )}
              {onShareLink && (
                <DropdownMenuItem onClick={onShareLink} className="flex items-center gap-2 cursor-pointer">
                  <Share2 className="h-4 w-4" />
                  Share via Email
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {onLeave && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onLeave}
            className="text-[10px] sm:text-sm px-2 sm:px-4 h-7 sm:h-9"
          >
            <span className="hidden sm:inline">{userRole === 'tutor' ? 'End Session' : 'Leave'}</span>
            <span className="sm:hidden">{userRole === 'tutor' ? 'End' : 'Leave'}</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="text-white hover:bg-gray-700 h-7 w-7 sm:h-10 sm:w-10 p-0 flex-shrink-0"
        >
          {isSidebarOpen ? <PanelRightClose className="h-3.5 w-3.5 sm:h-5 sm:w-5" /> : <PanelRight className="h-3.5 w-3.5 sm:h-5 sm:w-5" />}
        </Button>
      </div>
    </div>
  )
}
