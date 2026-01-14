import React, { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VideoOff, MicOff, MonitorUp, Hand, Mic, Volume2 } from 'lucide-react'
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

// Speaking indicator animation
const SpeakingIndicator = ({ isAudioOn, isSpeaking }: { isAudioOn: boolean; isSpeaking?: boolean }) => {
    return (
        <div className="absolute top-2 right-2 flex items-center gap-1">
            {isAudioOn && isSpeaking && (
                <div className="flex items-center gap-0.5">
                    <div className="h-2 w-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="h-2 w-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="h-2 w-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
            )}
        </div>
    );
};

export function VideoGrid({ localStream, peers, userRole, isLocalVideoOn, layout = 'focus', onMuteStudent, onUnmuteStudent }: VideoGridProps) {
    const tutorPeer = peers.find(p => p.userRole === 'tutor');
    const studentPeers = peers.filter(p => p.userRole !== 'tutor');
    const [speakingPeers, setSpeakingPeers] = useState<Set<string>>(new Set());

    // Detect speaking based on audio activity
    useEffect(() => {
        const audioContexts = new Map<string, AnalyserNode>();
        
        const checkSpeaking = () => {
            const newSpeakingPeers = new Set<string>();
            
            // Check each peer's audio
            peers.forEach(peer => {
                if (peer.stream && peer.isAudioOn) {
                    let analyser = audioContexts.get(peer.peerId);
                    
                    if (!analyser) {
                        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                        analyser = audioContext.createAnalyser();
                        const source = audioContext.createMediaStreamSource(peer.stream);
                        source.connect(analyser);
                        audioContexts.set(peer.peerId, analyser);
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

    // --- STUDENT VIEW ---
    if (userRole !== 'tutor') {
        return (
            <div className="flex-1 p-0 h-full w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 relative flex flex-col items-center justify-center overflow-hidden">
                {/* Tutor Video - Full Screen */}
                {tutorPeer ? (
                    tutorPeer.isVideoOn && tutorPeer.stream ? (
                         <div className="w-full h-full relative">
                            <VideoPlayer stream={tutorPeer.stream} />
                            <SpeakingIndicator isAudioOn={tutorPeer.isAudioOn} isSpeaking={speakingPeers.has(tutorPeer.peerId)} />
                            
                            {/* Tutor Info Badge */}
                            <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
                                <p className="text-white font-semibold text-sm">Tutor</p>
                            </div>
                         </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center gap-4 text-white p-8 text-center max-w-sm">
                             <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full h-28 w-28 flex items-center justify-center shadow-2xl">
                                  <span className="text-5xl font-bold">👨‍🏫</span>
                             </div>
                             <h2 className="text-2xl font-bold">Tutor's camera is off</h2>
                             <p className="text-gray-300 text-base">The tutor is present but has disabled their video.</p>
                         </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center gap-4 text-white p-8 text-center max-w-sm">
                        <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-full h-28 w-28 flex items-center justify-center shadow-2xl animate-pulse">
                            <span className="text-5xl">⏳</span>
                        </div>
                        <h2 className="text-2xl font-bold">Waiting for tutor to join...</h2>
                        <p className="text-gray-400 text-base">The session will start soon.</p>
                    </div>
                )}
            </div>
        );
    }

    // --- TUTOR VIEW (Grid Layout) ---
    return (
        <div className="flex-1 p-4 h-full relative flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
            {/* Students Grid */}
            {studentPeers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr flex-1 overflow-y-auto content-start pb-4">
                    {studentPeers.map(p => (
                        <Card key={p.peerId} className="relative overflow-hidden bg-gray-800 border border-gray-700 hover:border-indigo-500 transition-colors duration-300 group min-h-[180px] sm:min-h-[220px]">
                            {p.isVideoOn && p.stream ? (
                                <div className="w-full h-full relative">
                                    <VideoPlayer stream={p.stream} />
                                    <SpeakingIndicator isAudioOn={p.isAudioOn} isSpeaking={speakingPeers.has(p.peerId)} />
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950 gap-2">
                                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full h-16 w-16 flex items-center justify-center shadow-lg">
                                        <span className="text-2xl font-bold text-white">👤</span>
                                    </div>
                                    <div className="text-gray-300 text-xs font-medium">Video Off</div>
                                </div>
                            )}
                            
                            {/* Student Badge */}
                            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-start gap-2">
                                <div className="flex-1">
                                    <Badge className="bg-gray-950/80 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1">
                                        Student
                                    </Badge>
                                </div>
                                
                                {/* Audio/Video Status Icons */}
                                <div className="flex gap-1">
                                    {!p.isVideoOn && <VideoOff className="h-4 w-4 text-red-400" />}
                                    {!p.isAudioOn && <MicOff className="h-4 w-4 text-red-400" />}
                                </div>
                            </div>

                            {/* Tutor Control Buttons (Hover) */}
                            {userRole === 'tutor' && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-2">
                                    {p.isAudioOn ? (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => onMuteStudent?.(p.peerId)}
                                            className="rounded-full h-10 w-10 p-0 shadow-lg"
                                            title="Mute Student"
                                        >
                                            <MicOff className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onUnmuteStudent?.(p.peerId)}
                                            className="rounded-full h-10 w-10 p-0 shadow-lg bg-gray-950/90"
                                            title="Unmute Student"
                                        >
                                            <Mic className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <div className="text-6xl mb-4">👥</div>
                    <p className="text-lg font-medium">No students have joined yet</p>
                    <p className="text-sm text-gray-500 mt-2">Waiting for participants...</p>
                </div>
            )}

            {/* Tutor Self Preview (Bottom Right) */}
            <div className="absolute bottom-4 right-4 w-48 h-36 sm:w-56 sm:h-40 bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-indigo-500/50 rounded-xl shadow-2xl overflow-hidden z-20 group hover:border-indigo-400 transition-all duration-300 hover:shadow-indigo-500/20">
                 {isLocalVideoOn && localStream ? (
                     <div className="w-full h-full relative">
                         <VideoPlayer stream={localStream} isLocal={true} />
                         <div className="absolute bottom-2 left-2">
                             <Badge className="bg-indigo-600/95 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5">You (Tutor)</Badge>
                         </div>
                     </div>
                 ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950 gap-2">
                         <VideoOff className="h-8 w-8 text-gray-600" />
                         <span className="text-xs text-gray-500 font-medium">Camera Off</span>
                     </div>
                 )}
            </div>
        </div>
    );
}
