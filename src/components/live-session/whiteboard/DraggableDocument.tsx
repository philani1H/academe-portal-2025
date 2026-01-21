import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  X, 
  GripHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Maximize2, 
  Minimize2 
} from 'lucide-react';
import { CanvasDocument } from './types';
import { Button } from '@/components/ui/button';

interface DraggableDocumentProps {
  doc: CanvasDocument;
  onUpdate: (id: string, updates: Partial<CanvasDocument>) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isStudent?: boolean;
}

export function DraggableDocument({ 
  doc, 
  onUpdate, 
  onDelete, 
  isSelected, 
  onSelect,
  isStudent
}: DraggableDocumentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const docRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // Shared Drag Logic
  const handleDragStart = (clientX: number, clientY: number) => {
    if (isFullscreen) return;
    onSelect(doc.id);
    
    const rect = docRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
    }
    setIsDragging(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    e.preventDefault();
    e.stopPropagation();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    e.stopPropagation();
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const moveDoc = (clientX: number, clientY: number) => {
      const parent = docRef.current?.parentElement;
      if (!parent) return;
      
      const parentRect = parent.getBoundingClientRect();
      const newX = clientX - parentRect.left - dragOffset.x;
      const newY = clientY - parentRect.top - dragOffset.y;
      
      const minX = -doc.width + 50;
      const minY = -doc.height + 50;
      const maxX = parentRect.width - 50;
      const maxY = parentRect.height - 50;

      onUpdate(doc.id, {
        x: Math.max(minX, Math.min(newX, maxX)),
        y: Math.max(minY, Math.min(newY, maxY)),
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      moveDoc(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); 
      const touch = e.touches[0];
      moveDoc(touch.clientX, touch.clientY);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset, doc.id, doc.width, doc.height, onUpdate]);

  // Shared Resize Logic
  const startResize = (clientX: number, clientY: number) => {
    setIsResizing(true);
    resizeStartRef.current = {
      x: clientX,
      y: clientY,
      width: doc.width,
      height: doc.height
    };
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startResize(e.clientX, e.clientY);
  };

  const handleResizeTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    startResize(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    if (!isResizing) return;

    const resizeDoc = (clientX: number, clientY: number) => {
      if (!resizeStartRef.current) return;
      
      const dx = clientX - resizeStartRef.current.x;
      const dy = clientY - resizeStartRef.current.y;
      
      const newWidth = Math.max(200, resizeStartRef.current.width + dx);
      const newHeight = Math.max(150, resizeStartRef.current.height + dy);

      onUpdate(doc.id, {
        width: newWidth,
        height: newHeight
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      resizeDoc(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      resizeDoc(touch.clientX, touch.clientY);
    };

    const handleEnd = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isResizing, doc.id, onUpdate]);

  // Page Navigation
  const handlePrevPage = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (doc.currentPage > 1) {
      onUpdate(doc.id, { currentPage: doc.currentPage - 1 });
    }
  };

  const handleNextPage = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (doc.currentPage < doc.pages.length) {
      onUpdate(doc.id, { currentPage: doc.currentPage + 1 });
    }
  };

  // Download
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (doc.fileUrl) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.title || 'document.pdf';
      link.target = '_blank';
      link.click();
    }
  };

  return (
    <div
      ref={docRef}
      className={cn(
        'absolute bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden transition-shadow',
        isFullscreen ? 'fixed inset-4 z-[100] w-auto h-auto !transform-none !left-4 !top-4 !right-4 !bottom-4' : 'absolute',
        isDragging && 'shadow-2xl cursor-move',
        isSelected && !isFullscreen && 'ring-2 ring-primary ring-offset-1'
      )}
      style={!isFullscreen ? {
        left: doc.x,
        top: doc.y,
        width: doc.width,
        height: doc.height,
        zIndex: isSelected || isDragging ? 50 : 10,
      } : {}}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <GripHorizontal className="w-4 h-4 text-gray-400 cursor-move" />
          <span className="text-sm font-medium truncate max-w-[150px]" title={doc.title}>
            {doc.title}
          </span>
        </div>
        <div className="flex items-center gap-1 no-drag">
          {isStudent && doc.fileUrl && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDownload} title="Download">
              <Download className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={(e) => { e.stopPropagation(); setIsFullscreen(!isFullscreen); }}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
          {!isStudent && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 hover:bg-red-100 hover:text-red-600" 
              onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-100 overflow-hidden relative group">
        <img 
          src={doc.pages[doc.currentPage - 1]} 
          alt={`Page ${doc.currentPage}`} 
          className="w-full h-full object-contain pointer-events-none select-none"
        />
        
        {/* Navigation Overlay */}
        {doc.pages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity no-drag">
            <button 
              onClick={handlePrevPage}
              disabled={doc.currentPage <= 1}
              className="p-1 hover:bg-white/20 rounded-full disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium whitespace-nowrap">
              {doc.currentPage} / {doc.pages.length}
            </span>
            <button 
              onClick={handleNextPage}
              disabled={doc.currentPage >= doc.pages.length}
              className="p-1 hover:bg-white/20 rounded-full disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      {!isFullscreen && (
        <div 
          className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize no-drag flex items-end justify-end p-1 touch-none"
          onMouseDown={handleResizeMouseDown}
          onTouchStart={handleResizeTouchStart}
        >
          <div className="w-4 h-4 bg-gray-400 rounded-sm opacity-50 hover:opacity-100" />
        </div>
      )}
    </div>
  );
}
