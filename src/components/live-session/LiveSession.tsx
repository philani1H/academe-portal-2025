'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { LiveSessionHeader } from './LiveSessionHeader'
import { VideoGrid } from './VideoGrid'
import { Sidebar } from './Sidebar'
import { ControlsBar } from './ControlsBar'
import { LiveSessionProps, Message, Participant, SharedFile } from './types'
import { useWebRTC } from './useWebRTC'
import { useRecording } from './useRecording'
import { Whiteboard } from './whiteboard/Whiteboard'
import { Button } from '@/components/ui/button'

export default function EnhancedLiveSession({ 
  sessionId, 
  sessionName, 
  userRole, 
  onLeave, 
  courseId, 
  courseName, 
  category, 
  tutorName: propTutorName 
}: LiveSessionProps) {
  const [user, setUser] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    const initUser = async () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                if (parsed.name && parsed.name !== 'Tutor' && parsed.name !== 'Student' && parsed.name !== 'Instructor' && parsed.name !== 'Anonymous') {
                    setUser({ id: parsed.id || `user-${Date.now()}`, name: parsed.name });
                    return;
                }
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
            }
        }

        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.user && data.user.name) {
                    setUser({ id: String(data.user.id), name: data.user.name });
                    localStorage.setItem('user', JSON.stringify({ ...data.user, id: String(data.user.id) }));
                    return;
                }
            }
        } catch (e) {
            console.error("Failed to fetch user session", e);
        }

        if (userRole === 'tutor' && propTutorName) {
            setUser({
                id: `tutor-${Date.now()}`,
                name: propTutorName
            });
            return;
        }

        setUser({
            id: `${userRole}-${Date.now()}`,
            name: userRole === 'tutor' ? (propTutorName || 'Instructor') : 'Student'
        });
    };

    initUser();
  }, [userRole, propTutorName]);

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
      isHandRaised,
      connectionStatus,
      sessionStartTime,
      reconnectAttempt,
      manualReconnect
  } = useWebRTC({
      sessionId,
      userId: user?.id || '',
      userRole,
      userName: user?.name || '',
      courseId,
      courseName,
      category
  });

  const { isRecording, isUploading, startRecording, stopRecording } = useRecording(courseId, localStream, isScreenSharing);

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmails, setShareEmails] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const activeTutorName = propTutorName || (userRole === 'tutor' ? user?.name : undefined);

  const getSessionLink = () => {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    if (courseName) params.append('courseName', courseName);
    if (category) params.append('category', category);
    if (activeTutorName) params.append('tutorName', activeTutorName);
    params.append('fromStudent', 'true');
    return `${window.location.origin}/live-session/${sessionId}?${params.toString()}`;
  };

  const handleShareLink = async () => {
    if (!shareEmails.trim()) {
      toast.error('Please enter at least one email address');
      return;
    }

    setIsSharing(true);
    try {
      const emails = shareEmails.split(',').map(e => e.trim()).filter(e => e);
      const response = await fetch('/api/live-session/share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          courseId,
          courseName,
          tutorName: activeTutorName || user?.name || 'Instructor',
          emails,
          personalMessage: shareMessage,
          sessionLink: getSessionLink(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Session link shared successfully!');
        setShowShareDialog(false);
        setShareEmails('');
        setShareMessage('');
      } else {
        throw new Error('Failed to share link');
      }
    } catch (error) {
      toast.error('Failed to share session link');
    } finally {
      setIsSharing(false);
    }
  };

  const copySessionLink = () => {
    const link = getSessionLink();
    navigator.clipboard.writeText(link);
    toast.success('Session link copied!');
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'files' | 'notes'>('chat')
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [layout, setLayout] = useState<'focus' | 'grid'>('focus')
  const [isLive, setIsLive] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState('')
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([])

  const handleGoLive = () => {
    setIsLive(true);
    if (socket && user) {
        socket.emit('session-started', {
            sessionId,
            courseId,
            tutorName: user.name,
            students: []
        });
        toast.success("You are live! 🎉");
    }
  };

  useEffect(() => {
    if (sessionStartTime) {
      const updateTime = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - sessionStartTime) / 1000);
        setSessionTime(elapsed > 0 ? elapsed : 0);
      };
      
      updateTime();
      const timer = setInterval(updateTime, 1000);
      return () => clearInterval(timer);
    }
    
    if (!isLive && userRole === 'tutor') return; 
    
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isLive, userRole, sessionStartTime])

  const handleMuteParticipant = (targetSocketId: string | number) => {
    if (userRole !== 'tutor') return;
    socket?.emit('admin-action', { action: 'mute', targetId: targetSocketId, sessionId });
    toast.success("Mute command sent");
  };

  const handleKickParticipant = (targetSocketId: string | number) => {
    if (userRole !== 'tutor') return;
    socket?.emit('admin-action', { action: 'kick', targetId: targetSocketId, sessionId });
    toast.success("Participant removed");
  };

  const handleRequestUnmute = (targetSocketId: string | number) => {
    if (userRole !== 'tutor') return;
    socket?.emit('admin-action', { action: 'request-unmute', targetId: targetSocketId, sessionId });
    toast.success("Unmute request sent");
  };

  useEffect(() => {
    if (socket) {
        socket.on('admin-command', ({ action }) => {
            if (action === 'mute') {
                muteAudio();
                toast.warning("You have been muted");
            } else if (action === 'kick') {
                toast.error("You have been removed");
                onLeave();
            } else if (action === 'request-unmute') {
                toast("Please unmute your microphone", {
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

  useEffect(() => {
      if(socket) {
          socket.on('chat-message', (msg: Message) => {
              setMessages(prev => [...prev, msg]);

              if (activeTab !== 'chat' && msg.userId !== user?.id) {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZURE');
                audio.volume = 0.2;
                audio.play().catch(() => {});

                toast.info(`${msg.userName}: ${msg.text.substring(0, 30)}...`, {
                  duration: 3000,
                  icon: '💬',
                  action: {
                    label: 'View',
                    onClick: () => setActiveTab('chat')
                  }
                });
              }
          });

          socket.on('file-shared', (file: SharedFile) => {
             setSharedFiles(prev => [...prev, file]);
             if (activeTab !== 'files') {
                toast.info(`New file: ${file.name}`);
             }
          });
      }
      return () => {
          socket?.off('chat-message');
          socket?.off('file-shared');
      }
  }, [socket, activeTab, user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!socket || !socket.connected) {
        toast.error("Cannot upload: No connection");
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading('Uploading...');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      
      const sharedFile: SharedFile = {
        id: Date.now().toString(),
        name: file.name,
        url: data.url,
        size: (file.size / 1024).toFixed(1) + ' KB',
        uploadedBy: user.name,
        uploadedAt: new Date()
      };

      setSharedFiles(prev => [...prev, sharedFile]);
      socket.emit('file-shared', { sessionId, file: sharedFile });
      toast.success('File shared', { id: toastId });
    } catch (error) {
      toast.error('Upload failed', { id: toastId });
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if(!chatInput.trim() || !user) return;
      
      if (!socket || !socket.connected) {
          toast.error("Cannot send: No connection");
          return;
      }

      const msg: Message = {
          id: Date.now().toString(),
          userId: user.id,
          userName: user.name,
          text: chatInput,
          timestamp: new Date(),
          type: 'text'
      };
      
      setMessages(prev => [...prev, msg]);
      
      try {
        socket.emit('chat-message', { sessionId, message: msg });
        setChatInput('');
      } catch (error) {
        toast.error("Failed to send message");
      }
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

  // Loading states - Mobile optimized
  if (!user) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white gap-3 p-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      <p className="text-gray-400 text-sm">Setting up...</p>
    </div>
  );
  
  if (!localStream && connectionStatus === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white gap-3 p-4 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        <p className="text-base font-semibold">Setting up media...</p>
        <p className="text-gray-400 text-xs">Allow camera & mic access</p>
      </div>
    );
  }
  
  if (connectionStatus === 'disconnected') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white gap-3 p-4">
        <div className="text-red-500 text-5xl mb-2">⚠️</div>
        <p className="text-base font-semibold">Connection Lost</p>
        <p className="text-gray-400 text-sm">Reconnecting...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mt-2"></div>
      </div>
    );
  }

  // Reconnecting state
  if (connectionStatus === 'reconnecting') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white gap-3 p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
        <p className="text-base font-semibold">Reconnecting...</p>
        <p className="text-gray-400 text-sm">Attempt {reconnectAttempt}/5</p>
        <Button 
          onClick={manualReconnect}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2"
        >
          Reconnect Now
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gray-900 text-white overflow-hidden flex-col">
        {/* Header */}
        <div className="flex-none">
          <LiveSessionHeader
            sessionName={sessionName}
            sessionTime={sessionTime}
            isRecording={isRecording}
            isUploading={isUploading}
            participantCount={peers.length + 1}
            onLeave={onLeave}
            userRole={userRole}
            isJoined={userRole === 'tutor' ? isLive : true}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            category={category}
            courseName={courseName}
            tutorName={activeTutorName || (userRole === 'tutor' ? user.name : undefined)}
            onCopyLink={copySessionLink}
            onShareLink={() => setShowShareDialog(true)}
            connectionStatus={connectionStatus}
          />
        </div>
          
        {/* Main Content Row */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video + Controls Column */}
          <div className="flex-1 flex flex-col relative min-w-0">
            {/* Video Area */}
            <div className="flex-1 relative bg-black overflow-hidden flex flex-col min-h-0">
              {userRole === 'tutor' && !isLive && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                      <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 text-center max-w-sm">
                          <h2 className="text-lg font-bold text-white mb-2">Ready to Start?</h2>
                          <p className="text-sm text-gray-400 mb-4">
                              Start live session for <span className="text-indigo-400">{courseName || 'this class'}</span>
                          </p>
                          <div className="flex gap-2 justify-center">
                              <Button 
                                  variant="outline" 
                                  onClick={onLeave}
                                  className="border-gray-600 text-gray-300 hover:bg-gray-800 text-sm"
                              >
                                  Cancel
                              </Button>
                              <Button 
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
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
                      onMuteStudent={handleMuteParticipant}
                      onUnmuteStudent={handleRequestUnmute}
                  />
              )}
            </div>

            {/* Controls Bar */}
            <div className="flex-none z-50">
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
                  onRequestScreenShare={() => toast.info("Request not implemented")}
                  onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                  onToggleLayout={() => setLayout(prev => prev === 'focus' ? 'grid' : 'focus')}
                  onLeave={onLeave}
              />
            </div>
          </div>

          {/* Sidebar - Desktop */}
          {isSidebarOpen && (
            <div className="w-80 border-l border-gray-800 bg-gray-900 flex-none hidden md:block h-full">
              <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                messages={messages}
                participants={participantsList}
                sharedFiles={sharedFiles}
                onFileUpload={handleFileUpload}
                onSendMessage={handleSendMessage}
                chatInput={chatInput}
                setChatInput={setChatInput}
                currentUserId={user.id}
                currentUserName={user.name}
                userRole={userRole}
                socket={socket}
                sessionId={sessionId}
                onMuteParticipant={handleMuteParticipant}
                onKickParticipant={handleKickParticipant}
                onRequestUnmute={handleRequestUnmute}
              />
            </div>
          )}
        </div>

        {/* Sidebar - Mobile Overlay */}
        {isSidebarOpen && (
            <div className="fixed inset-0 z-[60] md:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)}></div>
              <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-gray-900">
                <Sidebar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  messages={messages}
                  participants={participantsList}
                  sharedFiles={sharedFiles}
                  onFileUpload={handleFileUpload}
                  onSendMessage={handleSendMessage}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  currentUserId={user.id}
                  currentUserName={user.name}
                  userRole={userRole}
                  socket={socket}
                  sessionId={sessionId}
                  onMuteParticipant={handleMuteParticipant}
                  onKickParticipant={handleKickParticipant}
                  onRequestUnmute={handleRequestUnmute}
                />
              </div>
            </div>
        )}
      </div>

      {/* Share Dialog - Mobile Optimized */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-3">Share Link</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Emails (comma-separated)</label>
                <input
                  type="text"
                  value={shareEmails}
                  onChange={(e) => setShareEmails(e.target.value)}
                  placeholder="student1@email.com"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Message (optional)</label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Add a message..."
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowShareDialog(false)}
                  disabled={isSharing}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleShareLink}
                  disabled={isSharing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                >
                  {isSharing ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}