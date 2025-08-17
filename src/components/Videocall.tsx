import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

export default function VideoCall({ socket, roomId }: { socket: Socket; roomId: string }) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  useEffect(() => {
    if (!socket) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    // Get local media stream
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        localStreamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;
        
        // Add all tracks to peer connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      } catch (err) {
        console.error("Failed to get local media", err);
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      if (remoteRef.current && !remoteRef.current.srcObject) {
        remoteRef.current.srcObject = event.streams[0];
      }
    };

    // ICE Candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice", { 
          roomId, 
          candidate: event.candidate 
        });
      }
    };

    // Signaling event handlers
    const handleOffer = async ({ offer, from }: { 
      offer: RTCSessionDescriptionInit; 
      from: string 
    }) => {
      if (!pcRef.current || from === socket.id) return;
      
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit("webrtc-answer", { roomId, answer });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    };

    const handleAnswer = async ({ answer, from }: { 
      answer: RTCSessionDescriptionInit; 
      from: string 
    }) => {
      if (!pcRef.current || from === socket.id) return;
      
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    };

    const handleIce = async ({ candidate, from }: { 
      candidate: RTCIceCandidateInit; 
      from: string 
    }) => {
      if (!pcRef.current || from === socket.id) return;
      
      try {
        if (candidate) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    };

    const handleReadyForOffer = async () => {
      if (!pcRef.current) return;
      
      try {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socket.emit("webrtc-offer", { roomId, offer });
      } catch (err) {
        console.error("Error creating offer:", err);
      }
    };

    // Setup event listeners
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice", handleIce);
    socket.on("ready-for-offer", handleReadyForOffer);

    // Initialize
    getMedia();

    // Cleanup
    return () => {
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice", handleIce);
      socket.off("ready-for-offer", handleReadyForOffer);
    };
  }, [socket, roomId]);

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  return (
    <div className="w-72 bg-white p-3 rounded shadow">
      <div className="flex gap-2">
        <video 
          ref={localRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-38 h-28 bg-black rounded" 
        />
        <video 
          ref={remoteRef} 
          autoPlay 
          playsInline 
          className="w-36 h-28 bg-black rounded" 
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button 
          onClick={toggleCamera} 
          className="px-2 py-1 border rounded"
        >
          {cameraOn ? "Camera Off" : "Camera On"}
        </button>
        <button 
          onClick={toggleMic} 
          className="px-2 py-1 border rounded"
        >
          {micOn ? "Mute" : "Unmute"}
        </button>
      </div>
    </div>
  );
}