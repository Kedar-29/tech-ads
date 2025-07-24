"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { VideoIcon } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  fileUrl: string;
}

export default function AdList() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  async function fetchAds() {
    setLoading(true);
    try {
      const res = await fetch("/api/ads");
      if (!res.ok) throw new Error("Failed to fetch ads");
      const data: Ad[] = await res.json();
      setAds(data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this ad?")) return;
    try {
      const res = await fetch(`/api/ads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete ad");
      toast.success("Ad deleted");
      setAds((prev) => prev.filter((ad) => ad.id !== id));
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4 space-y-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="rounded-md w-full h-40" />
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        No ads found.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-foreground mb-1">
          Ad Library
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your uploaded ads. Edit or remove them as needed.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map(({ id, title, fileUrl }) => (
          <Card key={id} className="p-4 space-y-3 shadow-md border rounded-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg text-foreground line-clamp-1">
                {title}
              </h2>
              <VideoIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <AspectRatio ratio={16 / 9}>
              <video
                src={fileUrl}
                className="w-full h-full rounded-md border object-cover"
                controls
                preload="metadata"
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0;
                }}
              />
            </AspectRatio>
            <div className="flex justify-end gap-2">
              <Link href={`/roles/agency/ads/edit/${id}`}>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </Link>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(id)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
