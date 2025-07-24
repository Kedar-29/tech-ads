"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Ad {
  id: string;
  title: string;
  fileUrl?: string | null;
}

interface Device {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  clientId: string;
  deviceId: string;
  adId: string;
  date: string; // ISO string from backend (can keep but unused here)
  startTime: string; // ISO string
  endTime: string; // ISO string
  createdAt: string;
  ad: Ad;
  device: Device;
}

export default function ScheduledAdsView() {
  const [ads, setAds] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agency-clients-api/ads/schedules")
      .then((res) => res.json())
      .then((data: Assignment[]) => {
        setAds(data);
      })
      .catch((err) => {
        console.error("Error fetching scheduled ads:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-[160px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        ✅ All caught up! No upcoming ads scheduled.
      </div>
    );
  }

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
        📅 Upcoming Scheduled Ads
      </h1>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {ads.map((ad) => {
          const start = new Date(ad.startTime);
          const end = new Date(ad.endTime);

          return (
            <Card
              key={ad.id}
              className="border hover:shadow-sm transition-shadow"
            >
              <CardHeader className="pb-2">
                <CardTitle className="truncate">📺 Ad: {ad.ad.title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Scheduled on {start.toLocaleDateString()}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 text-sm">
                <p>
                  <strong>Device:</strong> {ad.device.name}
                </p>
                <p>
                  <strong>Time:</strong>{" "}
                  {start.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  –{" "}
                  {end.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                <div className="mt-2">
                  <Badge variant="secondary">Upcoming</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
