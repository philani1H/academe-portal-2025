import { useEffect, useState, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import SimplePeer, { Instance as PeerInstance } from 'simple-peer';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Map<string, PeerInstance>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const userInfoRef = useRef({ userName, userId, userRole });
  const isMountedRef = useRef(true);
  const initializingRef = useRef(false);

  // Use refs for values needed in callbacks to avoid stale closures
  const isScreenSharingRef = useRef(isScreenSharing);
  const isRecordingRef = useRef(isRecording);
  const isAudioOnRef = useRef(isAudioOn);
  const isVideoOnRef = useRef(isVideoOn);

  // Keep refs in sync with state
  useEffect(() => {
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    isAudioOnRef.current = isAudioOn;
  }, [isAudioOn]);

  useEffect(() => {
    isVideoOnRef.current = isVideoOn;
  }, [isVideoOn]);

  // Safe state setter that only updates if component is mounted
  const safeSetState = useCallback(<T,>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    value: React.SetStateAction<T>
  ) => {
    if (isMountedRef.current) {
      setter(value);
    }
  }, []);

  // Keep user info updated
  useEffect(() => {
    userInfoRef.current = { userName, userId, userRole };
  }, [userName, userId, userRole]);

  // Create initiator peer
  const createPeer = useCallback((
    userToSignal: string,
    callerID: string,
    stream: MediaStream
  ): PeerInstance => {
    console.log('[WebRTC] Creating initiator peer for:', userToSignal);

    const peer = new SimplePeer({
      initiator: true,
      trickle: true, // Enable trickle ICE for faster connections
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (signal) => {
      console.log('[WebRTC] Sending signal to:', userToSignal, 'type:', signal.type || 'candidate');
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
      console.log('[WebRTC] Received stream from peer:', userToSignal, {
        id: remoteStream.id,
        video: remoteStream.getVideoTracks().length,
        audio: remoteStream.getAudioTracks().length,
        videoEnabled: remoteStream.getVideoTracks()[0]?.enabled,
        audioEnabled: remoteStream.getAudioTracks()[0]?.enabled
      });
      safeSetState(setPeers, prev => prev.map(p =>
        p.peerId === userToSignal
          ? { ...p, stream: remoteStream }
          : p
      ));
    });

    peer.on('connect', () => {
      console.log('[WebRTC] Peer connected:', userToSignal);
    });

    peer.on('error', (err) => {
      console.error('[WebRTC] Peer error:', userToSignal, err.message);
    });

    peer.on('close', () => {
      console.log('[WebRTC] Peer closed:', userToSignal);
    });

    return peer;
  }, [safeSetState]);

  // Create receiver peer
  const addPeer = useCallback((
    incomingSignal: SimplePeer.SignalData,
    callerID: string,
    stream: MediaStream
  ): PeerInstance => {
    console.log('[WebRTC] Creating receiver peer for:', callerID);

    const peer = new SimplePeer({
      initiator: false,
      trickle: true, // Enable trickle ICE for faster connections
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (signal) => {
      console.log('[WebRTC] Sending answer signal to:', callerID, 'type:', signal.type || 'candidate');
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
      console.log('[WebRTC] Received stream from caller:', callerID, {
        id: remoteStream.id,
        video: remoteStream.getVideoTracks().length,
        audio: remoteStream.getAudioTracks().length,
        videoEnabled: remoteStream.getVideoTracks()[0]?.enabled,
        audioEnabled: remoteStream.getAudioTracks()[0]?.enabled
      });
      safeSetState(setPeers, prev => prev.map(p =>
        p.peerId === callerID
          ? { ...p, stream: remoteStream }
          : p
      ));
    });

    peer.on('connect', () => {
      console.log('[WebRTC] Peer connected:', callerID);
    });

    peer.on('error', (err) => {
      console.error('[WebRTC] Peer error:', callerID, err.message);
    });

    peer.on('close', () => {
      console.log('[WebRTC] Peer closed:', callerID);
    });

    // Signal the incoming offer
    try {
      peer.signal(incomingSignal);
    } catch (err) {
      console.error('[WebRTC] Error signaling incoming peer:', err);
    }

    return peer;
  }, [safeSetState]);

  // Setup socket listeners
  const setupSocketListeners = useCallback((socket: Socket, stream: MediaStream | null) => {
    // When another user joins
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
      if (!isMountedRef.current) return;
      console.log('[WebRTC] User joined:', data);

      // Avoid duplicate connections
      if (peersRef.current.has(data.socketId)) {
        console.log('[WebRTC] Peer already exists:', data.socketId);
        return;
      }

      // CRITICAL FIX: Use consistent ID comparison to prevent duplicate connections
      // Only the peer with the LARGER socket ID initiates the connection
      // This prevents both peers from trying to initiate simultaneously
      if (socket.id! > data.socketId) {
        console.log('[WebRTC] My ID is larger, initiating connection to:', data.socketId);

        const currentStream = localStreamRef.current || stream;
        if (!currentStream) {
          console.warn('[WebRTC] No local stream for new peer');
          return;
        }

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
        console.log('[WebRTC] My ID is smaller, waiting for connection from:', data.socketId);
        // Add peer metadata even if not initiating, so we track them
        safeSetState(setPeers, prev => {
          if (prev.some(p => p.peerId === data.socketId)) return prev;
          return [...prev, {
            peerId: data.socketId,
            peer: null as any, // Will be set when signal is received
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

    // Session Info
    socket.on('session-info', (data: { startTime: number }) => {
      if (!isMountedRef.current) return;
      console.log('[WebRTC] Received session info:', data);
      if (data.startTime) {
        safeSetState(setSessionStartTime, data.startTime);
      }
    });

    // Existing users in session
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
      console.log('[WebRTC] Existing users:', data.users);

      const currentStream = localStreamRef.current || stream;

      data.users.forEach(user => {
        if (user.socketId === socket.id) return;
        if (peersRef.current.has(user.socketId)) return;

        // CRITICAL FIX: Always initiate connections to existing users when joining
        // This ensures students can see tutors and vice versa
        // The existing ID comparison was causing connection failures
        console.log('[WebRTC] Initiating connection to existing user:', user.socketId, user.userRole);

        if (!currentStream) {
          console.warn('[WebRTC] No local stream for existing peer');
          return;
        }

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
      });
    });

    // Receive signal from peer
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
      console.log('[WebRTC] Received signal from:', data.from, 'type:', data.signal.type || 'candidate');

      const existingPeer = peersRef.current.get(data.from);

      if (existingPeer) {
        try {
          existingPeer.signal(data.signal);
          console.log('[WebRTC] Signaled existing peer:', data.from);

          // Update peer metadata
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
        if (!currentStream) {
          console.warn('[WebRTC] No stream for incoming peer');
          return;
        }

        console.log('[WebRTC] Creating new peer from signal:', data.from);
        const peer = addPeer(data.signal, data.from, currentStream);
        peersRef.current.set(data.from, peer);

        // Update or add peer in state
        safeSetState(setPeers, prev => {
          const existingIndex = prev.findIndex(p => p.peerId === data.from);
          if (existingIndex >= 0) {
            // Update existing peer entry with actual peer instance
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
            // Add new peer
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

    // Stream state changes
    socket.on('stream-state-changed', (data: {
      socketId: string;
      isVideoOn: boolean;
      isAudioOn: boolean;
      isScreenSharing: boolean;
      isRecording: boolean;
    }) => {
      if (!isMountedRef.current) return;
      console.log('[WebRTC] Stream state changed:', data);
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

    // Hand raised changes
    socket.on('hand-raised-changed', (data: {
      socketId: string;
      isHandRaised: boolean;
    }) => {
      if (!isMountedRef.current) return;
      console.log('[WebRTC] Hand raised changed:', data);
      safeSetState(setPeers, prev => prev.map(p =>
        p.peerId === data.socketId
          ? { ...p, isHandRaised: data.isHandRaised }
          : p
      ));
    });

    // User left
    socket.on('user-left', (data: { socketId: string }) => {
      if (!isMountedRef.current) return;
      console.log('[WebRTC] User left:', data.socketId);
      const peer = peersRef.current.get(data.socketId);
      if (peer) {
        peer.destroy();
        peersRef.current.delete(data.socketId);
      }
      safeSetState(setPeers, prev => prev.filter(p => p.peerId !== data.socketId));
    });
  }, [createPeer, addPeer, safeSetState]);

  // Main initialization effect
  useEffect(() => {
    isMountedRef.current = true;

    if (!userId || !userName || !sessionId) {
      console.log('[WebRTC] Missing required info:', { userId, userName, sessionId });
      return;
    }

    if (initializingRef.current) {
      console.log('[WebRTC] Already initializing, skipping...');
      return;
    }

    initializingRef.current = true;

    const initializeWebRTC = async () => {
      console.log('[WebRTC] Initializing...', { sessionId, userId, userName, userRole });

      // Initialize socket
      const newSocket = io(SOCKET_SERVER_URL, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling']
      });

      socketRef.current = newSocket;
      safeSetState(setSocket, newSocket);

      // Connection status and promise
      const socketConnectPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout'));
        }, 15000);

        newSocket.on('connect', () => {
          clearTimeout(timeout);
          console.log('[WebRTC] Socket connected, ID:', newSocket.id);
          safeSetState(setConnectionStatus, 'connected');
          resolve();
        });

        newSocket.on('connect_error', (error) => {
          console.error('[WebRTC] Connection error:', error.message);
          safeSetState(setConnectionStatus, 'disconnected');
        });

        if (newSocket.connected) {
          clearTimeout(timeout);
          console.log('[WebRTC] Socket already connected, ID:', newSocket.id);
          safeSetState(setConnectionStatus, 'connected');
          resolve();
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('[WebRTC] Socket disconnected:', reason);
        safeSetState(setConnectionStatus, 'disconnected');
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('[WebRTC] Socket reconnected after', attemptNumber, 'attempts');
        safeSetState(setConnectionStatus, 'connected');

        // Rejoin session after reconnect
        newSocket.emit('join-session', {
          sessionId,
          userId,
          userRole,
          userName,
          courseId,
          courseName,
          category,
          isVideoOn: isVideoOnRef.current,
          isAudioOn: isAudioOnRef.current,
          isHandRaised: false,
          isScreenSharing: isScreenSharingRef.current,
          isRecording: isRecordingRef.current
        });
      });

      // Get media devices
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });

        if (!isMountedRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        console.log('[WebRTC] Media acquired:', {
          video: stream.getVideoTracks().length,
          audio: stream.getAudioTracks().length
        });

        safeSetState(setLocalStream, stream);
        localStreamRef.current = stream;
        cameraStreamRef.current = stream;

        // Enable tracks by default
        stream.getVideoTracks().forEach(track => { track.enabled = true; });
        stream.getAudioTracks().forEach(track => { track.enabled = true; });
        safeSetState(setIsVideoOn, true);
        safeSetState(setIsAudioOn, true);

      } catch (err) {
        console.error('[WebRTC] Media error:', err);
        safeSetState(setIsVideoOn, false);
        safeSetState(setIsAudioOn, false);
      }

      try {
        // Wait for socket connection
        await socketConnectPromise;

        if (!isMountedRef.current) return;

        // Setup socket listeners before joining
        setupSocketListeners(newSocket, stream);

        // Join session
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

        console.log('[WebRTC] Emitted join-session');

        // Request existing users after a short delay to ensure server has registered us
        setTimeout(() => {
          if (isMountedRef.current && newSocket.connected) {
            newSocket.emit('get-session-users', { sessionId });
            console.log('[WebRTC] Requested existing users');
          }
        }, 500);

      } catch (err) {
        console.error('[WebRTC] Socket connection failed:', err);
        safeSetState(setConnectionStatus, 'disconnected');
      }
    };

    initializeWebRTC();

    return () => {
      console.log('[WebRTC] Cleaning up...');
      isMountedRef.current = false;
      initializingRef.current = false;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('[WebRTC] Stopped track:', track.kind);
        });
        localStreamRef.current = null;
      }

      if (cameraStreamRef.current && cameraStreamRef.current !== localStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }

      peersRef.current.forEach((peer, id) => {
        console.log('[WebRTC] Destroying peer:', id);
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
          console.error('[WebRTC] Error cleaning up socket:', err);
        }
        socketRef.current = null;
      }
    };
  }, [sessionId, userId, userName, userRole, courseId, courseName, category, safeSetState, setupSocketListeners]);

  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) {
      console.warn('[WebRTC] No local stream');
      return;
    }

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack) {
      console.warn('[WebRTC] No audio track');
      return;
    }

    audioTrack.enabled = !audioTrack.enabled;
    const newState = audioTrack.enabled;
    safeSetState(setIsAudioOn, newState);

    console.log('[WebRTC] Audio toggled:', newState);
    socketRef.current?.emit('stream-state-change', {
      sessionId,
      isVideoOn: localStreamRef.current.getVideoTracks()[0]?.enabled ?? false,
      isAudioOn: newState,
      isScreenSharing: isScreenSharingRef.current,
      isRecording: isRecordingRef.current
    });
  }, [sessionId, safeSetState]);

  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) {
      console.warn('[WebRTC] No local stream');
      return;
    }

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) {
      console.warn('[WebRTC] No video track');
      return;
    }

    videoTrack.enabled = !videoTrack.enabled;
    const newState = videoTrack.enabled;
    safeSetState(setIsVideoOn, newState);

    console.log('[WebRTC] Video toggled:', newState);
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
      // Stop screen sharing
      try {
        console.log('[WebRTC] Stopping screen share, restoring camera...');

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        if (!isMountedRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        // Replace tracks in all peer connections
        const replacePromises: Promise<void>[] = [];
        peersRef.current.forEach((peer) => {
          try {
            // @ts-ignore - accessing internal _pc
            const senders = peer._pc?.getSenders() || [];
            const videoSender = senders.find((s: RTCRtpSender) => s.track?.kind === 'video');
            if (videoSender && videoTrack) {
              console.log('[WebRTC] Replacing screen track with camera for peer');
              replacePromises.push(videoSender.replaceTrack(videoTrack));
            }
          } catch (err) {
            console.error('[WebRTC] Error replacing track for peer:', err);
          }
        });

        await Promise.all(replacePromises);

        // Stop old video track
        localStreamRef.current?.getVideoTracks()[0]?.stop();

        safeSetState(setLocalStream, stream);
        localStreamRef.current = stream;
        cameraStreamRef.current = stream;
        safeSetState(setIsScreenSharing, false);

        audioTrack.enabled = isAudioOnRef.current;
        videoTrack.enabled = true;
        safeSetState(setIsVideoOn, true);

        console.log('[WebRTC] Screen share stopped, camera restored');

        socketRef.current?.emit('stream-state-change', {
          sessionId,
          isVideoOn: true,
          isAudioOn: isAudioOnRef.current,
          isScreenSharing: false,
          isRecording: isRecordingRef.current
        });
      } catch (err) {
        console.error('[WebRTC] Error stopping screen share:', err);
      }
    } else {
      // Start screen sharing
      try {
        console.log('[WebRTC] Starting screen share...');

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });

        if (!isMountedRef.current) {
          screenStream.getTracks().forEach(track => track.stop());
          return;
        }

        const screenTrack = screenStream.getVideoTracks()[0];

        screenTrack.onended = () => {
          console.log('[WebRTC] Screen share ended by user');
          if (isMountedRef.current) {
            toggleScreenShare();
          }
        };

        // Replace tracks in all peer connections
        const replacePromises: Promise<void>[] = [];
        peersRef.current.forEach((peer) => {
          try {
            // @ts-ignore - accessing internal _pc
            const senders = peer._pc?.getSenders() || [];
            const videoSender = senders.find((s: RTCRtpSender) => s.track?.kind === 'video');
            if (videoSender && screenTrack) {
              console.log('[WebRTC] Replacing camera track with screen for peer');
              replacePromises.push(videoSender.replaceTrack(screenTrack));
            }
          } catch (err) {
            console.error('[WebRTC] Error replacing track for peer:', err);
          }
        });

        await Promise.all(replacePromises);

        // Keep audio from original stream
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        const newStream = new MediaStream([
          screenTrack,
          ...(audioTrack ? [audioTrack] : [])
        ]);

        // Stop old camera video track
        localStreamRef.current?.getVideoTracks()[0]?.stop();

        safeSetState(setLocalStream, newStream);
        localStreamRef.current = newStream;
        safeSetState(setIsScreenSharing, true);
        safeSetState(setIsVideoOn, true);

        console.log('[WebRTC] Screen share started successfully');

        socketRef.current?.emit('stream-state-change', {
          sessionId,
          isVideoOn: true,
          isAudioOn: isAudioOnRef.current,
          isScreenSharing: true,
          isRecording: isRecordingRef.current
        });
      } catch (err) {
        console.error('[WebRTC] Error starting screen share:', err);
      }
    }
  }, [sessionId, safeSetState]);

  const toggleRecording = useCallback(() => {
    const newState = !isRecordingRef.current;
    safeSetState(setIsRecording, newState);

    console.log('[WebRTC] Recording toggled:', newState);

    socketRef.current?.emit('stream-state-change', {
      sessionId,
      isVideoOn: localStreamRef.current?.getVideoTracks()[0]?.enabled ?? false,
      isAudioOn: localStreamRef.current?.getAudioTracks()[0]?.enabled ?? false,
      isScreenSharing: isScreenSharingRef.current,
      isRecording: newState
    });
  }, [sessionId, safeSetState]);

  const toggleHandRaise = useCallback(() => {
    const newState = !isHandRaised;
    safeSetState(setIsHandRaised, newState);
    socketRef.current?.emit('hand-raised-change', {
      sessionId,
      isHandRaised: newState
    });
  }, [isHandRaised, sessionId, safeSetState]);

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
    toggleAudio,
    toggleVideo,
    muteAudio,
    toggleScreenShare,
    toggleRecording,
    toggleHandRaise
  };
};
