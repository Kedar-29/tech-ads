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
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/datepicker";
import { toast } from "sonner";

interface Client {
  id: string;
  businessName: string;
}

interface Completed {
  id: string;
  date: string;
  ad: { title: string };
  device: { name: string };
  client: { businessName: string; id: string };
  startTime: string;
  endTime: string;
  hours: number;
}

export default function BillingDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [unitPrice, setUnitPrice] = useState<number>(50);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [completed, setCompleted] = useState<Completed[]>([]);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    fetch("/api/billing/clients")
      .then((res) => res.json())
      .then((data: { clients: Client[] }) => {
        if (Array.isArray(data.clients)) {
          setClients(data.clients);
        }
      })
      .catch(() => toast.error("Failed to load clients"));
  }, []);

  const loadCompleted = async (): Promise<void> => {
    if (!fromDate || !toDate) return;

    try {
      const res = await fetch(
        `/api/billing/completed-ads?fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}`
      );

      const data = await res.json();

      const list: Completed[] = (data.completed || []).filter((c: Completed) =>
        clientId ? c.client.id === clientId : true
      );

      if (list.length === 0) {
        toast.warning("No completed ads found for this period.");
      }

      setCompleted(list);

      const sum = list.reduce((acc: number, c: Completed): number => {
        return acc + c.hours * unitPrice;
      }, 0);

      setTotal(sum);
    } catch {
      toast.error("Failed to load completed ads");
    }
  };

  const generate = async (): Promise<void> => {
    if (!clientId || !fromDate || !toDate || !unitPrice) return;

    try {
      const res = await fetch("/api/billing/generate-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString(),
          unitPrice,
        }),
      });

      if (res.ok) {
        toast.success("✅ Bill generated successfully");
        setCompleted([]);
        setTotal(0);
      } else {
        toast.error("❌ Failed to generate bill");
      }
    } catch {
      toast.error("❌ Something went wrong");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          📈 Billing Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Select a client and date range to view completed ads and generate
          bills.
        </p>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Client select */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">Client</label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.businessName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* From Date */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">From Date</label>
          <DatePicker value={fromDate} onChange={setFromDate} />
        </div>

        {/* To Date */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">To Date</label>
          <DatePicker value={toDate} onChange={setToDate} />
        </div>

        {/* Unit Price */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">Unit Price (₹/hr)</label>
          <Input
            type="number"
            value={unitPrice}
            min={0}
            onChange={(e) => setUnitPrice(+e.target.value)}
            placeholder="₹ per hour"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={loadCompleted} className="w-fit">
          Load Completed Ads
        </Button>
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => {
            setClientId("");
            setFromDate(null);
            setToDate(null);
            setCompleted([]);
            setTotal(0);
          }}
        >
          Reset
        </Button>
      </div>

      {/* Completed Ads Table */}
      {completed.length > 0 && (
        <section className="mt-6 border rounded-md p-4 bg-background space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">
            ✅ Completed Ads: {completed.length}
          </h2>

          <div className="grid gap-y-4">
            {completed.map((c) => (
              <div
                key={c.id}
                className="flex justify-between gap-4 border-b pb-2"
              >
                <div>
                  <div className="font-medium">
                    {c.date} — {c.ad.title} @ {c.device.name}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    Time: {c.startTime}:00 to {c.endTime}:00 • Duration:{" "}
                    {c.hours} hr{c.hours !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-sm font-semibold whitespace-nowrap">
                  ₹{c.hours * unitPrice}
                </div>
              </div>
            ))}
          </div>

          <div className="text-right text-xl font-bold border-t pt-4">
            Total: ₹{total}
          </div>

          <div className="text-right">
            <Button
              variant="secondary"
              onClick={generate}
              disabled={!clientId || !fromDate || !toDate}
            >
              Generate Bill Now
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
