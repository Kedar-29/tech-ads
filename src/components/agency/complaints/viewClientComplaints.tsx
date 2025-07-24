"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { format } from "date-fns";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ClientInfo {
  id: string;
  name: string;
  businessName: string;
  businessEmail: string;
}

type ComplaintStatus = "PENDING" | "RESOLVED" | "REJECTED";

interface Complaint {
  id: string;
  message: string;
  reply?: string;
  status: ComplaintStatus;
  createdAt: string;
  client: ClientInfo;
}

const STATUSES: ComplaintStatus[] = ["PENDING", "RESOLVED", "REJECTED"];
const ITEMS_PER_PAGE = 5;
type ReplyMap = Record<string, string>;
type LoadingMap = Record<string, boolean>;

export default function ViewClientComplaintsByAgency() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [replyMap, setReplyMap] = useState<ReplyMap>({});
  const [loadingMap, setLoadingMap] = useState<LoadingMap>({});
  const [statusFilter, setStatusFilter] = useState<"ALL" | ComplaintStatus>(
    "ALL"
  );
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchComplaints = async (): Promise<void> => {
    try {
      const res = await fetch(`/api/agency-clients-api/complaints/agency`);
      const json = (await res.json()) as {
        complaints?: Complaint[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error || "Failed to load complaints");
      }
      setComplaints(json.complaints ?? []);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to load complaints");
      }
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleStatusUpdate = async (
    id: string,
    newStatus: ComplaintStatus
  ): Promise<void> => {
    const current = complaints.find((c) => c.id === id);
    const reply = (replyMap[id] ?? current?.reply ?? "").trim();
    if (!reply) {
      toast.error("Reply is required");
      return;
    }

    setLoadingMap((prev) => ({ ...prev, [id]: true }));

    try {
      const res = await fetch(
        `/api/agency-clients-api/complaints/agency/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, reply, status: newStatus }),
        }
      );

      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error || "Failed to update complaint");
      }

      toast.success(`Complaint marked as ${newStatus}`);
      await fetchComplaints();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update complaint");
      }
    } finally {
      setLoadingMap((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleReplyChange = (id: string, value: string): void => {
    setReplyMap((prev) => ({ ...prev, [id]: value }));
  };

  const filtered =
    statusFilter === "ALL"
      ? complaints
      : complaints.filter((c) => c.status === statusFilter);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            🧾 Client Complaints
          </h2>
          <p className="text-sm text-muted-foreground">
            Review and respond to client-submitted complaints.
          </p>
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {paginated.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">
          No complaints to display.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="min-w-[160px]">Reply</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((c, index) => (
                <TableRow key={c.id} className="align-top">
                  <TableCell className="text-muted-foreground">
                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{c.client.businessName}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.client.businessEmail}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs whitespace-pre-line">
                    {c.message}
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(c.createdAt), "PPP p")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Textarea
                      rows={3}
                      value={replyMap[c.id] ?? c.reply ?? ""}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        handleReplyChange(c.id, e.target.value)
                      }
                      placeholder="Type your reply…"
                    />
                  </TableCell>
                  <TableCell className="capitalize text-sm font-medium">
                    {c.status.toLowerCase()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <Button
                        size="sm"
                        variant={c.status === "PENDING" ? "default" : "outline"}
                        onClick={() => handleStatusUpdate(c.id, "PENDING")}
                        disabled={loadingMap[c.id]}
                      >
                        Pending
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleStatusUpdate(c.id, "RESOLVED")}
                        disabled={loadingMap[c.id]}
                      >
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusUpdate(c.id, "REJECTED")}
                        disabled={loadingMap[c.id]}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
