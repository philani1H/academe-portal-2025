import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Toolbar } from './Toolbar';
import { Canvas } from './Canvas';
import { MathDialog } from './MathDialog';
import { DocumentViewer } from './DocumentViewer';
import { StickyNote } from './StickyNote';
import { TextInput } from './TextInput';
import { LaserPointer } from './LaserPointer';
import { useCanvas } from './hooks/useCanvas';
import { DraggableDocument } from './DraggableDocument';
import { DrawTool, ShapeType, StickyNote as StickyNoteType, PDFDocument, STICKY_COLORS, CanvasDocument } from './types';
import { toast } from 'sonner';
import katex from 'katex';
import html2canvas from 'html2canvas';
import { pdfjs } from 'react-pdf';
import 'katex/dist/katex.min.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import { Socket } from 'socket.io-client';

interface WhiteboardProps {
  sessionId?: string;
  onClose?: () => void;
  className?: string;
  socket?: Socket | null;
  isTutor?: boolean;
}

export function Whiteboard({ sessionId, onClose, className, socket, isTutor }: WhiteboardProps) {
  const [tool, setTool] = useState<DrawTool>('pen');
  const [color, setColor] = useState('#1e1e1e');
  const [lineWidth, setLineWidth] = useState(4);
  const [opacity, setOpacity] = useState(1);
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle');
  const [isMathDialogOpen, setIsMathDialogOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<PDFDocument | null>(null);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteType[]>([]);
  const [documents, setDocuments] = useState<CanvasDocument[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);

  const handleDraw = useCallback((action: any) => {
    if (socket && sessionId) {
      socket.emit('whiteboard-draw', { sessionId, action });
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
    undo,
    redo,
    exportCanvas,
    zoomIn,
    zoomOut,
    resetZoom,
    drawRemote,
  } = useCanvas({
    tool,
    color,
    lineWidth,
    opacity,
    selectedShape,
    onDraw: handleDraw,
  });

  const handleSendDocument = useCallback((doc: CanvasDocument) => {
    // Ensure currentPage is 1-based as DraggableDocument expects 1-based index for display but array access is 0-based
    // DraggableDocument: src={doc.pages[doc.currentPage - 1]}
    // DocumentViewer sends 0-based index? Let's check.
    // In DocumentViewer I set currentPage: 0.
    // So if I set currentPage: 1 here, it matches DraggableDocument expectation.
    const newDoc = { ...doc, currentPage: 1 };
    
    setDocuments(prev => [...prev, newDoc]);
    if (socket && sessionId) {
      socket.emit('whiteboard-doc-add', { sessionId, doc: newDoc });
    }
    setIsDocViewerOpen(false);
  }, [socket, sessionId]);

  const handleUpdateDocument = useCallback((id: string, updates: Partial<CanvasDocument>) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    if (socket && sessionId) {
      socket.emit('whiteboard-doc-update', { sessionId, docId: id, updates });
    }
  }, [socket, sessionId]);

  const handleDeleteDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (socket && sessionId) {
      socket.emit('whiteboard-doc-delete', { sessionId, docId: id });
    }
  }, [socket, sessionId]);

  useEffect(() => {
    if (!socket || !sessionId) return;

    // Request history on mount
    socket.emit('get-whiteboard-history', { sessionId });

    const handleRemoteDraw = ({ action }: { action: any }) => {
      drawRemote(action);
    };

    const handleHistory = ({ history, documents: historyDocs }: { history: any[], documents?: CanvasDocument[] }) => {
        if (Array.isArray(history)) {
            history.forEach(item => {
                if (item.action) {
                    drawRemote(item.action);
                }
            });
        }
        if (Array.isArray(historyDocs)) {
          setDocuments(historyDocs);
        }
    };

    const handleDocAdd = ({ doc }: { doc: CanvasDocument }) => {
      setDocuments(prev => {
        if (prev.some(d => d.id === doc.id)) return prev;
        return [...prev, doc];
      });
    };

    const handleDocUpdate = ({ docId, updates }: { docId: string, updates: Partial<CanvasDocument> }) => {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...updates } : d));
    };

    const handleDocDelete = ({ docId }: { docId: string }) => {
      setDocuments(prev => prev.filter(d => d.id !== docId));
    };

    socket.on('whiteboard-draw', handleRemoteDraw);
    socket.on('whiteboard-history', handleHistory);
    socket.on('whiteboard-doc-add', handleDocAdd);
    socket.on('whiteboard-doc-update', handleDocUpdate);
    socket.on('whiteboard-doc-delete', handleDocDelete);

    return () => {
      socket.off('whiteboard-draw', handleRemoteDraw);
      socket.off('whiteboard-history', handleHistory);
      socket.off('whiteboard-doc-add', handleDocAdd);
      socket.off('whiteboard-doc-update', handleDocUpdate);
      socket.off('whiteboard-doc-delete', handleDocDelete);
    };
  }, [socket, sessionId, drawRemote]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'v' || e.key === 'V') setTool('select');
      if (e.key === 'p' || e.key === 'P') setTool('pen');
      if (e.key === 'h' || e.key === 'H') setTool('highlighter');
      if (e.key === 'e' || e.key === 'E') setTool('eraser');
      if (e.key === 't' || e.key === 'T') setTool('text');
      if (e.key === 's' || e.key === 'S') setTool('shape');
      if (e.key === 'n' || e.key === 'N') setTool('sticky');
      if (e.key === 'l' || e.key === 'L') setTool('laser');
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

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
      // Attempt to upload file for persistence (so students can download)
      let fileUrl = '';
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          // Use relative path assuming proxy or same-origin
          const res = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
          
          if (res.ok) {
            const data = await res.json();
            // Ensure full URL if relative
            fileUrl = data.url.startsWith('http') ? data.url : `http://localhost:3000${data.url}`;
          }
        } catch (uploadError) {
          console.warn('File upload failed, download will not be available for students:', uploadError);
        }
      }

      const uri = URL.createObjectURL(file);
      const pdf = await pdfjs.getDocument(uri).promise;
      const pageImages: string[] = [];
      
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
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
        fileUrl: fileUrl || undefined
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
    }
  }, [tool]);

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
      setDocuments([]);
      if (socket && sessionId) {
        socket.emit('whiteboard-clear', { sessionId });
      }
    }
  }, [clearCanvas, socket, sessionId]);

  return (
    <div className={cn('relative w-full h-full bg-canvas overflow-hidden', className)}>
      <div className="absolute inset-0 canvas-grid opacity-50" />
      
      <DocumentViewer
        document={currentDocument}
        onClose={() => setIsDocViewerOpen(false)}
        onSendToCanvas={addImage}
        onSendDocument={handleSendDocument}
        isOpen={isDocViewerOpen}
      />

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

      <div className={cn('absolute inset-0', isDocViewerOpen && 'left-[380px]')}>
        <Canvas
          ref={canvasRef}
          tool={tool}
          scale={scale}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawingWithPoint}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawingWithPoint}
          onClick={handleCanvasClick}
          overlayRef={overlayCanvasRef}
        />

        {documents.map(doc => (
          <DraggableDocument
            key={doc.id}
            doc={doc}
            onUpdate={handleUpdateDocument}
            onDelete={handleDeleteDocument}
            isSelected={selectedDocId === doc.id}
            onSelect={setSelectedDocId}
            isStudent={!isTutor}
          />
        ))}

        {stickyNotes.map(note => (
          <StickyNote
            key={note.id}
            note={note}
            isSelected={selectedNoteId === note.id}
            onSelect={setSelectedNoteId}
            onUpdate={(id, updates) => setStickyNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))}
            onDelete={(id) => setStickyNotes(prev => prev.filter(n => n.id !== id))}
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

      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground glass px-3 py-1.5 rounded-lg">
        Tool: <span className="text-foreground font-medium capitalize">{tool}</span>
      </div>

      <MathDialog open={isMathDialogOpen} onOpenChange={setIsMathDialogOpen} onInsert={handleMathInsert} />
    </div>
  );
}
