"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export default function PlayerPage() {
  const [key, setKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [assignedButNotPlaying, setAssignedButNotPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const connectDevice = async () => {
    setMessage(null);
    try {
      const res = await fetch("/api/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to connect device");
        return;
      }

      setIsConnected(true);
      setMessage(data.message || "Device connected and activated");
    } catch {
      setMessage("Network error connecting device");
    }
  };

  const disconnectDevice = async () => {
    if (!isConnected) return;

    try {
      await fetch("/api/player/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
        keepalive: true,
      });
      setIsConnected(false);
      setMessage("Device disconnected");
      setVideoUrl(null);
      setTitle(null);
      setAssignedButNotPlaying(false);
    } catch {
      // ignore errors
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (key) {
        navigator.sendBeacon("/api/player/disconnect", JSON.stringify({ key }));
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      disconnectDevice();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [key]);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!isConnected || !key) return;
      try {
        const res = await fetch("/api/player/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });

        const data = await res.json();
        if (!res.ok) {
          setVideoUrl(null);
          setTitle(null);
          setAssignedButNotPlaying(data.assignedButNotPlaying || false);
          return;
        }

        setVideoUrl(data.videoUrl || null);
        setTitle(data.title || null);
        setAssignedButNotPlaying(data.assignedButNotPlaying || false);
      } catch {
        setVideoUrl(null);
        setTitle(null);
        setAssignedButNotPlaying(false);
      }
    };

    fetchVideo();
  }, [isConnected, key]);

  // Trigger fullscreen when videoUrl is available and video is ready
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !videoUrl) return;

    const handleLoadedData = async () => {
      try {
        await videoEl.requestFullscreen?.();
      } catch (e) {
        console.warn("Fullscreen not allowed", e);
      }
    };

    videoEl.addEventListener("loadeddata", handleLoadedData);
    return () => {
      videoEl.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [videoUrl]);

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      {!isConnected ? (
        <>
          <h2 className="text-xl font-semibold">Device Player Login</h2>
          <input
            type="text"
            placeholder="Enter device key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <Button
            onClick={connectDevice}
            disabled={!key.trim()}
            className="w-full"
          >
            Connect Device
          </Button>
          {message && <p className="text-sm text-red-600">{message}</p>}
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold">Device Connected</h2>
          <p className="text-green-600">{message}</p>
          {videoUrl ? (
            <>
              <h3 className="text-lg font-medium">{title}</h3>
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full rounded shadow"
                autoPlay
                loop
                controls
              />
            </>
          ) : assignedButNotPlaying ? (
            <p className="text-yellow-600 font-semibold">
              Ad is assigned but not playing right now.
            </p>
          ) : (
            <p className="text-gray-500">No ad assigned for current hour.</p>
          )}
          <Button
            onClick={() => {
              disconnectDevice();
            }}
            className="mt-4 bg-red-600 text-white"
          >
            Disconnect
          </Button>
        </>
      )}
    </div>
  );
}
