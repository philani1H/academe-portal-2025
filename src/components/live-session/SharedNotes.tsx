import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { StickyNote, Users, Sparkles } from 'lucide-react';

interface SharedNotesProps {
    socket?: Socket;
    sessionId: string;
    userName?: string;
}

export function SharedNotes({ socket, sessionId, userName }: SharedNotesProps) {
    const [notes, setNotes] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [lastTyper, setLastTyper] = useState<string | null>(null);

    useEffect(() => {
        if (socket) {
            socket.on('shared-notes-update', (updatedNotes: string) => {
                setNotes(updatedNotes);
            });

            socket.on('notes-typing', (typerName: string) => {
                if (typerName !== userName) {
                    setLastTyper(typerName);
                    setIsTyping(true);
                    setTimeout(() => setIsTyping(false), 2000);
                }
            });
        }
        return () => {
            socket?.off('shared-notes-update');
            socket?.off('notes-typing');
        };
    }, [socket, userName]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newNotes = e.target.value;
        setNotes(newNotes);
        socket?.emit('shared-notes-update', { sessionId, notes: newNotes });
        
        if (userName) {
            socket?.emit('notes-typing', { sessionId, userName });
        }
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 p-3 sm:p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <StickyNote className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm">Collaborative Notes</h3>
                        <p className="text-indigo-300/50 text-[10px]">Everyone can see and edit</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                    <Users className="h-3 w-3 text-indigo-400" />
                    <span className="text-[10px] text-indigo-300">Live</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                </div>
            </div>

            {/* Typing Indicator */}
            {isTyping && lastTyper && (
                <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Sparkles className="h-3 w-3 text-indigo-400 animate-pulse" />
                    <span className="text-xs text-indigo-300">{lastTyper} is typing...</span>
                </div>
            )}

            {/* Notes Textarea */}
            <div className="flex-1 relative rounded-xl overflow-hidden border border-indigo-500/20 hover:border-indigo-500/40 transition-colors duration-200">
                <textarea
                    value={notes}
                    onChange={handleChange}
                    className="w-full h-full bg-slate-800/50 text-white resize-none font-mono text-sm p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder-indigo-300/30 leading-relaxed"
                    placeholder="Start typing notes here...&#10;&#10;Everyone in the session can see and edit these notes in real-time."
                />

                {/* Character Count */}
                <div className="absolute bottom-2 right-2 text-[10px] text-indigo-300/40 bg-slate-900/80 px-2 py-0.5 rounded">
                    {notes.length} characters
                </div>
            </div>

            {/* Tips */}
            <div className="mt-3 flex items-start gap-2 p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-indigo-300/60 leading-relaxed">
                    Tip: Use these notes to jot down key points, questions, or summaries during the session.
                </p>
            </div>
        </div>
    );
}
