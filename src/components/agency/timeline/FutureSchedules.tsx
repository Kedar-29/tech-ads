"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Schedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  ad: { title: string; videoUrl?: string };
  device: { name: string };
  client: { businessName: string };
}

export default function FutureSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/timeline/shedules") // fix typo here
      .then((res) => res.json())
      .then((data) => setSchedules(data.schedules || []))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          📅 Upcoming Ad Schedules
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          View scheduled ad campaigns awaiting playback.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No upcoming ad schedules found.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((item) => (
            <Card
              key={item.id}
              className="rounded-xl border shadow-sm transition hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex justify-between items-center">
                  <span className="truncate max-w-[80%]">{item.ad.title}</span>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {formatTime(item.startTime)} – {formatTime(item.endTime)}
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">📆 Date:</span>{" "}
                  {new Date(item.date).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium text-foreground">
                    🖥️ Device:
                  </span>{" "}
                  {item.device.name}
                </div>
                <div>
                  <span className="font-medium text-foreground">
                    👤 Client:
                  </span>{" "}
                  {item.client.businessName}
                </div>

                {/* Video preview */}
                {item.ad.videoUrl && (
                  <video
                    controls
                    width="100%"
                    height={180}
                    className="rounded-md mt-2"
                    src={item.ad.videoUrl}
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
