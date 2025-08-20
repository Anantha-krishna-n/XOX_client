import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";
console.log("Socket URL:", URL);

export const socket = io(URL, {
  autoConnect: false,
  transports: ["websocket"], 
  secure: true, 
  reconnection: true, 
  reconnectionAttempts: 5, 
  reconnectionDelay: 1000,
});

// Log connection events for debugging
socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.warn("Socket disconnected:", reason);
});

socket.connect();