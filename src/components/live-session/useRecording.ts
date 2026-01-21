import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const useRecording = (
  courseId: string | undefined,
  localStream: MediaStream | null,
  isScreenSharing: boolean
) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isMountedRef = useRef(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  // Safe state setter
  const safeSetState = useCallback(<T,>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    value: React.SetStateAction<T>
  ) => {
    if (isMountedRef.current) {
      setter(value);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const uploadRecording = async (blob: Blob) => {
    if (!courseId) {
      // If no courseId, just download locally
      downloadLocally(blob);
      return;
    }

    safeSetState(setIsUploading, true);
    const toastId = toast.loading("Uploading recording to server...");

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `session-recording-${timestamp}.webm`;

      // Convert blob to File
      const file = new File([blob], filename, { type: blob.type || 'video/webm' });

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', courseId);
      formData.append('type', 'video');
      formData.append('name', `Live Session Recording - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
      formData.append('description', 'Live session recording uploaded from session');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload/material', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Recording saved to Course Materials!`, { id: toastId, duration: 5000 });
        console.log('Material saved:', data);
        
        // Invalidate cache to update Tutor Dashboard immediately
        api.invalidateCache('materials');
        api.invalidateCache('courses');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to save material to database');
      }
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Upload failed: ${errorMessage}. Downloading locally instead.`, { id: toastId, duration: 5000 });
      downloadLocally(blob);
    } finally {
      safeSetState(setIsUploading, false);
    }
  };

  const downloadLocally = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `session-recording-${timestamp}.webm`;
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
    toast.success("Recording saved to downloads.");
  };

  const startRecording = useCallback(async () => {
    try {
      let streamToRecord: MediaStream;

      if (isScreenSharing) {
        // If screen sharing, capture the screen
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: { 
                  displaySurface: 'monitor',
                  cursor: 'always'
                } as any,
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  sampleRate: 44100
                } as any
            });
            
            // Mix with mic if available
            if (localStream && localStream.getAudioTracks().length > 0) {
                const audioContext = new AudioContext();
                const dest = audioContext.createMediaStreamDestination();
                
                // Add system audio (if any)
                if (displayStream.getAudioTracks().length > 0) {
                    const sysSource = audioContext.createMediaStreamSource(displayStream);
                    sysSource.connect(dest);
                }
                
                // Add mic audio
                const micTracks = localStream.getAudioTracks();
                if (micTracks.length > 0) {
                    const micStream = new MediaStream([micTracks[0]]);
                    const micSource = audioContext.createMediaStreamSource(micStream);
                    micSource.connect(dest);
                }
                
                const mixedAudioTrack = dest.stream.getAudioTracks()[0];
                streamToRecord = new MediaStream([
                    displayStream.getVideoTracks()[0],
                    mixedAudioTrack
                ]);
            } else {
                streamToRecord = displayStream;
            }
            
            recordingStreamRef.current = displayStream;
        } catch (err) {
            // User cancelled screen share selection
            console.warn("Screen share cancelled for recording", err);
            toast.info("Screen recording cancelled");
            return;
        }
      } else {
        // Not screen sharing? Record the camera directly!
        if (!localStream) {
            toast.error("No camera/microphone stream to record.");
            return;
        }
        streamToRecord = localStream;
      }

      setupRecorder(streamToRecord);

    } catch (err) {
      console.error("Error starting recording:", err);
      toast.error("Failed to start recording. Please check your permissions.");
    }
  }, [localStream, isScreenSharing, courseId]);

  const setupRecorder = (stream: MediaStream) => {
    try {
      // Check for supported MIME types
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4'
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error('No supported MIME type found for recording');
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });
      
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });
        
        // Stop recording stream tracks if they were created specifically for recording
        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach(track => {
            // Only stop if it's not the local stream
            if (!localStream || !localStream.getTracks().some(t => t.id === track.id)) {
              track.stop();
            }
          });
          recordingStreamRef.current = null;
        }

        uploadRecording(blob);
        safeSetState(setIsRecording, false);
      };

      recorder.onerror = (event: any) => {
        console.error("MediaRecorder error:", event);
        toast.error("Recording error occurred");
        safeSetState(setIsRecording, false);
      };

      recorder.start(1000); // Collect data every second
      safeSetState(setIsRecording, true);
      toast.success(isScreenSharing ? "Recording screen..." : "Recording session...");
    } catch (err) {
      console.error("Error setting up recorder:", err);
      toast.error("Failed to initialize recorder");
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        toast.info("Stopping recording...");
      } catch (err) {
        console.error("Error stopping recording:", err);
        toast.error("Failed to stop recording");
      }
    }
  }, []);

  return {
    isRecording,
    isUploading,
    startRecording,
    stopRecording
  };
};
