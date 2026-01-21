import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Maximize2,
  Minimize2,
  GripVertical,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
} from 'lucide-react';
import { PDFDocument } from './types';

interface CanvasDocumentProps {
  document: PDFDocument;
  onClose: () => void;
  onDownload: () => void;
  isStudent?: boolean;
  initialPosition?: { x: number; y: number };
}

export function CanvasDocument({
  document,
  onClose,
  onDownload,
  isStudent = false,
  initialPosition,
}: CanvasDocumentProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [position, setPosition] = useState(initialPosition || { x: 80, y: 80 });
  const [size, setSize] = useState({ width: 420, height: 520 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [imageZoom, setImageZoom] = useState(100);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Pre-fullscreen state to restore
  const [preFullscreenState, setPreFullscreenState] = useState({ 
    position: { x: 80, y: 80 }, 
    size: { width: 420, height: 520 } 
  });

  // Handle page navigation
  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(document.pageCount, prev + 1));
  }, [document.pageCount]);

  // Image zoom controls
  const handleZoomIn = useCallback(() => {
    setImageZoom(prev => Math.min(prev + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setImageZoom(prev => Math.max(prev - 25, 50));
  }, []);

  const handleResetZoom = useCallback(() => {
    setImageZoom(100);
  }, []);

  // Handle dragging
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isFullscreen) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  }, [position, isFullscreen]);

  const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Allow dragging within viewport with some padding
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;
    
    setPosition({
      x: Math.max(-size.width + 100, Math.min(maxX, clientX - dragStart.x)),
      y: Math.max(0, Math.min(maxY, clientY - dragStart.y)),
    });
  }, [isDragging, dragStart, size.width]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle resizing from multiple corners
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, corner: string) => {
    if (isFullscreen) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setResizeStart({
      x: clientX,
      y: clientY,
      width: size.width,
      height: size.height,
    });
  }, [size, isFullscreen]);

  const handleResize = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - resizeStart.x;
    const deltaY = clientY - resizeStart.y;
    
    // Maintain minimum and maximum sizes
    const newWidth = Math.max(280, Math.min(window.innerWidth - position.x - 20, resizeStart.width + deltaX));
    const newHeight = Math.max(350, Math.min(window.innerHeight - position.y - 20, resizeStart.height + deltaY));
    
    setSize({ width: newWidth, height: newHeight });
  }, [isResizing, resizeStart, position]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      setPreFullscreenState({ position, size });
      setIsFullscreen(true);
      setIsMinimized(false);
    } else {
      setPosition(preFullscreenState.position);
      setSize(preFullscreenState.size);
      setIsFullscreen(false);
    }
  }, [isFullscreen, position, size, preFullscreenState]);

  // Toggle minimize (collapse to title bar)
  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
    if (isFullscreen) {
      setIsFullscreen(false);
      setPosition(preFullscreenState.position);
      setSize(preFullscreenState.size);
    }
  }, [isFullscreen, preFullscreenState]);

  // Double-click to toggle fullscreen
  const handleDoubleClick = useCallback(() => {
    toggleFullscreen();
  }, [toggleFullscreen]);

  // Global mouse/touch listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
      window.addEventListener('touchmove', handleResize, { passive: false });
      window.addEventListener('touchend', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
      window.removeEventListener('touchmove', handleResize);
      window.removeEventListener('touchend', handleResizeEnd);
    };
  }, [isResizing, handleResize, handleResizeEnd]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'ArrowRight') handleNextPage();
      if (e.key === 'Escape' && isFullscreen) toggleFullscreen();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevPage, handleNextPage, isFullscreen, toggleFullscreen, handleZoomIn, handleZoomOut]);

  const currentPageImage = document.pageImages[currentPage - 1];

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute z-50 flex flex-col bg-background/98 backdrop-blur-xl border-2 border-border rounded-xl shadow-2xl overflow-hidden',
        'transition-[left,top,width,height,inset] duration-200 ease-out',
        isFullscreen && 'inset-4 sm:inset-8 !w-auto !h-auto border-primary/50',
        isDragging && 'cursor-grabbing shadow-3xl scale-[1.01]',
        isResizing && 'transition-none',
        !isFullscreen && !isDragging && 'hover:shadow-3xl hover:border-primary/30',
      )}
      style={
        isFullscreen
          ? {}
          : {
              left: position.x,
              top: position.y,
              width: size.width,
              height: isMinimized ? 'auto' : size.height,
            }
      }
    >
      {/* Header - Drag Handle */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-muted/80 to-muted/40 border-b border-border select-none',
          !isFullscreen && 'cursor-grab active:cursor-grabbing'
        )}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onDoubleClick={handleDoubleClick}
      >
        {!isFullscreen && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Move className="w-4 h-4" />
          </div>
        )}
        <span className="flex-1 text-sm font-semibold truncate" title={document.name}>
          {document.name}
        </span>
        <div className="flex items-center gap-0.5">
          {/* Always show download for everyone */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            title="Download Document"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-primary/10"
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (Double-click header)'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          {!isStudent && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              title="Close Document"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Zoom Controls */}
          <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-muted/30 border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleZoomOut}
              disabled={imageZoom <= 50}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <button 
              onClick={handleResetZoom}
              className="text-xs font-medium w-12 text-center hover:text-primary transition-colors"
            >
              {imageZoom}%
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleZoomIn}
              disabled={imageZoom >= 200}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            {imageZoom !== 100 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleResetZoom}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Document Content */}
          <div 
            ref={contentRef}
            className="flex-1 overflow-auto p-3 sm:p-4 flex items-center justify-center bg-gradient-to-b from-muted/10 to-muted/30"
          >
            {currentPageImage ? (
              <img
                src={currentPageImage}
                alt={`Page ${currentPage}`}
                className="shadow-xl rounded-lg border border-border transition-transform duration-200"
                style={{ 
                  width: `${imageZoom}%`,
                  maxWidth: 'none',
                }}
                draggable={false}
                onDoubleClick={toggleFullscreen}
              />
            ) : (
              <div className="flex items-center justify-center text-muted-foreground">
                <div className="animate-pulse">Loading page...</div>
              </div>
            )}
          </div>

          {/* Footer - Page Navigation */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-muted/40 to-muted/80 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="gap-1 h-8 px-2 sm:px-3"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Prev</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">
                {currentPage}
              </span>
              <span className="text-xs text-muted-foreground">of {document.pageCount}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= document.pageCount}
              className="gap-1 h-8 px-2 sm:px-3"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {/* Resize Handle - Bottom Right */}
      {!isFullscreen && !isMinimized && (
        <div
          className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize touch-none group"
          onMouseDown={(e) => handleResizeStart(e, 'se')}
          onTouchStart={(e) => handleResizeStart(e, 'se')}
        >
          <svg
            className="w-4 h-4 absolute bottom-1.5 right-1.5 text-muted-foreground/40 group-hover:text-primary transition-colors"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22ZM10 22H8V20H10V22ZM18 14H16V12H18V14ZM14 18H12V16H14V18Z" />
          </svg>
        </div>
      )}

      {/* Edge resize handles */}
      {!isFullscreen && !isMinimized && (
        <>
          <div 
            className="absolute bottom-0 left-4 right-8 h-2 cursor-s-resize"
            onMouseDown={(e) => handleResizeStart(e, 's')}
            onTouchStart={(e) => handleResizeStart(e, 's')}
          />
          <div 
            className="absolute right-0 top-12 bottom-8 w-2 cursor-e-resize"
            onMouseDown={(e) => handleResizeStart(e, 'e')}
            onTouchStart={(e) => handleResizeStart(e, 'e')}
          />
        </>
      )}
    </div>
  );
}
