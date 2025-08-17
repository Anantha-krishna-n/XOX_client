import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // backend URL

let socket: Socket;

const SocketTest: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState("room123");
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // connect socket
    socket = io(SOCKET_URL);

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
      setConnected(false);
    });

    socket.on("room_message", (msg: string) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = () => {
    if (roomId.trim()) {
      socket.emit("join_room", roomId);
      setMessages((prev) => [...prev, `Joined room: ${roomId}`]);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Socket.io Test</h2>
      <p>Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}</p>

      <div className="mt-4">
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="border p-2 mr-2"
          placeholder="Enter room ID"
        />
        <button
          onClick={joinRoom}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Join Room
        </button>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold">Messages:</h3>
        <ul className="list-disc pl-5">
          {messages.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SocketTest;
