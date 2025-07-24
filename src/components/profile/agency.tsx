"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Pencil, Save, User } from "lucide-react";

// Modal Component
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

interface Agency {
  id: string;
  name: string;
  email: string;
  phone: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface Master {
  id: string;
  name: string;
  email: string;
  phone?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  // add more fields if needed
}

export default function AgencyProfile() {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Agency>>({});
  const [saving, setSaving] = useState(false);

  // Master modal states
  const [master, setMaster] = useState<Master | null>(null);
  const [masterLoading, setMasterLoading] = useState(false);
  const [masterModalOpen, setMasterModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/profile/agency")
      .then((res) => res.json())
      .then((data) => {
        setAgency(data);
        setFormData(data);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/agency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      const updated = await res.json();
      setAgency(updated);
      setEditMode(false);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const fetchMasterDetails = async () => {
    setMasterLoading(true);
    setMasterModalOpen(true);
    try {
      const res = await fetch("/api/profile/master");
      if (!res.ok) throw new Error("Failed to fetch Master details");
      const data = await res.json();
      setMaster(data);
    } catch (error) {
      alert((error as Error).message);
      setMasterModalOpen(false);
    } finally {
      setMasterLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="text-center py-10 text-red-600 font-semibold">
        Failed to load Agency profile.
      </div>
    );
  }

  return (
    <>
      <Card className="max-w-4xl mx-auto mt-12 shadow-xl border border-gray-300 rounded-lg">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-3xl font-extrabold tracking-tight text-gray-900">
            Agency Profile
          </CardTitle>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (editMode) {
                  setFormData(agency); // reset form data on cancel
                }
                setEditMode(!editMode);
              }}
              disabled={saving}
            >
              <Pencil className="w-4 h-4 mr-2" />
              {editMode ? "Cancel" : "Edit"}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchMasterDetails}
              aria-label="View Master Details"
            >
              <User className="w-4 h-4 mr-2" /> View Master
            </Button>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="p-6 space-y-8">
          <div className="flex items-start gap-8">
            <Avatar className="w-28 h-28 border-2 border-gray-300 shadow-sm">
              <AvatarImage
                src={`/api/avatar/agency/${agency.id}`}
                alt={agency.name}
                onError={(e) => {
                  (
                    e.target as HTMLImageElement
                  ).src = `https://avatars.dicebear.com/api/identicon/${agency.id}.svg`;
                }}
              />
              <AvatarFallback className="text-4xl font-bold text-gray-700">
                {agency.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-5">
              {editMode ? (
                <>
                  <Input
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="Agency Name"
                    className="text-lg font-semibold"
                    autoFocus
                  />
                  <Input
                    name="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    placeholder="Email"
                  />
                  <Input
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    placeholder="Phone"
                  />
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {agency.name}
                  </h2>
                  <p className="text-gray-600">{agency.email}</p>
                  <p className="text-gray-600">Phone: {agency.phone}</p>
                </>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: "Area", field: "area" },
              { label: "City", field: "city" },
              { label: "State", field: "state" },
              { label: "Country", field: "country" },
              { label: "Pincode", field: "pincode" },
            ].map(({ label, field }) => (
              <div key={field}>
                <Label className="block font-semibold text-sm text-gray-700 mb-1">
                  {label}
                </Label>
                {editMode ? (
                  <Input
                    name={field}
                    value={formData[field as keyof Agency] || ""}
                    onChange={handleChange}
                    placeholder={label}
                  />
                ) : (
                  <p className="mt-1 text-gray-700 font-medium">
                    {agency[field as keyof Agency] || "-"}
                  </p>
                )}
              </div>
            ))}
          </div>

          {editMode && (
            <div className="pt-6">
              <Button
                onClick={handleSave}
                className="w-full"
                disabled={saving}
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-3" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Master Details Modal */}
      <Modal open={masterModalOpen} onClose={() => setMasterModalOpen(false)}>
        <h3 className="text-2xl font-bold mb-5 border-b pb-3 text-gray-900">
          Master Details
        </h3>
        {masterLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={36} />
          </div>
        ) : master ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-gray-800 font-medium text-base">
            <div>
              <span className="font-semibold text-gray-700">Name:</span>{" "}
              {master.name || "-"}
            </div>
            <div>
              <span className="font-semibold text-gray-700">Email:</span>{" "}
              {master.email || "-"}
            </div>
          </div>
        ) : (
          <p className="text-red-600 font-semibold">
            Failed to load master details.
          </p>
        )}
      </Modal>
    </>
  );
}
