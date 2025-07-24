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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

const hours = Array.from({ length: 19 }, (_, i) => i + 5);
const ITEMS_PER_PAGE = 5;

const isAssignmentCompleted = (endTimeISO: string): boolean => {
  return new Date() >= new Date(endTimeISO);
};

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
  const totalPages = Math.ceil(assignments.length / ITEMS_PER_PAGE);
  const paginatedAssignments = assignments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/assignments").then((res) => res.json()),
      fetch("/api/ads").then((res) => res.json()),
    ])
      .then(([assignmentsRes, adsArray]) => {
        console.log("Assignments API response:", assignmentsRes);
        console.log("Ads API response:", adsArray);

        if (Array.isArray(assignmentsRes.assignments)) {
          setAssignments(assignmentsRes.assignments);
        } else {
          console.warn("Invalid assignments data:", assignmentsRes);
          setAssignments([]);
        }

        if (Array.isArray(adsArray)) {
          setAds(adsArray);
        } else {
          console.warn("Invalid ads data:", adsArray);
          setAds([]);
        }
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

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
      end.setDate(end.getDate() + 1); // handle overnight
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
      const res = await fetch(`/api/assignments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Deleted assignment");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🎯 Manage Ad Assignments</h1>
        <p className="text-sm text-muted-foreground">
          Update or remove ad assignments
        </p>
      </div>

      {loading ? (
        <p className="text-center py-10">Loading assignments...</p>
      ) : assignments.length === 0 ? (
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
                  const isCompleted = isAssignmentCompleted(a.endTime);

                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
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
                          className={`text-xs font-semibold ${
                            isCompleted ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {isCompleted ? "Completed" : "Upcoming"}
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
                          disabled={isCompleted}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteAssignment(a.id)}
                          disabled={isCompleted}
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

          {/* Pagination */}
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
                  {hours.map((h) => (
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
                  {hours.map((h) => (
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
