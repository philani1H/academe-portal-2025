import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface UseRecordingProps {
  containerRef?: React.RefObject<HTMLElement>;
}

export const useRecording = ({ containerRef }: UseRecordingProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [hasRecording, setHasRecording] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formattedDuration = new Date(recordingTime * 1000).toISOString().substr(11, 8);

  const startRecording = useCallback(async () => {
    try {
      // Use getDisplayMedia to capture the screen/tab/window
      // This allows capturing the whiteboard including all overlays (sticky notes, etc.)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          displaySurface: 'browser' // Prefer current tab/browser
        },
        audio: true
      });

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        setRecordedChunks(chunks);
        setHasRecording(true);
        setIsRecording(false);
        setIsPaused(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        
        // Stop all tracks to stop the "Sharing this tab" browser UI
        stream.getTracks().forEach(track => track.stop());
      };

      // Handle user stopping via browser UI
      stream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== 'inactive') {
            recorder.stop();
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setHasRecording(false);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Recording started');
    } catch (err) {
      console.error('Error starting recording:', err);
      // User likely cancelled the selection
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
         toast.info('Recording cancelled');
      } else {
         toast.error('Failed to start recording');
      }
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      setIsPaused(true);
      if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
      }
      toast.info('Recording paused');
    }
  }, [mediaRecorder]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      toast.info('Recording resumed');
    }
  }, [mediaRecorder]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      // State updates happen in onstop handler
    }
  }, [mediaRecorder]);

  const downloadRecording = useCallback(() => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = `whiteboard-recording-${new Date().toISOString()}.webm`;
    a.click();
    
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 100);
    
    toast.success('Recording downloaded');
  }, [recordedChunks]);

  const discardRecording = useCallback(() => {
    setRecordedChunks([]);
    setHasRecording(false);
    setRecordingTime(0);
    toast.info('Recording discarded');
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  return {
    isRecording,
    isPaused,
    formattedDuration,
    hasRecording,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    downloadRecording,
    discardRecording,
  };
};
