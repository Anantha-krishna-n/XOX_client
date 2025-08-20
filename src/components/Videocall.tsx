import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

export default function VideoCall({ socket, roomId }: { socket: Socket; roomId: string }) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const isMediaInitializing = useRef(false); // Track initMedia state

  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Create peer connection
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        // Add TURN server for production reliability
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelay.project",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelay.project",
          credential: "openrelayproject",
        },
      ],
    });
    pcRef.current = pc;

    // Handle remote stream
    pc.ontrack = (event) => {
      if (remoteRef.current && !remoteRef.current.srcObject) {
        remoteRef.current.srcObject = event.streams[0];
        setIsConnected(true);
      }
    };

    // Debug ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state: ${pc.iceConnectionState}`);
    };

    // ICE Candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice", {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    // Signaling event handlers
    const handleOffer = async ({
      offer,
      from,
    }: {
      offer: RTCSessionDescriptionInit;
      from: string;
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

    const handleAnswer = async ({
      answer,
      from,
    }: {
      answer: RTCSessionDescriptionInit;
      from: string;
    }) => {
      if (!pcRef.current || from === socket.id) return;

      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    };

    const handleIce = async ({
      candidate,
      from,
    }: {
      candidate: RTCIceCandidateInit;
      from: string;
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
      if (!pcRef.current || pcRef.current.signalingState === "closed") return;

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

    // Initialize media and signal ready
    const initMedia = async () => {
      if (isMediaInitializing.current) return; // Prevent multiple initMedia calls
      isMediaInitializing.current = true;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;

        // Add tracks only if connection is not closed
        if (pcRef.current && pcRef.current.signalingState !== "closed") {
          stream.getTracks().forEach((track) => {
            pcRef.current!.addTrack(track, stream);
          });
          socket.emit("media-ready", { roomId });
        } else {
          console.warn("RTCPeerConnection closed before adding tracks");
          stream.getTracks().forEach((track) => track.stop()); // Clean up stream
        }
      } catch (err) {
        console.error("Failed to get local media:", err);
      } finally {
        isMediaInitializing.current = false;
      }
    };

    initMedia();

    // Cleanup
    return () => {
      if (pcRef.current && pcRef.current.signalingState !== "closed") {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
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
    <div className="bg-card rounded-2xl p-6 shadow-xl border border-border backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          Video Call
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-500"} animate-pulse`}></div>
        </h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Local Video */}
          <div className="relative">
            <video
              ref={localRef}
              autoPlay
              muted
              playsInline
              className="w-full h-40 bg-muted rounded-xl object-cover border-2 border-border"
            />
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded-md">You</div>
            {!cameraOn && (
              <div className="absolute inset-0 bg-muted rounded-xl flex items-center justify-center">
                <div className="text-muted-foreground text-sm">Camera Off</div>
              </div>
            )}
          </div>

          {/* Remote Video */}
          <div className="relative">
            <video
              ref={remoteRef}
              autoPlay
              playsInline
              className="w-full h-40 bg-muted rounded-xl object-cover border-2 border-border"
            />
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded-md">Opponent</div>
            {!isConnected && (
              <div className="absolute inset-0 bg-muted rounded-xl flex items-center justify-center">
                <div className="text-muted-foreground text-sm">Waiting for opponent...</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleCamera}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
              cameraOn
                ? "bg-muted text-foreground hover:bg-muted/80"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/80"
            }`}
          >
            {cameraOn ? "📹 Camera" : "📹 Off"}
          </button>
          <button
            onClick={toggleMic}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
              micOn
                ? "bg-muted text-foreground hover:bg-muted/80"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/80"
            }`}
          >
            {micOn ? "🎤 Mic" : "🎤 Off"}
          </button>
        </div>
      </div>
    </div>
  );
}