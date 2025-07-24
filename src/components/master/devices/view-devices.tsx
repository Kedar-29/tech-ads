"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon paths:
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Device = {
  id: string;
  uuid: string;
  name: string;
  model: string;
  size: string;
  latitude: number;
  longitude: number;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  agencyId: string | null;
};

type Agency = {
  id: string;
  name: string;
};

export default function ViewDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedDevice, setEditedDevice] = useState<Partial<Device>>({});
  const [viewMapDevice, setViewMapDevice] = useState<Device | null>(null);

  useEffect(() => {
    fetchDevices();
    fetchAgencies();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/devices");
      if (!res.ok) throw new Error("Failed to fetch devices");
      const data: Device[] = await res.json();
      setDevices(data);
    } catch {
      setError("Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const res = await fetch("/api/agencies");
      if (!res.ok) throw new Error("Failed to fetch agencies");
      const data: Agency[] = await res.json();
      setAgencies(data);
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this device?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/devices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setError("Failed to delete device");
    } finally {
      setDeletingId(null);
    }
  };

  const startEditing = (device: Device) => {
    setEditingId(device.id);
    setEditedDevice({ ...device });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedDevice({});
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/devices/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedDevice),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setDevices((prev) =>
        prev.map((d) => (d.id === editingId ? updated.device ?? updated : d))
      );
      cancelEditing();
    } catch {
      setError("Failed to update device");
    }
  };

  return (
    <>
      <Card className="max-w-7xl mx-auto p-6 shadow-lg">
        <CardHeader>
          <CardTitle>All Devices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading devices...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Latitude</TableHead>
                  <TableHead>Longitude</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No devices found.
                    </TableCell>
                  </TableRow>
                )}
                {devices.map((device) => {
                  const isEditing = editingId === device.id;

                  return (
                    <TableRow key={device.id}>
                      {isEditing ? (
                        <>
                          <TableCell>
                            <Input
                              value={editedDevice.name || ""}
                              onChange={(e) =>
                                setEditedDevice({
                                  ...editedDevice,
                                  name: e.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editedDevice.model || ""}
                              onChange={(e) =>
                                setEditedDevice({
                                  ...editedDevice,
                                  model: e.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editedDevice.size || ""}
                              onChange={(e) =>
                                setEditedDevice({
                                  ...editedDevice,
                                  size: e.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={
                                editedDevice.latitude !== undefined
                                  ? editedDevice.latitude.toString()
                                  : ""
                              }
                              onChange={(e) =>
                                setEditedDevice({
                                  ...editedDevice,
                                  latitude: parseFloat(e.target.value),
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={
                                editedDevice.longitude !== undefined
                                  ? editedDevice.longitude.toString()
                                  : ""
                              }
                              onChange={(e) =>
                                setEditedDevice({
                                  ...editedDevice,
                                  longitude: parseFloat(e.target.value),
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <select
                              className="border rounded px-2 py-1"
                              value={editedDevice.agencyId || ""}
                              onChange={(e) =>
                                setEditedDevice({
                                  ...editedDevice,
                                  agencyId: e.target.value,
                                })
                              }
                            >
                              <option value="">Select agency</option>
                              {agencies.map((agency) => (
                                <option key={agency.id} value={agency.id}>
                                  {agency.name}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <select
                              className="border rounded px-2 py-1"
                              value={editedDevice.status || "INACTIVE"}
                              onChange={(e) =>
                                setEditedDevice({
                                  ...editedDevice,
                                  status: e.target.value as Device["status"],
                                })
                              }
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="INACTIVE">INACTIVE</option>
                              <option value="MAINTENANCE">MAINTENANCE</option>
                            </select>
                          </TableCell>
                          <TableCell className="space-x-2">
                            <Button size="sm" onClick={handleSave}>
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                            >
                              Cancel
                            </Button>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{device.name}</TableCell>
                          <TableCell>{device.model}</TableCell>
                          <TableCell>{device.size}</TableCell>
                          <TableCell>{device.latitude.toFixed(4)}</TableCell>
                          <TableCell>{device.longitude.toFixed(4)}</TableCell>
                          <TableCell>
                            {device.agencyId
                              ? agencies.find(
                                  (a) => a.id.trim() === device.agencyId?.trim()
                                )?.name || `Unknown (${device.agencyId})`
                              : "-"}
                          </TableCell>
                          <TableCell>{device.status}</TableCell>
                          <TableCell className="space-x-1 whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(device)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(device.id)}
                              disabled={deletingId === device.id}
                            >
                              {deletingId === device.id
                                ? "Deleting..."
                                : "Delete"}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setViewMapDevice(device)}
                            >
                              View Map
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Map Modal */}
      {viewMapDevice && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={() => setViewMapDevice(null)}
        >
          <div
            className="bg-white rounded p-4 max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">
              Device Location: {viewMapDevice.name}
            </h3>
            <MapContainer
              center={{
                lat: viewMapDevice.latitude,
                lng: viewMapDevice.longitude,
              }}
              zoom={15}
              style={{ height: 400, width: "100%" }}
              className="rounded"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker
                position={{
                  lat: viewMapDevice.latitude,
                  lng: viewMapDevice.longitude,
                }}
              />
            </MapContainer>
            <div className="mt-4 text-right">
              <Button onClick={() => setViewMapDevice(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
