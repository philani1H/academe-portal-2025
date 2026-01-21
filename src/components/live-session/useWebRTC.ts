import { useEffect, useState, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import SimplePeer, { Instance as PeerInstance } from 'simple-peer';
import { toast } from 'sonner';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academe-portal-2025.onrender.com' : 'http://localhost:3000');

// Optimized sound effects with better quality
const playJoinSound = () => {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZURE');
  audio.volume = 0.25;
  audio.play().catch(() => {});
};

const playLeaveSound = () => {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZURE');
  audio.volume = 0.15;
  audio.play().catch(() => {});
};

// Sound when YOU join the session
const playYouJoinedSound = () => {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZURE');
  audio.volume = 0.3;
  audio.play().catch(() => {});
};

// Sound when YOU leave the session
const playYouLeftSound = () => {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZURE');
  audio.volume = 0.2;
  audio.play().catch(() => {});
};

interface UseWebRTCProps {
  sessionId: string;
  userId: string;
  userRole: 'tutor' | 'student';
  userName: string;
  courseId?: string;
  courseName?: string;
  category?: string;
}

interface PeerData {
  peerId: string;
  peer: PeerInstance;
  stream?: MediaStream;
  userRole: 'tutor' | 'student';
  isVideoOn: boolean;
  isAudioOn: boolean;
  isHandRaised?: boolean;
  isScreenSharing?: boolean;
  isRecording?: boolean;
  name?: string;
}

export const useWebRTC = ({
  sessionId,
  userId,
  userRole,
  userName,
  courseId,
  courseName,
  category
}: UseWebRTCProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<PeerData[]>([]);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('connecting');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Map<string, PeerInstance>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const userInfoRef = useRef({ userName, userId, userRole });
  const isMountedRef = useRef(true);
  const initializingRef = useRef(false);

  const isScreenSharingRef = useRef(isScreenSharing);
  const isRecordingRef = useRef(isRecording);
  const isAudioOnRef = useRef(isAudioOn);
  const isVideoOnRef = useRef(isVideoOn);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReconnectingRef = useRef(false);

  useEffect(() => { isScreenSharingRef.current = isScreenSharing; }, [isScreenSharing]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { isAudioOnRef.current = isAudioOn; }, [isAudioOn]);
  useEffect(() => { isVideoOnRef.current = isVideoOn; }, [isVideoOn]);

  const safeSetState = useCallback(<T,>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    value: React.SetStateAction<T>
  ) => {
    if (isMountedRef.current) {
      setter(value);
    }
  }, []);

  const checkSocketConnection = useCallback((): boolean => {
    if (!socketRef.current?.connected) {
      console.warn('[WebRTC] Socket not connected');
      if (!isReconnectingRef.current) {
        toast.error('Connection lost. Reconnecting...', { duration: 2000 });
      }
      return false;
    }
    return true;
  }, []);

  useEffect(() => {
    userInfoRef.current = { userName, userId, userRole };
  }, [userName, userId, userRole]);

  // Smart reconnection handler
  const handleReconnection = useCallback(async () => {
    if (!socketRef.current || isReconnectingRef.current || !isMountedRef.current) return;
    
    isReconnectingRef.current = true;
    safeSetState(setConnectionStatus, 'reconnecting');
    
    console.log('[WebRTC] Starting smart reconnection...');
    toast.info('Reconnecting to session...', { duration: 2000 });

    try {
      // Wait for socket to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Reconnection timeout')), 10000);
        
        if (socketRef.current?.connected) {
          clearTimeout(timeout);
          resolve();
        } else {
          socketRef.current?.once('connect', () => {
            clearTimeout(timeout);
            resolve();
          });
        }
      });

      if (!isMountedRef.current) return;

      // Rejoin session with preserved state
      socketRef.current?.emit('join-session', {
        sessionId,
        userId,
        userRole,
        userName,
        courseId,
        courseName,
        category,
        isVideoOn: isVideoOnRef.current,
        isAudioOn: isAudioOnRef.current,
        isHandRaised: isHandRaised,
        isScreenSharing: isScreenSharingRef.current,
        isRecording: isRecordingRef.current
      });

      // Clear existing peers and reconnect
      peersRef.current.forEach((peer) => {
        try {
          peer.destroy();
        } catch (err) {
          console.error('[WebRTC] Error destroying peer during reconnect:', err);
        }
      });
      peersRef.current.clear();
      safeSetState(setPeers, []);

      // Request session users
      setTimeout(() => {
        if (isMountedRef.current && socketRef.current?.connected) {
          socketRef.current.emit('get-session-users', { sessionId });
        }
      }, 300);

      safeSetState(setConnectionStatus, 'connected');
      safeSetState(setReconnectAttempt, 0);
      isReconnectingRef.current = false;
      
      toast.success('Reconnected successfully! ✅', { duration: 2000 });
      playYouJoinedSound();
      
      console.log('[WebRTC] Smart reconnection completed');

    } catch (err) {
      console.error('[WebRTC] Reconnection failed:', err);
      
      if (!isMountedRef.current) return;
      
      safeSetState(setReconnectAttempt, prev => prev + 1);
      
      // Retry with exponential backoff
      const attempt = reconnectAttempt + 1;
      if (attempt < 5) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        toast.warning(`Reconnection failed. Retrying in ${delay/1000}s...`, { duration: delay });
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            handleReconnection();
          }
        }, delay);
      } else {
        safeSetState(setConnectionStatus, 'disconnected');
        isReconnectingRef.current = false;
        toast.error('Unable to reconnect. Please refresh the page.', { duration: 5000 });
      }
    }
  }, [sessionId, userId, userRole, userName, courseId, courseName, category, reconnectAttempt, safeSetState]);

  // OPTIMIZED: Enhanced peer configuration for better quality and lower latency
  const getOptimizedPeerConfig = () => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ],
    sdpSemantics: 'unified-plan' as const,
    iceTransportPolicy: 'all' as const,
    bundlePolicy: 'max-bundle' as const,
    rtcpMuxPolicy: 'require' as const,
    iceCandidatePoolSize: 10
  });

  const createPeer = useCallback((
    userToSignal: string,
    callerID: string,
    stream: MediaStream | null
  ): PeerInstance => {
    console.log('[WebRTC] Creating optimized initiator peer:', userToSignal);

    const peer = new SimplePeer({
      initiator: true,
      trickle: true,
      stream: stream || undefined,
      config: getOptimizedPeerConfig(),
      offerOptions: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      }
    });

    peer.on('signal', (signal) => {
      socketRef.current?.emit('signal', {
        to: userToSignal,
        signal,
        from: callerID,
        userRole: userInfoRef.current.userRole,
        userName: userInfoRef.current.userName,
        isVideoOn: localStreamRef.current?.getVideoTracks()[0]?.enabled ?? true,
        isAudioOn: localStreamRef.current?.getAudioTracks()[0]?.enabled ?? true,
        isScreenSharing: isScreenSharingRef.current,
        isRecording: isRecordingRef.current
      });
    });

    peer.on('stream', (remoteStream) => {
      if (!isMountedRef.current) return;
      console.log('[WebRTC] Stream received:', userToSignal);
      
      safeSetState(setPeers, prev => prev.map(p =>
        p.peerId === userToSignal ? { ...p, stream: remoteStream } : p
      ));
    });

    peer.on('connect', () => console.log('[WebRTC] Peer connected:', userToSignal));
    peer.on('error', (err) => console.error('[WebRTC] Peer error:', userToSignal, err.message));
    peer.on('close', () => console.log('[WebRTC] Peer closed:', userToSignal));

    return peer;
  }, [safeSetState]);

  const addPeer = useCallback((
    incomingSignal: SimplePeer.SignalData,
    callerID: string,
    stream: MediaStream | null
  ): PeerInstance => {
    console.log('[WebRTC] Creating optimized receiver peer:', callerID);

    const peer = new SimplePeer({
      initiator: false,
      trickle: true,
      stream: stream || undefined,
      config: getOptimizedPeerConfig(),
      answerOptions: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      }
    });

    peer.on('signal', (signal) => {
      socketRef.current?.emit('signal', {
        to: callerID,
        signal,
        from: socketRef.current?.id,
        userRole: userInfoRef.current.userRole,
        userName: userInfoRef.current.userName,
        isVideoOn: localStreamRef.current?.getVideoTracks()[0]?.enabled ?? true,
        isAudioOn: localStreamRef.current?.getAudioTracks()[0]?.enabled ?? true,
        isScreenSharing: isScreenSharingRef.current,
        isRecording: isRecordingRef.current
      });
    });

    peer.on('stream', (remoteStream) => {
      if (!isMountedRef.current) return;
      console.log('[WebRTC] Stream received from caller:', callerID);
      safeSetState(setPeers, prev => prev.map(p =>
        p.peerId === callerID ? { ...p, stream: remoteStream } : p
      ));
    });

    peer.on('connect', () => console.log('[WebRTC] Peer connected:', callerID));
    peer.on('error', (err) => console.error('[WebRTC] Peer error:', callerID, err.message));
    peer.on('close', () => console.log('[WebRTC] Peer closed:', callerID));

    try {
      peer.signal(incomingSignal);
    } catch (err) {
      console.error('[WebRTC] Error signaling peer:', err);
    }

    return peer;
  }, [safeSetState]);

  const setupSocketListeners = useCallback((socket: Socket, stream: MediaStream | null) => {
    socket.on('user-joined', (data: {
      socketId: string;
      userRole: string;
      isVideoOn: boolean;
      isAudioOn: boolean;
      isHandRaised: boolean;
      isScreenSharing: boolean;
      isRecording: boolean;
      userName: string;
    }) => {
      if (!isMountedRef.current || peersRef.current.has(data.socketId)) return;
      console.log('[WebRTC] User joined:', data.userName);
      
      playJoinSound();
      toast.success(`${data.userName || 'Someone'} joined`, { duration: 2000 });

      if (socket.id! > data.socketId) {
        const currentStream = localStreamRef.current || stream;
        
        const peer = createPeer(data.socketId, socket.id!, currentStream);
        peersRef.current.set(data.socketId, peer);

        safeSetState(setPeers, prev => {
          if (prev.some(p => p.peerId === data.socketId)) return prev;
          return [...prev, {
            peerId: data.socketId,
            peer,
            userRole: data.userRole as 'tutor' | 'student',
            isVideoOn: data.isVideoOn,
            isAudioOn: data.isAudioOn,
            isHandRaised: data.isHandRaised,
            isScreenSharing: data.isScreenSharing,
            isRecording: data.isRecording,
            name: data.userName
          }];
        });
      } else {
        safeSetState(setPeers, prev => {
          if (prev.some(p => p.peerId === data.socketId)) return prev;
          return [...prev, {
            peerId: data.socketId,
            peer: null as unknown as PeerInstance,
            userRole: data.userRole as 'tutor' | 'student',
            isVideoOn: data.isVideoOn,
            isAudioOn: data.isAudioOn,
            isHandRaised: data.isHandRaised,
            isScreenSharing: data.isScreenSharing,
            isRecording: data.isRecording,
            name: data.userName
          }];
        });
      }
    });

    socket.on('session-info', (data: { startTime: number }) => {
      if (!isMountedRef.current) return;
      if (data.startTime) safeSetState(setSessionStartTime, data.startTime);
    });

    socket.on('existing-users', (data: {
      users: Array<{
        socketId: string;
        userRole: string;
        userName: string;
        isVideoOn: boolean;
        isAudioOn: boolean;
        isHandRaised: boolean;
        isScreenSharing: boolean;
        isRecording: boolean;
      }>
    }) => {
      if (!isMountedRef.current) return;
      const currentStream = localStreamRef.current || stream;

      data.users.forEach(user => {
        if (user.socketId === socket.id || peersRef.current.has(user.socketId)) return;
        
        // ID Comparison Strategy: Larger ID initiates
        if (socket.id! > user.socketId) {
          // Allow connection even without local stream (view-only mode)
          // if (!currentStream) return; 

          console.log('[WebRTC] Initiating connection to existing user (I am larger):', user.socketId);
          const peer = createPeer(user.socketId, socket.id!, currentStream);
          peersRef.current.set(user.socketId, peer);

          safeSetState(setPeers, prev => {
            if (prev.some(p => p.peerId === user.socketId)) return prev;
            return [...prev, {
              peerId: user.socketId,
              peer,
              userRole: user.userRole as 'tutor' | 'student',
              isVideoOn: user.isVideoOn,
              isAudioOn: user.isAudioOn,
              isHandRaised: user.isHandRaised,
              isScreenSharing: user.isScreenSharing,
              isRecording: user.isRecording,
              name: user.userName
            }];
          });
        } else {
          console.log('[WebRTC] Waiting for existing user to initiate (I am smaller):', user.socketId);
          // Add placeholder peer to UI while waiting for connection
          safeSetState(setPeers, prev => {
            if (prev.some(p => p.peerId === user.socketId)) return prev;
            return [...prev, {
              peerId: user.socketId,
              peer: null as unknown as PeerInstance,
              userRole: user.userRole as 'tutor' | 'student',
              isVideoOn: user.isVideoOn,
              isAudioOn: user.isAudioOn,
              isHandRaised: user.isHandRaised,
              isScreenSharing: user.isScreenSharing,
              isRecording: user.isRecording,
              name: user.userName
            }];
          });
        }
      });
    });

    socket.on('signal', (data: {
      signal: SimplePeer.SignalData;
      from: string;
      userRole: string;
      isVideoOn: boolean;
      isAudioOn: boolean;
      isHandRaised: boolean;
      isScreenSharing: boolean;
      isRecording: boolean;
      userName: string;
    }) => {
      if (!isMountedRef.current) return;

      const existingPeer = peersRef.current.get(data.from);

      if (existingPeer) {
        try {
          existingPeer.signal(data.signal);
          safeSetState(setPeers, prev => prev.map(p =>
            p.peerId === data.from
              ? {
                ...p,
                isVideoOn: data.isVideoOn,
                isAudioOn: data.isAudioOn,
                isScreenSharing: data.isScreenSharing,
                isRecording: data.isRecording,
                name: data.userName || p.name
              }
              : p
          ));
        } catch (err) {
          console.error('[WebRTC] Error signaling peer:', err);
        }
      } else {
        const currentStream = localStreamRef.current || stream;

        const peer = addPeer(data.signal, data.from, currentStream);
        peersRef.current.set(data.from, peer);

        safeSetState(setPeers, prev => {
          const existingIndex = prev.findIndex(p => p.peerId === data.from);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              peer,
              isVideoOn: data.isVideoOn,
              isAudioOn: data.isAudioOn,
              isScreenSharing: data.isScreenSharing,
              isRecording: data.isRecording,
              name: data.userName || updated[existingIndex].name
            };
            return updated;
          } else {
            return [...prev, {
              peerId: data.from,
              peer,
              userRole: data.userRole as 'tutor' | 'student',
              isVideoOn: data.isVideoOn,
              isAudioOn: data.isAudioOn,
              isHandRaised: data.isHandRaised,
              isScreenSharing: data.isScreenSharing,
              isRecording: data.isRecording,
              name: data.userName
            }];
          }
        });
      }
    });

    socket.on('stream-state-changed', (data: {
      socketId: string;
      isVideoOn: boolean;
      isAudioOn: boolean;
      isScreenSharing: boolean;
      isRecording: boolean;
    }) => {
      if (!isMountedRef.current) return;
      safeSetState(setPeers, prev => prev.map(p =>
        p.peerId === data.socketId
          ? {
            ...p,
            isVideoOn: data.isVideoOn,
            isAudioOn: data.isAudioOn,
            isScreenSharing: data.isScreenSharing,
            isRecording: data.isRecording
          }
          : p
      ));
    });

    socket.on('hand-raised-changed', (data: {
      socketId: string;
      isHandRaised: boolean;
    }) => {
      if (!isMountedRef.current) return;
      safeSetState(setPeers, prev => prev.map(p =>
        p.peerId === data.socketId ? { ...p, isHandRaised: data.isHandRaised } : p
      ));
    });

    socket.on('user-left', (data: { socketId: string }) => {
      if (!isMountedRef.current) return;
      
      safeSetState(setPeers, prev => {
        const leavingPeer = prev.find(p => p.peerId === data.socketId);
        if (leavingPeer) {
          playLeaveSound();
          toast.info(`${leavingPeer.name || 'Someone'} left`, { duration: 2000 });
        }
        return prev.filter(p => p.peerId !== data.socketId);
      });

      const peer = peersRef.current.get(data.socketId);
      if (peer) {
        peer.destroy();
        peersRef.current.delete(data.socketId);
      }
    });
  }, [createPeer, addPeer, safeSetState]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!userId || !userName || !sessionId || initializingRef.current) return;

    initializingRef.current = true;

    const initializeWebRTC = async () => {
      console.log('[WebRTC] Initializing optimized connection...');

      // OPTIMIZED: Faster socket connection
      const newSocket = io(SOCKET_SERVER_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 500,
        reconnectionDelayMax: 3000,
        timeout: 10000,
        transports: ['websocket'],
        upgrade: false,
        forceNew: true
      });

      socketRef.current = newSocket;
      safeSetState(setSocket, newSocket);

      const socketConnectPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Socket timeout')), 10000);

        newSocket.on('connect', () => {
          clearTimeout(timeout);
          console.log('[WebRTC] Socket connected:', newSocket.id);
          safeSetState(setConnectionStatus, 'connected');
          resolve();
        });

        newSocket.on('connect_error', (error) => {
          console.error('[WebRTC] Connection error:', error.message);
          safeSetState(setConnectionStatus, 'disconnected');
        });

        if (newSocket.connected) {
          clearTimeout(timeout);
          safeSetState(setConnectionStatus, 'connected');
          resolve();
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('[WebRTC] Socket disconnected:', reason);
        safeSetState(setConnectionStatus, 'disconnected');
        
        // Auto-reconnect for recoverable disconnections
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          toast.warning('Server disconnected. Reconnecting...', { duration: 2000 });
        } else if (reason === 'transport close' || reason === 'transport error') {
          // Network issue, will auto-reconnect
          toast.info('Connection interrupted. Reconnecting...', { duration: 2000 });
        }
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log('[WebRTC] Reconnection attempt:', attemptNumber);
        safeSetState(setConnectionStatus, 'reconnecting');
        safeSetState(setReconnectAttempt, attemptNumber);
        
        if (attemptNumber === 1) {
          toast.loading('Reconnecting...', { duration: 2000 });
        }
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('[WebRTC] Socket reconnected after', attemptNumber, 'attempts');
        safeSetState(setConnectionStatus, 'connected');
        
        // Trigger smart reconnection
        handleReconnection();
      });

      newSocket.on('reconnect_failed', () => {
        console.error('[WebRTC] Reconnection failed after all attempts');
        safeSetState(setConnectionStatus, 'disconnected');
        toast.error('Connection failed. Please refresh the page.', { duration: 5000 });
      });

      newSocket.on('connect_error', (error) => {
        console.error('[WebRTC] Connection error:', error.message);
        
        if (!isReconnectingRef.current) {
          safeSetState(setConnectionStatus, 'disconnected');
          toast.error('Connection error. Retrying...', { duration: 2000 });
        }
      });

      // OPTIMIZED: High-quality, low-latency media constraints
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            // Voice optimization: Mono is clearer for voice and reduces bandwidth
            channelCount: { ideal: 1 },
            // @ts-ignore - Advanced constraints for Chrome/Webkit
            googEchoCancellation: true,
            // @ts-ignore
            googAutoGainControl: true,
            // @ts-ignore
            googNoiseSuppression: true,
            // @ts-ignore
            googHighpassFilter: true,
            // @ts-ignore
            googTypingNoiseDetection: true
          }
        });

        if (!isMountedRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        console.log('[WebRTC] High-quality media acquired');

        safeSetState(setLocalStream, stream);
        localStreamRef.current = stream;
        cameraStreamRef.current = stream;

        const savedPrefs = localStorage.getItem('liveSessionMediaPrefs');
        let videoEnabled = true;
        let audioEnabled = true;

        if (savedPrefs) {
          try {
            const prefs = JSON.parse(savedPrefs);
            videoEnabled = prefs.videoEnabled ?? true;
            audioEnabled = prefs.audioEnabled ?? true;
          } catch (e) {
            console.warn('[WebRTC] Failed to parse preferences');
          }
        }

        stream.getVideoTracks().forEach(track => { track.enabled = videoEnabled; });
        stream.getAudioTracks().forEach(track => { track.enabled = audioEnabled; });
        safeSetState(setIsVideoOn, videoEnabled);
        safeSetState(setIsAudioOn, audioEnabled);

      } catch (err) {
        console.error('[WebRTC] Media error:', err);
        safeSetState(setIsVideoOn, false);
        safeSetState(setIsAudioOn, false);
      }

      try {
        await socketConnectPromise;
        if (!isMountedRef.current) return;

        setupSocketListeners(newSocket, stream);

        newSocket.emit('join-session', {
          sessionId,
          userId,
          userRole,
          userName,
          courseId,
          courseName,
          category,
          isVideoOn: stream?.getVideoTracks()[0]?.enabled ?? false,
          isAudioOn: stream?.getAudioTracks()[0]?.enabled ?? false,
          isHandRaised: false,
          isScreenSharing: false,
          isRecording: false
        });

        // Play sound and notify when YOU join
        playYouJoinedSound();
        toast.success("You joined the session! 🎉", { duration: 2000 });

        setTimeout(() => {
          if (isMountedRef.current && newSocket.connected) {
            newSocket.emit('get-session-users', { sessionId });
          }
        }, 300);

      } catch (err) {
        console.error('[WebRTC] Connection failed:', err);
        safeSetState(setConnectionStatus, 'disconnected');
      }
    };

    initializeWebRTC();

    return () => {
      console.log('[WebRTC] Cleanup...');
      isMountedRef.current = false;
      initializingRef.current = false;
      isReconnectingRef.current = false;

      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Play sound when YOU leave
      playYouLeftSound();

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      if (cameraStreamRef.current && cameraStreamRef.current !== localStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }

      peersRef.current.forEach((peer) => {
        try {
          peer.destroy();
        } catch (err) {
          console.error('[WebRTC] Error destroying peer:', err);
        }
      });
      peersRef.current.clear();

      if (socketRef.current) {
        try {
          socketRef.current.emit('leave-session', { sessionId });
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
        } catch (err) {
          console.error('[WebRTC] Socket cleanup error:', err);
        }
        socketRef.current = null;
      }
    };
  }, [sessionId, userId, userName, userRole, courseId, courseName, category, safeSetState, setupSocketListeners, handleReconnection]);

  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    const newState = audioTrack.enabled;
    safeSetState(setIsAudioOn, newState);

    try {
      const currentPrefs = JSON.parse(localStorage.getItem('liveSessionMediaPrefs') || '{}');
      localStorage.setItem('liveSessionMediaPrefs', JSON.stringify({
        ...currentPrefs,
        audioEnabled: newState
      }));
    } catch (e) {}

    socketRef.current?.emit('stream-state-change', {
      sessionId,
      isVideoOn: localStreamRef.current.getVideoTracks()[0]?.enabled ?? false,
      isAudioOn: newState,
      isScreenSharing: isScreenSharingRef.current,
      isRecording: isRecordingRef.current
    });
  }, [sessionId, safeSetState]);

  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    const newState = videoTrack.enabled;
    safeSetState(setIsVideoOn, newState);

    try {
      const currentPrefs = JSON.parse(localStorage.getItem('liveSessionMediaPrefs') || '{}');
      localStorage.setItem('liveSessionMediaPrefs', JSON.stringify({
        ...currentPrefs,
        videoEnabled: newState
      }));
    } catch (e) {}

    socketRef.current?.emit('stream-state-change', {
      sessionId,
      isVideoOn: newState,
      isAudioOn: localStreamRef.current.getAudioTracks()[0]?.enabled ?? false,
      isScreenSharing: isScreenSharingRef.current,
      isRecording: isRecordingRef.current
    });
  }, [sessionId, safeSetState]);

  const muteAudio = useCallback(() => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack && audioTrack.enabled) {
      audioTrack.enabled = false;
      safeSetState(setIsAudioOn, false);
      socketRef.current?.emit('stream-state-change', {
        sessionId,
        isVideoOn: localStreamRef.current.getVideoTracks()[0]?.enabled ?? false,
        isAudioOn: false,
        isScreenSharing: isScreenSharingRef.current,
        isRecording: isRecordingRef.current
      });
    }
  }, [sessionId, safeSetState]);

  const toggleScreenShare = useCallback(async () => {
    if (!isMountedRef.current) return;

    if (isScreenSharingRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
          }
        });

        if (!isMountedRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        const replacePromises: Promise<void>[] = [];
        peersRef.current.forEach((peer) => {
          try {
            // @ts-ignore
            const senders = peer._pc?.getSenders() || [];
            const videoSender = senders.find((s: RTCRtpSender) => s.track?.kind === 'video');
            if (videoSender && videoTrack) {
              replacePromises.push(videoSender.replaceTrack(videoTrack));
            }
          } catch (err) {}
        });

        await Promise.all(replacePromises);

        localStreamRef.current?.getVideoTracks()[0]?.stop();

        safeSetState(setLocalStream, stream);
        localStreamRef.current = stream;
        cameraStreamRef.current = stream;
        safeSetState(setIsScreenSharing, false);

        if (audioTrack) audioTrack.enabled = isAudioOnRef.current;
        if (videoTrack) videoTrack.enabled = true;
        safeSetState(setIsVideoOn, true);

        if (checkSocketConnection()) {
          socketRef.current?.emit('stream-state-change', {
            sessionId,
            isVideoOn: true,
            isAudioOn: isAudioOnRef.current,
            isScreenSharing: false,
            isRecording: isRecordingRef.current
          });
        }
      } catch (err) {
        console.error('[WebRTC] Error stopping screen share:', err);
        toast.error('Error stopping screen share');
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920, max: 3840 },
            height: { ideal: 1080, max: 2160 },
            frameRate: { ideal: 30, max: 60 }
          },
          audio: false
        });

        if (!isMountedRef.current) {
          screenStream.getTracks().forEach(track => track.stop());
          return;
        }

        const screenTrack = screenStream.getVideoTracks()[0];

        screenTrack.onended = () => {
          if (isMountedRef.current) {
            toast.info("Screen sharing ended");
          }
        };

        const replacePromises: Promise<void>[] = [];
        peersRef.current.forEach((peer) => {
          try {
            // @ts-ignore
            const senders = peer._pc?.getSenders() || [];
            const videoSender = senders.find((s: RTCRtpSender) => s.track?.kind === 'video');
            if (videoSender && screenTrack) {
              replacePromises.push(videoSender.replaceTrack(screenTrack));
            }
          } catch (err) {}
        });

        await Promise.all(replacePromises);

        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        const newStream = new MediaStream([
          screenTrack,
          ...(audioTrack ? [audioTrack] : [])
        ]);

        localStreamRef.current?.getVideoTracks()[0]?.stop();

        safeSetState(setLocalStream, newStream);
        localStreamRef.current = newStream;
        safeSetState(setIsScreenSharing, true);
        safeSetState(setIsVideoOn, true);

        if (checkSocketConnection()) {
          socketRef.current?.emit('stream-state-change', {
            sessionId,
            isVideoOn: true,
            isAudioOn: isAudioOnRef.current,
            isScreenSharing: true,
            isRecording: isRecordingRef.current
          });
        }
      } catch (err) {
        if ((err as Error).name !== 'NotAllowedError') {
          toast.error('Failed to start screen share');
        }
      }
    }
  }, [sessionId, safeSetState, checkSocketConnection]);

  const toggleRecording = useCallback(() => {
    const newState = !isRecordingRef.current;
    safeSetState(setIsRecording, newState);

    socketRef.current?.emit('stream-state-change', {
      sessionId,
      isVideoOn: localStreamRef.current?.getVideoTracks()[0]?.enabled ?? false,
      isAudioOn: localStreamRef.current?.getAudioTracks()[0]?.enabled ?? false,
      isScreenSharing: isScreenSharingRef.current,
      isRecording: newState
    });
  }, [sessionId, safeSetState]);

  const toggleHandRaise = useCallback(() => {
    if (!checkSocketConnection()) return;

    const newState = !isHandRaised;
    safeSetState(setIsHandRaised, newState);
    socketRef.current?.emit('hand-raised-change', {
      sessionId,
      isHandRaised: newState
    });

    if (newState) {
      toast.success("Hand raised ✋", { duration: 1500 });
    }
  }, [isHandRaised, sessionId, safeSetState, checkSocketConnection]);

  return {
    localStream,
    peers,
    socket,
    isVideoOn,
    isAudioOn,
    isScreenSharing,
    isRecording,
    isHandRaised,
    connectionStatus,
    sessionStartTime,
    reconnectAttempt,
    toggleAudio,
    toggleVideo,
    muteAudio,
    toggleScreenShare,
    toggleRecording,
    toggleHandRaise,
    manualReconnect: handleReconnection
  };
};