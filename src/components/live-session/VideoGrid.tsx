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

const VideoPlayer = ({ stream, isLocal = false }: { stream: MediaStream | null | undefined, isLocal?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className="w-full h-full object-cover"
        />
    );
};

// Enhanced Speaking indicator animation with sound wave bars
const SpeakingIndicator = ({ isAudioOn, isSpeaking }: { isAudioOn: boolean; isSpeaking?: boolean }) => {
    if (!isAudioOn || !isSpeaking) return null;
    return (
        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full px-2.5 py-1.5 backdrop-blur-md border border-green-400/30 shadow-lg shadow-green-500/20">
            <div className="h-2 w-1 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-sound-bar-1" />
            <div className="h-3.5 w-1 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-sound-bar-2" />
            <div className="h-2.5 w-1 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-sound-bar-3" />
            <div className="h-4 w-1 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-sound-bar-4" />
            <div className="h-2 w-1 bg-gradient-to-t from-green-400 to-emerald-300 rounded-full animate-sound-bar-5" />
        </div>
    );
};

// Speaking ring glow effect for video container
const SpeakingRing = ({ isSpeaking }: { isSpeaking?: boolean }) => {
    if (!isSpeaking) return null;
    return (
        <>
            <div className="absolute inset-0 rounded-xl ring-2 ring-green-400/60 animate-pulse pointer-events-none z-10" />
            <div className="absolute inset-0 rounded-xl shadow-[0_0_20px_rgba(74,222,128,0.4)] pointer-events-none z-10" />
        </>
    );
};

// Round avatar component for when video is off
const AvatarPlaceholder = ({ name, size = 'md' }: { name?: string; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
        sm: 'h-12 w-12 text-lg',
        md: 'h-16 w-16 sm:h-20 sm:w-20 text-xl sm:text-2xl',
        lg: 'h-24 w-24 sm:h-32 sm:w-32 text-3xl sm:text-4xl'
    };

    const initial = name ? name.charAt(0).toUpperCase() : '?';

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl ring-4 ring-indigo-500/20`}>
            <span className="font-bold text-white">{initial}</span>
        </div>
    );
};

export function VideoGrid({ localStream, peers, userRole, isLocalVideoOn, layout = 'focus', onMuteStudent, onUnmuteStudent }: VideoGridProps) {
    // If I am the tutor, I am not in the peers list.
    // If I am a student, the tutor is in the peers list.
    
    // Logic:
    // 1. Identify the "Main Presenter" (Tutor)
    // 2. Identify "Other Participants" (Students)

    const isLocalUserTutor = userRole === 'tutor';
    const tutorPeer = peers.find(p => p.userRole === 'tutor');
    
    // If I am the tutor, I should be the main presenter in my view? 
    // Or maybe I want to see the students?
    // Usually, Tutors want to see students, Students want to see Tutor.
    
    // Current Logic Fix:
    // If I am a student, `tutorPeer` exists in peers.
    // If I am a tutor, `tutorPeer` is undefined (because I am the tutor).
    
    const studentPeers = peers.filter(p => p.userRole !== 'tutor');
    const [speakingPeers, setSpeakingPeers] = useState<Set<string>>(new Set());

    // Detect speaking based on audio activity
    useEffect(() => {
        const audioContexts = new Map<string, AnalyserNode>();

        const checkSpeaking = () => {
            const newSpeakingPeers = new Set<string>();

            peers.forEach(peer => {
                if (peer.stream && peer.isAudioOn) {
                    let analyser = audioContexts.get(peer.peerId);

                    if (!analyser) {
                        try {
                            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                            analyser = audioContext.createAnalyser();
                            const source = audioContext.createMediaStreamSource(peer.stream);
                            source.connect(analyser);
                            audioContexts.set(peer.peerId, analyser);
                        } catch (e) {
                            return;
                        }
                    }

                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    analyser.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

                    if (average > 30) {
                        newSpeakingPeers.add(peer.peerId);
                    }
                }
            });

            setSpeakingPeers(newSpeakingPeers);
        };

        const interval = setInterval(checkSpeaking, 100);
        return () => {
            clearInterval(interval);
            audioContexts.forEach(analyser => analyser.disconnect?.());
        };
    }, [peers]);

    console.log('[VideoGrid] Rendering', {
        userRole,
        peersCount: peers.length,
        hasTutorPeer: !!tutorPeer,
        hasLocalStream: !!localStream,
        isLocalVideoOn
    });

    // --- STUDENT VIEW ---
    if (userRole !== 'tutor') {
        return (
            <div className="flex-1 p-0 h-full w-full bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 relative flex flex-col items-center justify-center overflow-hidden">
                {/* Tutor Video - Full Screen */}
                {tutorPeer ? (
                    tutorPeer.stream ? (
                         <div className="w-full h-full relative">
                            <VideoPlayer stream={tutorPeer.stream} />
                            <SpeakingIndicator isAudioOn={tutorPeer.isAudioOn} isSpeaking={speakingPeers.has(tutorPeer.peerId)} />
                            <SpeakingRing isSpeaking={speakingPeers.has(tutorPeer.peerId) && tutorPeer.isAudioOn} />

                            {/* Tutor Info Badge */}
                            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 bg-gradient-to-r from-indigo-600/90 to-purple-600/90 backdrop-blur-md rounded-xl px-4 py-2 sm:px-5 sm:py-3 flex flex-col gap-1 shadow-xl border border-indigo-400/30">
                                <p className="text-white font-bold text-sm sm:text-base">
                                    {tutorPeer.name || 'Instructor'}
                                </p>
                                {!tutorPeer.isVideoOn && (
                                    <p className="text-indigo-200 text-[10px] sm:text-xs flex items-center gap-1.5">
                                        <MonitorUp className="h-3 w-3" /> Sharing Screen
                                    </p>
                                )}
                            </div>

                            {/* Audio status indicator */}
                            {!tutorPeer.isAudioOn && (
                                <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                                    <MicOff className="h-4 w-4 text-white" />
                                </div>
                            )}
                         </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 text-white p-8 text-center">
                             <AvatarPlaceholder name={tutorPeer.name} size="lg" />
                             <div className="space-y-2">
                                 <h2 className="text-xl sm:text-2xl font-bold">{tutorPeer.name || 'Instructor'}</h2>
                                 <p className="text-indigo-300 text-sm sm:text-base">Camera is off</p>
                             </div>
                             {!tutorPeer.isAudioOn && (
                                 <Badge className="bg-red-500/20 text-red-300 border border-red-500/30">
                                     <MicOff className="h-3 w-3 mr-1" /> Muted
                                 </Badge>
                             )}
                         </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 text-white p-8 text-center">
                        <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-indigo-600/50 to-purple-600/50 flex items-center justify-center animate-pulse ring-4 ring-indigo-500/20">
                            <User className="h-12 w-12 sm:h-16 sm:w-16 text-indigo-300" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl sm:text-2xl font-bold">Waiting for instructor...</h2>
                            <p className="text-indigo-300/70 text-sm sm:text-base">The session will start soon</p>
                        </div>
                    </div>
                )}
                
                {/* Student Self Preview (Bottom Right) - ALWAYS SHOW */}
                <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-28 h-20 sm:w-40 sm:h-28 md:w-48 md:h-36 bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-indigo-500/50 rounded-xl shadow-2xl overflow-hidden z-20 group hover:border-indigo-400 transition-all duration-300 hover:shadow-indigo-500/20">
                    {isLocalVideoOn && localStream ? (
                        <div className="w-full h-full relative">
                            <VideoPlayer stream={localStream} isLocal={true} />
                            <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2">
                                <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 border-0">You</Badge>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-indigo-500/50 to-purple-500/50 flex items-center justify-center">
                                <VideoOff className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-300" />
                            </div>
                            <span className="text-[10px] sm:text-xs text-indigo-300/60">Camera Off</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- TUTOR VIEW (Grid Layout) ---
    // Calculate optimal grid columns based on student count
    const getGridCols = (count: number) => {
        if (count <= 2) return 'grid-cols-1 sm:grid-cols-2';
        if (count <= 4) return 'grid-cols-2';
        if (count <= 6) return 'grid-cols-2 sm:grid-cols-3';
        if (count <= 9) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3';
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
    };

    return (
        <div className="flex-1 p-2 sm:p-4 h-full relative flex flex-col bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 overflow-hidden">
            {/* Students Grid */}
            {studentPeers.length > 0 ? (
                <div className={`grid ${getGridCols(studentPeers.length)} gap-2 sm:gap-3 auto-rows-fr flex-1 overflow-y-auto content-start pb-2 sm:pb-4`}>
                    {studentPeers.map(p => (
                        <Card key={p.peerId} className={`relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border transition-all duration-300 group min-h-[120px] sm:min-h-[150px] md:min-h-[180px] hover:shadow-lg rounded-xl ${speakingPeers.has(p.peerId) && p.isAudioOn ? 'border-green-400/60 shadow-lg shadow-green-500/20' : 'border-indigo-500/20 hover:border-indigo-400/50 hover:shadow-indigo-500/10'}`}>
                            {p.stream && p.isVideoOn ? (
                                <div className="w-full h-full relative">
                                    <VideoPlayer stream={p.stream} />
                                    <SpeakingIndicator isAudioOn={p.isAudioOn} isSpeaking={speakingPeers.has(p.peerId)} />
                                    <SpeakingRing isSpeaking={speakingPeers.has(p.peerId) && p.isAudioOn} />
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 sm:gap-3 p-4">
                                    <AvatarPlaceholder name={p.name} size="md" />
                                    <span className="text-white text-xs sm:text-sm font-medium truncate max-w-full">{p.name || 'Student'}</span>
                                </div>
                            )}

                            {/* Student Name Badge */}
                            <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 right-1.5 sm:right-2 flex justify-between items-end gap-1">
                                <Badge className="bg-gradient-to-r from-indigo-600/90 to-purple-600/90 backdrop-blur-sm text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 truncate max-w-[70%] border-0">
                                    {p.name || 'Student'}
                                </Badge>

                                {/* Status Icons */}
                                <div className="flex gap-1 flex-shrink-0">
                                    {!p.isAudioOn && (
                                        <div className="bg-red-500/80 rounded-full p-1">
                                            <MicOff className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                                        </div>
                                    )}
                                    {p.isHandRaised && (
                                        <div className="bg-yellow-500/80 rounded-full p-1 animate-bounce">
                                            <Hand className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tutor Control Buttons (Hover) */}
                            {userRole === 'tutor' && (
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-2">
                                    {p.isAudioOn ? (
                                        <Button
                                            size="sm"
                                            onClick={() => onMuteStudent?.(p.peerId)}
                                            className="rounded-full h-10 w-10 p-0 shadow-lg bg-red-500 hover:bg-red-600"
                                            title="Mute Student"
                                        >
                                            <MicOff className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onUnmuteStudent?.(p.peerId)}
                                            className="rounded-full h-10 w-10 p-0 shadow-lg bg-indigo-600 hover:bg-indigo-700 border-0"
                                            title="Request Unmute"
                                        >
                                            <Mic className="h-4 w-4 text-white" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-white p-4">
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-indigo-600/30 to-purple-600/30 flex items-center justify-center mb-4 ring-4 ring-indigo-500/10">
                        <User className="h-10 w-10 sm:h-12 sm:w-12 text-indigo-400" />
                    </div>
                    <p className="text-lg sm:text-xl font-semibold text-white">No students yet</p>
                    <p className="text-sm text-indigo-300/60 mt-2">Waiting for participants to join...</p>
                </div>
            )}

            {/* Tutor Self Preview (Bottom Right) */}
            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-28 h-20 sm:w-40 sm:h-28 md:w-48 md:h-36 bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-indigo-500/50 rounded-xl shadow-2xl overflow-hidden z-20 group hover:border-indigo-400 transition-all duration-300 hover:shadow-indigo-500/20">
                 {isLocalVideoOn && localStream ? (
                     <div className="w-full h-full relative">
                         <VideoPlayer stream={localStream} isLocal={true} />
                         <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2">
                             <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 border-0">You</Badge>
                         </div>
                     </div>
                 ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                         <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-indigo-500/50 to-purple-500/50 flex items-center justify-center">
                             <VideoOff className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-300" />
                         </div>
                         <span className="text-[10px] sm:text-xs text-indigo-300/60">Camera Off</span>
                     </div>
                 )}
            </div>
        </div>
    );
}
