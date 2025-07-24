"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  MouseEvent,
} from "react";
import { useRouter } from "next/navigation";

type RGB = { r: number; g: number; b: number };

type NavItem = {
  id: string;
  label: string;
  href?: string;
  target?: "_blank" | "_self";
  onClick?: () => void;
};

type HeroSectionProps = {
  heading?: string;
  tagline?: string;
  buttonText?: string;
  imageUrl?: string;
  videoUrl?: string;
  navItems?: NavItem[];
};

const parseRgbColor = (colorString: string): RGB | null => {
  const match = colorString.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/
  );
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
    };
  }
  return null;
};

const PlayIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8 5V19L19 12L8 5Z" />
  </svg>
);

export const HeroSection: React.FC<HeroSectionProps> = ({
  heading = "Something you really want",
  tagline = "You can't live without this product. I'm sure of it.",
  buttonText = "Get Started",
  imageUrl,
  videoUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef<HTMLButtonElement>(null);
  const mousePosRef = useRef<{
    x: number | null;
    y: number | null;
  }>({ x: null, y: null });
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameIdRef = useRef<number>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  const resolvedCanvasColorsRef = useRef<{ strokeStyle: RGB }>({
    strokeStyle: { r: 128, g: 128, b: 128 },
  });

  const router = useRouter();

  useEffect(() => {
    const tempElement = document.createElement("div");
    tempElement.style.display = "none";
    document.body.appendChild(tempElement);

    const updateResolvedColors = () => {
      tempElement.style.color = "var(--foreground)";
      const computed = getComputedStyle(tempElement).color;
      const parsed = parseRgbColor(computed);
      resolvedCanvasColorsRef.current.strokeStyle =
        parsed ??
        (document.documentElement.classList.contains("dark")
          ? { r: 250, g: 250, b: 250 }
          : { r: 10, g: 10, b: 10 });
    };

    updateResolvedColors();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          updateResolvedColors();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
      document.body.removeChild(tempElement);
    };
  }, []);

  const drawArrow = useCallback(() => {
    const canvas = canvasRef.current;
    const target = targetRef.current;
    const ctx = ctxRef.current;
    const mouse = mousePosRef.current;

    if (!canvas || !target || !ctx || mouse.x === null || mouse.y === null)
      return;

    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const angle = Math.atan2(cy - mouse.y, cx - mouse.x);
    const x1 = cx - Math.cos(angle) * (rect.width / 2 + 12);
    const y1 = cy - Math.sin(angle) * (rect.height / 2 + 12);

    const midX = (mouse.x + x1) / 2;
    const midY = (mouse.y + y1) / 2;
    const offset = Math.min(200, Math.hypot(x1 - mouse.x, y1 - mouse.y) * 0.5);
    const t = Math.max(-1, Math.min(1, (mouse.y - y1) / 200));
    const controlX = midX;
    const controlY = midY + offset * t;

    const dist = Math.sqrt((x1 - mouse.x) ** 2 + (y1 - mouse.y) ** 2);
    const opacity = Math.min(1.0, (dist - rect.width / 2) / 500);

    const strokeColor = resolvedCanvasColorsRef.current.strokeStyle;
    ctx.strokeStyle = `rgba(${strokeColor.r}, ${strokeColor.g}, ${strokeColor.b}, ${opacity})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);

    ctx.beginPath();
    ctx.moveTo(mouse.x, mouse.y);
    ctx.quadraticCurveTo(controlX, controlY, x1, y1);
    ctx.stroke();

    // Draw arrowhead
    const arrowAngle = Math.atan2(y1 - controlY, x1 - controlX);
    const headLength = 10;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(
      x1 - headLength * Math.cos(arrowAngle - Math.PI / 6),
      y1 - headLength * Math.sin(arrowAngle - Math.PI / 6)
    );
    ctx.moveTo(x1, y1);
    ctx.lineTo(
      x1 - headLength * Math.cos(arrowAngle + Math.PI / 6),
      y1 - headLength * Math.sin(arrowAngle + Math.PI / 6)
    );
    ctx.stroke();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctxRef.current = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouse = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouse as any);
    resizeCanvas();

    const loop = () => {
      const ctx = ctxRef.current;
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawArrow();
      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouse as any);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [drawArrow]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const onEnd = () => {
      setShowVideo(false);
      video.currentTime = 0;
    };

    if (showVideo) {
      video.play().catch(console.error);
      video.addEventListener("ended", onEnd);
    } else {
      video.pause();
    }

    return () => video.removeEventListener("ended", onEnd);
  }, [showVideo, videoUrl]);

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <main className="flex-grow flex flex-col items-center justify-center">
        <h1 className="text-4xl sm:text-5xl font-semibold text-center px-4 mt-10">
          {heading}
        </h1>
        <p className="mt-4 text-center text-muted-foreground text-lg max-w-xl px-4">
          {tagline}
        </p>

        <div className="mt-6">
          <button
            ref={targetRef}
            className="py-2 px-4 rounded-lg border border-foreground hover:border-foreground/80"
            onClick={() => router.push("/signin")}
          >
            {buttonText}
          </button>
        </div>

        <div className="mt-12 w-full max-w-2xl px-4">
          <div className="relative h-72 rounded-3xl overflow-hidden border border-border">
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  showVideo ? "opacity-0" : "opacity-100"
                }`}
              />
            )}
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                muted
                playsInline
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  showVideo ? "opacity-100" : "opacity-0"
                }`}
              />
            )}
            {!showVideo && videoUrl && (
              <button
                onClick={() => setShowVideo(true)}
                className="absolute bottom-4 left-4 z-20 p-3 bg-accent/30 hover:bg-accent/50 text-accent-foreground backdrop-blur-sm rounded-full"
                aria-label="Play video"
              >
                <PlayIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </main>

      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10"
      />
    </div>
  );
};
