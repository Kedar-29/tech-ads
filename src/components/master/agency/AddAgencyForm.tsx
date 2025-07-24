"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  area: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
};

export default function AddAgencyForm() {
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/agencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      toast.success("Agency created successfully!");
      setFormData(initialForm);
    } else {
      const error = await res.json();
      toast.error(error.error || "Failed to create agency");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Add New Agency</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {Object.keys(formData).map((field) => (
              <div key={field}>
                <Label htmlFor={field}>{field}</Label>
                <Input
                  id={field}
                  name={field}
                  type={field === "password" ? "password" : "text"}
                  value={formData[field as keyof typeof formData]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Create Agency"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
