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
            active && 'bg-primary text-primary-foreground shadow-lg',
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
      <div className="flex items-center gap-1 px-3 py-2 bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border">
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