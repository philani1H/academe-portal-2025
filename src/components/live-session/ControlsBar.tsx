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
  MoreVertical,
  Circle,
  Flag
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ControlsBarProps {
  userRole: 'tutor' | 'student' | 'admin'
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
  onFlagSession?: () => void
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
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 px-3 sm:px-6 py-3 sm:py-4 border-t border-indigo-500/20 relative z-[100] shadow-2xl shrink-0">
      <div className="flex justify-between items-center w-full max-w-full">
        {/* Left Controls - Basic Audio/Video */}
        <div className="flex gap-2 sm:gap-3 flex-1 justify-start">
          <Button
            size="sm"
            onClick={onToggleAudio}
            className={`rounded-full w-11 h-11 sm:w-14 sm:h-14 p-0 flex-shrink-0 transition-all duration-200 shadow-lg ${
              isAudioOn
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isAudioOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isAudioOn ? <Mic className="h-5 w-5 sm:h-6 sm:w-6" /> : <MicOff className="h-5 w-5 sm:h-6 sm:w-6" />}
          </Button>

          <Button
            size="sm"
            onClick={onToggleVideo}
            className={`rounded-full w-11 h-11 sm:w-14 sm:h-14 p-0 flex-shrink-0 transition-all duration-200 shadow-lg ${
              isVideoOn
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isVideoOn ? "Turn Off Camera" : "Turn On Camera"}
          >
            {isVideoOn ? <Video className="h-5 w-5 sm:h-6 sm:w-6" /> : <VideoOff className="h-5 w-5 sm:h-6 sm:w-6" />}
          </Button>
        </div>

        {/* Center Controls - Mode Specific */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 sm:gap-3 flex-shrink-0">
          {userRole === 'tutor' || userRole === 'admin' ? (
            <>
              <Button
                size="sm"
                onClick={onToggleScreenShare}
                className={`rounded-full w-11 h-11 sm:w-14 sm:h-14 p-0 hidden sm:flex transition-all duration-200 shadow-lg ${
                  isScreenSharing
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30'
                }`}
                title="Share Screen"
              >
                <MonitorUp className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>

              <Button
                size="sm"
                onClick={onToggleRecording}
                className={`rounded-full w-11 h-11 sm:w-14 sm:h-14 p-0 hidden sm:flex transition-all duration-200 shadow-lg ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30'
                }`}
                title="Record Session"
              >
                <Circle className={`h-4 w-4 sm:h-5 sm:w-5 ${isRecording ? 'fill-white' : 'fill-red-500'}`} />
              </Button>

              <Button
                size="sm"
                onClick={onToggleWhiteboard}
                className={`rounded-full w-11 h-11 sm:w-14 sm:h-14 p-0 hidden sm:flex transition-all duration-200 shadow-lg ${
                  showWhiteboard
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30'
                }`}
                title="Whiteboard"
              >
                <Pencil className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>

              {userRole === 'admin' && (
                <Button
                  size="sm"
                  onClick={onFlagSession}
                  className="rounded-full w-11 h-11 sm:w-14 sm:h-14 p-0 hidden sm:flex transition-all duration-200 shadow-lg bg-red-500 hover:bg-red-600 text-white"
                  title="Flag Session"
                >
                  <Flag className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              )}
            </>
          ) : (
            <Button
              size="sm"
              onClick={onToggleHandRaise}
              className={`rounded-full w-11 h-11 sm:w-14 sm:h-14 p-0 flex-shrink-0 transition-all duration-200 shadow-lg ${
                isHandRaised
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white animate-bounce'
                  : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30'
              }`}
              title="Raise Hand"
            >
              <Hand className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          )}
        </div>

        {/* Right Controls - Sidebar, Menu & Leave */}
        <div className="flex gap-2 sm:gap-3 items-center flex-shrink-0 flex-1 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleSidebar}
            className={`rounded-full w-11 h-11 sm:w-14 sm:h-14 p-0 hidden sm:flex relative transition-all duration-200 shadow-lg ${
              isSidebarOpen
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0'
                : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30'
            }`}
            title="Toggle Sidebar"
          >
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
            {messageCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
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
                className="rounded-full w-11 h-11 p-0 flex sm:hidden bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-indigo-500/30">
              {(userRole === 'tutor' || userRole === 'admin') && (
                <>
                  <DropdownMenuItem onClick={onToggleScreenShare} className="flex items-center gap-2 cursor-pointer text-indigo-200 focus:bg-indigo-500/20 focus:text-white">
                    <MonitorUp className="h-4 w-4" />
                    {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onToggleRecording} className="flex items-center gap-2 cursor-pointer text-indigo-200 focus:bg-indigo-500/20 focus:text-white">
                    <Circle className={`h-3 w-3 ${isRecording ? 'fill-red-500' : 'fill-red-500'}`} />
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onToggleWhiteboard} className="flex items-center gap-2 cursor-pointer text-indigo-200 focus:bg-indigo-500/20 focus:text-white">
                    <Pencil className="h-4 w-4" />
                    {showWhiteboard ? 'Hide Whiteboard' : 'Show Whiteboard'}
                  </DropdownMenuItem>
                  {userRole === 'admin' && (
                    <DropdownMenuItem onClick={onFlagSession} className="flex items-center gap-2 cursor-pointer text-red-400 focus:bg-red-500/20 focus:text-red-200">
                      <Flag className="h-4 w-4" />
                      Flag Session
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuItem onClick={onToggleSidebar} className="flex items-center gap-2 cursor-pointer text-indigo-200 focus:bg-indigo-500/20 focus:text-white">
                <MessageSquare className="h-4 w-4" />
                {isSidebarOpen ? 'Hide Chat' : 'Show Chat'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Leave Button */}
          <Button
            size="sm"
            onClick={onLeave}
            className="rounded-full w-11 h-11 sm:w-14 sm:h-14 p-0 flex-shrink-0 bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all duration-200"
            title="Leave Session"
          >
            <PhoneOff className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}
