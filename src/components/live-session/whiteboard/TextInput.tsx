import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TextInputProps {
  x: number;
  y: number;
  color: string;
  fontSize: number;
  onSubmit: (text: string, x: number, y: number) => void;
  onCancel: () => void;
}

export function TextInput({ x, y, color, fontSize, onSubmit, onCancel }: TextInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) {
        onSubmit(text, x, y);
      } else {
        onCancel();
      }
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = () => {
    if (text.trim()) {
      onSubmit(text, x, y);
    } else {
      onCancel();
    }
  };

  return (
    <div
      className="absolute z-50"
      style={{ left: x, top: y }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn(
          'min-w-[200px] max-w-[400px] p-2 bg-white/90 backdrop-blur-sm',
          'border-2 border-primary rounded-lg shadow-lg',
          'outline-none resize-none font-sans'
        )}
        style={{
          color,
          fontSize: `${fontSize}px`,
          lineHeight: 1.4,
        }}
        placeholder="Type text..."
        rows={1}
      />
      <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
        Press Enter to confirm, Esc to cancel
      </div>
    </div>
  );
}
