// app/master/agency/ads/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface LiveAd {
  id: string;
  adTitle: string;
  deviceName: string;
  clientName: string;
  date: string;
  startTime: string;
  endTime: string;
  adPreviewUrl: string;
}

export default function LiveAdsPage() {
  const [ads, setAds] = useState<LiveAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLiveAds() {
      try {
        const res = await fetch("/api/master/agency/ads");
        if (!res.ok) throw new Error("Failed to fetch live ads");
        const data = await res.json();
        if (!Array.isArray(data)) {
          setError("Unexpected response format");
          setAds([]);
          return;
        }
        setAds(data);
      } catch {
        setError("Failed to load live ads.");
        setAds([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveAds();
  }, []);

  if (loading) return <p>Loading live ads...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (ads.length === 0) return <p>No live ads currently.</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Live Ads</h2>
      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Title</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ads.map((ad) => (
              <TableRow key={ad.id}>
                <TableCell className="font-medium">{ad.adTitle}</TableCell>
                <TableCell>{ad.deviceName}</TableCell>
                <TableCell>{ad.clientName}</TableCell>
                <TableCell>{new Date(ad.date).toLocaleDateString()}</TableCell>
                <TableCell>{ad.startTime}</TableCell>
                <TableCell>{ad.endTime}</TableCell>
                <TableCell>
                  {ad.adPreviewUrl.endsWith(".mp4") ? (
                    <video
                      src={ad.adPreviewUrl}
                      controls
                      className="w-[150px] h-[80px] rounded object-cover"
                    />
                  ) : (
                    <img
                      src={ad.adPreviewUrl}
                      alt={ad.adTitle}
                      className="w-[150px] h-[80px] rounded object-cover"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
