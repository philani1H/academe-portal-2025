import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export const useRecording = (
  courseId: string | undefined, 
  localStream: MediaStream | null, 
  isScreenSharing: boolean
) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const uploadRecording = async (blob: Blob) => {
    if (!courseId) {
      // If no courseId, just download locally
      downloadLocally(blob);
      return;
    }

    const toastId = toast.loading("Saving recording as learning material...");
    
    try {
      const formData = new FormData();
      formData.append('file', blob, `session-recording-${new Date().toISOString()}.webm`);
      formData.append('courseId', courseId);
      formData.append('type', 'video');
      formData.append('name', `Live Session Recording - ${new Date().toLocaleDateString()}`);

      const response = await fetch('/api/upload/material', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast.success("Recording saved to Course Materials!", { id: toastId });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload recording. Downloading locally instead.", { id: toastId });
      downloadLocally(blob);
    }
  };

  const downloadLocally = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = `session-recording-${new Date().toISOString()}.webm`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Recording saved to downloads.");
  };

  const startRecording = useCallback(async () => {
    try {
      let streamToRecord: MediaStream;

      if (isScreenSharing) {
        // If screen sharing, prioritize capturing the screen (meeting view)
        // Note: getDisplayMedia prompts the user.
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: 'screen' } as any,
                audio: true
            });
            
            // Mix with mic if available
            if (localStream) {
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
        } catch (err) {
            // User cancelled screen share selection
            console.warn("Screen share cancelled for recording", err);
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
      toast.error("Failed to start recording.");
    }
  }, [localStream, isScreenSharing]);

  const setupRecorder = (stream: MediaStream) => {
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      
      // Stop tracks if they were created specifically for recording (like display media)
      // But don't stop localStream tracks!
      stream.getTracks().forEach(track => {
          // Only stop if it's not the local stream (e.g. it's a display track)
          // Rough check: if track id is not in localStream
           if (localStream && !localStream.getTracks().some(t => t.id === track.id)) {
               track.stop();
           }
      });

      uploadRecording(blob);
      setIsRecording(false);
    };

    recorder.start();
    setIsRecording(true);
    toast.success(isScreenSharing ? "Recording screen..." : "Recording camera...");
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};
