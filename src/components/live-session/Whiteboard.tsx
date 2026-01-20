import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil, Eraser, Trash2, Calculator, Image as ImageIcon, Type, Download, FileText, Undo, Redo, ZoomIn, ZoomOut, Square, Circle, Minus, ArrowRight, MousePointer2, Highlighter, Layers, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Socket } from 'socket.io-client'
import katex from 'katex'
import html2canvas from 'html2canvas'
import { pdfjs } from 'react-pdf'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import jsPDF from 'jspdf'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import 'katex/dist/katex.min.css'

interface WhiteboardProps {
  socket?: Socket
  sessionId: string
  onClose: () => void
  isTutor: boolean
}

type DrawTool = 'pen' | 'eraser' | 'highlighter' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'select'

interface DrawAction {
    type: 'draw' | 'shape' | 'text' | 'image' | 'clear'
    data: any
}

interface TextElement {
    id: string
    x: number
    y: number
    text: string
    fontSize: number
    color: string
}

export function Whiteboard({ socket, sessionId, onClose, isTutor }: WhiteboardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawTool, setDrawTool] = useState<DrawTool>('pen');
    const [drawColor, setDrawColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);
    const [history, setHistory] = useState<DrawAction[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [shapeStart, setShapeStart] = useState<{ x: number, y: number } | null>(null);
    const [textElements, setTextElements] = useState<TextElement[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pages, setPages] = useState<Record<number, ImageData>>({});

    // Math Dialog State
    const [isMathDialogOpen, setIsMathDialogOpen] = useState(false);
    const [mathInput, setMathInput] = useState('');

    // Text Dialog State
    const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [textPosition, setTextPosition] = useState<{ x: number, y: number } | null>(null);
    const [fontSize, setFontSize] = useState(24);

    // Color palette
    const colorPalette = [
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
        '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
        '#FFC0CB', '#A52A2A', '#808080', '#00FF7F', '#4B0082'
    ];

    // Save current page to history
    const savePageState = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setPages(prev => ({ ...prev, [currentPage]: imageData }));
    };

    // Load page from history
    const loadPageState = (pageNum: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (pages[pageNum]) {
            ctx.putImageData(pages[pageNum], 0, 0);
        }
    };

    // Resize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if(canvas) {
             const parent = canvas.parentElement;
             if(parent) {
                 canvas.width = parent.clientWidth;
                 canvas.height = parent.clientHeight;
             }
        }

        const handleResize = () => {
             if(canvas && canvas.parentElement) {
                 // Save current state
                 const tempCanvas = document.createElement('canvas');
                 tempCanvas.width = canvas.width;
                 tempCanvas.height = canvas.height;
                 const tempCtx = tempCanvas.getContext('2d');
                 tempCtx?.drawImage(canvas, 0, 0);

                 canvas.width = canvas.parentElement.clientWidth;
                 canvas.height = canvas.parentElement.clientHeight;

                 const ctx = canvas.getContext('2d');
                 ctx?.drawImage(tempCanvas, 0, 0);
             }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const getCoordinates = (e: MouseEvent | TouchEvent) => {
            const rect = canvas.getBoundingClientRect();
            if ('touches' in e && e.touches.length > 0) {
                return {
                    x: (e.touches[0].clientX - rect.left - pan.x) / zoom,
                    y: (e.touches[0].clientY - rect.top - pan.y) / zoom
                };
            } else if ('clientX' in e) {
                return {
                    x: (e.clientX - rect.left - pan.x) / zoom,
                    y: (e.clientY - rect.top - pan.y) / zoom
                };
            }
            return { x: 0, y: 0 };
        };

        const handleStart = (e: MouseEvent | TouchEvent) => {
            if (e.type === 'mousedown' && (e as MouseEvent).button !== 0) return;
            e.preventDefault();

            const { x, y } = getCoordinates(e);

            if (drawTool === 'text') {
                setTextPosition({ x, y });
                setIsTextDialogOpen(true);
                return;
            }

            if (drawTool === 'select') {
                setIsPanning(true);
                setPanStart({ x: (e as MouseEvent).clientX - pan.x, y: (e as MouseEvent).clientY - pan.y });
                return;
            }

            if (['rectangle', 'circle', 'line', 'arrow'].includes(drawTool)) {
                setShapeStart({ x, y });
                setIsDrawing(true);
                return;
            }

            setIsDrawing(true);
            ctx.beginPath();
            ctx.moveTo(x, y);
            socket?.emit('whiteboard-draw', { sessionId, type: 'start', x, y, color: drawColor, tool: drawTool, lineWidth: drawTool === 'eraser' ? 20 : drawTool === 'highlighter' ? lineWidth * 3 : lineWidth });
        };

        const handleMove = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();

            if (isPanning && drawTool === 'select') {
                const x = (e as MouseEvent).clientX;
                const y = (e as MouseEvent).clientY;
                setPan({ x: x - panStart.x, y: y - panStart.y });
                return;
            }

            if (!isDrawing) return;
            const { x, y } = getCoordinates(e);

            if (['rectangle', 'circle', 'line', 'arrow'].includes(drawTool) && shapeStart) {
                // Preview shape while drawing
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Redraw canvas from saved state
                if (pages[currentPage]) {
                    ctx.putImageData(pages[currentPage], 0, 0);
                }

                ctx.strokeStyle = drawColor;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                if (drawTool === 'rectangle') {
                    const width = x - shapeStart.x;
                    const height = y - shapeStart.y;
                    ctx.strokeRect(shapeStart.x, shapeStart.y, width, height);
                } else if (drawTool === 'circle') {
                    const radius = Math.sqrt(Math.pow(x - shapeStart.x, 2) + Math.pow(y - shapeStart.y, 2));
                    ctx.beginPath();
                    ctx.arc(shapeStart.x, shapeStart.y, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                } else if (drawTool === 'line') {
                    ctx.beginPath();
                    ctx.moveTo(shapeStart.x, shapeStart.y);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                } else if (drawTool === 'arrow') {
                    drawArrow(ctx, shapeStart.x, shapeStart.y, x, y);
                }
                return;
            }

            if (drawTool === 'pen' || drawTool === 'eraser' || drawTool === 'highlighter') {
                ctx.strokeStyle = drawTool === 'eraser' ? '#ffffff' : drawColor;
                ctx.lineWidth = drawTool === 'eraser' ? 20 : drawTool === 'highlighter' ? lineWidth * 3 : lineWidth;
                ctx.lineCap = 'round';
                ctx.globalAlpha = drawTool === 'highlighter' ? 0.3 : 1;
                ctx.lineTo(x, y);
                ctx.stroke();
                ctx.globalAlpha = 1;

                socket?.emit('whiteboard-draw', { sessionId, type: 'draw', x, y, color: drawColor, tool: drawTool, lineWidth: drawTool === 'eraser' ? 20 : drawTool === 'highlighter' ? lineWidth * 3 : lineWidth });
            }
        };

        const handleEnd = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();

            if (isPanning) {
                setIsPanning(false);
                return;
            }

            if (isDrawing && ['rectangle', 'circle', 'line', 'arrow'].includes(drawTool) && shapeStart) {
                const { x, y } = getCoordinates(e);
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Save state before drawing
                savePageState();

                ctx.strokeStyle = drawColor;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                if (drawTool === 'rectangle') {
                    const width = x - shapeStart.x;
                    const height = y - shapeStart.y;
                    ctx.strokeRect(shapeStart.x, shapeStart.y, width, height);
                    socket?.emit('whiteboard-draw', { sessionId, type: 'shape', tool: 'rectangle', x1: shapeStart.x, y1: shapeStart.y, x2: x, y2: y, color: drawColor, lineWidth });
                } else if (drawTool === 'circle') {
                    const radius = Math.sqrt(Math.pow(x - shapeStart.x, 2) + Math.pow(y - shapeStart.y, 2));
                    ctx.beginPath();
                    ctx.arc(shapeStart.x, shapeStart.y, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                    socket?.emit('whiteboard-draw', { sessionId, type: 'shape', tool: 'circle', x: shapeStart.x, y: shapeStart.y, radius, color: drawColor, lineWidth });
                } else if (drawTool === 'line') {
                    ctx.beginPath();
                    ctx.moveTo(shapeStart.x, shapeStart.y);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                    socket?.emit('whiteboard-draw', { sessionId, type: 'shape', tool: 'line', x1: shapeStart.x, y1: shapeStart.y, x2: x, y2: y, color: drawColor, lineWidth });
                } else if (drawTool === 'arrow') {
                    drawArrow(ctx, shapeStart.x, shapeStart.y, x, y);
                    socket?.emit('whiteboard-draw', { sessionId, type: 'shape', tool: 'arrow', x1: shapeStart.x, y1: shapeStart.y, x2: x, y2: y, color: drawColor, lineWidth });
                }

                setShapeStart(null);
            }

            setIsDrawing(false);
            if (drawTool === 'pen' || drawTool === 'eraser' || drawTool === 'highlighter') {
                socket?.emit('whiteboard-draw', { sessionId, type: 'end' });
                savePageState();
            }
        };

        const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
            const headLength = 15;
            const angle = Math.atan2(y2 - y1, x2 - x1);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        };

        // Mouse events
        canvas.addEventListener('mousedown', handleStart);
        canvas.addEventListener('mousemove', handleMove);
        canvas.addEventListener('mouseup', handleEnd);
        canvas.addEventListener('mouseleave', handleEnd);

        // Touch events
        canvas.addEventListener('touchstart', handleStart);
        canvas.addEventListener('touchmove', handleMove);
        canvas.addEventListener('touchend', handleEnd);
        canvas.addEventListener('touchcancel', handleEnd);

        // Socket listeners
        const handleDrawEvent = (data: any) => {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            if(data.type === 'start') {
                ctx.beginPath();
                ctx.moveTo(data.x, data.y);
            } else if(data.type === 'draw') {
                ctx.strokeStyle = data.tool === 'eraser' ? '#ffffff' : data.color;
                ctx.lineWidth = data.lineWidth || 2;
                ctx.lineCap = 'round';
                ctx.globalAlpha = data.tool === 'highlighter' ? 0.3 : 1;
                ctx.lineTo(data.x, data.y);
                ctx.stroke();
                ctx.globalAlpha = 1;
            } else if (data.type === 'shape') {
                ctx.strokeStyle = data.color;
                ctx.lineWidth = data.lineWidth || 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                if (data.tool === 'rectangle') {
                    const width = data.x2 - data.x1;
                    const height = data.y2 - data.y1;
                    ctx.strokeRect(data.x1, data.y1, width, height);
                } else if (data.tool === 'circle') {
                    ctx.beginPath();
                    ctx.arc(data.x, data.y, data.radius, 0, 2 * Math.PI);
                    ctx.stroke();
                } else if (data.tool === 'line') {
                    ctx.beginPath();
                    ctx.moveTo(data.x1, data.y1);
                    ctx.lineTo(data.x2, data.y2);
                    ctx.stroke();
                } else if (data.tool === 'arrow') {
                    drawArrow(ctx, data.x1, data.y1, data.x2, data.y2);
                }
            } else if (data.type === 'clear') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else if (data.type === 'image') {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, data.x || 0, data.y || 0);
                };
                img.src = data.src;
            } else if (data.type === 'text') {
                ctx.font = `${data.fontSize}px Arial`;
                ctx.fillStyle = data.color;
                ctx.fillText(data.text, data.x, data.y);
            }
        };

        socket?.on('whiteboard-draw', handleDrawEvent);

        return () => {
            canvas.removeEventListener('mousedown', handleStart);
            canvas.removeEventListener('mousemove', handleMove);
            canvas.removeEventListener('mouseup', handleEnd);
            canvas.removeEventListener('mouseleave', handleEnd);
            canvas.removeEventListener('touchstart', handleStart);
            canvas.removeEventListener('touchmove', handleMove);
            canvas.removeEventListener('touchend', handleEnd);
            canvas.removeEventListener('touchcancel', handleEnd);
            socket?.off('whiteboard-draw', handleDrawEvent);
        }
    }, [socket, sessionId, drawTool, drawColor, lineWidth, zoom, pan, isDrawing, isPanning, panStart, shapeStart, pages, currentPage]);

    const handleClear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if(canvas && ctx) {
            savePageState();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            socket?.emit('whiteboard-draw', { sessionId, type: 'clear' });
        }
    };

    const handleUndo = () => {
        // Simple undo by clearing and redrawing previous state
        // In a production app, you'd maintain a proper action history
        console.log('Undo functionality - implement with action history');
    };

    const handleRedo = () => {
        console.log('Redo functionality - implement with action history');
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.25, 0.5));
    };

    const handleResetZoom = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const handleExportPNG = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `whiteboard-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const handleExportPDF = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const imgData = canvas.toDataURL('image/png');
        // Force Landscape A4 for professional look as requested
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps = pdf.getImageProperties(imgData);
        let imgWidth = pageWidth;
        let imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        
        // If image height is greater than page height, scale by height
        if (imgHeight > pageHeight) {
            imgHeight = pageHeight;
            imgWidth = (imgProps.width * imgHeight) / imgProps.height;
        }
        
        // Center the image
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`whiteboard-${Date.now()}.pdf`);
    };

    const handleAddPage = () => {
        savePageState();
        setTotalPages(prev => prev + 1);
        setCurrentPage(prev => prev + 1);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            savePageState();
            setCurrentPage(prev => prev - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            savePageState();
            setCurrentPage(prev => prev + 1);
        }
    };

    // Load page when changing pages
    useEffect(() => {
        loadPageState(currentPage);
    }, [currentPage]);

    const handleInsertText = () => {
        if (!textInput || !textPosition) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = drawColor;
            ctx.fillText(textInput, textPosition.x, textPosition.y);

            socket?.emit('whiteboard-draw', {
                sessionId,
                type: 'text',
                text: textInput,
                x: textPosition.x,
                y: textPosition.y,
                fontSize,
                color: drawColor
            });

            const newText: TextElement = {
                id: Date.now().toString(),
                x: textPosition.x,
                y: textPosition.y,
                text: textInput,
                fontSize,
                color: drawColor
            };
            setTextElements(prev => [...prev, newText]);
            savePageState();
        }

        setTextInput('');
        setTextPosition(null);
        setIsTextDialogOpen(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const src = event.target?.result as string;
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (canvas && ctx) {
                    // Draw centered
                    const x = (canvas.width - img.width) / 2;
                    const y = (canvas.height - img.height) / 2;
                    ctx.drawImage(img, x, y); // TODO: Resize if too big
                    socket?.emit('whiteboard-draw', { sessionId, type: 'image', src, x, y });
                }
            };
            img.src = src;
        };
        reader.readAsDataURL(file);
    };

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== 'application/pdf') return;

        try {
            const uri = URL.createObjectURL(file);
            const loadingTask = pdfjs.getDocument(uri);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1); // Render first page
            
            const viewport = page.getViewport({ scale: 1.5 });
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.height = viewport.height;
            tempCanvas.width = viewport.width;

            if (tempCtx) {
                await page.render({ canvasContext: tempCtx, viewport }).promise;
                const src = tempCanvas.toDataURL('image/png');
                
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (canvas && ctx) {
                     // Draw centered, maybe scaled down if huge
                     let width = tempCanvas.width;
                     let height = tempCanvas.height;
                     const maxWidth = canvas.width * 0.8;
                     const maxHeight = canvas.height * 0.8;
                     
                     // Scale to fit
                     const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
                     width = width * ratio;
                     height = height * ratio;

                     const x = (canvas.width - width) / 2;
                     const y = (canvas.height - height) / 2;
                     
                     const img = new Image();
                     img.onload = () => {
                         ctx.drawImage(img, x, y, width, height);
                         // Use 'image' type for sync. Note: src might be large.
                         socket?.emit('whiteboard-draw', { sessionId, type: 'image', src, x, y }); 
                     };
                     img.src = src;
                }
            }
        } catch (error) {
            console.error("Error rendering PDF:", error);
        }
    };

    const handleInsertMath = async () => {
        if (!mathInput) return;
        
        // Render math to image
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.padding = '20px';
        container.style.backgroundColor = 'transparent';
        container.style.fontSize = '24px';
        document.body.appendChild(container);
        
        try {
            katex.render(mathInput, container, { throwOnError: false, displayMode: true });
            
            const canvas = await html2canvas(container, { backgroundColor: null, scale: 2 });
            const dataUrl = canvas.toDataURL('image/png');
            
            const mainCanvas = canvasRef.current;
            const ctx = mainCanvas?.getContext('2d');
            if (mainCanvas && ctx) {
                 const x = 50;
                 const y = 50;
                 const img = new Image();
                 img.onload = () => {
                     ctx.drawImage(img, x, y, img.width / 2, img.height / 2);
                     socket?.emit('whiteboard-draw', { sessionId, type: 'image', src: dataUrl, x, y });
                 };
                 img.src = dataUrl;
            }
        } catch (err) {
            console.error("Math render error:", err);
        } finally {
            document.body.removeChild(container);
            setIsMathDialogOpen(false);
            setMathInput('');
        }
    };

    return (
        <div className="absolute inset-0 bg-white z-40 flex flex-col">
            {/* Top Toolbar */}
            <div className="min-h-16 bg-gradient-to-r from-indigo-600 to-purple-600 border-b flex flex-wrap items-center px-2 sm:px-4 gap-1 sm:gap-2 shadow-lg py-2">
                {/* Drawing Tools */}
                <div className="flex gap-1 border-r border-indigo-400 pr-2 mr-2">
                    <Button
                        variant={drawTool === 'select' ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => setDrawTool('select')}
                        title="Select/Pan"
                        className={drawTool === 'select' ? 'bg-white text-indigo-600' : 'text-white hover:bg-indigo-500'}
                    >
                        <MousePointer2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={drawTool === 'pen' ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => setDrawTool('pen')}
                        title="Pen"
                        className={drawTool === 'pen' ? 'bg-white text-indigo-600' : 'text-white hover:bg-indigo-500'}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={drawTool === 'highlighter' ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => setDrawTool('highlighter')}
                        title="Highlighter"
                        className={drawTool === 'highlighter' ? 'bg-white text-indigo-600' : 'text-white hover:bg-indigo-500'}
                    >
                        <Highlighter className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={drawTool === 'eraser' ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => setDrawTool('eraser')}
                        title="Eraser"
                        className={drawTool === 'eraser' ? 'bg-white text-indigo-600' : 'text-white hover:bg-indigo-500'}
                    >
                        <Eraser className="h-4 w-4" />
                    </Button>
                </div>

                {/* Shape Tools */}
                <div className="flex gap-1 border-r border-indigo-400 pr-2 mr-2">
                    <Button
                        variant={drawTool === 'rectangle' ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => setDrawTool('rectangle')}
                        title="Rectangle"
                        className={drawTool === 'rectangle' ? 'bg-white text-indigo-600' : 'text-white hover:bg-indigo-500'}
                    >
                        <Square className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={drawTool === 'circle' ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => setDrawTool('circle')}
                        title="Circle"
                        className={drawTool === 'circle' ? 'bg-white text-indigo-600' : 'text-white hover:bg-indigo-500'}
                    >
                        <Circle className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={drawTool === 'line' ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => setDrawTool('line')}
                        title="Line"
                        className={drawTool === 'line' ? 'bg-white text-indigo-600' : 'text-white hover:bg-indigo-500'}
                    >
                        <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={drawTool === 'arrow' ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => setDrawTool('arrow')}
                        title="Arrow"
                        className={drawTool === 'arrow' ? 'bg-white text-indigo-600' : 'text-white hover:bg-indigo-500'}
                    >
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={drawTool === 'text' ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => setDrawTool('text')}
                        title="Text"
                        className={drawTool === 'text' ? 'bg-white text-indigo-600' : 'text-white hover:bg-indigo-500'}
                    >
                        <Type className="h-4 w-4" />
                    </Button>
                </div>

                {/* Color & Width */}
                <div className="flex gap-2 items-center border-r border-indigo-400 pr-2 mr-2">
                    <input
                        type="color"
                        value={drawColor}
                        onChange={(e) => setDrawColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-2 border-white"
                        disabled={drawTool === 'eraser'}
                        title="Color Picker"
                    />
                    <select
                        value={lineWidth}
                        onChange={(e) => setLineWidth(Number(e.target.value))}
                        className="h-8 rounded border-white text-sm bg-white text-gray-900 px-2"
                        title="Line Width"
                    >
                        <option value={1}>1px</option>
                        <option value={2}>2px</option>
                        <option value={3}>3px</option>
                        <option value={5}>5px</option>
                        <option value={8}>8px</option>
                        <option value={10}>10px</option>
                    </select>
                </div>

                {/* Additional Tools */}
                <div className="flex gap-1 border-r border-indigo-400 pr-2 mr-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMathDialogOpen(true)}
                        title="Insert Math"
                        className="text-white hover:bg-indigo-500"
                    >
                        <Calculator className="h-4 w-4" />
                    </Button>

                    <div className="relative">
                        <input
                            type="file"
                            accept="application/pdf"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            onChange={handlePdfUpload}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Upload PDF"
                            className="text-white hover:bg-indigo-500"
                        >
                            <FileText className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            onChange={handleImageUpload}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Upload Image"
                            className="text-white hover:bg-indigo-500"
                        >
                            <ImageIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Zoom Controls */}
                <div className="flex gap-1 border-r border-indigo-400 pr-2 mr-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomOut}
                        title="Zoom Out"
                        className="text-white hover:bg-indigo-500"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-white text-sm px-2 flex items-center min-w-[50px] justify-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomIn}
                        title="Zoom In"
                        className="text-white hover:bg-indigo-500"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        title="Clear Board"
                        className="text-white hover:bg-red-500"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="relative group">
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Export"
                            className="text-white hover:bg-indigo-500"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                        <div className="hidden group-hover:block absolute top-full mt-1 right-0 bg-white rounded-lg shadow-lg py-1 z-50 min-w-[120px]">
                            <button
                                onClick={handleExportPNG}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Export PNG
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Export PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div className="ml-auto">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="bg-white text-indigo-600 hover:bg-gray-100"
                    >
                        Close
                    </Button>
                </div>
            </div>

            {/* Color Palette */}
            <div className="bg-gray-50 border-b px-2 sm:px-4 py-2">
                <div className="flex gap-1 items-center flex-wrap">
                    <span className="text-xs text-gray-600 mr-2 hidden sm:block">Quick Colors:</span>
                    {colorPalette.map((color) => (
                        <button
                            key={color}
                            onClick={() => setDrawColor(color)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                                drawColor === color ? 'border-indigo-600 scale-110' : 'border-gray-300 hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative bg-white overflow-hidden">
                <div
                    className="w-full h-full"
                    style={{
                        cursor: drawTool === 'select' ? 'move' : 'crosshair',
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'top left'
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        className="touch-none"
                    />
                </div>

                {/* Page Navigation */}
                {totalPages > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-3 border">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            className="h-8 w-8"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                            Page {currentPage} / {totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="border-l pl-2 ml-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleAddPage}
                                title="Add Page"
                                className="h-8 w-8"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Zoom Info */}
                {zoom !== 1 && (
                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-3 py-2 text-sm">
                        <button
                            onClick={handleResetZoom}
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            Reset Zoom ({Math.round(zoom * 100)}%)
                        </button>
                    </div>
                )}
            </div>

            {/* Math Dialog */}
            <Dialog open={isMathDialogOpen} onOpenChange={setIsMathDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Insert Math Equation (LaTeX)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>LaTeX Formula</Label>
                            <Input
                                placeholder="e.g. E = mc^2 or \int_0^\infty x^2 dx"
                                value={mathInput}
                                onChange={(e) => setMathInput(e.target.value)}
                            />
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg min-h-[80px] flex items-center justify-center">
                            {mathInput ? (
                                <div dangerouslySetInnerHTML={{ __html: katex.renderToString(mathInput, { throwOnError: false }) }} />
                            ) : (
                                <span className="text-gray-400 text-sm">Preview will appear here</span>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMathDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleInsertMath}>Insert</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Text Dialog */}
            <Dialog open={isTextDialogOpen} onOpenChange={setIsTextDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Insert Text</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Text</Label>
                            <Input
                                placeholder="Enter text to add to whiteboard"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Font Size</Label>
                            <select
                                value={fontSize}
                                onChange={(e) => setFontSize(Number(e.target.value))}
                                className="w-full h-10 rounded border-gray-300 text-sm px-3"
                            >
                                <option value={12}>Small (12px)</option>
                                <option value={16}>Normal (16px)</option>
                                <option value={24}>Large (24px)</option>
                                <option value={32}>Extra Large (32px)</option>
                                <option value={48}>Huge (48px)</option>
                            </select>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg min-h-[80px] flex items-center justify-center">
                            {textInput ? (
                                <span style={{ fontSize: `${fontSize}px`, color: drawColor }}>
                                    {textInput}
                                </span>
                            ) : (
                                <span className="text-gray-400 text-sm">Text preview will appear here</span>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTextDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleInsertText}>Insert</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
