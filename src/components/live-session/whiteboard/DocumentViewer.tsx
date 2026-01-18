import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  FileText,
  Send,
  GripVertical
} from 'lucide-react';
import { PDFDocument } from './types';

interface DocumentViewerProps {
  document: PDFDocument | null;
  onClose: () => void;
  onSendToCanvas: (imageData: string) => void;
  isOpen: boolean;
}

export function DocumentViewer({
  document,
  onClose,
  onSendToCanvas,
  isOpen
}: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    if (document) {
      setCurrentPage(prev => Math.min(document.pageCount, prev + 1));
    }
  }, [document]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(200, prev + 25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(50, prev - 25));
  }, []);

  const handleSendToCanvas = useCallback(() => {
    if (document && document.pageImages[currentPage - 1]) {
      onSendToCanvas(document.pageImages[currentPage - 1]);
    }
  }, [document, currentPage, onSendToCanvas]);

  if (!isOpen || !document) {
    return null;
  }

  const currentPageImage = document.pageImages[currentPage - 1];

  return (
    <div className="absolute left-0 top-0 bottom-0 w-[380px] z-40 flex flex-col bg-background/95 backdrop-blur-xl border-r border-border shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/50">
        <FileText className="w-4 h-4 text-primary" />
        <span className="flex-1 text-sm font-medium truncate" title={document.name}>
          {document.name}
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={handleSendToCanvas}
        >
          <Send className="h-3.5 w-3.5" />
          Send to Canvas
        </Button>
      </div>

      {/* Page View */}
      <ScrollArea className="flex-1">
        <div className="p-4 flex items-center justify-center min-h-full">
          {currentPageImage ? (
            <img
              src={currentPageImage}
              alt={`Page ${currentPage}`}
              className="max-w-full shadow-lg rounded-lg border border-border"
              style={{
                width: `${zoom}%`,
                transition: 'width 0.2s ease',
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground py-20">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">Loading page...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Page Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <span className="text-sm font-medium">
          Page {currentPage} of {document.pageCount}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage >= document.pageCount}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Page Thumbnails */}
      {document.pageCount > 1 && (
        <div className="border-t border-border">
          <ScrollArea className="h-24">
            <div className="flex gap-2 p-3">
              {document.pageImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={cn(
                    'flex-shrink-0 w-14 h-18 rounded border-2 overflow-hidden transition-all',
                    currentPage === index + 1
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <img
                    src={img}
                    alt={`Page ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}