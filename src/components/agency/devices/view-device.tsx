"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Device {
  id: string;
  uuid: string;
  name: string;
  model: string;
  size: string;
  latitude: number;
  longitude: number;
  apiEndpoint: string;
  publicKey: string;
  secretKey: string;
  status: string;
}

export default function AgencyDeviceList() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchDevices() {
      try {
        const res = await fetch("/api/agencies/devices", {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to fetch devices");
          setDevices([]);
          return;
        }

        setDevices(data);
      } catch {
        toast.error("Error fetching devices");
        setDevices([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDevices();
  }, []);

  return (
    <div className="max-w-6xl mx-auto w-full px-4 md:px-6 py-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Registered Devices
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Devices associated with your agency
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-[180px] rounded-lg" />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">
          No devices found for your agency.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <Card key={device.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">{device.name}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  UUID: {device.uuid}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <strong>Model:</strong> {device.model}
                </p>
                <p>
                  <strong>Size:</strong> {device.size}
                </p>
                <p>
                  <strong>Location:</strong> {device.latitude},{" "}
                  {device.longitude}
                </p>
                <p className="flex items-center gap-2">
                  <strong>Status:</strong>
                  <Badge
                    variant={
                      device.status === "ACTIVE"
                        ? "default"
                        : device.status === "INACTIVE"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {device.status}
                  </Badge>
                </p>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    API Endpoint:
                  </p>
                  <code className="break-all text-xs block bg-muted p-1 rounded">
                    {device.apiEndpoint}
                  </code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
