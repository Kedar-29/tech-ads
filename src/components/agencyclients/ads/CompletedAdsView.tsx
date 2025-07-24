"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react"; // or any icon library you have

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
  date: string; // ISO string
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

        const data = await res.json();

        if (!res.ok) {
          const message =
            typeof data === "object" && "error" in data
              ? data.error
              : "Failed to fetch ads";
          setError(message ?? "Unknown error");
          return;
        }

        if (Array.isArray(data)) {
          setAssignments(data);
          setError(null);
        } else {
          setError("Unexpected server response");
        }
      } catch {
        setError("Failed to fetch ads");
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, []);

  if (loading)
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-full mb-6 rounded-md" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md mb-3" />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="text-center text-destructive py-12 font-semibold max-w-2xl mx-auto">
        {error}
      </div>
    );

  if (assignments.length === 0)
    return (
      <div className="text-center text-muted-foreground py-12 max-w-2xl mx-auto">
        No played ads found.
      </div>
    );

  return (
    <div className="overflow-x-auto max-w-6xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <Table className="min-w-full">
        <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
          <TableRow>
            <TableHead className="text-left font-semibold text-gray-700 px-4 py-3">
              Ad Title
            </TableHead>
            <TableHead className="text-left font-semibold text-gray-700 px-4 py-3">
              Played On
            </TableHead>
            <TableHead className="text-left font-semibold text-gray-700 px-4 py-3">
              Device
            </TableHead>
            <TableHead className="text-left font-semibold text-gray-700 px-4 py-3">
              Ad File
            </TableHead>
            <TableHead className="text-left font-semibold text-gray-700 px-4 py-3">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map(({ id, ad, device, date }, idx) => (
            <TableRow
              key={id}
              className={`transition-colors duration-200 cursor-default ${
                idx % 2 === 0 ? "bg-gray-50" : "bg-white"
              } hover:bg-gray-100`}
            >
              <TableCell className="max-w-[250px] truncate px-4 py-3 font-medium text-gray-900">
                {ad.title}
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-700">
                {format(new Date(date), "dd MMM yyyy")}
              </TableCell>
              <TableCell className="px-4 py-3 text-gray-700">
                {device.name}
              </TableCell>
              <TableCell className="px-4 py-3">
                <a
                  href={ad.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-primary hover:underline font-semibold"
                >
                  <span>View Video</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge variant="secondary" className="text-xs py-1 px-2">
                  Completed
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
