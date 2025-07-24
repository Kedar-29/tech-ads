"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";

interface Agency {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export default function ViewAllAgencies() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/agencies", { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAgencies(data);
        } else {
          toast.error(data.error || "Failed to load agencies");
          setAgencies([]);
        }
      })
      .catch(() => {
        toast.error("Failed to load agencies");
        setAgencies([]);
      });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agency?")) return;

    const res = await fetch(`/api/agencies/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      toast.success("Agency deleted");
      setAgencies((prev) => prev.filter((a) => a.id !== id));
    } else {
      toast.error("Failed to delete agency");
    }
  };

  const handleEditClick = (agency: Agency) => {
    setEditingAgency({ ...agency }); // clone to avoid mutation
    setOpen(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof Agency
  ) => {
    if (!editingAgency) return;
    setEditingAgency({ ...editingAgency, [key]: e.target.value });
  };

  const handleSave = async () => {
    if (!editingAgency) return;

    const res = await fetch(`/api/agencies/${editingAgency.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingAgency),
      credentials: "include",
    });

    if (res.ok) {
      toast.success("Agency updated");
      setAgencies((prev) =>
        prev.map((a) => (a.id === editingAgency.id ? editingAgency : a))
      );
      setOpen(false);
    } else {
      toast.error("Failed to update agency");
    }
  };

  return (
    <>
      <div className="mt-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agencies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No agencies found.
                </TableCell>
              </TableRow>
            ) : (
              agencies.map((agency) => (
                <TableRow key={agency.id}>
                  <TableCell>{agency.name}</TableCell>
                  <TableCell>{agency.email}</TableCell>
                  <TableCell>{agency.phone}</TableCell>
                  <TableCell>{agency.city}</TableCell>
                  <TableCell>{agency.state}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(agency)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(agency.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Agency</DialogTitle>
          </DialogHeader>

          {editingAgency && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-4"
            >
              {(
                [
                  "name",
                  "email",
                  "password",
                  "phone",
                  "area",
                  "city",
                  "state",
                  "country",
                  "pincode",
                ] as (keyof Agency)[]
              ).map((key) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={key}>{key}</Label>
                  <Input
                    id={key}
                    type={key === "password" ? "password" : "text"}
                    value={editingAgency?.[key] ?? ""}
                    onChange={(e) => handleChange(e, key)}
                    required
                  />
                </div>
              ))}

              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
