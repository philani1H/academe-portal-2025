import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Pencil,
  Hand,
  PhoneOff,
  MessageSquare,
  Layout,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ControlsBarProps {
  userRole: 'tutor' | 'student'
  isAudioOn: boolean
  isVideoOn: boolean
  isScreenSharing: boolean
  isRecording: boolean
  showWhiteboard: boolean
  isHandRaised: boolean
  isSidebarOpen: boolean
  messageCount: number
  onToggleAudio: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onToggleRecording: () => void
  onToggleWhiteboard: () => void
  onToggleHandRaise: () => void
  onRequestScreenShare: () => void
  onToggleSidebar: () => void
  onToggleLayout?: () => void
  onLeave: () => void
}

export function ControlsBar({
  userRole,
  isAudioOn,
  isVideoOn,
  isScreenSharing,
  isRecording,
  showWhiteboard,
  isHandRaised,
  isSidebarOpen,
  messageCount,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onToggleWhiteboard,
  onToggleHandRaise,
  onRequestScreenShare,
  onToggleSidebar,
  onToggleLayout,
  onLeave
}: ControlsBarProps) {
  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-3 sm:px-4 py-3 border-t border-gray-700 relative z-[100] shadow-2xl shrink-0">
      <div className="flex justify-between items-center w-full max-w-full">
        {/* Left Controls - Basic Audio/Video */}
        <div className="flex gap-1 sm:gap-2">
          <Button
            size="sm"
            variant={isAudioOn ? 'default' : 'destructive'}
            onClick={onToggleAudio}
            className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 flex-shrink-0"
            title={isAudioOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isAudioOn ? <Mic className="h-4 w-4 sm:h-5 sm:w-5" /> : <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>

          <Button
            size="sm"
            variant={isVideoOn ? 'default' : 'destructive'}
            onClick={onToggleVideo}
            className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 flex-shrink-0"
            title={isVideoOn ? "Turn Off Camera" : "Turn On Camera"}
          >
            {isVideoOn ? <Video className="h-4 w-4 sm:h-5 sm:w-5" /> : <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>
        </div>

        {/* Center Controls - Mode Specific */}
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          {userRole === 'tutor' ? (
            <>
              <Button
                size="sm"
                variant={isScreenSharing ? 'default' : 'outline'}
                onClick={onToggleScreenShare}
                className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 hidden sm:flex"
                title="Share Screen"
              >
                <MonitorUp className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              <Button
                size="sm"
                variant={isRecording ? 'destructive' : 'outline'}
                onClick={onToggleRecording}
                className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 hidden sm:flex"
                title="Record Session"
              >
                <div className={`h-2 w-2 sm:h-3 sm:w-3 ${isRecording ? 'rounded-sm bg-white animate-pulse' : 'rounded-full bg-red-500'}`} />
              </Button>

              <Button
                size="sm"
                variant={showWhiteboard ? 'default' : 'outline'}
                onClick={onToggleWhiteboard}
                className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 hidden sm:flex"
                title="Whiteboard"
              >
                <Pencil className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant={isHandRaised ? 'default' : 'outline'}
              onClick={onToggleHandRaise}
              className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 flex-shrink-0"
              title="Raise Hand"
            >
              <Hand className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
        </div>

        {/* Right Controls - Sidebar, Menu & Leave */}
        <div className="flex gap-1 sm:gap-2 items-center flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleSidebar}
            className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 hidden sm:flex relative"
            title="Toggle Sidebar"
          >
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            {messageCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {messageCount > 9 ? '9+' : messageCount}
              </span>
            )}
          </Button>

          {/* More Options Menu (for mobile) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 flex sm:hidden"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {userRole === 'tutor' && (
                <>
                  <DropdownMenuItem onClick={onToggleScreenShare} className="flex items-center gap-2 cursor-pointer">
                    <MonitorUp className="h-4 w-4" />
                    {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onToggleRecording} className="flex items-center gap-2 cursor-pointer">
                    <div className={`h-2 w-2 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`} />
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onToggleWhiteboard} className="flex items-center gap-2 cursor-pointer">
                    <Pencil className="h-4 w-4" />
                    {showWhiteboard ? 'Hide Whiteboard' : 'Show Whiteboard'}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={onToggleSidebar} className="flex items-center gap-2 cursor-pointer">
                <MessageSquare className="h-4 w-4" />
                {isSidebarOpen ? 'Hide Chat' : 'Show Chat'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Leave Button */}
          <Button
            size="sm"
            variant="destructive"
            onClick={onLeave}
            className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 flex-shrink-0 hover:bg-red-700"
            title="Leave Session"
          >
            <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
