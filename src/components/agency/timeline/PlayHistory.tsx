"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface PlayLog {
  id: string;
  playedAt: string;
  ad: { title: string };
  device: { name: string };
  client: { businessName: string };
}

const ITEMS_PER_PAGE = 10;

export default function PlayHistory() {
  const [history, setHistory] = useState<PlayLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);

  useEffect(() => {
    fetch("/api/timeline/history")
      .then((res) => res.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]));
  }, []);

  const paginatedHistory = history.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          🕓 Ad Play History
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          See all previously played ads and the time they were played.
        </p>
      </div>

      {history.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">
          No play history available.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Played At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedHistory.map((log, idx) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.ad.title}
                    </TableCell>
                    <TableCell>{log.client.businessName}</TableCell>
                    <TableCell>{log.device.name}</TableCell>
                    <TableCell>
                      {new Date(log.playedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
