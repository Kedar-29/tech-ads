"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type ClientInput = {
  name: string;
  businessName: string;
  businessEmail: string;
  password: string;
  whatsappNumber: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
};

const initialState: ClientInput = {
  name: "",
  businessName: "",
  businessEmail: "",
  password: "",
  whatsappNumber: "",
  area: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
};

export function AddAgencyClientForm() {
  const [form, setForm] = useState<ClientInput>(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/agency-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add client");

      setMessage("Client added successfully");
      setForm(initialState);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatLabel = (key: string) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

  return (
    <div className="w-full sm:w-[50vw] mx-auto p-6 bg-white rounded-md shadow-md">
      <h2 className="text-2xl font-semibold mb-6">Add Agency Client</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading) handleSubmit();
        }}
        className="space-y-5"
      >
        {Object.keys(form).map((key) => (
          <div key={key} className="flex flex-col">
            <Label htmlFor={key} className="mb-1 font-medium text-gray-700">
              {formatLabel(key)}
            </Label>
            <Input
              id={key}
              name={key}
              type={key === "password" ? "password" : "text"}
              placeholder={formatLabel(key)}
              value={(form as Record<string, string>)[key]}
              onChange={handleChange}
              required
            />
          </div>
        ))}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Adding..." : "Add Client"}
        </Button>
      </form>

      {message && (
        <>
          <Separator className="my-4" />
          <p
            className={`text-center text-sm ${
              message.includes("success") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        </>
      )}
    </div>
  );
}
