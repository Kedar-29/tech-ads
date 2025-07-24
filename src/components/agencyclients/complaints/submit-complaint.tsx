"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2Icon } from "lucide-react";

interface ClientComplaint {
  id: string;
  message: string;
  reply?: string;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  createdAt: string;
}

export default function ClientComplaintForm() {
  const [complaints, setComplaints] = useState<ClientComplaint[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchComplaints = async () => {
    try {
      const res = await fetch("/api/agency-clients-api/complaints/clients");
      if (!res.ok) throw new Error("Failed to fetch complaints");
      const data = await res.json();
      setComplaints(data.complaints || []);
    } catch {
      toast.error("Failed to load complaints.");
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Message cannot be empty.");
      return;
    }

    setLoading(true);

    try {
      let res: Response;

      if (editingId) {
        res = await fetch(
          `/api/agency-clients-api/complaints/clients/${editingId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
          }
        );
      } else {
        res = await fetch("/api/agency-clients-api/complaints/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      toast.success(editingId ? "Complaint updated." : "Complaint submitted.");
      setMessage("");
      setEditingId(null);
      fetchComplaints();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (id: string, currentMessage: string) => {
    setEditingId(id);
    setMessage(currentMessage);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setMessage("");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <Card>
        <CardHeader>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Submit a Complaint
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            We will review and respond promptly.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue or concern..."
            rows={4}
          />

          <div className="flex gap-2 justify-end">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Update Complaint" : "Submit Complaint"}
            </Button>

            {editingId && (
              <Button
                variant="outline"
                onClick={cancelEditing}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator className="my-10" />

      <div>
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Complaint History
        </h2>

        {complaints.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No complaints submitted yet.
          </p>
        ) : (
          <div className="space-y-4">
            {complaints.map((c) => (
              <Card key={c.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {c.message}
                      </p>

                      <div className="text-sm text-gray-500">
                        <p>
                          Status:{" "}
                          <span
                            className={
                              c.status === "RESOLVED"
                                ? "text-green-600 font-semibold"
                                : c.status === "REJECTED"
                                ? "text-red-600 font-semibold"
                                : "text-yellow-600 font-semibold"
                            }
                          >
                            {c.status}
                          </span>
                        </p>

                        <p>
                          Submitted on:{" "}
                          <span className="font-mono text-xs">
                            {format(new Date(c.createdAt), "PPP p")}
                          </span>
                        </p>
                      </div>

                      {c.reply && (
                        <div className="p-3 bg-gray-100 rounded-md border text-sm text-gray-700">
                          <strong className="block mb-1 text-gray-600">
                            Reply:
                          </strong>
                          {c.reply}
                        </div>
                      )}
                    </div>

                    {c.status === "PENDING" && (
                      <div className="sm:mt-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(c.id, c.message)}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
