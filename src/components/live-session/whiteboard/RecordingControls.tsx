import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  Square,
  Download,
  Trash2,
  Circle,
  Clock
} from 'lucide-react';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  hasRecording: boolean;
  formattedDuration: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDownload: () => void;
  onDiscard: () => void;
}

export function RecordingControls({
  isRecording,
  isPaused,
  hasRecording,
  formattedDuration,
  onStart,
  onPause,
  onResume,
  onStop,
  onDownload,
  onDiscard,
}: RecordingControlsProps) {
  // Always show controls to allow starting recording
  
  return (
    <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-lg border border-indigo-500/30 backdrop-blur-sm shadow-xl">
      <div className="flex items-center gap-3 px-2 border-r border-indigo-500/30 mr-2">
        {isRecording && !isPaused && (
          <div className="relative">
            <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
          </div>
        )}
        <div className="flex items-center gap-1.5 font-mono text-sm font-medium text-white min-w-[80px]">
          <Clock className="h-4 w-4 text-indigo-400" />
          {formattedDuration}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {isRecording ? (
          <>
            {isPaused ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResume}
                className="h-8 w-8 p-0 text-white hover:bg-indigo-500/20 hover:text-indigo-300"
                title="Resume Recording"
              >
                <Play className="h-4 w-4 fill-current" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPause}
                className="h-8 w-8 p-0 text-white hover:bg-indigo-500/20 hover:text-indigo-300"
                title="Pause Recording"
              >
                <Pause className="h-4 w-4 fill-current" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onStop}
              className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20 hover:text-red-300"
              title="Stop Recording"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          </>
        ) : hasRecording ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className="h-8 w-8 p-0 text-green-400 hover:bg-green-500/20 hover:text-green-300"
              title="Download Recording"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDiscard}
              className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-500/20 hover:text-slate-300"
              title="Discard Recording"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : (
             // Fallback start button if this component handles starting too
             <Button
                variant="ghost"
                size="sm"
                onClick={onStart}
                className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                title="Start Recording"
              >
                <Circle className="h-4 w-4 fill-current" />
              </Button>
        )}
      </div>
    </div>
  );
}
