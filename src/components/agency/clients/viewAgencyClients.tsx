"use client";

import { useEffect, useState, ChangeEvent } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type AgencyClient = {
  id: string;
  name: string;
  businessName: string;
  businessEmail: string;
  password?: string;
  whatsappNumber: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
};

const PAGE_LIMIT = 5;

export function ViewAgencyClients() {
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AgencyClient>>({});
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(clients.length / PAGE_LIMIT);
  const paginatedClients = clients.slice(
    (currentPage - 1) * PAGE_LIMIT,
    currentPage * PAGE_LIMIT
  );

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/agency-clients");
      const data: AgencyClient[] = await res.json();
      if (!res.ok) throw new Error("Failed to fetch clients");
      setClients(data);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const startEdit = (c: AgencyClient) => {
    setEditingId(c.id);
    setEditForm({ ...c, password: "" });
  };

  const handleEditChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (id: string) => {
    try {
      const body = { ...editForm };
      if (!body.password) delete body.password;

      const res = await fetch(`/api/agency-clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Client updated successfully");
      setEditingId(null);
      await fetchClients();
    } catch (err) {
      toast.error((err as Error).message || "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      const res = await fetch(`/api/agency-clients/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete client");
      toast.success("Client deleted");
      await fetchClients();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const fields: Array<keyof AgencyClient> = [
    "businessName",
    "name",
    "businessEmail",
    "whatsappNumber",
    "area",
    "city",
    "state",
    "country",
    "pincode",
    "password",
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Agency Clients
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your linked clients
        </p>
      </div>

      {clients.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No clients found.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Location
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {(currentPage - 1) * PAGE_LIMIT + i + 1}
                    </TableCell>

                    {editingId === c.id ? (
                      <>
                        <TableCell colSpan={4}>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSave(c.id);
                            }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            {fields.map((field) => (
                              <div key={field}>
                                <Label htmlFor={field} className="capitalize">
                                  {field === "businessEmail" ? "Email" : field}
                                </Label>
                                <Input
                                  name={field}
                                  id={field}
                                  type={
                                    field === "password" ? "password" : "text"
                                  }
                                  placeholder={
                                    field === "password"
                                      ? "Leave blank to keep unchanged"
                                      : ""
                                  }
                                  value={editForm[field] ?? ""}
                                  onChange={handleEditChange}
                                />
                              </div>
                            ))}

                            <div className="col-span-full flex gap-2 mt-2 justify-end">
                              <Button type="submit">Save</Button>
                              <Button variant="outline" onClick={cancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-medium">
                          {c.businessName}
                        </TableCell>
                        <TableCell>{c.businessEmail}</TableCell>
                        <TableCell>{c.whatsappNumber}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {[c.area, c.city, c.state, c.country, c.pincode]
                            .filter(Boolean)
                            .join(", ")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(c)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(c.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
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
