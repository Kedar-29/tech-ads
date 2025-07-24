"use client";

import { useEffect, useState, useRef, ChangeEvent } from "react";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";

type ComplaintStatus = "PENDING" | "RESOLVED" | "REJECTED";

interface Complaint {
  id: string;
  message: string;
  reply?: string;
  status: ComplaintStatus;
  createdAt: string;
}

const ITEMS_PER_PAGE = 5;
const STATUS_OPTIONS: Array<"ALL" | ComplaintStatus> = [
  "ALL",
  "PENDING",
  "RESOLVED",
  "REJECTED",
];

export default function SubmitComplaintForm() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | ComplaintStatus>(
    "ALL"
  );

  const [currentPage, setCurrentPage] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchComplaints = async () => {
    try {
      const res = await fetch("/api/agency-complaints/self");
      const data: { complaints: Complaint[] } = await res.json();
      setComplaints(data.complaints || []);
    } catch {
      toast.error("Failed to load complaints.");
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (modalOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [modalOpen]);

  const filtered = complaints.filter((c) =>
    statusFilter === "ALL" ? true : c.status === statusFilter
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const openNewComplaint = () => {
    setEditingId(null);
    setMessage("");
    setModalOpen(true);
  };

  const openEditComplaint = (c: Complaint) => {
    setEditingId(c.id);
    setMessage(c.message);
    setModalOpen(true);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!message.trim()) {
      toast.error("Message is required.");
      return;
    }

    setLoading(true);
    const url = editingId
      ? `/api/agency-complaints/${editingId}`
      : "/api/agency-complaints";
    const method = editingId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Submission failed.");
      }

      toast.success(editingId ? "Complaint updated." : "Complaint submitted.");
      setModalOpen(false);
      setEditingId(null);
      setMessage("");
      fetchComplaints();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            📬 My Complaints
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and manage complaints you have submitted.
          </p>
        </div>

        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(val) =>
              setStatusFilter(val as "ALL" | ComplaintStatus)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={openNewComplaint}>New Complaint</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">
          No complaints to display.
        </p>
      ) : (
        <>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reply</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((c, i) => (
                  <TableRow key={c.id} className="align-top">
                    <TableCell>
                      {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                    </TableCell>
                    <TableCell className="max-w-sm whitespace-pre-wrap">
                      {c.message}
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(c.createdAt), "PPP p")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block text-xs font-semibold px-3 py-0.5 rounded-full ${
                          c.status === "RESOLVED"
                            ? "bg-green-100 text-green-700"
                            : c.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md text-sm whitespace-pre-wrap text-muted-foreground">
                      {c.reply || (
                        <em className="text-xs text-gray-400">No reply yet</em>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditComplaint(c)}
                        >
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Complaint" : "New Complaint"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update your previous complaint message."
                : "Type your complaint for the agency."}
            </DialogDescription>
          </DialogHeader>

          <Textarea
            ref={textareaRef}
            rows={6}
            value={message}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setMessage(e.target.value)
            }
            placeholder="Type your complaint..."
          />

          <DialogFooter className="mt-6 flex justify-end gap-4">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading
                ? editingId
                  ? "Updating..."
                  : "Submitting..."
                : editingId
                ? "Update"
                : "Submit"}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setModalOpen(false);
                setEditingId(null);
                setMessage("");
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
