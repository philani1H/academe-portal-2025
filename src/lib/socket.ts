import { io, Socket } from "socket.io-client";

// Use environment variable for URL or default to current window origin
// For development with separate backend, use localhost:3000
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

let socket: Socket;

export const getSocket = (): Socket => {
  if (!socket) {
    console.log("Initializing Socket.IO connection to", SOCKET_URL);
    socket = io(SOCKET_URL, {
      path: "/socket.io", // Default path
      transports: ["websocket", "polling"], // Try websocket first
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    // We don't nullify socket here so it can be reconnected if getSocket is called again
    // but typically we might want to fully reset if the user logs out
  }
};
