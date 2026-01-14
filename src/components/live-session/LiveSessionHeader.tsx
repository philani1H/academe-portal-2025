import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Clock, PanelRight, PanelRightClose } from 'lucide-react'

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
  onLeave
}: LiveSessionHeaderProps) {
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-3 sm:px-4 py-3 flex justify-between items-center border-b border-gray-700 shadow-lg">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-white text-base sm:text-xl font-bold truncate">{sessionName}</h2>
          <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
            {category && (
              <Badge variant="outline" className="text-white border-white bg-indigo-500/20 text-xs sm:text-sm py-0.5">
                {category}
              </Badge>
            )}
            <Badge variant="outline" className="text-white border-white text-xs sm:text-sm py-0.5 flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className="hidden sm:inline">{participantCount}</span>
              <span className="sm:hidden">{participantCount}</span>
            </Badge>
            {userRole === 'tutor' && (
              <Badge className="bg-indigo-600 text-xs sm:text-sm py-0.5">Host</Badge>
            )}
            <Badge variant="outline" className="text-white border-white text-xs sm:text-sm py-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(sessionTime)}
            </Badge>
            {isJoined && (
              <span className="flex items-center gap-1 text-green-400 text-xs sm:text-sm font-medium">
                <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="hidden sm:inline">Live</span>
                <span className="sm:hidden">●</span>
              </span>
            )}
            {!isJoined && userRole === 'tutor' && (
              <span className="flex items-center gap-1 text-yellow-400 text-xs sm:text-sm font-medium">
                <span className="h-2 w-2 bg-yellow-400 rounded-full"></span>
                Ready
              </span>
            )}
          </div>
        </div>
        
        {isRecording && (
          <div className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-red-500/20 rounded-full border border-red-500 flex-shrink-0 ml-2">
            <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-red-500 text-xs sm:text-sm font-bold">REC</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
        {onLeave && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onLeave}
            className="text-xs sm:text-sm px-2 sm:px-4"
          >
            <span className="hidden sm:inline">{userRole === 'tutor' ? 'End Session' : 'Leave'}</span>
            <span className="sm:hidden">{userRole === 'tutor' ? 'End' : 'Leave'}</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="text-white hover:bg-gray-700 h-8 w-8 sm:h-10 sm:w-10 p-0 flex-shrink-0"
        >
          {isSidebarOpen ? <PanelRightClose className="h-4 w-4 sm:h-5 sm:w-5" /> : <PanelRight className="h-4 w-4 sm:h-5 sm:w-5" />}
        </Button>
      </div>
    </div>
  )
}
