"use client";

import { useEffect, useRef, useState } from "react";

export default function PlayerPage() {
  const [key, setKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [assignedButNotPlaying, setAssignedButNotPlaying] = useState(false);
  const [futureAds, setFutureAds] = useState<
    { title: string; startTime: string }[]
  >([]);
  const [showUI, setShowUI] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Connect device and mark ACTIVE
  const connectDevice = async () => {
    if (!key.trim()) return;
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
      localStorage.setItem("deviceKey", key);
    } catch {
      setMessage("Network error connecting device");
    }
  };

  // Disconnect device
  const disconnectDevice = async () => {
    if (!isConnected) return;
    try {
      await fetch("/api/player/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
        keepalive: true,
      });
    } catch {}
    setIsConnected(false);
    setMessage("Device disconnected");
    setVideoUrl(null);
    setTitle(null);
    setAssignedButNotPlaying(false);
    setFutureAds([]);
    localStorage.removeItem("deviceKey");
    setShowUI(true);
    document.body.style.cursor = "default";
  };

  // Auto disconnect on window close
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

  // Load saved device key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("deviceKey");
    if (savedKey) {
      setKey(savedKey);
      setIsConnected(true);
    }
  }, []);

  // Poll video ads periodically
  useEffect(() => {
    if (!isConnected || !key) return;

    const fetchVideo = async () => {
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
          setFutureAds(data.futureAds || []);
          setShowUI(true);
          document.body.style.cursor = "default";
          return;
        }

        setVideoUrl(data.videoUrl || null);
        setTitle(data.title || null);
        setAssignedButNotPlaying(data.assignedButNotPlaying || false);

        if (data.videoUrl) {
          setShowUI(false);
          document.body.style.cursor = "none";
        } else {
          setShowUI(true);
          document.body.style.cursor = "default";
        }

        setFutureAds(data.futureAds || []);
      } catch {
        setVideoUrl(null);
        setTitle(null);
        setAssignedButNotPlaying(false);
        setFutureAds([]);
        setShowUI(true);
        document.body.style.cursor = "default";
      }
    };

    fetchVideo();
    const interval = setInterval(fetchVideo, 15000);
    return () => clearInterval(interval);
  }, [isConnected, key]);

  // Always fullscreen video
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !videoUrl) return;

    const startFullscreen = async () => {
      try {
        if (document.fullscreenElement !== videoEl) {
          await videoEl.requestFullscreen?.();
        }
        await videoEl.play();
      } catch (e) {
        console.warn("Fullscreen not allowed", e);
      }
    };

    videoEl.addEventListener("canplay", startFullscreen);
    return () => videoEl.removeEventListener("canplay", startFullscreen);
  }, [videoUrl]);

  // Toggle UI on Escape key & connect on Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowUI((prev) => !prev);
        document.body.style.cursor = showUI ? "none" : "default";
      }
      if (e.key === "Enter" && !isConnected) {
        connectDevice();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showUI, key, isConnected]);

  return (
    <div className="h-screen w-screen bg-white relative overflow-hidden">
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          className="fixed top-0 left-0 w-screen h-screen object-cover z-0"
          autoPlay
          loop
          muted
          controls={false}
          playsInline
          onContextMenu={(e) => e.preventDefault()}
        />
      )}

      {showUI && (
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center z-10 gap-6 text-gray-900 px-4">
          {!isConnected ? (
            <>
              <h2 className="text-3xl font-bold">Device Player Login</h2>
              <input
                type="text"
                placeholder="Enter device key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="px-4 py-3 rounded border border-gray-400 w-full max-w-sm text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoFocus
              />
              <button
                onClick={connectDevice}
                disabled={!key.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded text-xl disabled:opacity-50 hover:bg-blue-700 transition"
              >
                Connect Device
              </button>
              {message && <p className="text-red-600 mt-2">{message}</p>}
            </>
          ) : assignedButNotPlaying ? (
            <div className="text-center">
              <p className="text-orange-500 font-semibold mb-2">
                No ad playing now, but scheduled ads:
              </p>
              <ul className="list-disc pl-6 text-lg">
                {futureAds.map((ad, idx) => (
                  <li key={idx}>
                    {ad.title} – {new Date(ad.startTime).toLocaleTimeString()}
                  </li>
                ))}
              </ul>
            </div>
          ) : !videoUrl ? (
            <p className="text-gray-700 text-xl">No ad assigned today.</p>
          ) : null}

          {isConnected && videoUrl === null && (
            <button
              onClick={disconnectDevice}
              className="bg-red-600 px-4 py-2 rounded absolute top-4 right-4 hover:bg-red-700 transition"
            >
              Disconnect
            </button>
          )}
        </div>
      )}
    </div>
  );
}
