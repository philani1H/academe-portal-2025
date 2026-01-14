import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Textarea } from '@/components/ui/textarea';

interface SharedNotesProps {
    socket?: Socket;
    sessionId: string;
}

export function SharedNotes({ socket, sessionId }: SharedNotesProps) {
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (socket) {
            socket.on('shared-notes-update', (updatedNotes: string) => {
                setNotes(updatedNotes);
            });
        }
        return () => {
            socket?.off('shared-notes-update');
        };
    }, [socket]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newNotes = e.target.value;
        setNotes(newNotes);
        socket?.emit('shared-notes-update', { sessionId, notes: newNotes });
    };

    return (
        <div className="h-full flex flex-col p-4 bg-gray-900">
            <h3 className="text-white font-semibold mb-2">Collaborative Notes</h3>
            <Textarea 
                value={notes}
                onChange={handleChange}
                className="flex-1 bg-gray-800 border-gray-700 text-white resize-none font-mono"
                placeholder="Type notes here... everyone can see and edit this."
            />
        </div>
    );
}
