"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet icon issues
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

type DeviceStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

interface Ad {
  id: string;
  title: string;
  fileUrl: string;
}

interface Device {
  id: string;
  name: string;
  uuid: string;
  size: string;
  model: string;
  latitude: number;
  longitude: number;
  apiEndpoint: string;
  publicKey: string;
  secretKey: string;
  status: DeviceStatus;
}

interface Assignment {
  id: string;
  clientId: string;
  deviceId: string;
  adId: string;
  date: string; // ISO
  startTime: string; // ISO
  endTime: string; // ISO
  createdAt: string; // ISO
  ad: Ad;
  device: Device;
}

export default function ClientLiveAdsView() {
  const [ads, setAds] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    fetch("/api/agency-clients-api/ads/live")
      .then((res) => res.json())
      .then((data: Assignment[]) => setAds(data))
      .catch((err) => console.error("Error loading live ads:", err))
      .finally(() => setLoading(false));
  }, []);

  const handlePlay = (id: string) => {
    const video = videoRefs.current[id];
    if (video) {
      video.play().catch((err) => console.error("Playback failed", err));
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton className="h-[350px] rounded-xl" key={i} />
        ))}
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-20 h-20 text-muted-foreground mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17v-6h13M9 11H5a2 2 0 00-2 2v6h6l4-4-4-4z"
          />
        </svg>
        <h3 className="text-2xl font-semibold text-gray-800">
          No live ads running
        </h3>
        <p className="text-muted-foreground max-w-md mt-2 text-sm">
          Try again later or contact your agency to schedule a campaign.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4 md:px-8 bg-background">
      <div className="max-w-7xl mx-auto text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Live Ads Playing for Your Business
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Click on a card to see play details, device, and schedule.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {ads.map((ad) => {
          const start = new Date(ad.startTime);
          const end = new Date(ad.endTime);
          const date = new Date(ad.date);

          return (
            <Card
              key={ad.id}
              className="border shadow-sm hover:shadow-md transition rounded-xl"
            >
              <CardHeader>
                <CardTitle className="text-lg truncate text-foreground">
                  🎯 Ad on: {ad.device.name}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {date.toLocaleDateString()} |{" "}
                  {start.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  –{" "}
                  {end.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="font-medium text-sm text-muted-foreground truncate">
                  Ad: {ad.ad.title}
                </p>

                {ad.ad.fileUrl ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[ad.id] = el;
                    }}
                    src={ad.ad.fileUrl}
                    className="w-full rounded-md border aspect-video"
                    controls
                    preload="metadata"
                  />
                ) : (
                  <div className="text-sm mt-2 text-destructive font-medium">
                    ❌ No video available
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col sm:flex-row items-center gap-2 p-4 bg-muted rounded-b-xl">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl space-y-6">
                    <DialogHeader>
                      <DialogTitle className="text-xl">
                        Ad & Device Details
                      </DialogTitle>
                      <DialogDescription>
                        Additional info for current schedule & device
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p>
                          <strong>Ad ID:</strong> {ad.ad.id}
                        </p>
                        <p>
                          <strong>Ad Title:</strong> {ad.ad.title}
                        </p>
                        <p>
                          <strong>Video URL:</strong> {ad.ad.fileUrl ?? "N/A"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p>
                          <strong>Device:</strong> {ad.device.name}
                        </p>
                        <p>
                          <strong>Model:</strong> {ad.device.model}
                        </p>
                        <p>
                          <strong>Status:</strong>
                          <Badge
                            variant={
                              ad.device.status === "ACTIVE"
                                ? "default"
                                : "outline"
                            }
                            className="ml-1"
                          >
                            {ad.device.status}
                          </Badge>
                        </p>
                        <p>
                          <strong>Location:</strong> {ad.device.latitude},{" "}
                          {ad.device.longitude}
                        </p>
                      </div>
                    </div>

                    <div className="h-[280px] rounded-md overflow-hidden border">
                      <MapContainer
                        center={[ad.device.latitude, ad.device.longitude]}
                        zoom={13}
                        style={{ width: "100%", height: "100%" }}
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='© <a href="https://osm.org/copyright">OpenStreetMap</a>'
                        />
                        <Marker
                          position={[ad.device.latitude, ad.device.longitude]}
                        >
                          <Popup>{ad.device.name}</Popup>
                        </Marker>
                      </MapContainer>
                    </div>

                    <DialogClose asChild>
                      <Button variant="outline" className="w-full mt-4">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogContent>
                </Dialog>

                {ad.ad.fileUrl && (
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() => handlePlay(ad.id)}
                  >
                    ▶️ Play
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
