"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Pencil, Save } from "lucide-react";

interface Master {
  id: string;
  name: string;
  email: string;
  // Add more fields here if needed
}

export default function MasterProfile() {
  const [master, setMaster] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Master>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile/master")
      .then((res) => res.json())
      .then((data) => {
        setMaster(data);
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
      const res = await fetch("/api/profile/master", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();
      setMaster(updated);
      setEditMode(false);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!master) {
    return (
      <div className="text-center py-10 text-red-600">
        Failed to load Master profile.
      </div>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto mt-12 shadow-lg border border-gray-200">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-2xl font-bold">Master Profile</CardTitle>
        <Button
          variant="outline"
          onClick={() => {
            if (editMode) setFormData(master); // reset changes on cancel
            setEditMode(!editMode);
          }}
          disabled={saving}
        >
          <Pencil className="w-4 h-4 mr-2" />
          {editMode ? "Cancel" : "Edit"}
        </Button>
      </CardHeader>

      <Separator />

      <CardContent className="flex flex-col items-center space-y-6 p-6">
        <Avatar className="w-32 h-32 border">
          <AvatarImage
            src={`/api/avatar/master/${master.id}`}
            alt={master.name}
            onError={(e) =>
              ((
                e.target as HTMLImageElement
              ).src = `https://avatars.dicebear.com/api/initials/${master.name}.svg`)
            }
          />
          <AvatarFallback>{master.name[0]}</AvatarFallback>
        </Avatar>

        {editMode ? (
          <div className="w-full max-w-sm space-y-4">
            <div>
              <Label
                htmlFor="name"
                className="text-sm font-medium text-muted-foreground"
              >
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                placeholder="Full Name"
              />
            </div>

            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium text-muted-foreground"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                placeholder="Email"
              />
            </div>

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold">{master.name}</h2>
            <p className="text-muted-foreground">{master.email}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
