here is th redisg of the whitebord import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { DrawTool } from './types';

interface CanvasProps {
tool: DrawTool;
scale?: number;
offset?: { x: number; y: number };
onMouseDown: (e: React.MouseEvent) => void;
onMouseMove: (e: React.MouseEvent) => void;
onMouseUp: (e: React.MouseEvent) => void;
onTouchStart: (e: React.TouchEvent) => void;
onTouchMove: (e: React.TouchEvent) => void;
onTouchEnd: (e: React.TouchEvent) => void;
onClick?: (e: React.MouseEvent) => void;
overlayRef?: React.RefObject<HTMLCanvasElement>;
}

export const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(
({
tool,
scale = 1,
offset = { x: 0, y: 0 },
onMouseDown,
onMouseMove,
onMouseUp,
onTouchStart,
onTouchMove,
onTouchEnd,
onClick,
overlayRef,
}, ref) => {
const getCursor = () => {
switch (tool) {
case 'select':
return 'default';
case 'pen':
case 'highlighter':
return 'crosshair';
case 'eraser':
return 'cell';
case 'text':
return 'text';
case 'shape':
return 'crosshair';
case 'laser':
return 'none';
case 'sticky':
return 'copy';
case 'pan':
return 'grab';
default:
return 'default';
}
};

return (
  <div 
    className="absolute inset-0 overflow-hidden"
    style={{
      transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
      transformOrigin: 'center center',
    }}
  >
    <canvas
      ref={ref}
      className={cn(
        'absolute inset-0 touch-none',
        'transition-opacity duration-200'
      )}
      style={{ cursor: getCursor() }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={onClick}
    />
    {/* Overlay canvas for previews */}
    <canvas
      ref={overlayRef}
      className="absolute inset-0 touch-none pointer-events-none"
    />
  </div>
);

}
);

Canvas.displayName = 'Canvas';
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
export { Whiteboard } from './Whiteboard';
export type { DrawTool, ShapeType, Point, DrawAction, DrawState } from './types';
import React, { useState, useEffect, useCallback } from 'react';
import { Point } from './types';

interface LaserPointerProps {
isActive: boolean;
color?: string;
}

export function LaserPointer({ isActive, color = '#ef4444' }: LaserPointerProps) {
const [position, setPosition] = useState<Point | null>(null);
const [trail, setTrail] = useState<Point[]>([]);

useEffect(() => {
if (!isActive) {
setPosition(null);
setTrail([]);
return;
}

const handleMouseMove = (e: MouseEvent) => {
  const newPos = { x: e.clientX, y: e.clientY };
  setPosition(newPos);
  setTrail(prev => {
    const updated = [...prev, newPos];
    // Keep only last 20 points for smooth trail
    return updated.slice(-20);
  });
};

const handleMouseLeave = () => {
  setPosition(null);
};

window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('mouseleave', handleMouseLeave);

return () => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseleave', handleMouseLeave);
};

}, [isActive]);

// Fade out trail effect
useEffect(() => {
if (!isActive || trail.length === 0) return;

const interval = setInterval(() => {
  setTrail(prev => prev.slice(1));
}, 50);

return () => clearInterval(interval);

}, [isActive, trail.length > 0]);

if (!isActive || !position) return null;

return (
<div className="fixed inset-0 pointer-events-none z-[9999]">
{/* Trail */}
<svg className="absolute inset-0 w-full h-full">
{trail.length > 1 && (
<polyline
points={trail.map(p => ${p.x},${p.y}).join(' ')}
fill="none"
stroke={color}
strokeWidth="3"
strokeLinecap="round"
strokeLinejoin="round"
opacity="0.5"
/>
)}
</svg>

  {/* Main dot */}
  <div
    className="absolute w-4 h-4 rounded-full animate-pulse"
    style={{
      left: position.x - 8,
      top: position.y - 8,
      backgroundColor: color,
      boxShadow: `0 0 20px ${color}, 0 0 40px ${color}, 0 0 60px ${color}`,
    }}
  />

  {/* Glow ring */}
  <div
    className="absolute w-8 h-8 rounded-full animate-ping"
    style={{
      left: position.x - 16,
      top: position.y - 16,
      backgroundColor: color,
      opacity: 0.3,
    }}
  />
</div>

);
}
import React, { useState, useEffect } from 'react';
import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathDialogProps {
open: boolean;
onOpenChange: (open: boolean) => void;
onInsert: (latex: string) => void;
}

const MATH_TEMPLATES = {
basic: [
{ label: 'Fraction', latex: '\frac{a}{b}' },
{ label: 'Square Root', latex: '\sqrt{x}' },
{ label: 'Nth Root', latex: '\sqrt[n]{x}' },
{ label: 'Power', latex: 'x^{n}' },
{ label: 'Subscript', latex: 'x_{n}' },
{ label: 'Absolute', latex: '|x|' },
],
algebra: [
{ label: 'Quadratic', latex: 'ax^2 + bx + c = 0' },
{ label: 'Quadratic Formula', latex: 'x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}' },
{ label: 'Binomial', latex: '(a + b)^n' },
{ label: 'Factorial', latex: 'n!' },
{ label: 'Combination', latex: '\binom{n}{k}' },
{ label: 'Logarithm', latex: '\log_b(x)' },
],
calculus: [
{ label: 'Limit', latex: '\lim_{x \to a} f(x)' },
{ label: 'Derivative', latex: '\frac{df}{dx}' },
{ label: 'Partial Derivative', latex: '\frac{\partial f}{\partial x}' },
{ label: 'Integral', latex: '\int f(x) \, dx' },
{ label: 'Definite Integral', latex: '\int_{a}^{b} f(x) \, dx' },
{ label: 'Double Integral', latex: '\iint f(x,y) \, dA' },
{ label: 'Sum', latex: '\sum_{i=1}^{n} x_i' },
{ label: 'Product', latex: '\prod_{i=1}^{n} x_i' },
{ label: 'Infinity', latex: '\infty' },
],
greek: [
{ label: 'Alpha', latex: '\alpha' },
{ label: 'Beta', latex: '\beta' },
{ label: 'Gamma', latex: '\gamma' },
{ label: 'Delta', latex: '\delta' },
{ label: 'Epsilon', latex: '\epsilon' },
{ label: 'Theta', latex: '\theta' },
{ label: 'Lambda', latex: '\lambda' },
{ label: 'Mu', latex: '\mu' },
{ label: 'Pi', latex: '\pi' },
{ label: 'Sigma', latex: '\sigma' },
{ label: 'Omega', latex: '\omega' },
{ label: 'Phi', latex: '\phi' },
],
trigonometry: [
{ label: 'Sine', latex: '\sin(x)' },
{ label: 'Cosine', latex: '\cos(x)' },
{ label: 'Tangent', latex: '\tan(x)' },
{ label: 'Arc Sine', latex: '\arcsin(x)' },
{ label: 'Arc Cosine', latex: '\arccos(x)' },
{ label: 'Arc Tangent', latex: '\arctan(x)' },
],
matrices: [
{ label: '2x2 Matrix', latex: '\begin{pmatrix} a & b \\ c & d \end{pmatrix}' },
{ label: '3x3 Matrix', latex: '\begin{pmatrix} a & b & c \\ d & e & f \\ g & h & i \end{pmatrix}' },
{ label: 'Determinant', latex: '\begin{vmatrix} a & b \\ c & d \end{vmatrix}' },
{ label: 'Bracket Matrix', latex: '\begin{bmatrix} a & b \\ c & d \end{bmatrix}' },
],
physics: [
{ label: 'E=mc²', latex: 'E = mc^2' },
{ label: 'Force', latex: 'F = ma' },
{ label: "Newton's Gravitation", latex: 'F = G\frac{m_1 m_2}{r^2}' },
{ label: 'Kinetic Energy', latex: 'KE = \frac{1}{2}mv^2' },
{ label: "Schrödinger", latex: 'i\hbar\frac{\partial}{\partial t}\Psi = \hat{H}\Psi' },
{ label: 'Wave Equation', latex: 'c = f\lambda' },
],
};

export function MathDialog({ open, onOpenChange, onInsert }: MathDialogProps) {
const [latex, setLatex] = useState('');
const [preview, setPreview] = useState('');
const [error, setError] = useState('');

useEffect(() => {
if (latex) {
try {
const rendered = katex.renderToString(latex, {
throwOnError: true,
displayMode: true,
});
setPreview(rendered);
setError('');
} catch (err) {
setError((err as Error).message);
setPreview('');
}
} else {
setPreview('');
setError('');
}
}, [latex]);

const handleInsert = () => {
if (latex && !error) {
onInsert(latex);
setLatex('');
onOpenChange(false);
}
};

const handleTemplateClick = (template: string) => {
setLatex((prev) => prev + template);
};

return (
<Dialog open={open} onOpenChange={onOpenChange}>
<DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
<DialogHeader>
<DialogTitle className="text-xl font-semibold gradient-text">
Insert Math Equation
</DialogTitle>
<DialogDescription>
Write LaTeX or use templates below. Preview updates in real-time.
</DialogDescription>
</DialogHeader>

    <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
      {/* Input */}
      <div className="space-y-2">
        <Label htmlFor="latex-input" className="text-sm font-medium">
          LaTeX Formula
        </Label>
        <Input
          id="latex-input"
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          placeholder="e.g. \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
          className="font-mono text-sm"
        />
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Preview</Label>
        <div className="min-h-[80px] p-6 bg-secondary rounded-xl flex items-center justify-center border border-border">
          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : preview ? (
            <div
              dangerouslySetInnerHTML={{ __html: preview }}
              className="text-2xl"
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              Your equation preview will appear here
            </p>
          )}
        </div>
      </div>

      {/* Templates */}
      <div className="flex-1 overflow-hidden">
        <Label className="text-sm font-medium mb-2 block">Templates</Label>
        <Tabs defaultValue="basic" className="h-full">
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="algebra">Algebra</TabsTrigger>
            <TabsTrigger value="calculus">Calculus</TabsTrigger>
            <TabsTrigger value="trig">Trig</TabsTrigger>
            <TabsTrigger value="greek">Greek</TabsTrigger>
            <TabsTrigger value="matrices">Matrices</TabsTrigger>
            <TabsTrigger value="physics">Physics</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[180px] mt-2">
            <TabsContent value="basic" className="mt-0">
              <TemplateGrid
                templates={MATH_TEMPLATES.basic}
                onClick={handleTemplateClick}
              />
            </TabsContent>
            <TabsContent value="algebra" className="mt-0">
              <TemplateGrid
                templates={MATH_TEMPLATES.algebra}
                onClick={handleTemplateClick}
              />
            </TabsContent>
            <TabsContent value="calculus" className="mt-0">
              <TemplateGrid
                templates={MATH_TEMPLATES.calculus}
                onClick={handleTemplateClick}
              />
            </TabsContent>
            <TabsContent value="trig" className="mt-0">
              <TemplateGrid
                templates={MATH_TEMPLATES.trigonometry}
                onClick={handleTemplateClick}
              />
            </TabsContent>
            <TabsContent value="greek" className="mt-0">
              <TemplateGrid
                templates={MATH_TEMPLATES.greek}
                onClick={handleTemplateClick}
              />
            </TabsContent>
            <TabsContent value="matrices" className="mt-0">
              <TemplateGrid
                templates={MATH_TEMPLATES.matrices}
                onClick={handleTemplateClick}
              />
            </TabsContent>
            <TabsContent value="physics" className="mt-0">
              <TemplateGrid
                templates={MATH_TEMPLATES.physics}
                onClick={handleTemplateClick}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>

    <div className="flex justify-end gap-2 pt-4 border-t">
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Cancel
      </Button>
      <Button onClick={handleInsert} disabled={!latex || !!error}>
        Insert Equation
      </Button>
    </div>
  </DialogContent>
</Dialog>

);
}

interface TemplateGridProps {
templates: { label: string; latex: string }[];
onClick: (latex: string) => void;
}

function TemplateGrid({ templates, onClick }: TemplateGridProps) {
return (
<div className="grid grid-cols-3 gap-2">
{templates.map((t) => (
<button
key={t.latex}
onClick={() => onClick(t.latex)}
className="p-3 bg-card hover:bg-secondary rounded-lg border border-border transition-colors text-left group"
>
<p className="text-xs text-muted-foreground mb-1 group-hover:text-foreground transition-colors">
{t.label}
</p>
<div
className="text-sm"
dangerouslySetInnerHTML={{
__html: katex.renderToString(t.latex, {
throwOnError: false,
displayMode: false,
}),
}}
/>
</button>
))}
</div>
);
}
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
}

export function StickyNote({
note,
onUpdate,
onDelete,
isSelected,
onSelect
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
if (!isDragging) return;

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

}, [isDragging, dragOffset, note.id, note.width, note.height, onUpdate]);

const handleDoubleClick = (e: React.MouseEvent) => {
e.stopPropagation();
setIsEditing(true);
};

const handleBlur = () => {
setIsEditing(false);
};

const handleColorChange = (color: string) => {
onUpdate(note.id, { color });
};

return (
<div
ref={noteRef}
className={cn(
'absolute rounded-lg shadow-lg transition-shadow cursor-move select-none',
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

  {/* Content */}
  <div className="px-3 pb-3">
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

  {/* Color Picker (visible when selected) */}
  {isSelected && (
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
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TextInputProps {
x: number;
y: number;
color: string;
fontSize: number;
onSubmit: (text: string, x: number, y: number) => void;
onCancel: () => void;
}

export function TextInput({ x, y, color, fontSize, onSubmit, onCancel }: TextInputProps) {
const [text, setText] = useState('');
const textareaRef = useRef<HTMLTextAreaElement>(null);

useEffect(() => {
if (textareaRef.current) {
textareaRef.current.focus();
}
}, []);

const handleKeyDown = (e: React.KeyboardEvent) => {
if (e.key === 'Enter' && !e.shiftKey) {
e.preventDefault();
if (text.trim()) {
onSubmit(text, x, y);
} else {
onCancel();
}
}
if (e.key === 'Escape') {
onCancel();
}
};

const handleBlur = () => {
if (text.trim()) {
onSubmit(text, x, y);
} else {
onCancel();
}
};

return (
<div
className="absolute z-50"
style={{ left: x, top: y }}
>
<textarea
ref={textareaRef}
value={text}
onChange={(e) => setText(e.target.value)}
onKeyDown={handleKeyDown}
onBlur={handleBlur}
className={cn(
'min-w-[200px] max-w-[400px] p-2 bg-white/90 backdrop-blur-sm',
'border-2 border-primary rounded-lg shadow-lg',
'outline-none resize-none font-sans'
)}
style={{
color,
fontSize: ${fontSize}px,
lineHeight: 1.4,
}}
placeholder="Type text..."
rows={1}
/>
<div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
Press Enter to confirm, Esc to cancel
</div>
</div>
);
}
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
MousePointer2,
Pencil,
Highlighter,
Eraser,
Type,
Shapes,
Undo2,
Redo2,
Trash2,
Download,
Calculator,
FileText,
Image as ImageIcon,
Palette,
Minus,
Circle,
Square,
ArrowRight,
Triangle,
StickyNote,
Pointer,
ZoomIn,
ZoomOut,
Maximize,
Hand,
} from 'lucide-react';
import { DrawTool, COLORS, LINE_WIDTHS, ShapeType } from './types';

interface ToolbarProps {
tool: DrawTool;
color: string;
lineWidth: number;
opacity: number;
canUndo: boolean;
canRedo: boolean;
scale?: number;
onToolChange: (tool: DrawTool) => void;
onColorChange: (color: string) => void;
onLineWidthChange: (width: number) => void;
onOpacityChange: (opacity: number) => void;
onUndo: () => void;
onRedo: () => void;
onClear: () => void;
onExport: () => void;
onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
onPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
onMathInsert: () => void;
selectedShape: ShapeType;
onShapeChange: (shape: ShapeType) => void;
onZoomIn?: () => void;
onZoomOut?: () => void;
onResetZoom?: () => void;
}

interface ToolButtonProps {
icon: React.ReactNode;
label: string;
active?: boolean;
disabled?: boolean;
onClick: () => void;
className?: string;
}

function ToolButton({ icon, label, active, disabled, onClick, className }: ToolButtonProps) {
return (
<Tooltip>
<TooltipTrigger asChild>
<button
onClick={onClick}
disabled={disabled}
className={cn(
'relative p-2.5 rounded-xl transition-all duration-200 ease-out',
'hover:bg-secondary/80 active:scale-95',
active && 'bg-primary text-primary-foreground shadow-tool',
!active && 'text-muted-foreground hover:text-foreground',
disabled && 'opacity-40 cursor-not-allowed',
className
)}
>
{icon}
{active && (
<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-foreground" />
)}
</button>
</TooltipTrigger>
<TooltipContent side="bottom" className="font-medium">
{label}
</TooltipContent>
</Tooltip>
);
}

export function Toolbar({
tool,
color,
lineWidth,
opacity,
canUndo,
canRedo,
scale = 1,
onToolChange,
onColorChange,
onLineWidthChange,
onOpacityChange,
onUndo,
onRedo,
onClear,
onExport,
onImageUpload,
onPdfUpload,
onMathInsert,
selectedShape,
onShapeChange,
onZoomIn,
onZoomOut,
onResetZoom,
}: ToolbarProps) {
return (
<div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
<div className="flex items-center gap-1 px-3 py-2 glass rounded-2xl shadow-toolbar">
{/* Drawing Tools */}
<div className="flex items-center gap-0.5">
<ToolButton
icon={<MousePointer2 className="w-5 h-5" />}
label="Select (V)"
active={tool === 'select'}
onClick={() => onToolChange('select')}
/>
<ToolButton
icon={<Pencil className="w-5 h-5" />}
label="Pen (P)"
active={tool === 'pen'}
onClick={() => onToolChange('pen')}
/>
<ToolButton
icon={<Highlighter className="w-5 h-5" />}
label="Highlighter (H)"
active={tool === 'highlighter'}
onClick={() => onToolChange('highlighter')}
/>
<ToolButton
icon={<Eraser className="w-5 h-5" />}
label="Eraser (E)"
active={tool === 'eraser'}
onClick={() => onToolChange('eraser')}
/>
<ToolButton
icon={<Type className="w-5 h-5" />}
label="Text (T)"
active={tool === 'text'}
onClick={() => onToolChange('text')}
/>

      {/* Shapes Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'relative p-2.5 rounded-xl transition-all duration-200 ease-out',
              'hover:bg-secondary/80 active:scale-95',
              tool === 'shape' && 'bg-primary text-primary-foreground shadow-tool',
              tool !== 'shape' && 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Shapes className="w-5 h-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="center">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => { onToolChange('shape'); onShapeChange('rectangle'); }}
              className={cn(
                'p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors text-xs',
                selectedShape === 'rectangle' && tool === 'shape'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              )}
            >
              <Square className="w-5 h-5" />
              Rect
            </button>
            <button
              onClick={() => { onToolChange('shape'); onShapeChange('circle'); }}
              className={cn(
                'p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors text-xs',
                selectedShape === 'circle' && tool === 'shape'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              )}
            >
              <Circle className="w-5 h-5" />
              Circle
            </button>
            <button
              onClick={() => { onToolChange('shape'); onShapeChange('triangle'); }}
              className={cn(
                'p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors text-xs',
                selectedShape === 'triangle' && tool === 'shape'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              )}
            >
              <Triangle className="w-5 h-5" />
              Triangle
            </button>
            <button
              onClick={() => { onToolChange('shape'); onShapeChange('line'); }}
              className={cn(
                'p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors text-xs',
                selectedShape === 'line' && tool === 'shape'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              )}
            >
              <Minus className="w-5 h-5" />
              Line
            </button>
            <button
              onClick={() => { onToolChange('shape'); onShapeChange('arrow'); }}
              className={cn(
                'p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors text-xs',
                selectedShape === 'arrow' && tool === 'shape'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              )}
            >
              <ArrowRight className="w-5 h-5" />
              Arrow
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6 mx-0.5" />

      {/* Extra Tools */}
      <ToolButton
        icon={<StickyNote className="w-5 h-5" />}
        label="Sticky Note (N)"
        active={tool === 'sticky'}
        onClick={() => onToolChange('sticky')}
      />
      <ToolButton
        icon={<Pointer className="w-5 h-5" />}
        label="Laser Pointer (L)"
        active={tool === 'laser'}
        onClick={() => onToolChange('laser')}
      />
      <ToolButton
        icon={<Hand className="w-5 h-5" />}
        label="Pan (Space)"
        active={tool === 'pan'}
        onClick={() => onToolChange('pan')}
      />
    </div>

    <Separator orientation="vertical" className="h-8 mx-1" />

    {/* Color Picker */}
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'p-2 rounded-xl transition-all duration-200 hover:bg-secondary/80 active:scale-95',
            'flex items-center gap-2'
          )}
        >
          <div
            className="w-6 h-6 rounded-lg border-2 border-border shadow-sm"
            style={{ backgroundColor: color }}
          />
          <Palette className="w-4 h-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="center">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Colors</p>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => onColorChange(c)}
                  className={cn(
                    'w-8 h-8 rounded-lg transition-all duration-150',
                    'hover:scale-110 active:scale-95',
                    'border-2',
                    color === c ? 'border-primary ring-2 ring-primary/30' : 'border-transparent',
                    c === '#ffffff' && 'border-border'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Custom Color</p>
            <input
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-full h-10 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>

    {/* Line Width */}
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'p-2 rounded-xl transition-all duration-200 hover:bg-secondary/80 active:scale-95',
            'flex items-center gap-2 min-w-[60px] justify-center'
          )}
        >
          <div
            className="bg-foreground rounded-full"
            style={{ width: lineWidth * 2, height: lineWidth * 2, maxWidth: 16, maxHeight: 16 }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-4" align="center">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-sm font-medium">Stroke Width</p>
              <span className="text-sm text-muted-foreground">{lineWidth}px</span>
            </div>
            <Slider
              value={[lineWidth]}
              onValueChange={([v]) => onLineWidthChange(v)}
              min={1}
              max={20}
              step={1}
            />
          </div>
          <div className="flex gap-2">
            {LINE_WIDTHS.map((lw) => (
              <button
                key={lw.value}
                onClick={() => onLineWidthChange(lw.value)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                  lineWidth === lw.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                )}
              >
                {lw.label}
              </button>
            ))}
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-sm font-medium">Opacity</p>
              <span className="text-sm text-muted-foreground">{Math.round(opacity * 100)}%</span>
            </div>
            <Slider
              value={[opacity * 100]}
              onValueChange={([v]) => onOpacityChange(v / 100)}
              min={10}
              max={100}
              step={10}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>

    <Separator orientation="vertical" className="h-8 mx-1" />

    {/* Insert Tools */}
    <div className="flex items-center gap-0.5">
      <ToolButton
        icon={<Calculator className="w-5 h-5" />}
        label="Insert Math Equation"
        onClick={onMathInsert}
      />
      
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          onChange={onImageUpload}
        />
        <ToolButton
          icon={<ImageIcon className="w-5 h-5" />}
          label="Upload Image"
          onClick={() => {}}
        />
      </div>
      
      <div className="relative">
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          onChange={onPdfUpload}
        />
        <ToolButton
          icon={<FileText className="w-5 h-5" />}
          label="Upload PDF Document"
          onClick={() => {}}
        />
      </div>
    </div>

    <Separator orientation="vertical" className="h-8 mx-1" />

    {/* Zoom Controls */}
    <div className="flex items-center gap-0.5">
      <ToolButton
        icon={<ZoomOut className="w-5 h-5" />}
        label="Zoom Out"
        onClick={onZoomOut || (() => {})}
        disabled={scale <= 0.5}
      />
      <button
        onClick={onResetZoom}
        className="px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {Math.round(scale * 100)}%
      </button>
      <ToolButton
        icon={<ZoomIn className="w-5 h-5" />}
        label="Zoom In"
        onClick={onZoomIn || (() => {})}
        disabled={scale >= 3}
      />
    </div>

    <Separator orientation="vertical" className="h-8 mx-1" />

    {/* History */}
    <div className="flex items-center gap-0.5">
      <ToolButton
        icon={<Undo2 className="w-5 h-5" />}
        label="Undo (⌘Z)"
        onClick={onUndo}
        disabled={!canUndo}
      />
      <ToolButton
        icon={<Redo2 className="w-5 h-5" />}
        label="Redo (⌘⇧Z)"
        onClick={onRedo}
        disabled={!canRedo}
      />
    </div>

    <Separator orientation="vertical" className="h-8 mx-1" />

    {/* Actions */}
    <div className="flex items-center gap-0.5">
      <ToolButton
        icon={<Download className="w-5 h-5" />}
        label="Export as Image"
        onClick={onExport}
      />
      <ToolButton
        icon={<Trash2 className="w-5 h-5 text-destructive" />}
        label="Clear Canvas"
        onClick={onClear}
      />
    </div>
  </div>
</div>

);
}
export type DrawTool =
| 'pen'
| 'eraser'
| 'highlighter'
| 'select'
| 'text'
| 'shape'
| 'laser'
| 'sticky'
| 'pan';

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow' | 'triangle';

export interface Point {
x: number;
y: number;
}

export interface DrawAction {
type: 'start' | 'draw' | 'end' | 'clear' | 'image' | 'text' | 'shape' | 'undo' | 'redo' | 'laser';
tool?: DrawTool;
x?: number;
y?: number;
color?: string;
lineWidth?: number;
src?: string;
text?: string;
shape?: ShapeType;
endX?: number;
endY?: number;
}

export interface DrawState {
tool: DrawTool;
color: string;
lineWidth: number;
opacity: number;
}

export interface CanvasLayer {
id: string;
name: string;
visible: boolean;
locked: boolean;
data: ImageData | null;
}

export interface HistoryItem {
imageData: ImageData;
timestamp: number;
}

export interface StickyNote {
id: string;
x: number;
y: number;
width: number;
height: number;
content: string;
color: string;
}

export interface TextElement {
id: string;
x: number;
y: number;
content: string;
fontSize: number;
color: string;
fontFamily: string;
}

export interface PDFDocument {
id: string;
name: string;
pageCount: number;
currentPage: number;
pageImages: string[];
originalFile?: File;
}

export const COLORS = [
'#1e1e1e', // Black
'#6366f1', // Indigo
'#8b5cf6', // Purple
'#ec4899', // Pink
'#ef4444', // Red
'#f97316', // Orange
'#eab308', // Yellow
'#22c55e', // Green
'#06b6d4', // Cyan
'#3b82f6', // Blue
'#64748b', // Slate
'#ffffff', // White
] as const;

export const STICKY_COLORS = [
'#fef3c7', // Yellow
'#fce7f3', // Pink
'#dbeafe', // Blue
'#d1fae5', // Green
'#fae8ff', // Purple
'#fed7aa', // Orange
] as const;

export const LINE_WIDTHS = [
{ value: 2, label: 'Fine', icon: '━' },
{ value: 4, label: 'Medium', icon: '━' },
{ value: 8, label: 'Bold', icon: '━' },
{ value: 16, label: 'Thick', icon: '━' },
] as const;

export const TOOLS: { id: DrawTool; label: string; shortcut: string }[] = [
{ id: 'select', label: 'Select', shortcut: 'V' },
{ id: 'pen', label: 'Pen', shortcut: 'P' },
{ id: 'highlighter', label: 'Highlighter', shortcut: 'H' },
{ id: 'eraser', label: 'Eraser', shortcut: 'E' },
{ id: 'text', label: 'Text', shortcut: 'T' },
{ id: 'shape', label: 'Shapes', shortcut: 'S' },
{ id: 'sticky', label: 'Sticky Note', shortcut: 'N' },
{ id: 'laser', label: 'Laser Pointer', shortcut: 'L' },
{ id: 'pan', label: 'Pan', shortcut: 'Space' },
];
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
import { DrawTool, ShapeType, StickyNote as StickyNoteType, PDFDocument, STICKY_COLORS } from './types';
import { toast } from 'sonner';
import katex from 'katex';
import html2canvas from 'html2canvas';
import { pdfjs } from 'react-pdf';
import 'katex/dist/katex.min.css';

pdfjs.GlobalWorkerOptions.workerSrc = //unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs;

interface WhiteboardProps {
sessionId?: string;
onClose?: () => void;
className?: string;
}

export function Whiteboard({ sessionId, onClose, className }: WhiteboardProps) {
const [tool, setTool] = useState<DrawTool>('pen');
const [color, setColor] = useState('#1e1e1e');
const [lineWidth, setLineWidth] = useState(4);
const [opacity, setOpacity] = useState(1);
const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle');
const [isMathDialogOpen, setIsMathDialogOpen] = useState(false);
const [currentDocument, setCurrentDocument] = useState<PDFDocument | null>(null);
const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
const [stickyNotes, setStickyNotes] = useState<StickyNoteType[]>([]);
const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);

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
} = useCanvas({
tool,
color,
lineWidth,
opacity,
selectedShape,
});

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
link.download = whiteboard-${Date.now()}.png;
link.href = dataUrl;
link.click();
toast.success('Exported');
}
}, [exportCanvas]);

const handleClear = useCallback(() => {
if (confirm('Clear the canvas?')) {
clearCanvas();
setStickyNotes([]);
}
}, [clearCanvas]);

return (
<div className={cn('relative w-full h-full bg-canvas overflow-hidden', className)}>
<div className="absolute inset-0 canvas-grid opacity-50" />

  <DocumentViewer
    document={currentDocument}
    onClose={() => setIsDocViewerOpen(false)}
    onSendToCanvas={addImage}
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
  }, [color, lineWidth, opacity, selectedShape, clearOverlay]);

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
    onDraw?.({ type: 'draw', x: point.x, y: point.y, tool, color, lineWidth });
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
    }
    stopDrawing();
  }, [isDrawing, tool, startPoint, getPoint, finalizeShape, stopDrawing]);

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
  }, [color, opacity, saveToHistory]);

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
