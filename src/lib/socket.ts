import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academe-portal-2025.onrender.com' : 'http://localhost:3000');

// Create a singleton socket instance
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  withCredentials: true,
});

export const connectSocket = () => {
  if (socket.connected) return;
  
  socket.connect();

  socket.on('connect', () => {
    console.log('[Socket] Connected with ID:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log('[Socket] Disconnected');
  }
};
