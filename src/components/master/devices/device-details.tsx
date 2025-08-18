"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Agency = { id: string; name: string };
type DeviceSummary = { id: string; name: string };
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

export default function DevicesTableView() {
  const [deviceSummaries, setDeviceSummaries] = useState<DeviceSummary[]>([]);
  const [deviceDetailsMap, setDeviceDetailsMap] = useState<
    Record<string, DeviceDetail>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApiDocsFor, setShowApiDocsFor] = useState<Record<string, boolean>>(
    {}
  );

  // Fetch devices
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

  // Fetch device details
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

  if (loading)
    return <p className="text-center text-gray-600 mt-8">Loading devices...</p>;
  if (error) return <p className="text-center text-red-600 mt-8">{error}</p>;
  if (deviceSummaries.length === 0)
    return <p className="text-center text-gray-700 mt-8">No devices found.</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse rounded-lg overflow-hidden shadow-md">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                Device Name
              </th>
              <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                Model
              </th>
              <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                Size
              </th>
              <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                Status
              </th>
              <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                Agency
              </th>
              <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                API Docs
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {deviceSummaries.map((device) => {
              const detail = deviceDetailsMap[device.id];
              const showApiDocs = showApiDocsFor[device.id] ?? false;

              if (!detail) {
                return (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td colSpan={6} className="px-6 py-4 text-gray-500">
                      Loading details for {device.name}...
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={detail.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 font-medium">{detail.name}</td>
                  <td className="px-6 py-4">{detail.model}</td>
                  <td className="px-6 py-4">{detail.size}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-semibold ${
                        detail.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : detail.status === "INACTIVE"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {detail.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {detail.agency?.name || "Not assigned"}
                  </td>
                  <td className="px-6 py-4">
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
                      {showApiDocs ? "Hide" : "Show"}
                    </Button>
                    {showApiDocs && (
                      <div className="mt-2 p-2 border border-gray-200 rounded bg-gray-50 text-gray-700 text-sm">
                        <p>
                          <strong>API Endpoint:</strong> {detail.apiEndpoint}
                        </p>
                        <p>
                          <strong>Public Key:</strong> {detail.publicKey}
                        </p>
                        <p>
                          <strong>Secret Key:</strong> {detail.secretKey}
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
