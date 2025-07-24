"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
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
  fileUrl: string;
}

interface Device {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  date: string;
  ad: Ad;
  device: Device;
}

export default function AgencyPlayedAds() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const res = await fetch("/api/agency-clients-api/ads/history", {
          credentials: "include",
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          setError(
            typeof errorData === "object" && "error" in errorData
              ? (errorData as { error?: string }).error ?? "Failed to fetch ads"
              : "Failed to fetch ads"
          );
          setAssignments([]);
          setLoading(false);
          return;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setAssignments(data);
          setError(null);
        } else if (data && typeof data === "object" && "error" in data) {
          setError((data as { error?: string }).error ?? "Error");
          setAssignments([]);
        } else {
          setError("Unexpected server response");
          setAssignments([]);
        }
      } catch {
        setError("Failed to fetch ads");
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, []);

  if (loading)
    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[180px] w-full rounded-lg" />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="text-center text-destructive py-12 font-semibold">
        {error}
      </div>
    );

  if (assignments.length === 0)
    return (
      <div className="text-center text-muted-foreground py-12">
        No played ads found.
      </div>
    );

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 px-4">
      {assignments.map(({ id, ad, device, date }) => (
        <Card key={id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-1">
            <CardTitle className="truncate">📺 {ad.title}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Played on {format(new Date(date), "dd MMM yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-sm">
            <p>
              <strong>Device:</strong> {device.name}
            </p>
            <p>
              <strong>Ad File:</strong>{" "}
              <a
                href={ad.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                View Video
              </a>
            </p>
            <Badge variant="outline" className="mt-2 w-fit text-xs">
              Completed
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
