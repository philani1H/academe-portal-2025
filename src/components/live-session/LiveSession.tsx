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

export default function EnhancedLiveSession({ sessionId, sessionName, userRole, onLeave, courseId, courseName, category, tutorName: propTutorName }: LiveSessionProps) {
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
                if (parsed.name && parsed.name !== 'Tutor' && parsed.name !== 'Student' && parsed.name !== 'Instructor' && parsed.name !== 'Anonymous') {
                    setUser({ id: parsed.id || `user-${Date.now()}`, name: parsed.name });
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
                if (data.user && data.user.name) {
                    setUser({ id: String(data.user.id), name: data.user.name });
                    // Update local storage to keep it fresh
                    localStorage.setItem('user', JSON.stringify({ ...data.user, id: String(data.user.id) }));
                    return;
                }
            }
        } catch (e) {
            console.error("Failed to fetch user session", e);
        }

        // 3. Use propTutorName if this is a tutor
        if (userRole === 'tutor' && propTutorName) {
            setUser({
                id: `tutor-${Date.now()}`,
                name: propTutorName
            });
            return;
        }

        // 4. Fallback (if everything fails) - DON'T set generic names, wait for user input
        // This should rarely happen as LiveClass.tsx handles the join screen
        setUser({
            id: `${userRole}-${Date.now()}`,
            name: userRole === 'tutor' ? (propTutorName || 'Instructor') : 'Student'
        });
    };

    initUser();
  }, [userRole, propTutorName]);

  // Only initialize WebRTC once we have valid user info
  const isUserReady = user !== null && user.id && user.name;

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
      sessionStartTime
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

  // Share session link
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmails, setShareEmails] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  // Get the actual tutor name - either from props or from current user if tutor
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
    toast.success('Session link copied to clipboard!');
  };

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
    // If we have a server-provided start time, use it to calculate elapsed time
    if (sessionStartTime) {
      const updateTime = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - sessionStartTime) / 1000);
        setSessionTime(elapsed > 0 ? elapsed : 0);
      };
      
      updateTime(); // Update immediately
      const timer = setInterval(updateTime, 1000);
      return () => clearInterval(timer);
    }
    
    // Fallback to local timer if no server time (e.g. tutor before going live)
    if (!isLive && userRole === 'tutor') return; 
    
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isLive, userRole, sessionStartTime])

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
              console.log('[LiveSession] Received chat message:', msg);
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

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      <p className="text-gray-400">Setting up your session...</p>
    </div>
  );
  
  // Show media setup status
  if (!localStream && connectionStatus === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="text-xl font-semibold">Setting up camera and microphone...</p>
        <p className="text-gray-400 text-sm">Please allow access when prompted</p>
      </div>
    );
  }
  
  // Show connection status
  if (connectionStatus === 'disconnected') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white gap-4">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <p className="text-xl font-semibold">Connection Lost</p>
        <p className="text-gray-400">Trying to reconnect...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mt-4"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gray-900 text-white overflow-hidden flex-col sm:flex-row">
        <div className="flex-1 flex flex-col min-w-0">
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
          
          <div className="flex-1 relative bg-black overflow-hidden flex flex-col">
              {userRole === 'tutor' && !isLive && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                      <div className="bg-gray-900 p-6 sm:p-8 rounded-xl border border-gray-700 text-center max-w-md mx-4">
                          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Ready to Start?</h2>
                          <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
                              You are about to start the live session for <span className="text-indigo-400">{courseName || 'this class'}</span>.
                              Students will be notified once you go live.
                          </p>
                          <div className="flex gap-3 sm:gap-4 justify-center">
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

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Share Session Link</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Email Addresses (comma-separated)</label>
                <input
                  type="text"
                  value={shareEmails}
                  onChange={(e) => setShareEmails(e.target.value)}
                  placeholder="student1@email.com, student2@email.com"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Personal Message (optional)</label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowShareDialog(false)}
                  disabled={isSharing}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleShareLink}
                  disabled={isSharing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isSharing ? 'Sending...' : 'Send Invites'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
