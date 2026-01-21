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
