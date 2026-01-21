import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Toolbar } from './Toolbar';
import { Canvas } from './Canvas';
import { MathDialog } from './MathDialog';
import { DocumentViewer } from './DocumentViewer';
import { CanvasDocument } from './CanvasDocument';
import { StickyNote } from './StickyNote';
import { TextInput } from './TextInput';
import { LaserPointer } from './LaserPointer';
import { RecordingControls } from './RecordingControls';
import { useCanvas } from './hooks/useCanvas';
import { useRecording } from './useRecording';
import { DrawTool, ShapeType, StickyNote as StickyNoteType, PDFDocument, STICKY_COLORS } from './types';
import { toast } from 'sonner';
import katex from 'katex';
import html2canvas from 'html2canvas';
import { pdfjs } from 'react-pdf';
import 'katex/dist/katex.min.css';
import { Socket } from 'socket.io-client';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface WhiteboardProps {
  sessionId?: string;
  onClose?: () => void;
  className?: string;
  isStudent?: boolean;
  onToggleRecording?: () => void;
  isRecordingActive?: boolean;
  socket?: Socket;
}

export function Whiteboard({ 
  sessionId, 
  onClose, 
  className, 
  isStudent = false,
  onToggleRecording,
  isRecordingActive,
  socket
}: WhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<DrawTool>('pen');
  const [color, setColor] = useState('#1e1e1e');
  const [lineWidth, setLineWidth] = useState(4);
  const [opacity, setOpacity] = useState(1);
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle');
  const [isMathDialogOpen, setIsMathDialogOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<PDFDocument | null>(null);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  const [canvasDocuments, setCanvasDocuments] = useState<PDFDocument[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteType[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);
  const [documentCounter, setDocumentCounter] = useState(0);

  // Recording hook (Local fallback if no external control provided)
  const localRecording = useRecording({ containerRef });
  
  // Use external props if provided, otherwise local state
  const isRecording = isRecordingActive !== undefined ? isRecordingActive : localRecording.isRecording;
  const startRecording = onToggleRecording || localRecording.startRecording;
  const stopRecording = onToggleRecording || localRecording.stopRecording;
  const isPaused = isRecordingActive !== undefined ? false : localRecording.isPaused; // External pause not supported yet
  const formattedDuration = isRecordingActive !== undefined ? (isRecordingActive ? "REC" : "00:00:00") : localRecording.formattedDuration;
  const hasRecording = isRecordingActive !== undefined ? false : localRecording.hasRecording;

  const handleRecordingAction = () => {
    if (onToggleRecording) {
      onToggleRecording();
    } else {
      if (isRecording) {
        localRecording.stopRecording();
      } else {
        localRecording.startRecording();
      }
    }
  };

  const handleDraw = useCallback((action: any) => {
    if (socket && sessionId) {
      socket.emit('whiteboard-action', { sessionId, action });
    }
  }, [socket, sessionId]);

  const {
    canvasRef,
    overlayCanvasRef,
    isDrawing,
    canUndo,
    canRedo,
    scale,
    startDrawing,
    draw,
    stopDrawingWithPoint,
    clearCanvas,
    addImage,
    drawText,
    drawRemoteAction,
    undo,
    redo,
    exportCanvas,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useCanvas({
    tool,
    color,
    lineWidth,
    opacity,
    selectedShape,
    onDraw: handleDraw
  });

  const handleStickyUpdate = useCallback((id: string, updates: Partial<StickyNoteType>) => {
    setStickyNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    handleDraw({ type: 'sticky-update', id, updates });
  }, [handleDraw]);

  const handleStickyDelete = useCallback((id: string) => {
    setStickyNotes(prev => prev.filter(n => n.id !== id));
    handleDraw({ type: 'sticky-delete', id });
  }, [handleDraw]);

  useEffect(() => {
    if (!socket) return;

    const onWhiteboardAction = (data: { action: any }) => {
      const { action } = data;
      switch (action.type) {
        case 'sticky-add':
          setStickyNotes(prev => [...prev, action.note]);
          break;
        case 'sticky-update':
          setStickyNotes(prev => prev.map(n => n.id === action.id ? { ...n, ...action.updates } : n));
          break;
        case 'sticky-delete':
          setStickyNotes(prev => prev.filter(n => n.id !== action.id));
          break;
        case 'doc-add':
          setCanvasDocuments(prev => [...prev, action.doc]);
          break;
        case 'doc-remove':
          setCanvasDocuments(prev => prev.filter(d => d.id !== action.id));
          break;
        case 'clear':
          drawRemoteAction(action);
          setStickyNotes([]);
          setCanvasDocuments([]);
          setDocumentCounter(0);
          break;
        default:
          drawRemoteAction(action);
      }
    };

    socket.on('whiteboard-action', onWhiteboardAction);
    
    // Request history
    socket.emit('whiteboard-request-history', { sessionId });

    const onHistory = (history: any[]) => {
       if (Array.isArray(history)) {
         history.forEach(action => {
            // Re-use the same logic
            onWhiteboardAction({ action });
         });
       }
    };
    socket.on('whiteboard-history', onHistory);

    return () => {
      socket.off('whiteboard-action', onWhiteboardAction);
      socket.off('whiteboard-history', onHistory);
    };
  }, [socket, drawRemoteAction, sessionId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isStudent) return;
      if (e.key === 'v' || e.key === 'V') setTool('select');
      if (e.key === 'p' || e.key === 'P') setTool('pen');
      if (e.key === 'h' || e.key === 'H') setTool('highlighter');
      if (e.key === 'e' || e.key === 'E') setTool('eraser');
      if (e.key === 't' || e.key === 'T') setTool('text');
      if (e.key === 's' || e.key === 'S') setTool('shape');
      if (e.key === 'n' || e.key === 'N') setTool('sticky');
      if (e.key === 'l' || e.key === 'L') setTool('laser');
      if (e.key === 'r' || e.key === 'R') {
        if (!isRecording) startRecording();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, isRecording, startRecording]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      addImage(event.target?.result as string);
      toast.success('Image added');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [addImage]);

  const handlePdfUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Processing PDF...');
    try {
      const uri = URL.createObjectURL(file);
      const pdf = await pdfjs.getDocument(uri).promise;
      const pageImages: string[] = [];
      
      for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        if (ctx) {
          await (page.render({ canvasContext: ctx, viewport, canvas: tempCanvas } as any).promise);
          pageImages.push(tempCanvas.toDataURL('image/png'));
        }
      }
      
      setCurrentDocument({
        id: crypto.randomUUID(),
        name: file.name,
        pageCount: pdf.numPages,
        currentPage: 1,
        pageImages,
        originalFile: file,
      });
      setIsDocViewerOpen(true);
      toast.success(`PDF loaded (${pdf.numPages} pages)`, { id: toastId });
      URL.revokeObjectURL(uri);
    } catch (error) {
      console.error('PDF error:', error);
      toast.error('Failed to process PDF', { id: toastId });
    }
    e.target.value = '';
  }, []);

  const handleMathInsert = useCallback(async (latex: string) => {
    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;left:-9999px;padding:24px;background:white;font-size:32px';
    document.body.appendChild(container);
    try {
      katex.render(latex, container, { throwOnError: false, displayMode: true });
      const canvas = await html2canvas(container, { backgroundColor: '#ffffff', scale: 2 });
      addImage(canvas.toDataURL('image/png'));
      toast.success('Equation added');
    } finally {
      document.body.removeChild(container);
    }
  }, [addImage]);

  const handleSendPageToCanvas = useCallback((imageData: string) => {
    addImage(imageData);
    toast.success('Page added to canvas');
  }, [addImage]);

  const handleSendFullDocumentToCanvas = useCallback((doc: PDFDocument) => {
    // Position documents in a cascade pattern
    const offset = documentCounter * 30;
    setDocumentCounter(prev => prev + 1);
    
    const newDoc = { 
      ...doc, 
      id: crypto.randomUUID(),
    };

    setCanvasDocuments(prev => [...prev, newDoc]);
    
    // Omit originalFile for socket
    const { originalFile, ...docToSend } = newDoc;
    handleDraw({ type: 'doc-add', doc: docToSend });

    toast.success('Document added - drag header to move, corner to resize, double-click for fullscreen');
  }, [documentCounter, handleDraw]);

  const handleRemoveCanvasDocument = useCallback((docId: string) => {
    setCanvasDocuments(prev => prev.filter(d => d.id !== docId));
    handleDraw({ type: 'doc-remove', id: docId });
  }, [handleDraw]);

  const handleDownloadDocument = useCallback(() => {
    if (currentDocument?.originalFile) {
      const url = URL.createObjectURL(currentDocument.originalFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = currentDocument.name;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } else if (currentDocument?.pageImages.length) {
      // Fallback: download first page as image
      const link = document.createElement('a');
      link.href = currentDocument.pageImages[0];
      link.download = `${currentDocument.name.replace('.pdf', '')}-page1.png`;
      link.click();
      toast.success('First page downloaded as image');
    }
  }, [currentDocument]);

  const handleDownloadCanvasDocument = useCallback((doc: PDFDocument) => {
    if (doc.originalFile) {
      const url = URL.createObjectURL(doc.originalFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } else if (doc.pageImages.length) {
      const link = document.createElement('a');
      link.href = doc.pageImages[0];
      link.download = `${doc.name.replace('.pdf', '')}-page1.png`;
      link.click();
      toast.success('First page downloaded as image');
    }
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (tool === 'text') {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setTextInputPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else if (tool === 'sticky') {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const newNote: StickyNoteType = {
        id: crypto.randomUUID(),
        x: e.clientX - rect.left - 75,
        y: e.clientY - rect.top - 50,
        width: 150,
        height: 100,
        content: '',
        color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
      };
      setStickyNotes(prev => [...prev, newNote]);
      setSelectedNoteId(newNote.id);
      handleDraw({ type: 'sticky-add', note: newNote });
    }
  }, [tool, handleDraw]);

  const handleTextSubmit = useCallback((text: string, x: number, y: number) => {
    drawText(text, x, y, 18);
    setTextInputPos(null);
  }, [drawText]);

  const handleExport = useCallback(() => {
    const dataUrl = exportCanvas('png');
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `whiteboard-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Exported');
    }
  }, [exportCanvas]);

  const handleClear = useCallback(() => {
    if (confirm('Clear the canvas?')) {
      clearCanvas();
      setStickyNotes([]);
      setCanvasDocuments([]);
      setDocumentCounter(0);
    }
  }, [clearCanvas]);

  return (
    <div ref={containerRef} className={cn('flex flex-col w-full h-full bg-canvas overflow-hidden', className)}>
      
      {/* Top Controls Bar */}
      <div className="flex-none z-50 relative pointer-events-none">
        {/* Mobile Layout Wrapper */}
        {!isStudent && (
          <div className="sm:hidden flex flex-col pointer-events-auto bg-slate-900/80 backdrop-blur-md border-b border-white/10">
            <Toolbar
              tool={tool}
              color={color}
              lineWidth={lineWidth}
              opacity={opacity}
              canUndo={canUndo}
              canRedo={canRedo}
              scale={scale}
              onToolChange={setTool}
              onColorChange={setColor}
              onLineWidthChange={setLineWidth}
              onOpacityChange={setOpacity}
              onUndo={undo}
              onRedo={redo}
              onClear={handleClear}
              onExport={handleExport}
              onImageUpload={handleImageUpload}
              onPdfUpload={handlePdfUpload}
              onMathInsert={() => setIsMathDialogOpen(true)}
              selectedShape={selectedShape}
              onShapeChange={setSelectedShape}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onResetZoom={resetZoom}
            />
            <div className="p-2 flex justify-center border-t border-white/5">
              <RecordingControls
                isRecording={isRecording}
                isPaused={isPaused}
                hasRecording={hasRecording}
                formattedDuration={formattedDuration}
                onStart={handleRecordingAction}
                onPause={isRecordingActive !== undefined ? () => {} : localRecording.pauseRecording}
                onResume={isRecordingActive !== undefined ? () => {} : localRecording.resumeRecording}
                onStop={handleRecordingAction}
                onDownload={() => isRecordingActive === undefined && localRecording.downloadRecording()}
                onDiscard={isRecordingActive !== undefined ? () => {} : localRecording.discardRecording}
              />
            </div>
          </div>
        )}

        {/* Desktop Layout Wrapper */}
        {!isStudent && (
          <div className="hidden sm:flex items-start justify-center p-4 relative w-full">
            <div className="pointer-events-auto">
              <Toolbar
                tool={tool}
                color={color}
                lineWidth={lineWidth}
                opacity={opacity}
                canUndo={canUndo}
                canRedo={canRedo}
                scale={scale}
                onToolChange={setTool}
                onColorChange={setColor}
                onLineWidthChange={setLineWidth}
                onOpacityChange={setOpacity}
                onUndo={undo}
                onRedo={redo}
                onClear={handleClear}
                onExport={handleExport}
                onImageUpload={handleImageUpload}
                onPdfUpload={handlePdfUpload}
                onMathInsert={() => setIsMathDialogOpen(true)}
                selectedShape={selectedShape}
                onShapeChange={setSelectedShape}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onResetZoom={resetZoom}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace */}
      <div className="flex-1 relative w-full overflow-hidden">
        {/* Desktop Recording Controls - Bottom Right */}
        {!isStudent && (
          <div className="hidden sm:block absolute right-4 bottom-4 pointer-events-auto z-50">
            <RecordingControls
              isRecording={isRecording}
              isPaused={isPaused}
              hasRecording={hasRecording}
              formattedDuration={formattedDuration}
              onStart={handleRecordingAction}
              onPause={isRecordingActive !== undefined ? () => {} : localRecording.pauseRecording}
              onResume={isRecordingActive !== undefined ? () => {} : localRecording.resumeRecording}
              onStop={handleRecordingAction}
              onDownload={() => isRecordingActive === undefined && localRecording.downloadRecording()}
              onDiscard={isRecordingActive !== undefined ? () => {} : localRecording.discardRecording}
            />
          </div>
        )}

        <div className="absolute inset-0 canvas-grid opacity-50" />
        
        <DocumentViewer
          document={currentDocument}
          onClose={() => setIsDocViewerOpen(false)}
          onSendPageToCanvas={handleSendPageToCanvas}
          onSendFullDocumentToCanvas={handleSendFullDocumentToCanvas}
          onDownload={handleDownloadDocument}
          isOpen={isDocViewerOpen}
          isStudent={isStudent}
        />

        <div className={cn('absolute inset-0', isDocViewerOpen && 'sm:left-[380px]')}>
          <Canvas
            ref={canvasRef}
            tool={tool}
            scale={scale}
            onMouseDown={!isStudent ? startDrawing : undefined}
            onMouseMove={!isStudent ? draw : undefined}
            onMouseUp={!isStudent ? stopDrawingWithPoint : undefined}
            onTouchStart={!isStudent ? startDrawing : undefined}
            onTouchMove={!isStudent ? draw : undefined}
            onTouchEnd={!isStudent ? stopDrawingWithPoint : undefined}
            onClick={!isStudent ? handleCanvasClick : undefined}
            overlayRef={overlayCanvasRef}
          />

          {/* Canvas Documents (draggable, resizable) */}
          {canvasDocuments.map((doc, index) => (
            <CanvasDocument
              key={doc.id}
              document={doc}
              onClose={() => handleRemoveCanvasDocument(doc.id)}
              onDownload={() => handleDownloadCanvasDocument(doc)}
              isStudent={isStudent}
              initialPosition={{ x: 80 + index * 30, y: 80 + index * 30 }}
            />
          ))}

          {stickyNotes.map(note => (
            <StickyNote
              key={note.id}
              note={note}
              isSelected={selectedNoteId === note.id}
              onSelect={setSelectedNoteId}
              onUpdate={handleStickyUpdate}
              onDelete={handleStickyDelete}
              readOnly={isStudent}
            />
          ))}

          {textInputPos && (
            <TextInput
              x={textInputPos.x}
              y={textInputPos.y}
              color={color}
              fontSize={18}
              onSubmit={handleTextSubmit}
              onCancel={() => setTextInputPos(null)}
            />
          )}
        </div>

        <LaserPointer isActive={tool === 'laser'} color="#ef4444" />

        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground glass px-3 py-1.5 rounded-lg hidden sm:flex items-center gap-3">
          <span>Tool: <span className="text-foreground font-medium capitalize">{tool}</span></span>
          {isRecording && (
            <span className="text-destructive font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              REC
            </span>
          )}
        </div>

        <MathDialog open={isMathDialogOpen} onOpenChange={setIsMathDialogOpen} onInsert={handleMathInsert} />
      </div>
    </div>
  );
}
