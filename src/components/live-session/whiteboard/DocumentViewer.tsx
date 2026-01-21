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
  SendToBack,
  Layers,
  Download,
} from 'lucide-react';
import { PDFDocument } from './types';

interface DocumentViewerProps {
  document: PDFDocument | null;
  onClose: () => void;
  onSendPageToCanvas: (imageData: string) => void;
  onSendFullDocumentToCanvas: (document: PDFDocument) => void;
  onDownload: () => void;
  isOpen: boolean;
  isStudent?: boolean;
}

export function DocumentViewer({ 
  document, 
  onClose, 
  onSendPageToCanvas,
  onSendFullDocumentToCanvas,
  onDownload,
  isOpen,
  isStudent = false,
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

  const handleSendPageToCanvas = useCallback(() => {
    if (document && document.pageImages[currentPage - 1]) {
      onSendPageToCanvas(document.pageImages[currentPage - 1]);
    }
  }, [document, currentPage, onSendPageToCanvas]);

  const handleSendFullDocument = useCallback(() => {
    if (document) {
      onSendFullDocumentToCanvas(document);
      onClose();
    }
  }, [document, onSendFullDocumentToCanvas, onClose]);

  if (!isOpen || !document) {
    return null;
  }

  const currentPageImage = document.pageImages[currentPage - 1];

  return (
    <div className="absolute left-0 top-0 bottom-0 w-full sm:w-[380px] z-40 flex flex-col bg-background/95 backdrop-blur-xl border-r border-border shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-border bg-card/50">
        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="flex-1 text-sm font-medium truncate" title={document.name}>
          {document.name}
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-border bg-muted/30">
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
          <span className="text-xs font-medium w-10 text-center">{zoom}%</span>
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
        
        {isStudent && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={onDownload}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 px-3 sm:px-4 py-2 border-b border-border bg-muted/20">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 gap-1.5 text-xs"
          onClick={handleSendPageToCanvas}
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">Send Page</span>
          <span className="xs:hidden">Page</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          className="flex-1 gap-1.5 text-xs"
          onClick={handleSendFullDocument}
        >
          <Layers className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">Full Document</span>
          <span className="xs:hidden">Full Doc</span>
        </Button>
      </div>

      {/* Page View */}
      <ScrollArea className="flex-1">
        <div className="p-3 sm:p-4 flex items-center justify-center min-h-full">
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
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-t border-border bg-card/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="gap-1 h-8 px-2 sm:px-3"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </Button>
        <span className="text-sm font-medium">
          {currentPage} / {document.pageCount}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage >= document.pageCount}
          className="gap-1 h-8 px-2 sm:px-3"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Page Thumbnails */}
      {document.pageCount > 1 && (
        <div className="border-t border-border">
          <ScrollArea className="h-20 sm:h-24">
            <div className="flex gap-2 p-2 sm:p-3">
              {document.pageImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={cn(
                    'flex-shrink-0 w-12 h-16 sm:w-14 sm:h-18 rounded border-2 overflow-hidden transition-all',
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
