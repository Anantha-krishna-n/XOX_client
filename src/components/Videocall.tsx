import  { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

export default function VideoCall({ socket, roomId }: { socket: Socket, roomId: string }) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  useEffect(() => {
    if (!socket) return;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcRef.current = pc;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      localStreamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
    }).catch(e => console.error("getUserMedia failed", e));

    pc.ontrack = ev => {
      if (remoteRef.current) remoteRef.current.srcObject = ev.streams[0];
    };

    pc.onicecandidate = e => {
      if (e.candidate) socket.emit("webrtc-ice", { roomId, candidate: e.candidate });
    };

    socket.on("webrtc-offer", async ({ offer }) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { roomId, answer });
      } catch (err) { console.warn(err); }
    });

    socket.on("webrtc-answer", async ({ answer }) => {
      try { await pc.setRemoteDescription(new RTCSessionDescription(answer)); } catch (e) { console.warn(e); }
    });

    socket.on("webrtc-ice", async ({ candidate }) => {
      try { if (candidate) await pc.addIceCandidate(candidate); } catch (e) { console.warn(e); }
    });

    // Try to create an offer after short delay (simple 2-peer strategy)
    setTimeout(async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { roomId, offer });
      } catch (e) { /* ignore in simple flow */ }
    }, 500);

    return () => {
      pc.close();
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice");
    };
  }, [socket, roomId]);

  const toggleCamera = () => {
    const vt = localStreamRef.current?.getVideoTracks()[0];
    if (vt) { vt.enabled = !vt.enabled; setCameraOn(vt.enabled); }
  };
  const toggleMic = () => {
    const at = localStreamRef.current?.getAudioTracks()[0];
    if (at) { at.enabled = !at.enabled; setMicOn(at.enabled); }
  };

  return (
    <div className="w-72 bg-white p-3 rounded shadow">
      <div className="flex gap-2">
        <video ref={localRef} autoPlay muted playsInline className="w-36 h-28 bg-black rounded" />
        <video ref={remoteRef} autoPlay playsInline className="w-36 h-28 bg-black rounded" />
      </div>
      <div className="flex gap-2 mt-2">
        <button onClick={toggleCamera} className="px-2 py-1 border rounded">{cameraOn ? "Camera Off" : "Camera On"}</button>
        <button onClick={toggleMic} className="px-2 py-1 border rounded">{micOn ? "Mute" : "Unmute"}</button>
      </div>
    </div>
  );
}
