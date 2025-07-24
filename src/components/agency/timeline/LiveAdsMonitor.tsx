"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface LiveAd {
  id: string;
  device?: {
    name: string;
    uuid: string;
    status: string;
  };
  ad?: {
    title: string;
    fileUrl?: string; // <-- Corrected field name here
  };
  client?: {
    businessName: string;
  };
  startTime: string;
  endTime: string;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getAdDuration(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const diffInMin = Math.max(
    Math.floor((end.getTime() - start.getTime()) / 60000),
    0
  );
  const hours = Math.floor(diffInMin / 60);
  const minutes = diffInMin % 60;
  if (hours && minutes) return `${hours} hr ${minutes} min`;
  if (hours) return `${hours} hr${hours > 1 ? "s" : ""}`;
  return `${minutes} min`;
}

export default function LiveAdsMonitor() {
  const [liveAds, setLiveAds] = useState<LiveAd[] | null>(null);

  useEffect(() => {
    fetch("/api/timeline/live")
      .then((res) => res.json())
      .then((data) => {
        setLiveAds(Array.isArray(data) ? data : []);
      })
      .catch(() => setLiveAds([]));
  }, []);

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 tracking-tight">
        📺 Live Ads Monitor
      </h2>

      {liveAds === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
          ))}
        </div>
      ) : liveAds.length === 0 ? (
        <p className="text-muted-foreground">No ads are currently playing.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveAds.map((item) => {
            const status = item.device?.status ?? "Unknown";
            const statusVariant =
              status.toLowerCase() === "active" ? "default" : "destructive";

            return (
              <Card
                key={item.id}
                className="rounded-xl shadow-md hover:shadow-lg transition-shadow border"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center">
                    <span className="truncate w-[80%]">
                      {item.ad?.title ?? "Untitled Ad"}
                    </span>
                    <Badge
                      variant={statusVariant}
                      className="text-xs capitalize"
                    >
                      {status}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 text-sm">
                  <Info
                    label="Device"
                    value={item.device?.name ?? "Unknown Device"}
                  />
                  <Info
                    label="Client"
                    value={item.client?.businessName ?? "Unknown Client"}
                  />
                  <Info
                    label="Scheduled Time"
                    value={`${formatTime(item.startTime)} – ${formatTime(
                      item.endTime
                    )}`}
                  />
                  <Info
                    label="Ad Duration"
                    value={getAdDuration(item.startTime, item.endTime)}
                  />

                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      Preview
                    </p>
                    {item.ad?.fileUrl ? (
                      <div className="aspect-video overflow-hidden rounded-md border bg-muted">
                        <video
                          src={item.ad.fileUrl}
                          controls
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">
                        No video available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
