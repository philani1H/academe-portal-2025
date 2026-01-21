import React, { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VideoOff, MicOff, MonitorUp, Hand, Mic, User } from 'lucide-react'
import { PeerData } from './types'

interface VideoGridProps {
  localStream: MediaStream | null
  peers: PeerData[]
  userRole: 'tutor' | 'student'
  isLocalVideoOn: boolean
  layout?: 'focus' | 'grid'
  onMuteStudent?: (peerId: string) => void
  onUnmuteStudent?: (peerId: string) => void
}

const VideoPlayer = ({ stream, isLocal = false, isScreenShare = false }: { stream: MediaStream | null | undefined, isLocal?: boolean, isScreenShare?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [trackId, setTrackId] = useState<string>('');

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;

            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                setTrackId(videoTrack.id);
            }

            const handleTrackChange = () => {
                console.log('[VideoPlayer] Track changed, updating video element');
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                    setTimeout(() => {
                        if (videoRef.current && stream) {
                            videoRef.current.srcObject = stream;
                        }
                    }, 0);
                }
                const videoTrack = stream.getVideoTracks()[0];
                if (videoTrack) {
                    setTrackId(videoTrack.id);
                }
            };

            stream.addEventListener('addtrack', handleTrackChange);
            stream.addEventListener('removetrack', handleTrackChange);

            return () => {
                stream.removeEventListener('addtrack', handleTrackChange);
                stream.removeEventListener('removetrack', handleTrackChange);
            };
        }
    }, [stream, trackId]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className="w-full h-full"
            style={{ 
                transform: isLocal ? 'scaleX(-1)' : 'none',
                objectFit: isScreenShare ? 'contain' : 'cover',
                maxHeight: '100%',
                maxWidth: '100%',
                backgroundColor: isScreenShare ? '#000' : 'transparent'
            }}
        />
    );
};

const SpeakingIndicator = ({ isAudioOn, isSpeaking }: { isAudioOn: boolean; isSpeaking?: boolean }) => {
    if (!isAudioOn || !isSpeaking) return null;
    return (
        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full px-2 py-1 backdrop-blur-md border border-green-400/30 shadow-lg">
            <div className="h-1.5 w-0.5 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-sound-bar-1" />
            <div className="h-2.5 w-0.5 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-sound-bar-2" />
            <div className="h-2 w-0.5 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-sound-bar-3" />
            <div className="h-3 w-0.5 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-sound-bar-4" />
            <div className="h-1.5 w-0.5 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-sound-bar-5" />
        </div>
    );
};

const SpeakingRing = ({ isSpeaking }: { isSpeaking?: boolean }) => {
    if (!isSpeaking) return null;
    return (
        <>
            <div className="absolute inset-0 rounded-xl ring-2 ring-green-400/60 animate-pulse pointer-events-none z-10" />
            <div className="absolute inset-0 rounded-xl shadow-[0_0_20px_rgba(74,222,128,0.4)] pointer-events-none z-10" />
        </>
    );
};

const AvatarPlaceholder = ({ name, size = 'md' }: { name?: string; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
        sm: 'h-10 w-10 text-base',
        md: 'h-16 w-16 text-xl',
        lg: 'h-20 w-20 text-2xl'
    };

    const initial = name ? name.charAt(0).toUpperCase() : '?';

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl ring-4 ring-indigo-500/20`}>
            <span className="font-bold text-white">{initial}</span>
        </div>
    );
};

export function VideoGrid({ localStream, peers, userRole, isLocalVideoOn, layout = 'focus', onMuteStudent, onUnmuteStudent }: VideoGridProps) {
    const isLocalUserTutor = userRole === 'tutor';
    const tutorPeer = peers.find(p => p.userRole === 'tutor');
    const studentPeers = peers.filter(p => p.userRole !== 'tutor');
    const [speakingPeers, setSpeakingPeers] = useState<Set<string>>(new Set());
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

    // Detect orientation changes
    useEffect(() => {
        const handleOrientationChange = () => {
            const isLandscape = window.innerWidth > window.innerHeight;
            setOrientation(isLandscape ? 'landscape' : 'portrait');
        };

        handleOrientationChange();
        window.addEventListener('resize', handleOrientationChange);
        window.addEventListener('orientationchange', handleOrientationChange);

        return () => {
            window.removeEventListener('resize', handleOrientationChange);
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, []);

    // Speaking detection - Optimized AudioContext Management
    useEffect(() => {
        // Use a persistent AudioContext reference to avoid constant recreation
        const audioContextRef = { current: null as AudioContext | null };
        const analysers = new Map<string, AnalyserNode>();
        let interval: NodeJS.Timeout;

        const initAudioContext = () => {
             if (!audioContextRef.current) {
                try {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                } catch (e) {
                    console.error("Failed to create AudioContext", e);
                }
            }
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume().catch(console.error);
            }
            return audioContextRef.current;
        };

        const checkSpeaking = () => {
            const ctx = initAudioContext();
            if (!ctx) return;

            const newSpeakingPeers = new Set<string>();

            peers.forEach(peer => {
                if (peer.stream && peer.isAudioOn) {
                    // Get or create analyser for this peer
                    let analyser = analysers.get(peer.peerId);

                    if (!analyser) {
                        try {
                            analyser = ctx.createAnalyser();
                            analyser.fftSize = 512;
                            const source = ctx.createMediaStreamSource(peer.stream);
                            source.connect(analyser);
                            analysers.set(peer.peerId, analyser);
                        } catch (e) {
                            // MediaStreamSource creation can fail if stream is inactive
                            return;
                        }
                    }

                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    analyser.getByteFrequencyData(dataArray);
                    
                    // Calculate average volume
                    let sum = 0;
                    for(let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / dataArray.length;

                    // Threshold for speaking detection
                    if (average > 25) { // Slightly lowered threshold
                        newSpeakingPeers.add(peer.peerId);
                    }
                } else {
                    // Clean up analyser if audio is off or stream is gone
                    if (analysers.has(peer.peerId)) {
                        const analyser = analysers.get(peer.peerId);
                        analyser?.disconnect();
                        analysers.delete(peer.peerId);
                    }
                }
            });

            setSpeakingPeers(newSpeakingPeers);
        };

        interval = setInterval(checkSpeaking, 100);

        return () => {
            clearInterval(interval);
            analysers.forEach(analyser => analyser.disconnect());
            analysers.clear();
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(console.error);
                audioContextRef.current = null;
            }
        };
    }, [peers]); // Note: Still depends on peers, but logic is robust enough to handle re-creation safely

    // --- STUDENT VIEW (Mobile Optimized) ---
    if (userRole !== 'tutor') {
        return (
            <div className="flex-1 h-full w-full bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 relative flex flex-col items-center justify-center overflow-hidden">
                {/* Tutor Video - Full Screen Mobile Optimized */}
                {tutorPeer ? (
                    tutorPeer.stream ? (
                         <div className="w-full h-full relative flex items-center justify-center bg-black">
                            <div className={`${orientation === 'landscape' ? 'w-full h-full' : 'w-full h-full'} relative`}>
                                <VideoPlayer 
                                    stream={tutorPeer.stream} 
                                    isScreenShare={tutorPeer.isScreenSharing !== undefined && tutorPeer.isScreenSharing} 
                                />
                            </div>
                            <SpeakingIndicator isAudioOn={tutorPeer.isAudioOn} isSpeaking={speakingPeers.has(tutorPeer.peerId)} />
                            <SpeakingRing isSpeaking={speakingPeers.has(tutorPeer.peerId) && tutorPeer.isAudioOn} />

                            {/* Screen Share Indicator */}
                            {tutorPeer.isScreenSharing !== undefined && tutorPeer.isScreenSharing && (
                                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600/90 to-cyan-600/90 backdrop-blur-md py-1.5 px-3 flex items-center justify-center gap-1.5 shadow-lg border-b border-blue-400/30 z-20">
                                    <MonitorUp className="h-3 w-3 text-white flex-shrink-0" />
                                    <p className="text-white font-semibold text-xs truncate">
                                        {tutorPeer.name || 'Instructor'} is sharing
                                    </p>
                                </div>
                            )}

                            {/* Tutor Info Badge - Mobile Optimized */}
                            <div className="absolute bottom-3 left-3 bg-gradient-to-r from-indigo-600/95 to-purple-600/95 backdrop-blur-md rounded-lg px-3 py-1.5 flex flex-col gap-0.5 shadow-xl border border-indigo-400/30 max-w-[60%] z-20">
                                <p className="text-white font-bold text-xs truncate">
                                    {tutorPeer.name || 'Instructor'}
                                </p>
                                {tutorPeer.isScreenSharing !== undefined && tutorPeer.isScreenSharing && (
                                    <p className="text-blue-200 text-[9px] flex items-center gap-1">
                                        <MonitorUp className="h-2.5 w-2.5 flex-shrink-0" /> Screen Share
                                    </p>
                                )}
                            </div>

                            {/* Audio Muted Indicator */}
                            {!tutorPeer.isAudioOn && (
                                <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg z-20">
                                    <MicOff className="h-3 w-3 text-white" />
                                </div>
                            )}
                         </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center gap-3 text-white p-6 text-center relative">
                             <AvatarPlaceholder name={tutorPeer.name} size="lg" />
                             <div className="space-y-1">
                                 <h2 className="text-lg font-bold">{tutorPeer.name || 'Instructor'}</h2>
                                 <p className="text-indigo-300 text-sm">Camera is off</p>
                             </div>
                             {!tutorPeer.isAudioOn && (
                                 <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs">
                                     <MicOff className="h-2.5 w-2.5 mr-1" /> Muted
                                 </Badge>
                             )}
                             {/* Ensure audio plays even if video is off */}
                             {tutorPeer.stream && (
                                 <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
                                     <VideoPlayer stream={tutorPeer.stream} />
                                 </div>
                             )}
                         </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center gap-3 text-white p-6 text-center">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-600/50 to-purple-600/50 flex items-center justify-center animate-pulse ring-4 ring-indigo-500/20">
                            <User className="h-10 w-10 text-indigo-300" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-lg font-bold">Waiting for instructor...</h2>
                            <p className="text-indigo-300/70 text-sm">Session starting soon</p>
                        </div>
                    </div>
                )}
                
                {/* Student Self Preview - Mobile Optimized (Always Visible) */}
                <div className="absolute bottom-2 right-2 w-24 h-32 bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-indigo-500/50 rounded-lg shadow-2xl overflow-hidden z-30 group hover:border-indigo-400 transition-all">
                    {isLocalVideoOn && localStream ? (
                        <div className="w-full h-full relative">
                            <VideoPlayer stream={localStream} isLocal={true} />
                            <div className="absolute bottom-1 left-1">
                                <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 border-0">You</Badge>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500/50 to-purple-500/50 flex items-center justify-center">
                                <VideoOff className="h-4 w-4 text-indigo-300" />
                            </div>
                            <span className="text-[9px] text-indigo-300/60">Off</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- TUTOR VIEW (Responsive Grid) ---
    const getGridCols = (count: number) => {
        // Mobile (default)
        if (window.innerWidth < 768) {
             if (count <= 1) return 'grid-cols-1';
             return 'grid-cols-2';
        }
        
        // Tablet / Desktop
        if (count <= 1) return 'md:grid-cols-1';
        if (count <= 4) return 'md:grid-cols-2';
        if (count <= 9) return 'md:grid-cols-3';
        if (count <= 16) return 'md:grid-cols-4';
        return 'md:grid-cols-5';
    };

    return (
        <div className="flex-1 p-2 h-full relative flex flex-col bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 overflow-hidden">
            {/* Students Grid - Mobile Optimized */}
            {studentPeers.length > 0 ? (
                <div className={`grid ${getGridCols(studentPeers.length)} gap-2 auto-rows-fr flex-1 overflow-y-auto content-start pb-2`}>
                    {studentPeers.map(p => (
                        <Card key={p.peerId} className={`relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border transition-all duration-300 group min-h-[140px] hover:shadow-lg rounded-lg ${speakingPeers.has(p.peerId) && p.isAudioOn ? 'border-green-400/60 shadow-lg shadow-green-500/20' : 'border-indigo-500/20 hover:border-indigo-400/50'}`}>
                            {p.stream && p.isVideoOn ? (
                                <div className="w-full h-full relative">
                                    <VideoPlayer 
                                        stream={p.stream} 
                                        isScreenShare={p.isScreenSharing !== undefined && p.isScreenSharing}
                                    />
                                    <SpeakingIndicator isAudioOn={p.isAudioOn} isSpeaking={speakingPeers.has(p.peerId)} />
                                    <SpeakingRing isSpeaking={speakingPeers.has(p.peerId) && p.isAudioOn} />
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 relative">
                                    <AvatarPlaceholder name={p.name} size="sm" />
                                    <span className="text-white text-xs font-medium truncate max-w-full">{p.name || 'Student'}</span>
                                    {/* Ensure audio plays even if video is off */}
                                    {p.stream && (
                                        <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
                                            <VideoPlayer stream={p.stream} />
                                        </div>
                                    )}
                                    <SpeakingIndicator isAudioOn={p.isAudioOn} isSpeaking={speakingPeers.has(p.peerId)} />
                                </div>
                            )}

                            {/* Student Info - Mobile Optimized */}
                            <div className="absolute bottom-1 left-1 right-1 flex justify-between items-end gap-1">
                                <Badge className="bg-gradient-to-r from-indigo-600/90 to-purple-600/90 backdrop-blur-sm text-white text-[9px] font-semibold px-1.5 py-0.5 truncate max-w-[65%] border-0">
                                    {p.name || 'Student'}
                                </Badge>

                                <div className="flex gap-1 flex-shrink-0">
                                    {!p.isAudioOn && (
                                        <div className="bg-red-500/80 rounded-full p-0.5">
                                            <MicOff className="h-2.5 w-2.5 text-white" />
                                        </div>
                                    )}
                                    {p.isHandRaised && (
                                        <div className="bg-yellow-500/80 rounded-full p-0.5 animate-bounce">
                                            <Hand className="h-2.5 w-2.5 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tutor Controls - Mobile Optimized */}
                            {userRole === 'tutor' && (
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-2">
                                    {p.isAudioOn ? (
                                        <Button
                                            size="sm"
                                            onClick={() => onMuteStudent?.(p.peerId)}
                                            className="rounded-full h-8 w-8 p-0 shadow-lg bg-red-500 hover:bg-red-600"
                                            title="Mute"
                                        >
                                            <MicOff className="h-3 w-3" />
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onUnmuteStudent?.(p.peerId)}
                                            className="rounded-full h-8 w-8 p-0 shadow-lg bg-indigo-600 hover:bg-indigo-700 border-0"
                                            title="Request Unmute"
                                        >
                                            <Mic className="h-3 w-3 text-white" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-white p-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-600/30 to-purple-600/30 flex items-center justify-center mb-3 ring-4 ring-indigo-500/10">
                        <User className="h-8 w-8 text-indigo-400" />
                    </div>
                    <p className="text-base font-semibold text-white">No students yet</p>
                    <p className="text-xs text-indigo-300/60 mt-1">Waiting for participants...</p>
                </div>
            )}

            {/* Tutor Self Preview - Mobile Optimized */}
            <div className="absolute bottom-2 right-2 w-24 h-32 bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-indigo-500/50 rounded-lg shadow-2xl overflow-hidden z-30 group hover:border-indigo-400 transition-all">
                 {isLocalVideoOn && localStream ? (
                     <div className="w-full h-full relative">
                         <VideoPlayer stream={localStream} isLocal={true} />
                         <div className="absolute bottom-1 left-1">
                             <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 border-0">You</Badge>
                         </div>
                     </div>
                 ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                         <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500/50 to-purple-500/50 flex items-center justify-center">
                             <VideoOff className="h-4 w-4 text-indigo-300" />
                         </div>
                         <span className="text-[9px] text-indigo-300/60">Off</span>
                     </div>
                 )}
            </div>
        </div>
    );
}