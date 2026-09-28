"use client";
import { useEffect, useRef, useState } from "react";

export default function WebcamPreview({
  isActive,
}: {
  isActive: boolean;
  onToggleSize: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    let didCancel = false;

    const startCamera = async () => {
      try {
        // Always stop existing first (if any)
        if (videoRef.current?.srcObject instanceof MediaStream) {
          (videoRef.current.srcObject as MediaStream)
            .getTracks()
            .forEach((track) => track.stop());
        }

        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!didCancel && videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        } else {
          // stopped before it started
          mediaStream.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.error("Camera access denied.", err);
      }
    };

    if (isActive) {
      startCamera();
    } else {
      // stop the stream when deactivating
      if (videoRef.current?.srcObject instanceof MediaStream) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      didCancel = true;
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current?.srcObject instanceof MediaStream) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [isActive]);


  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f1e2e] shadow-[0_12px_32px_rgba(15,30,46,0.22)] transition-all duration-300">
      {/* Video Content */}
      < div className="relative w-full h-full aspect-video" >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        {/* Subtle overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1e2e]/50 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-black/45 backdrop-blur text-white text-[11px] font-bold border border-white/15">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff6a3d] animate-pulse" />
          LIVE PREVIEW
        </div>
      </div >
    </div >
  );
}
