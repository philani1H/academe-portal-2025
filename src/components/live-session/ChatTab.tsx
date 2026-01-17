import React, { RefObject } from 'react'
import { Message } from './types'
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
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            className="text-indigo-300 font-semibold bg-indigo-500/20 rounded px-1.5 py-0.5"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Messages Area */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-3">
              <Send className="h-7 w-7 text-indigo-400/50" />
            </div>
            <p className="text-indigo-300/60 text-sm">No messages yet</p>
            <p className="text-indigo-300/40 text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id}
              className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.type === 'system' ? 'text-center' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {msg.type === 'system' ? (
                <div className="flex items-center gap-2 justify-center py-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                  <p className="text-xs text-indigo-400/60 italic px-2">{msg.text}</p>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                </div>
              ) : (
                <div className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:from-slate-800 hover:to-slate-900 rounded-xl p-3 border border-indigo-500/10 hover:border-indigo-500/30 transition-all duration-200 shadow-lg hover:shadow-indigo-500/5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {msg.userName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <p className="text-xs font-semibold text-indigo-400">{msg.userName}</p>
                    <p className="text-[10px] text-indigo-300/40 ml-auto">
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <p className="text-sm text-gray-200 break-words leading-relaxed pl-8">
                    {renderMessageText(msg.text)}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t border-indigo-500/20 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800/80 text-white rounded-xl px-4 py-2.5 text-sm border border-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 placeholder-indigo-300/30 transition-all duration-200"
          />
          <button
            onClick={() => onSendMessage()}
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
