import  { useEffect, useState } from "react";
import Landing from "./components/Landing";
import GameBoard from "./components/GameBoard";
import VideoCall from "./components/Videocall";
import { socket } from "../src/socket";

export default function App() {
  const [room, setRoom] = useState<string | null>(null);
  const [state, setState] = useState<any>({ board: Array(9).fill(null), turn: "X", winner: null, players: [] });

  useEffect(() => {
    socket.on("room-update", (s) => setState(s));
    return () => { socket.off("room-update"); };
  }, []);

  function handleJoin(code: string) {
    setRoom(code);
    socket.emit("join-room", { roomId: code }, (initial: any) => {
      if (initial) setState(initial);
    });
  }

  function handleCell(i: number) {
    if (!room) return;
    socket.emit("make-move", { roomId: room, index: i });
  }

  function handleRestart() {
    if (!room) return;
    socket.emit("restart-game", { roomId: room });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {!room ? <Landing onJoin={handleJoin} /> : (
        <div>
          <h2 className="font-semibold">Room: {room}</h2>
          <div className="flex gap-6 mt-4">
            <GameBoard state={state} onCellClick={handleCell} onRestart={handleRestart} />
            <VideoCall socket={socket} roomId={room} />
          </div>
        </div>
      )}
    </div>
  );
}
