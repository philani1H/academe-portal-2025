import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
  Hand,
  Menu,
  MoreHorizontal,
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
            'relative p-2 sm:p-2.5 rounded-xl transition-all duration-200 ease-out',
            'hover:bg-secondary/80 active:scale-95',
            active && 'bg-primary text-primary-foreground shadow-tool',
            !active && 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-40 cursor-not-allowed',
            className
          )}
        >
          {icon}
          {active && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-foreground hidden sm:block" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="font-medium hidden sm:block">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// Mobile Tool Grid Component
function MobileToolGrid({ 
  tool, 
  onToolChange, 
  selectedShape, 
  onShapeChange 
}: { 
  tool: DrawTool; 
  onToolChange: (t: DrawTool) => void;
  selectedShape: ShapeType;
  onShapeChange: (s: ShapeType) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 p-4">
      <button
        onClick={() => onToolChange('select')}
        className={cn(
          'p-3 rounded-xl flex flex-col items-center gap-1 text-xs',
          tool === 'select' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        <MousePointer2 className="w-5 h-5" />
        Select
      </button>
      <button
        onClick={() => onToolChange('pen')}
        className={cn(
          'p-3 rounded-xl flex flex-col items-center gap-1 text-xs',
          tool === 'pen' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        <Pencil className="w-5 h-5" />
        Pen
      </button>
      <button
        onClick={() => onToolChange('highlighter')}
        className={cn(
          'p-3 rounded-xl flex flex-col items-center gap-1 text-xs',
          tool === 'highlighter' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        <Highlighter className="w-5 h-5" />
        Highlight
      </button>
      <button
        onClick={() => onToolChange('eraser')}
        className={cn(
          'p-3 rounded-xl flex flex-col items-center gap-1 text-xs',
          tool === 'eraser' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        <Eraser className="w-5 h-5" />
        Eraser
      </button>
      <button
        onClick={() => onToolChange('text')}
        className={cn(
          'p-3 rounded-xl flex flex-col items-center gap-1 text-xs',
          tool === 'text' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        <Type className="w-5 h-5" />
        Text
      </button>
      <button
        onClick={() => { onToolChange('shape'); onShapeChange('rectangle'); }}
        className={cn(
          'p-3 rounded-xl flex flex-col items-center gap-1 text-xs',
          tool === 'shape' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        <Shapes className="w-5 h-5" />
        Shapes
      </button>
      <button
        onClick={() => onToolChange('sticky')}
        className={cn(
          'p-3 rounded-xl flex flex-col items-center gap-1 text-xs',
          tool === 'sticky' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        <StickyNote className="w-5 h-5" />
        Note
      </button>
      <button
        onClick={() => onToolChange('laser')}
        className={cn(
          'p-3 rounded-xl flex flex-col items-center gap-1 text-xs',
          tool === 'laser' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        <Pointer className="w-5 h-5" />
        Laser
      </button>
    </div>
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Toolbar */}
      <div className="sm:hidden flex items-center justify-between gap-2 p-2 w-full">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button className="p-2.5 glass rounded-xl shadow-toolbar">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Drawing Tools</h3>
              </div>
              <MobileToolGrid 
                tool={tool} 
                onToolChange={(t) => { onToolChange(t); setMobileMenuOpen(false); }}
                selectedShape={selectedShape}
                onShapeChange={onShapeChange}
              />
              
              <Separator />
              
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Colors</p>
                  <div className="grid grid-cols-6 gap-2">
                    {COLORS.slice(0, 12).map((c) => (
                      <button
                        key={c}
                        onClick={() => onColorChange(c)}
                        className={cn(
                          'w-8 h-8 rounded-lg transition-all',
                          color === c ? 'ring-2 ring-primary ring-offset-2' : '',
                          c === '#ffffff' && 'border border-border'
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Stroke: {lineWidth}px</p>
                  <Slider
                    value={[lineWidth]}
                    onValueChange={([v]) => onLineWidthChange(v)}
                    min={1}
                    max={20}
                    step={1}
                  />
                </div>
              </div>

              <Separator />

              <div className="p-4 grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={(e) => { onImageUpload(e); setMobileMenuOpen(false); }}
                  />
                  <Button variant="outline" className="w-full gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Image
                  </Button>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={(e) => { onPdfUpload(e); setMobileMenuOpen(false); }}
                  />
                  <Button variant="outline" className="w-full gap-2">
                    <FileText className="w-4 h-4" />
                    PDF
                  </Button>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => { onMathInsert(); setMobileMenuOpen(false); }}>
                  <Calculator className="w-4 h-4" />
                  Math
                </Button>
                <Button variant="outline" className="gap-2" onClick={onExport}>
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>

              <div className="mt-auto p-4 border-t">
                <Button variant="destructive" className="w-full gap-2" onClick={onClear}>
                  <Trash2 className="w-4 h-4" />
                  Clear Canvas
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile Quick Actions */}
        <div className="flex items-center gap-1.5 glass rounded-xl px-2 py-1.5 shadow-toolbar">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn('p-1.5 rounded-lg', !canUndo && 'opacity-40')}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={cn('p-1.5 rounded-lg', !canRedo && 'opacity-40')}
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <Separator orientation="vertical" className="h-4" />
          <div
            className="w-5 h-5 rounded-md border border-border"
            style={{ backgroundColor: color }}
          />
        </div>

        {/* Current Tool Indicator */}
        <div className="glass rounded-xl px-3 py-1.5 shadow-toolbar">
          <span className="text-xs font-medium capitalize">{tool}</span>
        </div>
      </div>

      {/* Desktop Toolbar */}
      <div className="hidden sm:block animate-slide-up">
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
    </>
  );
}
