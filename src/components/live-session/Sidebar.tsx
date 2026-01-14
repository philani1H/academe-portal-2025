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
  userRole: 'tutor' | 'student'
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
  sessionId
}: SidebarProps) {
  if (!isOpen) return null

  return (
    <div className="w-full sm:w-80 bg-gradient-to-b from-gray-900 to-gray-800 border-l border-gray-700 flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 px-2 text-xs font-medium flex items-center justify-center ${
            activeTab === 'chat' ? 'text-white bg-gray-700' : 'text-gray-400'
          }`}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-3 px-2 text-xs font-medium flex items-center justify-center ${
            activeTab === 'participants' ? 'text-white bg-gray-700' : 'text-gray-400'
          }`}
        >
          <Users className="h-4 w-4 mr-1" />
          People
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-3 px-2 text-xs font-medium flex items-center justify-center ${
            activeTab === 'files' ? 'text-white bg-gray-700' : 'text-gray-400'
          }`}
        >
          <FileText className="h-4 w-4 mr-1" />
          Files
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-3 px-2 text-xs font-medium flex items-center justify-center ${
            activeTab === 'notes' ? 'text-white bg-gray-700' : 'text-gray-400'
          }`}
        >
          <StickyNote className="h-4 w-4 mr-1" />
          Notes
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
            />
        )}
      </div>
    </div>
  )
}
