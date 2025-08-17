import  { useState } from "react";

export default function Landing({ onJoin }: { onJoin: (code: string) => void }) {
  const [code, setCode] = useState("");
  return (
    <div className="max-w-md mx-auto p-6 border rounded bg-white">
      <h1 className="text-2xl font-bold mb-4">XOX — Join or Create</h1>
      <div className="flex gap-2">
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="Enter room code" className="border p-2 flex-1 rounded" />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => {
          if (!code) { const gen = Math.random().toString(36).slice(2,8).toUpperCase(); setCode(gen); onJoin(gen); }
          else onJoin(code);
        }}>{code ? "Join" : "Generate & Join"}</button>
      </div>
    </div>
  );
}
