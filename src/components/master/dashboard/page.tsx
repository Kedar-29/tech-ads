"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const COLORS = ["#4ade80", "#60a5fa", "#facc15", "#f87171", "#a78bfa"];

interface StatusCount {
  [key: string]: number;
}

interface DevicesPerAgency {
  agencyName: string;
  deviceCount: number;
}

interface ClientComplaintStatusCounts {
  [key: string]: number;
}

interface AgencyComplaintCounts {
  [agencyName: string]: StatusCount;
}

interface ClientsPerAgency {
  agencyName: string;
  clientCount: number;
}

interface StatsData {
  totalAgencies: number;
  totalDevices: number;
  totalClients: number;
  deviceStatusCounts?: StatusCount;
  complaintStatusCounts?: StatusCount;
  devicesPerAgency: DevicesPerAgency[];
  agencyComplaintCounts: AgencyComplaintCounts;
  clientsPerAgency: ClientsPerAgency[];
  clientComplaintStatusCounts: ClientComplaintStatusCounts;
  adStatusCounts: StatusCount;
  totalAdsCount: number;
}

const formatStatusData = (
  statusCounts?: StatusCount
): { name: string; value: number }[] =>
  Object.entries(statusCounts ?? {}).map(([name, value]) => ({ name, value }));

export default function MasterDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/master/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <Skeleton className="h-[600px] w-full rounded-lg" />;
  }

  const deviceStatusData = formatStatusData(stats.deviceStatusCounts);
  const complaintStatusData = formatStatusData(stats.complaintStatusCounts);
  const clientComplaintData = formatStatusData(
    stats.clientComplaintStatusCounts
  );

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card className={cn("rounded-xl shadow-md", "bg-blue-100")}>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Total Agencies
            </h3>
            <p className="text-3xl font-extrabold text-black">
              {stats.totalAgencies}
            </p>
          </CardContent>
        </Card>
        <Card className={cn("rounded-xl shadow-md", "bg-green-100")}>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Total Devices
            </h3>
            <p className="text-3xl font-extrabold text-black">
              {stats.totalDevices}
            </p>
          </CardContent>
        </Card>
        <Card className={cn("rounded-xl shadow-md", "bg-yellow-100")}>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Total Clients
            </h3>
            <p className="text-3xl font-extrabold text-black">
              {stats.totalClients}
            </p>
          </CardContent>
        </Card>
        <Card className={cn("rounded-xl shadow-md", "bg-purple-100")}>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800">Total Ads</h3>
            <p className="text-3xl font-extrabold text-black">
              {stats.totalAdsCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* First row charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Device Status - Pie Chart */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-700">
              Device Status
            </h2>
            {deviceStatusData.length === 0 ? (
              <p className="text-center text-gray-500">No device status data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={deviceStatusData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label
                  >
                    {deviceStatusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Complaint Status - Bar Chart */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-700">
              Complaint Status
            </h2>
            {complaintStatusData.length === 0 ? (
              <p className="text-center text-gray-500">No complaint data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={complaintStatusData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f87171" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Devices Per Agency - Line Chart */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-700">
              Devices Per Agency
            </h2>
            {stats.devicesPerAgency.length === 0 ? (
              <p className="text-center text-gray-500">No agency device data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.devicesPerAgency}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
                  <XAxis
                    dataKey="agencyName"
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={60}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="deviceCount"
                    stroke="#4ade80"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second row charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Agency Complaint Status - Stacked Bar Chart */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-700">
              Agency Complaints
            </h2>
            {Object.keys(stats.agencyComplaintCounts).length === 0 ? (
              <p className="text-center text-gray-500">
                No agency complaints data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(stats.agencyComplaintCounts).map(
                    ([agencyName, statusCounts]) => ({
                      agencyName,
                      ...statusCounts,
                    })
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="agencyName"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="PENDING" stackId="a" fill="#facc15" />
                  <Bar dataKey="RESOLVED" stackId="a" fill="#4ade80" />
                  <Bar dataKey="REJECTED" stackId="a" fill="#f87171" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Clients Per Agency - Bar Chart */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-700">
              Clients Per Agency
            </h2>
            {stats.clientsPerAgency.length === 0 ? (
              <p className="text-center text-gray-500">No client data</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.clientsPerAgency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="agencyName"
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={60}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="clientCount" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Client Complaint Status - Pie Chart */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-700">
              Client Complaint Status
            </h2>
            {clientComplaintData.length === 0 ? (
              <p className="text-center text-gray-500">
                No client complaint data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={clientComplaintData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    label
                  >
                    {clientComplaintData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
