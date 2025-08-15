"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Client {
  id: string;
  businessName: string;
}

interface Assignment {
  id: string;
  ad: { title: string };
  device: { name: string };
  hours: number;
}

export default function BillingDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [unitPrice, setUnitPrice] = useState<number>(50);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    fetch("/api/billing/clients")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.clients)) setClients(data.clients);
      })
      .catch(() => toast.error("Failed to load clients"));
  }, []);

  const loadAssignments = async () => {
    if (!clientId) return;
    try {
      const res = await fetch(`/api/billing/unbilled-ads?clientId=${clientId}`);
      const data = await res.json();
      if (!data.assignments || data.assignments.length === 0) {
        toast.warning("No unbilled assignments for this client.");
        setAssignments([]);
        setTotal(0);
        return;
      }
      setAssignments(data.assignments);
      const sum = data.assignments.reduce(
        (acc: number, a: Assignment) => acc + a.hours * unitPrice,
        0
      );
      setTotal(sum);
    } catch {
      toast.error("Failed to load assignments");
    }
  };

  const generateBill = async () => {
    if (!clientId || assignments.length === 0) return;
    try {
      const res = await fetch("/api/billing/generate-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, unitPrice }),
      });
      if (res.ok) {
        toast.success("✅ Bill generated successfully");
        setAssignments([]);
        setTotal(0);
      } else {
        const data = await res.json();
        toast.error(data?.error || "❌ Failed to generate bill");
      }
    } catch {
      toast.error("❌ Something went wrong");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">📈 Billing Dashboard</h1>

      {/* Client Selection */}
      <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-3">
        <div className="flex-1">
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.businessName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={loadAssignments} className="md:w-auto w-full">
          Load Assignments
        </Button>
      </div>

      {/* Unit Price */}
      <div className="flex items-center gap-2 max-w-xs">
        <label className="font-medium text-gray-700">Unit Price (₹/hr)</label>
        <input
          type="number"
          value={unitPrice}
          min={0}
          onChange={(e) => setUnitPrice(+e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 w-24 text-right"
        />
      </div>

      {/* Assignments Table */}
      {assignments.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse rounded-lg overflow-hidden shadow-md">
            <thead className="bg-blue-100 text-left text-gray-700">
              <tr>
                <th className="px-4 py-2">Ad Title</th>
                <th className="px-4 py-2">Device</th>
                <th className="px-4 py-2">Hours</th>
                <th className="px-4 py-2 text-right">Price (₹)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2">{a.ad.title}</td>
                  <td className="px-4 py-2">{a.device.name}</td>
                  <td className="px-4 py-2">{a.hours}</td>
                  <td className="px-4 py-2 text-right">
                    {a.hours * unitPrice}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-semibold text-gray-800">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right">
                  Total:
                </td>
                <td className="px-4 py-2 text-right">₹{total}</td>
              </tr>
            </tfoot>
          </table>

          <div className="text-right mt-4">
            <Button
              onClick={generateBill}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Generate Bill
            </Button>
          </div>
        </div>
      )}

      {assignments.length === 0 && clientId && (
        <p className="text-gray-500 mt-4 text-center">
          No unbilled assignments for this client.
        </p>
      )}
    </div>
  );
}
