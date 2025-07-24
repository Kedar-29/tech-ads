"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Agency = {
  id: string;
  name: string;
};

type DeviceSummary = {
  id: string;
  name: string;
};

type DeviceDetail = {
  id: string;
  name: string;
  model: string;
  size: string;
  status: string;
  apiEndpoint: string;
  publicKey: string;
  secretKey: string;
  agency: Agency | null;
};

export default function DevicesListWithDetails() {
  const [deviceSummaries, setDeviceSummaries] = useState<DeviceSummary[]>([]);
  const [deviceDetailsMap, setDeviceDetailsMap] = useState<
    Record<string, DeviceDetail>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApiDocsFor, setShowApiDocsFor] = useState<Record<string, boolean>>(
    {}
  );

  // Fetch all devices summary on mount
  useEffect(() => {
    async function fetchDevices() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/devices", { credentials: "include" });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to fetch devices");
        }
        const data: DeviceSummary[] = await res.json();
        setDeviceSummaries(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchDevices();
  }, []);

  // Fetch details for each device summary
  useEffect(() => {
    if (deviceSummaries.length === 0) return;

    async function fetchDetails() {
      try {
        const detailsEntries = await Promise.all(
          deviceSummaries.map(async (device) => {
            const res = await fetch(`/api/devices/${device.id}`, {
              credentials: "include",
            });
            if (!res.ok) throw new Error(`Failed to fetch device ${device.id}`);
            const detail: DeviceDetail = await res.json();
            return [device.id, detail] as const;
          })
        );
        setDeviceDetailsMap(Object.fromEntries(detailsEntries));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching details");
      }
    }

    fetchDetails();
  }, [deviceSummaries]);

  if (loading) return <p className="text-center">Loading devices...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;
  if (deviceSummaries.length === 0)
    return <p className="text-center">No devices found.</p>;

  return (
    <div>
      {deviceSummaries.map((device) => {
        const detail = deviceDetailsMap[device.id];
        const showApiDocs = showApiDocsFor[device.id] ?? false;

        if (!detail) {
          // Loading detail for this device
          return (
            <Card
              key={device.id}
              className="max-w-md mx-auto my-4 shadow-md p-4"
            >
              <p>Loading details for {device.name}...</p>
            </Card>
          );
        }

        return (
          <Card key={detail.id} className="max-w-md mx-auto my-4 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {detail.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <strong>Model:</strong> {detail.model}
              </p>
              <p>
                <strong>Size:</strong> {detail.size}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`font-semibold ${
                    detail.status === "ACTIVE"
                      ? "text-green-600"
                      : detail.status === "INACTIVE"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {detail.status}
                </span>
              </p>
              <p>
                <strong>Assigned Agency:</strong>{" "}
                {detail.agency ? detail.agency.name : "Not assigned"}
              </p>

              {showApiDocs && (
                <div className="mt-4 rounded border border-gray-300 p-4 bg-gray-50 dark:bg-gray-900">
                  <h4 className="font-semibold mb-2">API Docs</h4>
                  <p>
                    <strong>API Endpoint:</strong>{" "}
                    <code className="break-all">{detail.apiEndpoint}</code>
                  </p>
                  <p>
                    <strong>Public Key:</strong>{" "}
                    <code className="break-all">{detail.publicKey}</code>
                  </p>
                  <p>
                    <strong>Secret Key:</strong>{" "}
                    <code className="break-all">{detail.secretKey}</code>
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setShowApiDocsFor((prev) => ({
                    ...prev,
                    [device.id]: !prev[device.id],
                  }))
                }
              >
                {showApiDocs ? "Hide API Docs" : "Show API Docs"}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
