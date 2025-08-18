"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Assignment {
  id: string;
  client?: { id: string; businessName: string };
  device?: { id: string; name: string };
  ad?: { id: string; title: string; fileUrl: string };
  startTime: string;
  endTime: string;
}

interface Ad {
  id: string;
  title: string;
  fileUrl: string;
}

const hours = Array.from({ length: 19 }, (_, i) => i + 5); // 5AM - 11PM
const ROW_OPTIONS = [5, 10, 20, 50];

export default function AssignmentsManager() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);

  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [selectedAdId, setSelectedAdId] = useState("");

  const [viewAdUrl, setViewAdUrl] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const getAssignmentStatus = (
    startTimeISO: string,
    endTimeISO: string
  ): "Upcoming" | "Live" | "Completed" => {
    const now = new Date();
    const start = new Date(startTimeISO);
    const end = new Date(endTimeISO);

    if (now < start) return "Upcoming";
    if (now >= start && now <= end) return "Live";
    return "Completed";
  };

  const sortedAssignments = assignments.slice().sort((a, b) => {
    const now = new Date();
    const aStart = new Date(a.startTime);
    const aEnd = new Date(a.endTime);
    const bStart = new Date(b.startTime);
    const bEnd = new Date(b.endTime);

    const aStatus = aStart > now ? 1 : aEnd < now ? 3 : 2; // 1=upcoming, 2=live, 3=completed
    const bStatus = bStart > now ? 1 : bEnd < now ? 3 : 2;

    if (aStatus !== bStatus) return aStatus - bStatus;

    return aStart.getTime() - bStart.getTime();
  });

  const totalPages = Math.ceil(sortedAssignments.length / itemsPerPage);
  const paginatedAssignments = sortedAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/assignments").then((res) => res.json()),
      fetch("/api/ads").then((res) => res.json()),
    ])
      .then(([assignmentsRes, adsArray]) => {
        if (Array.isArray(assignmentsRes.assignments))
          setAssignments(assignmentsRes.assignments);
        else setAssignments([]);

        if (Array.isArray(adsArray)) setAds(adsArray);
        else setAds([]);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => setCurrentPage(1), [itemsPerPage]);

  const openEditDialog = (assignment: Assignment) => {
    setEditing(assignment);
    setStartHour(
      new Date(assignment.startTime).getHours().toString().padStart(2, "0")
    );
    setEndHour(
      new Date(assignment.endTime).getHours().toString().padStart(2, "0")
    );
    setSelectedAdId(assignment.ad?.id ?? "");
    setEditOpen(true);
  };

  const getAvailableHours = (assignment: Assignment | null) => {
    if (!assignment) return [];
    const now = new Date();
    const startDate = new Date(assignment.startTime);
    return hours.filter((h) => {
      if (
        startDate.getFullYear() === now.getFullYear() &&
        startDate.getMonth() === now.getMonth() &&
        startDate.getDate() === now.getDate()
      ) {
        return h > now.getHours();
      }
      return true;
    });
  };

  const saveEdit = async () => {
    if (!editing || !startHour || !endHour || !selectedAdId) {
      toast.error("Please fill in all fields");
      return;
    }

    const originalDate = new Date(editing.startTime);
    const start = new Date(originalDate);
    start.setHours(parseInt(startHour, 10), 0, 0, 0);
    const end = new Date(originalDate);
    end.setHours(parseInt(endHour, 10), 0, 0, 0);

    if (parseInt(endHour) <= parseInt(startHour)) {
      end.setDate(end.getDate() + 1);
    }

    if (start < new Date()) {
      toast.error("Cannot set start time in the past");
      return;
    }

    try {
      const res = await fetch(`/api/assignments/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          adId: selectedAdId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Update failed");
      }

      const { assignment } = await res.json();
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignment.id ? assignment : a))
      );
      toast.success("Assignment updated");
      setEditOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm("Delete this assignment?")) return;
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Deleted assignment");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">🎯 Manage Ad Assignments</h1>
          <p className="text-sm text-muted-foreground">
            Update or remove ad assignments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Label>Rows per page:</Label>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(v) => setItemsPerPage(parseInt(v))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROW_OPTIONS.map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-10">Loading assignments...</p>
      ) : paginatedAssignments.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground">
          No assignments found
        </p>
      ) : (
        <>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAssignments.map((a, i) => {
                  const startTime = new Date(a.startTime);
                  const endTime = new Date(a.endTime);
                  const date = new Date(startTime.toDateString());
                  const status = getAssignmentStatus(a.startTime, a.endTime);

                  const statusColor =
                    status === "Completed"
                      ? "text-red-600"
                      : status === "Live"
                      ? "text-blue-600"
                      : "text-green-600";

                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        {(currentPage - 1) * itemsPerPage + i + 1}
                      </TableCell>
                      <TableCell>{a.client?.businessName ?? "—"}</TableCell>
                      <TableCell>{a.ad?.title ?? "—"}</TableCell>
                      <TableCell>{a.device?.name ?? "—"}</TableCell>
                      <TableCell>
                        {isNaN(date.getTime())
                          ? "—"
                          : date.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {!isNaN(startTime.getTime()) &&
                        !isNaN(endTime.getTime())
                          ? `${startTime.getHours()}:00 - ${endTime.getHours()}:00`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-semibold ${statusColor}`}
                        >
                          {status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewAdUrl(a.ad?.fileUrl || null)}
                          disabled={!a.ad?.fileUrl}
                        >
                          View Ad
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(a)}
                          disabled={status === "Live" || status === "Completed"}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteAssignment(a.id)}
                          disabled={status === "Live" || status === "Completed"}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>Change ad and time.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveEdit();
            }}
            className="space-y-4"
          >
            <div>
              <Label>Start Time</Label>
              <Select value={startHour} onValueChange={setStartHour}>
                <SelectTrigger>
                  <SelectValue placeholder="Start time" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableHours(editing!).map((h) => (
                    <SelectItem key={h} value={h.toString().padStart(2, "0")}>
                      {h % 12 || 12} {h < 12 ? "AM" : "PM"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>End Time</Label>
              <Select value={endHour} onValueChange={setEndHour}>
                <SelectTrigger>
                  <SelectValue placeholder="End time" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableHours(editing!)
                    .filter((h) => parseInt(h.toString()) > parseInt(startHour))
                    .map((h) => (
                      <SelectItem key={h} value={h.toString().padStart(2, "0")}>
                        {h % 12 || 12} {h < 12 ? "AM" : "PM"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ad</Label>
              <Select value={selectedAdId} onValueChange={setSelectedAdId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ad" />
                </SelectTrigger>
                <SelectContent>
                  {ads.map((ad) => (
                    <SelectItem key={ad.id} value={ad.id}>
                      {ad.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full">
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Ad Dialog */}
      <Dialog open={!!viewAdUrl} onOpenChange={() => setViewAdUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Ad</DialogTitle>
          </DialogHeader>
          {viewAdUrl ? (
            <video controls className="w-full rounded-lg" src={viewAdUrl} />
          ) : (
            <p>No video available</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
