import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academe-portal-2025.onrender.com' : 'http://localhost:3000');

function getAuthToken(): string | null {
  try {
    return localStorage.getItem('auth_token') || localStorage.getItem('admin_token');
  } catch {
    return null;
  }
}

// Create a singleton socket instance with auth token support for cross-origin production
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

export const connectSocket = () => {
  if (socket.connected) return;

  // Pass JWT via auth so socket works cross-origin (cookie alone fails cross-origin)
  const token = getAuthToken();
  if (token) {
    socket.auth = { token };
  }

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
