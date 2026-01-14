import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil, Eraser, Trash2, Upload, Calculator, Image as ImageIcon, Type, Download, FileText } from 'lucide-react'
import { Socket } from 'socket.io-client'
import katex from 'katex'
import html2canvas from 'html2canvas'
import { pdfjs } from 'react-pdf'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

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

export function Whiteboard({ socket, sessionId, onClose, isTutor }: WhiteboardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawTool, setDrawTool] = useState<'pen' | 'eraser'>('pen');
    const [drawColor, setDrawColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);
    
    // Math Dialog State
    const [isMathDialogOpen, setIsMathDialogOpen] = useState(false);
    const [mathInput, setMathInput] = useState('');

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
                 // Note: Resizing clears canvas. In a real app, we'd redraw the history.
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

        const handleMouseDown = (e: MouseEvent) => {
          setIsDrawing(true)
          const rect = canvas.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          ctx.beginPath()
          ctx.moveTo(x, y)
          socket?.emit('whiteboard-draw', { sessionId, type: 'start', x, y, color: drawColor, tool: drawTool, lineWidth: drawTool === 'eraser' ? 20 : lineWidth });
        }
    
        const handleMouseMove = (e: MouseEvent) => {
          if (!isDrawing) return
          const rect = canvas.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          
          ctx.strokeStyle = drawTool === 'eraser' ? '#ffffff' : drawColor
          ctx.lineWidth = drawTool === 'eraser' ? 20 : lineWidth
          ctx.lineCap = 'round'
          ctx.lineTo(x, y)
          ctx.stroke()
          
          socket?.emit('whiteboard-draw', { sessionId, type: 'draw', x, y, color: drawColor, tool: drawTool, lineWidth: drawTool === 'eraser' ? 20 : lineWidth });
        }
    
        const handleMouseUp = () => {
          setIsDrawing(false)
          socket?.emit('whiteboard-draw', { sessionId, type: 'end' });
        }

        canvas.addEventListener('mousedown', handleMouseDown)
        canvas.addEventListener('mousemove', handleMouseMove)
        canvas.addEventListener('mouseup', handleMouseUp)
        canvas.addEventListener('mouseleave', handleMouseUp)

        // Socket listeners
        const handleDrawEvent = (data: any) => {
             if(data.type === 'start') {
                 ctx.beginPath();
                 ctx.moveTo(data.x, data.y);
             } else if(data.type === 'draw') {
                 ctx.strokeStyle = data.tool === 'eraser' ? '#ffffff' : data.color;
                 ctx.lineWidth = data.lineWidth || 2;
                 ctx.lineCap = 'round';
                 ctx.lineTo(data.x, data.y);
                 ctx.stroke();
             } else if (data.type === 'clear') {
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
             } else if (data.type === 'image') {
                 const img = new Image();
                 img.onload = () => {
                     ctx.drawImage(img, data.x || 0, data.y || 0);
                 };
                 img.src = data.src;
             }
        };

        socket?.on('whiteboard-draw', handleDrawEvent);
        
        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown)
            canvas.removeEventListener('mousemove', handleMouseMove)
            canvas.removeEventListener('mouseup', handleMouseUp)
            canvas.removeEventListener('mouseleave', handleMouseUp)
            socket?.off('whiteboard-draw', handleDrawEvent);
        }
    }, [socket, sessionId, drawTool, drawColor, lineWidth]); // Re-bind when tool changes

    const handleClear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if(canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            socket?.emit('whiteboard-draw', { sessionId, type: 'clear' });
        }
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
            {/* Toolbar */}
            <div className="h-16 bg-gray-100 border-b flex items-center px-4 gap-2 shadow-sm">
                <div className="flex gap-1 border-r pr-2 mr-2">
                    <Button 
                        variant={drawTool === 'pen' ? 'default' : 'ghost'} 
                        size="icon"
                        onClick={() => setDrawTool('pen')}
                    >
                        <Pencil className="h-5 w-5" />
                    </Button>
                    <Button 
                        variant={drawTool === 'eraser' ? 'default' : 'ghost'} 
                        size="icon"
                        onClick={() => setDrawTool('eraser')}
                    >
                        <Eraser className="h-5 w-5" />
                    </Button>
                </div>
                
                <div className="flex gap-2 items-center border-r pr-2 mr-2">
                    <input 
                        type="color" 
                        value={drawColor} 
                        onChange={(e) => setDrawColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer"
                        disabled={drawTool === 'eraser'}
                    />
                    <select 
                        value={lineWidth} 
                        onChange={(e) => setLineWidth(Number(e.target.value))}
                        className="h-8 rounded border-gray-300 text-sm"
                    >
                        <option value={2}>Thin</option>
                        <option value={5}>Medium</option>
                        <option value={10}>Thick</option>
                    </select>
                </div>

                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setIsMathDialogOpen(true)} title="Insert Math Equation">
                        <Calculator className="h-5 w-5" />
                    </Button>
                    
                    <div className="relative">
                        <input 
                            type="file" 
                            accept="application/pdf" 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            onChange={handlePdfUpload}
                        />
                        <Button variant="ghost" size="icon" title="Upload PDF (First Page)">
                            <FileText className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="relative">
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            onChange={handleImageUpload}
                        />
                        <Button variant="ghost" size="icon" title="Upload Image">
                            <ImageIcon className="h-5 w-5" />
                        </Button>
                    </div>

                    <Button variant="ghost" size="icon" onClick={handleClear} title="Clear Board">
                        <Trash2 className="h-5 w-5 text-red-500" />
                    </Button>
                </div>

                <div className="ml-auto">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative bg-white cursor-crosshair overflow-hidden">
                <canvas 
                    ref={canvasRef}
                    className="touch-none"
                />
            </div>

            {/* Math Dialog */}
            <Dialog open={isMathDialogOpen} onOpenChange={setIsMathDialogOpen}>
                <DialogContent>
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
                        <div className="p-4 bg-gray-50 rounded-lg min-h-[60px] flex items-center justify-center">
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
        </div>
    )
}
