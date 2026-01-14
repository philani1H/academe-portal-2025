'use client'

import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { LiveSessionHeader } from './LiveSessionHeader'
import { VideoGrid } from './VideoGrid'
import { Sidebar } from './Sidebar'
import { ControlsBar } from './ControlsBar'
import { LiveSessionProps, Message, Participant, SharedFile } from './types'
import { useWebRTC } from './useWebRTC'
import { useRecording } from './useRecording'
import { Whiteboard } from './Whiteboard'
import { Button } from '@/components/ui/button'

export default function EnhancedLiveSession({ sessionId, sessionName, userRole, onLeave, courseId, courseName, category }: LiveSessionProps) {
  // User info
  const [user, setUser] = useState<{id: string, name: string} | null>(null);
  
  // Removed old useRecording call

  useEffect(() => {
    const initUser = async () => {
        // 1. Try local storage first (fastest)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                if (parsed.name && parsed.name !== 'Tutor' && parsed.name !== 'Student') {
                    setUser({ id: parsed.id, name: parsed.name });
                    return;
                }
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
            }
        }

        // 2. Try fetching from API (reliable)
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    setUser({ id: data.user.id, name: data.user.name });
                    // Update local storage to keep it fresh
                    localStorage.setItem('user', JSON.stringify(data.user));
                    return;
                }
            }
        } catch (e) {
            console.error("Failed to fetch user session", e);
        }

        // 3. Fallback (if everything fails)
        setUser({ 
            id: Math.random().toString(36).substr(2, 9), 
            name: userRole === 'tutor' ? 'Instructor' : 'Student' 
        });
    };

    initUser();
  }, [userRole]);

  const { 
      localStream, 
      peers, 
      socket, 
      toggleAudio, 
      muteAudio,
      toggleVideo, 
      toggleScreenShare, 
      toggleHandRaise,
      isVideoOn, 
      isAudioOn, 
      isScreenSharing,
      isHandRaised
  } = useWebRTC({
      sessionId,
      userId: user?.id || 'unknown',
      userRole,
      userName: user?.name || 'Anonymous',
      courseId,
      courseName,
      category
  });

  const { isRecording, startRecording, stopRecording } = useRecording(courseId, localStream, isScreenSharing);

  useEffect(() => {
    console.log(`[LiveSession] Current Session ID: ${sessionId}`);
    console.log(`[LiveSession] User Role: ${userRole}`);
    console.log(`[LiveSession] Course ID: ${courseId}`);
  }, [sessionId, userRole, courseId]);

  // UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'files' | 'notes'>('chat')
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [layout, setLayout] = useState<'focus' | 'grid'>('focus')
  const [isLive, setIsLive] = useState(false)
  
  // Session data
  const [sessionTime, setSessionTime] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState('')
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([])

  // Handle Go Live
  const handleGoLive = () => {
    setIsLive(true);
    if (socket && user) {
        console.log('[LiveSession] Go Live clicked', {
            sessionId,
            courseId,
            courseName,
            tutorId: user.id,
            tutorName: user.name,
            userRole
        });
        socket.emit('session-started', {
            sessionId,
            courseId,
            tutorName: user.name,
            students: []
        });
        toast.success("You are live! Students have been notified.");
    }
  };

  // Timer effect
  useEffect(() => {
    if (!isLive && userRole === 'tutor') return; // Don't start timer if tutor hasn't gone live
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isLive, userRole])

  // Admin actions
  const handleMuteParticipant = (targetSocketId: string | number) => {
    if (userRole !== 'tutor') return;
    socket?.emit('admin-action', { action: 'mute', targetId: targetSocketId, sessionId });
    toast.success("Mute command sent.");
  };

  const handleKickParticipant = (targetSocketId: string | number) => {
    if (userRole !== 'tutor') return;
    socket?.emit('admin-action', { action: 'kick', targetId: targetSocketId, sessionId });
    toast.success("Participant removed.");
  };

  const handleRequestUnmute = (targetSocketId: string | number) => {
    if (userRole !== 'tutor') return;
    socket?.emit('admin-action', { action: 'request-unmute', targetId: targetSocketId, sessionId });
    toast.success("Unmute request sent.");
  };

  // Socket event listeners for admin actions
  useEffect(() => {
    if (socket) {
        socket.on('admin-command', ({ action }) => {
            if (action === 'mute') {
                muteAudio();
                toast.warning("You have been muted by the tutor.");
            } else if (action === 'kick') {
                toast.error("You have been removed from the session.");
                onLeave();
            } else if (action === 'request-unmute') {
                toast("The tutor is asking you to unmute your microphone", {
                    action: {
                        label: "Unmute",
                        onClick: () => toggleAudio()
                    },
                    duration: 10000,
                });
            }
        });
    }
    return () => {
        socket?.off('admin-command');
    }
  }, [socket, muteAudio, onLeave, toggleAudio]);

  // Socket event listeners for chat
  useEffect(() => {
      if(socket) {
          socket.on('chat-message', (msg: Message) => {
              setMessages(prev => [...prev, msg]);
          });
      }
      return () => {
          socket?.off('chat-message');
      }
  }, [socket]);

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if(!chatInput.trim() || !user) return;
      
      const msg: Message = {
          id: Date.now().toString(),
          userId: user.id,
          userName: user.name,
          text: chatInput,
          timestamp: new Date(),
          type: 'text'
      };
      
      // Optimistic update
      setMessages(prev => [...prev, msg]);
      socket?.emit('chat-message', { sessionId, message: msg });
      setChatInput('');
  };

  const participantsList: Participant[] = peers.map(p => ({
      uid: p.peerId,
      role: p.userRole,
      isVideoOn: p.isVideoOn,
      isAudioOn: p.isAudioOn,
      isHandRaised: p.isHandRaised ?? false,
      canShare: p.userRole === 'tutor',
      name: p.name
  }));
  
  // Add self to participants
  if (user) {
      participantsList.push({
          uid: user.id,
          role: userRole,
          isVideoOn: isVideoOn,
          isAudioOn: isAudioOn,
          isHandRaised: isHandRaised,
          canShare: userRole === 'tutor',
          name: user.name
      });
  }

  if (!user) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <LiveSessionHeader
          sessionName={sessionName}
          sessionTime={sessionTime}
          isRecording={isRecording}
          participantCount={peers.length + 1}
          onLeave={onLeave}
          userRole={userRole}
          isJoined={userRole === 'tutor' ? isLive : true}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          category={category}
          tutorName={userRole === 'tutor' ? user.name : undefined}
        />
        
        <div className="flex-1 relative bg-black overflow-hidden flex flex-col">
            {userRole === 'tutor' && !isLive && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-900 p-8 rounded-xl border border-gray-700 text-center max-w-md">
                        <h2 className="text-2xl font-bold text-white mb-4">Ready to Start?</h2>
                        <p className="text-gray-400 mb-6">
                            You are about to start the live session for <span className="text-indigo-400">{courseName || 'this class'}</span>.
                            Students will be notified once you go live.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button 
                                variant="outline" 
                                onClick={onLeave}
                                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={handleGoLive}
                            >
                                Go Live
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {showWhiteboard ? (
                <Whiteboard 
                    socket={socket}
                    sessionId={sessionId}
                    onClose={() => setShowWhiteboard(false)}
                    isTutor={userRole === 'tutor'}
                />
            ) : (
                <VideoGrid 
                    localStream={localStream} 
                    peers={peers} 
                    userRole={userRole}
                    isLocalVideoOn={isVideoOn}
                    layout={layout}
                />
            )}
        </div>

        <div className="flex-none z-50 relative">
            <ControlsBar
                userRole={userRole}
                isAudioOn={isAudioOn}
                isVideoOn={isVideoOn}
                isScreenSharing={isScreenSharing}
                isRecording={isRecording}
                showWhiteboard={showWhiteboard}
                isHandRaised={isHandRaised}
                isSidebarOpen={isSidebarOpen}
                messageCount={messages.length}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                onToggleScreenShare={() => toggleScreenShare().catch(console.error)}
                onToggleRecording={isRecording ? stopRecording : startRecording}
                onToggleWhiteboard={() => setShowWhiteboard(!showWhiteboard)}
                onToggleHandRaise={toggleHandRaise}
                onRequestScreenShare={() => toast.info("Request screen share not implemented yet")}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onToggleLayout={() => setLayout(prev => prev === 'focus' ? 'grid' : 'focus')}
                onLeave={onLeave}
            />
        </div>
      </div>

      {isSidebarOpen && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            messages={messages}
            participants={participantsList}
            sharedFiles={sharedFiles}
            onSendMessage={handleSendMessage}
            chatInput={chatInput}
            setChatInput={setChatInput}
            currentUserId={user.id}
            userRole={userRole}
            socket={socket}
            sessionId={sessionId}
            onMuteParticipant={handleMuteParticipant}
            onKickParticipant={handleKickParticipant}
            onRequestUnmute={handleRequestUnmute}
          />
      )}
    </div>
  )
}
