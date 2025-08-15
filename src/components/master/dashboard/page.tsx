"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusCount {
  PENDING?: number;
  RESOLVED?: number;
  REJECTED?: number;
}

interface DevicesPerAgency {
  agencyName: string;
  deviceCount: number;
  [key: string]: string | number;
}

interface ClientsPerAgency {
  agencyName: string;
  clientCount: number;
  [key: string]: string | number;
}

interface AgencyComplaintCounts {
  [agencyName: string]: StatusCount;
}

interface StatsData {
  totalAgencies: number;
  totalDevices: number;
  totalClients: number;
  devicesPerAgency: DevicesPerAgency[];
  agencyComplaintCounts: AgencyComplaintCounts;
  clientsPerAgency: ClientsPerAgency[];
  totalAdsCount: number;
}

export default function MasterDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<string>("");

  useEffect(() => {
    fetch("/api/master/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("https://api.quotable.io/random?tags=business")
      .then((res) => res.json())
      .then((data) => setQuote(data.content))
      .catch(() =>
        setQuote(
          "Success usually comes to those who are too busy to be looking for it."
        )
      );
  }, []);

  if (loading || !stats) {
    return <Skeleton className="h-[600px] w-full rounded-lg" />;
  }

  const statsCards = [
    {
      label: "Agencies",
      value: stats.totalAgencies,
      color: "from-blue-400 to-blue-600",
    },
    {
      label: "Devices",
      value: stats.totalDevices,
      color: "from-green-400 to-green-600",
    },
    {
      label: "Clients",
      value: stats.totalClients,
      color: "from-yellow-400 to-yellow-600",
    },
    {
      label: "Ads",
      value: stats.totalAdsCount,
      color: "from-purple-400 to-purple-600",
    },
  ];

  const rowClass =
    "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200";

  const renderTable = <
    T extends { [key in K]: string | number },
    K extends keyof T
  >(
    title: string,
    headers: string[],
    rows: T[],
    rowKey: K,
    renderCells: (item: T) => React.ReactNode
  ) => (
    <Card className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md rounded-lg">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="font-medium text-gray-700 dark:text-gray-300 text-left px-4 py-2 border-b border-gray-200 dark:border-gray-700"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <tr
                  key={String(item[rowKey])}
                  className={`${rowClass} ${
                    index % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50 dark:bg-gray-800"
                  }`}
                >
                  {renderCells(item)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderStatusBadge = (
    status: number,
    type: "PENDING" | "RESOLVED" | "REJECTED"
  ) => {
    let color = "bg-gray-400 text-white";
    if (type === "PENDING") color = "bg-yellow-400 text-gray-900";
    if (type === "RESOLVED") color = "bg-green-500 text-white";
    if (type === "REJECTED") color = "bg-red-500 text-white";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Quote Banner */}
      <div className="p-4 rounded-md bg-gradient-to-r from-indigo-400 to-pink-400 dark:from-indigo-700 dark:to-pink-700 text-center italic text-white font-medium shadow-md">
        {quote}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <Card
            key={card.label}
            className={`flex flex-col items-center justify-center p-6 border border-gray-300 dark:border-gray-700 bg-gradient-to-r ${card.color} text-white shadow-lg rounded-lg`}
          >
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-sm mt-1">{card.label}</p>
          </Card>
        ))}
      </div>

      {/* Devices Table */}
      <div className="space-y-4">
        {renderTable<DevicesPerAgency, "agencyName">(
          "Devices Per Agency",
          ["Agency", "Devices"],
          stats.devicesPerAgency,
          "agencyName",
          (item) => (
            <>
              <td className="px-4 py-2 font-medium text-blue-600 dark:text-blue-400">
                {item.agencyName}
              </td>
              <td className="px-4 py-2 font-semibold text-green-600 dark:text-green-400">
                {item.deviceCount}
              </td>
            </>
          )
        )}

        {/* Clients Table */}
        {renderTable<ClientsPerAgency, "agencyName">(
          "Clients Per Agency",
          ["Agency", "Clients"],
          stats.clientsPerAgency,
          "agencyName",
          (item) => (
            <>
              <td className="px-4 py-2 font-medium text-yellow-600 dark:text-yellow-400">
                {item.agencyName}
              </td>
              <td className="px-4 py-2 font-semibold text-purple-600 dark:text-purple-400">
                {item.clientCount}
              </td>
            </>
          )
        )}

        {/* Complaints Table */}
        {renderTable<
          {
            agencyName: string;
            PENDING: number;
            RESOLVED: number;
            REJECTED: number;
          },
          "agencyName"
        >(
          "Agency Complaints",
          ["Agency", "Pending", "Resolved", "Rejected"],
          Object.entries(stats.agencyComplaintCounts).map(
            ([agencyName, counts]) => ({
              agencyName,
              PENDING: counts?.PENDING ?? 0,
              RESOLVED: counts?.RESOLVED ?? 0,
              REJECTED: counts?.REJECTED ?? 0,
            })
          ),
          "agencyName",
          (item) => (
            <>
              <td className="px-4 py-2 font-medium text-indigo-600 dark:text-indigo-400">
                {item.agencyName}
              </td>
              <td className="px-4 py-2">
                {renderStatusBadge(item.PENDING, "PENDING")}
              </td>
              <td className="px-4 py-2">
                {renderStatusBadge(item.RESOLVED, "RESOLVED")}
              </td>
              <td className="px-4 py-2">
                {renderStatusBadge(item.REJECTED, "REJECTED")}
              </td>
            </>
          )
        )}
      </div>
    </div>
  );
}
