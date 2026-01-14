import { useEffect, useState, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import SimplePeer, { Instance as PeerInstance } from 'simple-peer';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
}

export const useWebRTC = ({ sessionId, userId, userRole, userName, courseId, courseName, category }: UseWebRTCProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<PeerData[]>([]);
  const socketRef = useRef<Socket>();
  const peersRef = useRef<Map<string, PeerInstance>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [isHandRaised, setIsHandRaised] = useState(false);

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    // Get User Media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        localStreamRef.current = stream;

        if (socketRef.current) {
            socketRef.current.emit('join-session', { 
                sessionId, 
                userId, 
                userRole, 
                userName, 
                courseId, 
                courseName, 
                category,
                isVideoOn: true,
                isAudioOn: true,
                isHandRaised: false
            });

            socketRef.current.on('user-joined', ({ socketId, userRole: remoteUserRole, isVideoOn: remoteVideo, isAudioOn: remoteAudio, isHandRaised: remoteHand, userName: remoteName }) => {
                const peer = createPeer(socketId, socketRef.current!.id, stream);
                peersRef.current.set(socketId, peer);
                setPeers((prev) => [...prev, { 
                    peerId: socketId, 
                    peer, 
                    userRole: remoteUserRole,
                    isVideoOn: remoteVideo ?? true,
                    isAudioOn: remoteAudio ?? true,
                    isHandRaised: remoteHand ?? false
                }]);
            });

            socketRef.current.on('signal', ({ signal, from, userRole: remoteRole, isVideoOn: remoteVideo, isAudioOn: remoteAudio, isHandRaised: remoteHand }) => {
                const item = peersRef.current.get(from);
                if (item) {
                    item.signal(signal);
                } else {
                    const peer = addPeer(signal, from, stream);
                    peersRef.current.set(from, peer);
                    setPeers((prev) => [...prev, { 
                        peerId: from, 
                        peer, 
                        userRole: remoteRole || 'student',
                        isVideoOn: remoteVideo ?? true,
                        isAudioOn: remoteAudio ?? true,
                        isHandRaised: remoteHand ?? false
                    }]); 
                }
            });

            socketRef.current.on('stream-state-changed', ({ socketId, isVideoOn, isAudioOn }) => {
                setPeers(prev => prev.map(p => p.peerId === socketId ? { ...p, isVideoOn, isAudioOn } : p));
            });

            socketRef.current.on('hand-raised-changed', ({ socketId, isHandRaised }) => {
                setPeers(prev => prev.map(p => p.peerId === socketId ? { ...p, isHandRaised } : p));
            });

            socketRef.current.on('user-left', ({ socketId }) => {
                const peer = peersRef.current.get(socketId);
                if (peer) {
                    peer.destroy();
                }
                peersRef.current.delete(socketId);
                setPeers((prev) => prev.filter((p) => p.peerId !== socketId));
            });
        }
      })
      .catch(err => console.error('Error accessing media devices:', err));

    return () => {
        if(localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if(socketRef.current) {
            socketRef.current.disconnect();
        }
        peersRef.current.forEach(peer => peer.destroy());
    };
  }, [sessionId, userId, userRole]);

  function createPeer(userToSignal: string, callerID: string, stream: MediaStream) {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socketRef.current?.emit('signal', { 
          to: userToSignal, 
          signal, 
          from: callerID,
          userRole,
          isVideoOn: isVideoOn,
          isAudioOn: isAudioOn
      });
    });

    peer.on('stream', (remoteStream) => {
        setPeers(prev => prev.map(p => p.peerId === userToSignal ? { ...p, stream: remoteStream } : p));
    });

    return peer;
  }

  function addPeer(incomingSignal: any, callerID: string, stream: MediaStream) {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socketRef.current?.emit('signal', { 
          to: callerID, 
          signal, 
          from: socketRef.current?.id,
          userRole,
          isVideoOn: isVideoOn,
          isAudioOn: isAudioOn
      });
    });

    peer.on('stream', (remoteStream) => {
        setPeers(prev => prev.map(p => p.peerId === callerID ? { ...p, stream: remoteStream } : p));
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const toggleAudio = () => {
      if(localStream) {
          const audioTrack = localStream.getAudioTracks()[0];
          if(audioTrack) {
              audioTrack.enabled = !audioTrack.enabled;
              setIsAudioOn(audioTrack.enabled);
              socketRef.current?.emit('stream-state-change', { sessionId, isVideoOn, isAudioOn: audioTrack.enabled });
          }
      }
  };

  const muteAudio = () => {
      if(localStream) {
          const audioTrack = localStream.getAudioTracks()[0];
          if(audioTrack && audioTrack.enabled) {
              audioTrack.enabled = false;
              setIsAudioOn(false);
              socketRef.current?.emit('stream-state-change', { sessionId, isVideoOn, isAudioOn: false });
          }
      }
  };

  const toggleVideo = () => {
      if(localStream) {
          const videoTrack = localStream.getVideoTracks()[0];
          if(videoTrack) {
              videoTrack.enabled = !videoTrack.enabled;
              setIsVideoOn(videoTrack.enabled);
              socketRef.current?.emit('stream-state-change', { sessionId, isVideoOn: videoTrack.enabled, isAudioOn });
          }
      }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
        // Stop screen sharing
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const videoTrack = stream.getVideoTracks()[0];
            
            // Replace track in all peers
            peersRef.current.forEach(peer => {
                const oldTrack = localStream?.getVideoTracks()[0];
                if (oldTrack && videoTrack) {
                    peer.replaceTrack(oldTrack, videoTrack, localStream!);
                }
            });

            setLocalStream(stream);
            localStreamRef.current = stream;
            setIsScreenSharing(false);
            
            // Restore audio/video state
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) audioTrack.enabled = isAudioOn;
            // Video should be enabled as we just got it
            setIsVideoOn(true); 
            socketRef.current?.emit('stream-state-change', { sessionId, isVideoOn: true, isAudioOn });

        } catch (err) {
            console.error("Error stopping screen share:", err);
        }
    } else {
        // Start screen sharing
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];

            screenTrack.onended = () => {
                toggleScreenShare(); // Switch back when user stops via browser UI
            };

            // Replace track in all peers
            peersRef.current.forEach(peer => {
                const oldTrack = localStream?.getVideoTracks()[0];
                if (oldTrack && screenTrack) {
                    peer.replaceTrack(oldTrack, screenTrack, localStream!);
                }
            });

            // Create new composite stream with screen video and existing audio
            const audioTrack = localStream?.getAudioTracks()[0];
            const newStream = new MediaStream([screenTrack, ...(audioTrack ? [audioTrack] : [])]);
            
            setLocalStream(newStream);
            localStreamRef.current = newStream;
            setIsScreenSharing(true);
            setIsVideoOn(true); // Screen is always "video on"
            socketRef.current?.emit('stream-state-change', { sessionId, isVideoOn: true, isAudioOn });

        } catch (err) {
            console.error("Error starting screen share:", err);
        }
    }
  };

  const toggleHandRaise = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    socketRef.current?.emit('hand-raised-change', { sessionId, isHandRaised: newState });
  };

  return {
    localStream,
    peers,
    socket: socketRef.current,
    toggleAudio,
    muteAudio,
    toggleVideo,
    toggleScreenShare,
    toggleHandRaise,
    isVideoOn,
    isAudioOn,
    isScreenSharing,
    isHandRaised
  };
};
