"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface Complaint {
  id: string;
  message: string;
  reply?: string;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  createdAt: string;
  agency: { id: string; name: string; email: string };
}

export default function ViewAgencyComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [filterAgency, setFilterAgency] = useState("");

  const fetchAll = async () => {
    const res = await fetch(
      `/api/agency-complaints/master${
        filterAgency ? `?agencyId=${filterAgency}` : ""
      }`
    );
    const data = await res.json();
    setComplaints(data.complaints || []);
  };

  useEffect(() => {
    fetchAll();
  }, [filterAgency]);

  const agencies = Array.from(
    new Map(complaints.map((c) => [c.agency.id, c.agency])).values()
  );

  const handleStatusUpdate = async (
    id: string,
    status: "PENDING" | "RESOLVED" | "REJECTED"
  ) => {
    const base = complaints.find((c) => c.id === id);
    const reply = (replyMap[id] ?? base?.reply)?.trim();

    if (!reply) {
      toast.error("Reply is required.");
      return;
    }

    setLoadingMap((prev) => ({ ...prev, [id]: true }));

    const res = await fetch(`/api/agency-complaints/master/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply, status }),
    });

    if (res.ok) {
      toast.success(`Complaint marked as ${status}`);
      fetchAll();
    } else {
      toast.error((await res.json()).error);
    }

    setLoadingMap((prev) => ({ ...prev, [id]: false }));
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-semibold">
            Agency Complaints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label
              htmlFor="agency-filter"
              className="text-sm text-muted-foreground"
            >
              Filter by Agency
            </Label>
            <select
              id="agency-filter"
              value={filterAgency}
              onChange={(e) => setFilterAgency(e.target.value)}
              className="mt-1 block w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-2"
            >
              <option value="">All Agencies</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {complaints.length === 0 && (
            <p className="text-center text-sm text-muted-foreground italic">
              No complaints found.
            </p>
          )}

          <div className="space-y-6">
            {complaints.map((c) => (
              <Card key={c.id} className="border border-border shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(c.createdAt), "PPP p")} &bull;{" "}
                      <span className="font-semibold text-foreground">
                        {c.agency.name}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        ({c.agency.email})
                      </span>
                    </div>
                    <div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          c.status === "RESOLVED"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : c.status === "REJECTED"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-base text-foreground leading-relaxed">
                    {c.message}
                  </p>

                  <div>
                    <Label
                      htmlFor={`reply-${c.id}`}
                      className="text-sm mb-1 block"
                    >
                      Your Reply
                    </Label>
                    <Textarea
                      id={`reply-${c.id}`}
                      value={replyMap[c.id] ?? c.reply ?? ""}
                      onChange={(e) =>
                        setReplyMap((prev) => ({
                          ...prev,
                          [c.id]: e.target.value,
                        }))
                      }
                      placeholder="Type your reply here…"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
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
                      variant={c.status === "RESOLVED" ? "default" : "outline"}
                      onClick={() => handleStatusUpdate(c.id, "RESOLVED")}
                      disabled={loadingMap[c.id]}
                    >
                      Resolved
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        c.status === "REJECTED" ? "destructive" : "outline"
                      }
                      onClick={() => handleStatusUpdate(c.id, "REJECTED")}
                      disabled={loadingMap[c.id]}
                    >
                      Rejected
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
