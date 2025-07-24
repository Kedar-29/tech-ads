"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type StatsResponse = {
  stats: {
    totalDevices: number;
    totalClients: number;
    totalAdsCount: number;
    deviceStatusCounts: Record<string, number>;
    devicesPerClient: { clientName: string; deviceCount: number }[];
    clientComplaintCounts: Record<string, Record<string, number>>;
    adsAssignedPerClient: { clientName: string; assignedAdCount: number }[];
  };
};

const COLORS = ["#34d399", "#f87171", "#facc15", "#60a5fa", "#c084fc"];

export default function AgencyDashboard() {
  const [data, setData] = useState<StatsResponse["stats"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/agency")
      .then((res) => res.json())
      .then((json: StatsResponse) => {
        setData(json.stats);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-96 col-span-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Totals */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Overview</h2>
          <div className="space-y-2 text-sm">
            <p>
              Total Devices:{" "}
              <span className="font-medium">{data.totalDevices}</span>
            </p>
            <p>
              Total Clients:{" "}
              <span className="font-medium">{data.totalClients}</span>
            </p>
            <p>
              Total Ads:{" "}
              <span className="font-medium">{data.totalAdsCount}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Device Status Pie */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Device Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={Object.entries(data.deviceStatusCounts).map(
                  ([name, value]) => ({ name, value })
                )}
                cx="50%"
                cy="50%"
                outerRadius={70}
                label
                dataKey="value"
              >
                {Object.keys(data.deviceStatusCounts).map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Devices Per Client Bar */}
      <Card className="md:col-span-2">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Devices Per Client</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.devicesPerClient}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="clientName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="deviceCount" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ads Assigned Per Client */}
      <Card className="md:col-span-1">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Ads Assigned Per Client
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.adsAssignedPerClient}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="clientName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="assignedAdCount" fill="#facc15" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Complaint Stats */}
      <Card className="md:col-span-1">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Client Complaints</h2>
          <div className="space-y-3 text-sm">
            {Object.entries(data.clientComplaintCounts).map(
              ([client, statuses]) => (
                <div key={client}>
                  <p className="font-medium">{client}</p>
                  <ul className="ml-4 list-disc">
                    {Object.entries(statuses).map(([status, count]) => (
                      <li key={status}>
                        {status}: {count}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
