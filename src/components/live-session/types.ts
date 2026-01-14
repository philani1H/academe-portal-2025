import { Instance as PeerInstance } from 'simple-peer';

export interface LiveSessionProps {
  sessionId: string
  sessionName: string
  userRole: 'tutor' | 'student'
  onLeave: () => void
  courseId?: string
  courseName?: string
  category?: string
}

export interface Message {
  id: string
  userId: string
  userName: string
  text: string
  timestamp: Date
  type: 'text' | 'system'
}

export interface Participant {
  uid: string | number
  role: 'tutor' | 'student'
  isVideoOn: boolean
  isAudioOn: boolean
  isHandRaised: boolean
  canShare: boolean
  name?: string
}

export interface SharedFile {
  id: string
  name: string
  size: string
  uploadedBy: string
  timestamp: Date
}

export interface PeerData {
  peerId: string;
  peer: PeerInstance;
  stream?: MediaStream;
  userRole: 'tutor' | 'student';
  isVideoOn: boolean;
  isAudioOn: boolean;
  isHandRaised?: boolean;
  isMuted?: boolean;
}
