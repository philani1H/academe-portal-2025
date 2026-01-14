import React, { RefObject } from 'react'
import { Message } from './types'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

interface ChatTabProps {
  messages: Message[]
  chatInput: string
  setChatInput: (val: string) => void
  onSendMessage: (e?: React.FormEvent) => void
  chatEndRef?: RefObject<HTMLDivElement>
}

export function ChatTab({
  messages,
  chatInput,
  setChatInput,
  onSendMessage,
  chatEndRef
}: ChatTabProps) {
  // Function to highlight mentions
  const renderMessageText = (text: string) => {
    // Regex to match @word
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return <span key={index} className="text-blue-400 font-bold bg-blue-900/30 rounded px-1">{part}</span>;
      }
      return part;
    });
  };

  return (
    <>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.type === 'system' ? 'text-center' : ''}>
            {msg.type === 'system' ? (
              <p className="text-xs text-gray-500 italic">{msg.text}</p>
            ) : (
              <div className="bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-blue-400 mb-1">{msg.userName}</p>
                <p className="text-sm text-white break-words">{renderMessageText(msg.text)}</p>
                <p className="text-[10px] text-gray-500 text-right mt-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={onSendMessage} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )
}
