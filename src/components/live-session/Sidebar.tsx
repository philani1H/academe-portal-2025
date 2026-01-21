import React, { RefObject } from 'react'
import { MessageSquare, Users, FileText, StickyNote } from 'lucide-react'
import { Message, Participant, SharedFile } from './types'
import { ChatTab } from './ChatTab'
import { ParticipantsTab } from './ParticipantsTab'
import { FilesTab } from './FilesTab'
import { SharedNotes } from './SharedNotes'
import { Socket } from 'socket.io-client'

interface SidebarProps {
  isOpen?: boolean
  activeTab: 'chat' | 'participants' | 'files' | 'notes'
  setActiveTab: (tab: 'chat' | 'participants' | 'files' | 'notes') => void
  messages: Message[]
  chatInput: string
  setChatInput: (val: string) => void
  onSendMessage: (e: React.FormEvent) => void
  participants: Participant[]
  userRole: 'tutor' | 'student' | 'admin'
  onGrantShare?: (uid: string | number) => void
  onRevokeShare?: (uid: string | number) => void
  onMuteParticipant?: (uid: string | number) => void
  onRequestUnmute?: (uid: string | number) => void
  onKickParticipant?: (uid: string | number) => void
  sharedFiles: SharedFile[]
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void
  chatEndRef?: RefObject<HTMLDivElement>
  fileInputRef?: RefObject<HTMLInputElement>
  socket?: Socket
  sessionId: string
  currentUserId?: string
  currentUserName?: string
}

export function Sidebar({
  isOpen = true,
  activeTab,
  setActiveTab,
  messages,
  chatInput,
  setChatInput,
  onSendMessage,
  participants,
  userRole,
  onGrantShare,
  onRevokeShare,
  onMuteParticipant,
  onRequestUnmute,
  onKickParticipant,
  sharedFiles,
  onFileUpload,
  chatEndRef,
  fileInputRef,
  socket,
  sessionId,
  currentUserId,
  currentUserName
}: SidebarProps) {
  if (!isOpen) return null

  return (
    <div className="w-full sm:w-80 md:w-96 bg-gradient-to-b from-slate-900 to-slate-950 border-l border-indigo-500/20 flex flex-col h-full sm:h-auto absolute sm:relative inset-0 sm:inset-auto z-40 sm:z-auto">
      {/* Tabs */}
      <div className="flex border-b border-indigo-500/20 bg-slate-900/95 backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 px-2 text-sm font-medium flex items-center justify-center gap-2 transition-all relative ${
            activeTab === 'chat'
              ? 'text-indigo-400 bg-slate-800/50'
              : 'text-indigo-300/50 hover:text-indigo-200 hover:bg-slate-800/30'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Chat</span>
          {activeTab === 'chat' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-3 px-2 text-sm font-medium flex items-center justify-center gap-2 transition-all relative ${
            activeTab === 'participants'
              ? 'text-indigo-400 bg-slate-800/50'
              : 'text-indigo-300/50 hover:text-indigo-200 hover:bg-slate-800/30'
          }`}
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">People</span>
          {activeTab === 'participants' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-3 px-2 text-sm font-medium flex items-center justify-center gap-2 transition-all relative ${
            activeTab === 'files'
              ? 'text-indigo-400 bg-slate-800/50'
              : 'text-indigo-300/50 hover:text-indigo-200 hover:bg-slate-800/30'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Files</span>
          {activeTab === 'files' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-3 px-2 text-sm font-medium flex items-center justify-center gap-2 transition-all relative ${
            activeTab === 'notes'
              ? 'text-indigo-400 bg-slate-800/50'
              : 'text-indigo-300/50 hover:text-indigo-200 hover:bg-slate-800/30'
          }`}
        >
          <StickyNote className="h-4 w-4" />
          <span className="hidden sm:inline">Notes</span>
          {activeTab === 'notes' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'chat' && (
            <ChatTab
            messages={messages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onSendMessage={onSendMessage}
            chatEndRef={chatEndRef}
            />
        )}

        {activeTab === 'participants' && (
          <ParticipantsTab
            participants={participants}
            userRole={userRole}
            currentUserId={currentUserId}
            onGrantShare={onGrantShare || (() => {})}
            onRevokeShare={onRevokeShare || (() => {})}
            onMuteParticipant={onMuteParticipant}
            onRequestUnmute={onRequestUnmute}
            onKickParticipant={onKickParticipant}
          />
        )}

        {activeTab === 'files' && (
            <FilesTab
            sharedFiles={sharedFiles}
            onFileUpload={onFileUpload || (() => {})}
            fileInputRef={fileInputRef}
            userRole={userRole}
            />
        )}
        
        {activeTab === 'notes' && (
            <SharedNotes 
                socket={socket}
                sessionId={sessionId}
                userName={currentUserName}
            />
        )}
      </div>
    </div>
  )
}
