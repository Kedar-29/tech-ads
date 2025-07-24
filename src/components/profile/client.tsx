"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Save, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Client {
  id: string;
  name: string;
  businessName: string;
  businessEmail: string;
  whatsappNumber: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
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
        className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg"
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

export default function ClientProfile() {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [randomAvatar, setRandomAvatar] = useState<string>("");

  // Agency modal state
  const [agency, setAgency] = useState<Agency | null>(null);
  const [agencyLoading, setAgencyLoading] = useState(false);
  const [agencyModalOpen, setAgencyModalOpen] = useState(false);

  // Generate random avatar once
  useEffect(() => {
    const seed = Math.random().toString(36).substring(2, 10);
    setRandomAvatar(`https://avatars.dicebear.com/api/identicon/${seed}.svg`);
  }, []);

  useEffect(() => {
    fetch("/api/profile/client")
      .then((res) => res.json())
      .then((data) => {
        setClient(data);
        setFormData(data);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const res = await fetch("/api/profile/client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const updated = await res.json();
      setClient(updated);
      setEditMode(false);
    }
  };

  const fetchAgencyDetails = async () => {
    setAgencyLoading(true);
    setAgencyModalOpen(true);
    try {
      const res = await fetch("/api/profile/agency");
      if (!res.ok) throw new Error("Failed to fetch Agency details");
      const data = await res.json();
      setAgency(data);
    } catch (error) {
      alert((error as Error).message);
      setAgencyModalOpen(false);
    } finally {
      setAgencyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-purple-600" size={48} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-10 text-red-600">
        Failed to load client profile.
      </div>
    );
  }

  return (
    <>
      <Card className="max-w-4xl mx-auto mt-10 shadow-xl border border-gray-200 rounded-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-2xl font-bold">Client Profile</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setEditMode(!editMode)}>
              <Pencil className="w-4 h-4 mr-2" />
              {editMode ? "Cancel" : "Edit"}
            </Button>
            <Button variant="secondary" onClick={fetchAgencyDetails}>
              <User className="w-4 h-4 mr-2" /> View Agency
            </Button>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="p-6 space-y-6">
          {/* Avatar & Basic Info */}
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24 border">
              <AvatarImage
                src={`/api/avatar/client/${client.id}`}
                alt={client.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = randomAvatar;
                }}
              />
              <AvatarFallback>{client.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              {editMode ? (
                <>
                  <Input
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="Full Name"
                  />
                  <Input
                    name="businessEmail"
                    value={formData.businessEmail || ""}
                    onChange={handleChange}
                    placeholder="Email"
                  />
                  <Input
                    name="whatsappNumber"
                    value={formData.whatsappNumber || ""}
                    onChange={handleChange}
                    placeholder="WhatsApp Number"
                  />
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">{client.name}</h2>
                  <p className="text-muted-foreground">
                    {client.businessEmail}
                  </p>
                  <p className="text-muted-foreground">
                    WhatsApp: {client.whatsappNumber}
                  </p>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Business Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="font-medium text-sm text-muted-foreground">
                Business Name
              </Label>
              {editMode ? (
                <Input
                  name="businessName"
                  value={formData.businessName || ""}
                  onChange={handleChange}
                  placeholder="Business Name"
                />
              ) : (
                <p className="mt-1">{client.businessName}</p>
              )}
            </div>
          </div>

          {/* Address Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["area", "city", "state", "country", "pincode"].map((field) => (
              <div key={field}>
                <Label className="capitalize font-medium text-sm text-muted-foreground">
                  {field}
                </Label>
                {editMode ? (
                  <Input
                    name={field}
                    value={formData[field as keyof Client] || ""}
                    onChange={handleChange}
                    placeholder={field}
                  />
                ) : (
                  <p className="mt-1">{client[field as keyof Client]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Save Button */}
          {editMode && (
            <div className="pt-4">
              <Button onClick={handleSave} className="w-full">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agency Details Modal */}
      <Modal open={agencyModalOpen} onClose={() => setAgencyModalOpen(false)}>
        <h3 className="text-xl font-semibold mb-4">Agency Details</h3>
        {agencyLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : agency ? (
          <div className="space-y-3 text-gray-800">
            <p>
              <strong>Name:</strong> {agency.name}
            </p>
            <p>
              <strong>Email:</strong> {agency.email}
            </p>
            <p>
              <strong>Phone:</strong> {agency.phone}
            </p>
            <p>
              <strong>Area:</strong> {agency.area}
            </p>
            <p>
              <strong>City:</strong> {agency.city}
            </p>
            <p>
              <strong>State:</strong> {agency.state}
            </p>
            <p>
              <strong>Country:</strong> {agency.country}
            </p>
            <p>
              <strong>Pincode:</strong> {agency.pincode}
            </p>
          </div>
        ) : (
          <p className="text-red-600">Failed to load agency details.</p>
        )}
      </Modal>
    </>
  );
}
