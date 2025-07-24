"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface PlayedAd {
  id: string;
  adTitle: string;
  deviceName: string;
  clientName: string;
  playedAt: string;
  duration: string;
}

export default function CompletedAdsTable() {
  const [ads, setAds] = useState<PlayedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompletedAds() {
      try {
        const res = await fetch("/api/master/agency/ads/history");
        if (!res.ok) throw new Error("Failed to fetch completed ads");
        const data = await res.json();

        if (!Array.isArray(data)) {
          setError("API did not return a list");
          return;
        }

        setAds(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load completed ads.");
      } finally {
        setLoading(false);
      }
    }

    fetchCompletedAds();
  }, []);

  if (loading)
    return <p className="text-muted-foreground">Loading completed ads...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (ads.length === 0)
    return <p className="text-muted-foreground">No ads played yet.</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Completed Ad Plays</h2>
      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Title</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Played At</TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ads.map((ad) => (
              <TableRow key={ad.id}>
                <TableCell className="font-medium">{ad.adTitle}</TableCell>
                <TableCell>{ad.deviceName}</TableCell>
                <TableCell>{ad.clientName}</TableCell>
                <TableCell>
                  {new Date(ad.playedAt).toLocaleString("en-IN")}
                </TableCell>
                <TableCell>{ad.duration}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
