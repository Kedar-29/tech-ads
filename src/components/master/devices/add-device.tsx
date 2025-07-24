"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icon URLs to avoid 404 errors in Next.js
delete (L.Icon.Default.prototype as { _getIconUrl?: () => void })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapSelector({
  selected,
  onSelect,
}: {
  selected: { lat: number; lng: number } | null;
  onSelect: (coords: { lat: number; lng: number }) => void;
}) {
  const defaultCenter = selected || { lat: 19.076, lng: 72.8777 };

  function LocationMarker() {
    useMapEvents({
      click(e) {
        onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return selected ? <Marker position={selected} /> : null;
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: 280, width: "100%" }}
      className="rounded-md shadow-sm border"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker />
    </MapContainer>
  );
}

type Agency = {
  id: string;
  name: string;
};

export default function AddDeviceForm() {
  const [form, setForm] = useState({ name: "", model: "", size: "" });
  const [latlng, setLatlng] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [agencyId, setAgencyId] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [agencies, setAgencies] = useState<Agency[]>([]);

  // Fetch agencies for the current master on mount
  useEffect(() => {
    async function fetchAgencies() {
      const res = await fetch("/api/agencies");
      if (res.ok) {
        const data: Agency[] = await res.json();
        setAgencies(data);
        if (data.length > 0) setAgencyId(data[0].id); // default select first agency
      } else {
        setError("Failed to load agencies.");
      }
    }
    fetchAgencies();
  }, []);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!form.name || !form.model || !form.size || !latlng || !agencyId) {
      setError("Please fill all fields and select a location and agency.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          latitude: latlng.lat,
          longitude: latlng.lng,
          agencyId,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Failed to add device.");
      } else {
        setSuccess("Device added successfully!");
        setForm({ name: "", model: "", size: "" });
        setLatlng(null);
      }
    } catch {
      setLoading(false);
      setError("An unexpected error occurred.");
    }
  };

  return (
    <Card className="max-w-lg mx-auto p-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">
          Add New Device
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label htmlFor="name" className="mb-1 block font-medium">
            Device Name
          </Label>
          <Input
            id="name"
            placeholder="Enter device name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="model" className="mb-1 block font-medium">
            Model
          </Label>
          <Input
            id="model"
            placeholder="Enter device model"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="size" className="mb-1 block font-medium">
            Size
          </Label>
          <Input
            id="size"
            placeholder="Enter device size"
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
            required
          />
        </div>
        <div>
          <Label className="mb-1 block font-medium">Assign Agency</Label>
          <Select value={agencyId} onValueChange={(val) => setAgencyId(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select agency" />
            </SelectTrigger>
            <SelectContent>
              {agencies.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <br /> <br /> <br /> <br />
        <div className="mt-6">
          <Label className="mb-2 block font-medium">Select Location</Label>
          <MapSelector selected={latlng} onSelect={setLatlng} />
          {!latlng && (
            <p className="mt-1 text-sm text-muted-foreground">
              Click on the map to select the device location.
            </p>
          )}
          {latlng && (
            <p className="mt-1 text-sm text-green-600">
              Selected: {latlng.lat.toFixed(4)}, {latlng.lng.toFixed(4)}
            </p>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Add Device"}
        </Button>
      </CardContent>
    </Card>
  );
}
