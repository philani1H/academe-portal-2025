import { useRef, useState, useCallback, useEffect } from 'react';
import { DrawTool, Point, HistoryItem, ShapeType } from '../types';

interface UseCanvasProps {
  tool: DrawTool;
  color: string;
  lineWidth: number;
  opacity: number;
  selectedShape?: ShapeType;
  onDraw?: (action: any) => void;
}

export function useCanvas({ 
  tool, 
  color, 
  lineWidth, 
  opacity, 
  selectedShape = 'rectangle',
  onDraw 
}: UseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Initialize and resize canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Save current content
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (canvas.width > 0 && canvas.height > 0 && tempCtx) {
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx.drawImage(canvas, 0, 0);
    }

    // Resize main canvas
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    // Resize overlay canvas
    if (overlayCanvas) {
      overlayCanvas.width = rect.width * dpr;
      overlayCanvas.height = rect.height * dpr;
      overlayCanvas.style.width = `${rect.width}px`;
      overlayCanvas.style.height = `${rect.height}px`;
      const overlayCtx = overlayCanvas.getContext('2d');
      if (overlayCtx) {
        overlayCtx.scale(dpr, dpr);
      }
    }
    
    setCanvasSize({ width: rect.width, height: rect.height });

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      
      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      // Restore content
      if (tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.drawImage(
          tempCanvas, 
          0, 0, tempCanvas.width, tempCanvas.height, 
          0, 0, tempCanvas.width / dpr, tempCanvas.height / dpr
        );
      }
    }
  }, []);

  useEffect(() => {
    initCanvas();
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, [initCanvas]);

  // Save to history
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ imageData, timestamp: Date.now() });
    
    // Limit history to 50 items
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const newIndex = historyIndex - 1;
    const item = history[newIndex];
    if (item) {
      ctx.putImageData(item.imageData, 0, 0);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const newIndex = historyIndex + 1;
    const item = history[newIndex];
    if (item) {
      ctx.putImageData(item.imageData, 0, 0);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  // Get point from event
  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left - offset.x) / scale,
        y: (touch.clientY - rect.top - offset.y) / scale,
      };
    }
    
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale,
    };
  }, [scale, offset]);

  // Clear overlay canvas
  const clearOverlay = useCallback(() => {
    const overlayCanvas = overlayCanvasRef.current;
    const ctx = overlayCanvas?.getContext('2d');
    if (overlayCanvas && ctx) {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, overlayCanvas.width / dpr, overlayCanvas.height / dpr);
    }
  }, []);

  // Draw shape on overlay (preview)
  const drawShapePreview = useCallback((start: Point, end: Point) => {
    const overlayCanvas = overlayCanvasRef.current;
    const ctx = overlayCanvas?.getContext('2d');
    if (!ctx) return;

    clearOverlay();
    
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = opacity;

    const width = end.x - start.x;
    const height = end.y - start.y;

    ctx.beginPath();

    switch (selectedShape) {
      case 'rectangle':
        ctx.strokeRect(start.x, start.y, width, height);
        break;
      case 'circle':
        const radius = Math.sqrt(width * width + height * height) / 2;
        const centerX = start.x + width / 2;
        const centerY = start.y + height / 2;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'line':
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
      case 'arrow':
        // Draw line
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        // Draw arrowhead
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLength = 15;
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLength * Math.cos(angle - Math.PI / 6),
          end.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLength * Math.cos(angle + Math.PI / 6),
          end.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
        break;
      case 'triangle':
        const midX = start.x + width / 2;
        ctx.moveTo(midX, start.y);
        ctx.lineTo(start.x, end.y);
        ctx.lineTo(end.x, end.y);
        ctx.closePath();
        ctx.stroke();
        break;
    }

    ctx.globalAlpha = 1;
  }, [color, lineWidth, opacity, selectedShape, clearOverlay]);

  // Finalize shape on main canvas
  const finalizeShape = useCallback((start: Point, end: Point) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = opacity;

    const width = end.x - start.x;
    const height = end.y - start.y;

    ctx.beginPath();

    switch (selectedShape) {
      case 'rectangle':
        ctx.strokeRect(start.x, start.y, width, height);
        break;
      case 'circle':
        const radius = Math.sqrt(width * width + height * height) / 2;
        const centerX = start.x + width / 2;
        const centerY = start.y + height / 2;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'line':
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
      case 'arrow':
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLength = 15;
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLength * Math.cos(angle - Math.PI / 6),
          end.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLength * Math.cos(angle + Math.PI / 6),
          end.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
        break;
      case 'triangle':
        const midX = start.x + width / 2;
        ctx.moveTo(midX, start.y);
        ctx.lineTo(start.x, end.y);
        ctx.lineTo(end.x, end.y);
        ctx.closePath();
        ctx.stroke();
        break;
    }

    ctx.globalAlpha = 1;
    clearOverlay();
    
    onDraw?.({ 
      type: 'shape', 
      shapeType: selectedShape, 
      startX: start.x, 
      startY: start.y, 
      endX: end.x, 
      endY: end.y,
      color,
      lineWidth,
      opacity
    });
  }, [color, lineWidth, opacity, selectedShape, clearOverlay, onDraw]);

  // Draw methods
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'select' || tool === 'laser' || tool === 'sticky') return;
    
    const point = getPoint(e);
    setIsDrawing(true);
    setLastPoint(point);
    setStartPoint(point);

    if (tool === 'shape') return; // Shape drawing handled differently

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);

    onDraw?.({ type: 'start', x: point.x, y: point.y, tool, color, lineWidth });
  }, [tool, color, lineWidth, getPoint, onDraw]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool === 'select' || tool === 'laser' || tool === 'sticky') return;

    const point = getPoint(e);

    // Handle shape preview
    if (tool === 'shape' && startPoint) {
      drawShapePreview(startPoint, point);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !lastPoint) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = lineWidth * 3;
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth * 4;
      ctx.globalAlpha = 0.3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = opacity;
    }

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);

    setLastPoint(point);
    onDraw?.({ 
      type: 'draw', 
      x: point.x, 
      y: point.y, 
      prevX: lastPoint.x, 
      prevY: lastPoint.y, 
      tool, 
      color, 
      lineWidth 
    });
  }, [isDrawing, tool, color, lineWidth, opacity, lastPoint, startPoint, getPoint, onDraw, drawShapePreview]);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      // Finalize shape
      if (tool === 'shape' && startPoint && lastPoint) {
        const canvas = canvasRef.current;
        const rect = canvas?.getBoundingClientRect();
        if (rect) {
          // Get current mouse position for final shape
          finalizeShape(startPoint, lastPoint);
        }
      }

      setIsDrawing(false);
      setLastPoint(null);
      setStartPoint(null);
      saveToHistory();
      
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
      
      onDraw?.({ type: 'end' });
    }
  }, [isDrawing, tool, startPoint, lastPoint, saveToHistory, onDraw, finalizeShape]);

  // Handle shape drawing mouse up with final position
  const stopDrawingWithPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isDrawing && tool === 'shape' && startPoint) {
      const point = getPoint(e);
      finalizeShape(startPoint, point);
      
      // Cleanup manually to avoid double-finalization in stopDrawing
      setIsDrawing(false);
      setLastPoint(null);
      setStartPoint(null);
      saveToHistory();
      
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
      
      onDraw?.({ type: 'end' });
    } else {
      stopDrawing();
    }
  }, [isDrawing, tool, startPoint, getPoint, finalizeShape, stopDrawing, saveToHistory, onDraw]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    saveToHistory();
    onDraw?.({ type: 'clear' });
  }, [saveToHistory, onDraw]);

  // Add image to canvas
  const addImage = useCallback((src: string, x?: number, y?: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      const maxWidth = (canvas.width / dpr) * 0.8;
      const maxHeight = (canvas.height / dpr) * 0.8;
      
      let width = img.width;
      let height = img.height;
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      width *= ratio;
      height *= ratio;

      const posX = x ?? ((canvas.width / dpr) - width) / 2;
      const posY = y ?? ((canvas.height / dpr) - height) / 2;
      
      ctx.drawImage(img, posX, posY, width, height);
      saveToHistory();
      onDraw?.({ type: 'image', src, x: posX, y: posY });
    };
    img.src = src;
  }, [saveToHistory, onDraw]);

  // Draw text on canvas
  const drawText = useCallback((text: string, x: number, y: number, fontSize: number = 16) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    
    // Handle multiline text
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + (index * fontSize * 1.4));
    });
    
    ctx.globalAlpha = 1;
    saveToHistory();
    onDraw?.({ type: 'text', text, x, y, fontSize, color, opacity });
  }, [color, opacity, saveToHistory, onDraw]);

  // Export canvas
  const exportCanvas = useCallback((format: 'png' | 'jpeg' = 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL(`image/${format}`, 0.95);
  }, []);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const drawRemoteAction = useCallback((action: any) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    if (action.type === 'draw' && action.prevX !== undefined && action.prevY !== undefined) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (action.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = action.lineWidth * 3;
      } else if (action.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.lineWidth * 4;
        ctx.globalAlpha = 0.3;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.lineWidth;
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.moveTo(action.prevX, action.prevY);
      ctx.lineTo(action.x, action.y);
      ctx.stroke();
      
      // Reset
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    } else if (action.type === 'clear') {
      const dpr = window.devicePixelRatio || 1;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    } else if (action.type === 'image') {
       addImage(action.src, action.x, action.y);
    } else if (action.type === 'text') {
       const { text, x, y, fontSize, color, opacity } = action;
       ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
       ctx.fillStyle = color;
       ctx.globalAlpha = opacity;
       const lines = text.split('\n');
       lines.forEach((line: string, index: number) => {
         ctx.fillText(line, x, y + (index * fontSize * 1.4));
       });
       ctx.globalAlpha = 1;
    } else if (action.type === 'shape') {
       const { shapeType, startX, startY, endX, endY, color, lineWidth, opacity } = action;
       ctx.strokeStyle = color;
       ctx.lineWidth = lineWidth;
       ctx.lineCap = 'round';
       ctx.lineJoin = 'round';
       ctx.globalAlpha = opacity;

       const width = endX - startX;
       const height = endY - startY;

       ctx.beginPath();

       switch (shapeType) {
         case 'rectangle':
           ctx.strokeRect(startX, startY, width, height);
           break;
         case 'circle':
           const radius = Math.sqrt(width * width + height * height) / 2;
           const centerX = startX + width / 2;
           const centerY = startY + height / 2;
           ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
           ctx.stroke();
           break;
         case 'line':
           ctx.moveTo(startX, startY);
           ctx.lineTo(endX, endY);
           ctx.stroke();
           break;
         case 'arrow':
           ctx.moveTo(startX, startY);
           ctx.lineTo(endX, endY);
           ctx.stroke();
           const angle = Math.atan2(endY - startY, endX - startX);
           const headLength = 15;
           ctx.beginPath();
           ctx.moveTo(endX, endY);
           ctx.lineTo(
             endX - headLength * Math.cos(angle - Math.PI / 6),
             endY - headLength * Math.sin(angle - Math.PI / 6)
           );
           ctx.moveTo(endX, endY);
           ctx.lineTo(
             endX - headLength * Math.cos(angle + Math.PI / 6),
             endY - headLength * Math.sin(angle + Math.PI / 6)
           );
           ctx.stroke();
           break;
         case 'triangle':
           const midX = startX + width / 2;
           ctx.moveTo(midX, startY);
           ctx.lineTo(startX, endY);
           ctx.lineTo(endX, endY);
           ctx.closePath();
           ctx.stroke();
           break;
       }
       ctx.globalAlpha = 1;
    }
  }, [addImage]);

  return {
    canvasRef,
    overlayCanvasRef,
    isDrawing,
    canvasSize,
    history,
    historyIndex,
    scale,
    offset,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    startDrawing,
    draw,
    stopDrawing,
    stopDrawingWithPoint,
    clearCanvas,
    addImage,
    drawText,
    drawRemoteAction,
    undo,
    redo,
    exportCanvas,
    initCanvas,
    zoomIn,
    zoomOut,
    resetZoom,
    setOffset,
  };
}
