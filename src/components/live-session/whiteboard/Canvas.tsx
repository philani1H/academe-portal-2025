import React, { forwardRef } from 'react';
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
