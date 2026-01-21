import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, GripHorizontal } from 'lucide-react';
import { StickyNote as StickyNoteType, STICKY_COLORS } from './types';

interface StickyNoteProps {
  note: StickyNoteType;
  onUpdate: (id: string, updates: Partial<StickyNoteType>) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
  readOnly?: boolean;
}

export function StickyNote({ 
  note, 
  onUpdate, 
  onDelete, 
  isSelected, 
  onSelect,
  readOnly = false
}: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly) return;
    if (e.target === textareaRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    onSelect(note.id);
    
    const rect = noteRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging || readOnly) return;

    const handleMouseMove = (e: MouseEvent) => {
      const parent = noteRef.current?.parentElement;
      if (!parent) return;
      
      const parentRect = parent.getBoundingClientRect();
      const newX = e.clientX - parentRect.left - dragOffset.x;
      const newY = e.clientY - parentRect.top - dragOffset.y;
      
      onUpdate(note.id, {
        x: Math.max(0, Math.min(newX, parentRect.width - note.width)),
        y: Math.max(0, Math.min(newY, parentRect.height - note.height)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, note.id, note.width, note.height, onUpdate, readOnly]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleColorChange = (color: string) => {
    if (readOnly) return;
    onUpdate(note.id, { color });
  };

  return (
    <div
      ref={noteRef}
      className={cn(
        'absolute rounded-lg shadow-lg transition-shadow select-none',
        !readOnly && 'cursor-move',
        isDragging && 'shadow-2xl scale-105',
        isSelected && 'ring-2 ring-primary ring-offset-2'
      )}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        minHeight: note.height,
        backgroundColor: note.color,
        zIndex: isSelected || isDragging ? 100 : 50,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Header */}
      {!readOnly && (
      <div className="flex items-center justify-between px-2 py-1 cursor-move">
        <GripHorizontal className="w-4 h-4 text-gray-500/50" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="p-0.5 rounded hover:bg-black/10 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>
      )}

      {/* Content */}
      <div className={cn("px-3 pb-3", readOnly && "pt-3")}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={note.content}
            onChange={(e) => onUpdate(note.id, { content: e.target.value })}
            onBlur={handleBlur}
            className="w-full h-24 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400"
            placeholder="Type your note..."
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <p className="text-sm text-gray-800 min-h-[80px] whitespace-pre-wrap break-words">
            {note.content || 'Double-click to edit...'}
          </p>
        )}
      </div>

      {/* Color Picker (visible when selected and not readOnly) */}
      {isSelected && !readOnly && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-1 p-1.5 bg-white rounded-lg shadow-lg border border-gray-200">
          {STICKY_COLORS.map((color) => (
            <button
              key={color}
              onClick={(e) => {
                e.stopPropagation();
                handleColorChange(color);
              }}
              className={cn(
                'w-5 h-5 rounded-full transition-transform hover:scale-110',
                note.color === color && 'ring-2 ring-gray-400 ring-offset-1'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
