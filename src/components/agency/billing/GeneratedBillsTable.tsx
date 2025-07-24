"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Client {
  id: string;
  businessName: string;
  whatsappNumber?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

interface BillItem {
  ad: { title: string };
  device: { name: string };
  playCount: number;
  totalPrice: number;
}

interface Bill {
  id: string;
  fromDate: string;
  toDate: string;
  totalPrice: number;
  invoiceNumber?: string;
  client: Client;
  items: BillItem[];
  status: "PENDING" | "PAID" | "DELAYED";
}

export default function GeneratedBillsTable() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Format address
  const formatAddress = (client: Client): string => {
    const parts = [
      client.area,
      client.city,
      client.state,
      client.country,
      client.pincode,
    ];
    return parts.filter(Boolean).join(", ");
  };

  // WhatsApp sharing
  const handleWhatsapp = (bill: Bill) => {
    if (!bill.client.whatsappNumber) {
      alert("Client WhatsApp number not available.");
      return;
    }

    const pdfUrl = `${window.location.origin}/api/billing/pdf/${bill.id}`;
    const msg = `Hello ${bill.client.businessName},\nYour bill (Invoice #: ${
      bill.invoiceNumber ?? "N/A"
    }) from ${bill.fromDate} to ${bill.toDate} is ₹${bill.totalPrice.toFixed(
      2
    )}.\nAddress: ${formatAddress(
      bill.client
    )}\n\nDownload/view your bill:\n${pdfUrl}`;

    const encodedMsg = encodeURIComponent(msg);
    const whatsappUrl = `https://wa.me/${bill.client.whatsappNumber}?text=${encodedMsg}`;
    window.open(whatsappUrl, "_blank");
  };

  // View PDF
  const handleViewPdf = (id: string) => {
    window.open(`/api/billing/pdf/${id}`, "_blank");
  };

  // Fetch bills with filters
  const fetchBills = useCallback(() => {
    const params = new URLSearchParams();
    if (clientId !== "ALL") params.append("clientId", clientId);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);

    fetch(`/api/billing/generated-bills?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setBills(data.bills ?? []);
        setClients(data.clients ?? []);
      })
      .catch(() => {
        setBills([]);
        setClients([]);
      });
  }, [clientId, fromDate, toDate]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Update bill status API call
  const updateBillStatus = async (billId: string, status: string) => {
    try {
      const res = await fetch(`/api/billing/update-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId, status }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      fetchBills(); // Refresh bills after update
    } catch (err) {
      console.error("UPDATE_STATUS_ERROR", err);
      alert("Failed to update bill status.");
    }
  };

  // Helper for colored badge based on status
  const renderStatusBadge = (status: Bill["status"]) => {
    switch (status) {
      case "PAID":
        return <Badge variant="secondary">Paid</Badge>; // fixed variant
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>; // fixed variant
      case "DELAYED":
        return <Badge variant="destructive">Delayed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">
          🧾 Generated Bills
        </h2>
        <p className="text-sm text-muted-foreground">
          View all generated invoices and billing details.
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 border rounded-md shadow-sm bg-white flex flex-col md:flex-row md:flex-wrap gap-4 items-end">
        {/* Client filter */}
        <div className="flex-1 min-w-[200px]">
          <Label>Select Client</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.businessName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* From Date */}
        <div className="min-w-[180px]">
          <Label htmlFor="fromDate">From Date</Label>
          <Input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        {/* To Date */}
        <div className="min-w-[180px]">
          <Label htmlFor="toDate">To Date</Label>
          <Input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={fetchBills}>Apply</Button>
          <Button
            variant="outline"
            onClick={() => {
              setClientId("ALL");
              setFromDate("");
              setToDate("");
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Bill cards */}
      {bills.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No bills available.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bills.map((bill) => (
            <Card key={bill.id}>
              <CardHeader>
                <CardTitle className="text-lg flex justify-between items-start">
                  <div>
                    <div className="font-semibold">
                      {bill.client.businessName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Invoice #: {bill.invoiceNumber ?? "N/A"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(bill.fromDate), "PPP")} —{" "}
                      {format(new Date(bill.toDate), "PPP")}
                    </div>
                    <div className="mt-1">{renderStatusBadge(bill.status)}</div>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPdf(bill.id)}
                      >
                        View PDF
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleWhatsapp(bill)}
                      >
                        WhatsApp
                      </Button>
                    </div>

                    {/* Status Select */}
                    <Select
                      value={bill.status}
                      onValueChange={(newStatus) =>
                        updateBillStatus(bill.id, newStatus)
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">🕒 Pending</SelectItem>
                        <SelectItem value="PAID">✅ Paid</SelectItem>
                        <SelectItem value="DELAYED">⚠️ Delayed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="text-sm space-y-2">
                <p>
                  <strong>Address:</strong> {formatAddress(bill.client)}
                </p>
                <p>
                  <strong>WhatsApp:</strong>{" "}
                  {bill.client.whatsappNumber ? (
                    <a
                      className="text-green-600 underline"
                      href={`https://wa.me/${bill.client.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {bill.client.whatsappNumber}
                    </a>
                  ) : (
                    "Not available"
                  )}
                </p>

                {/* Items */}
                <div className="pt-2 border-t space-y-1">
                  {bill.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start text-sm"
                    >
                      <div>
                        {item.ad.title} @ {item.device.name} — {item.playCount}{" "}
                        hrs
                      </div>
                      <div className="font-medium">
                        ₹{item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-right border-t font-bold">
                  Total: ₹{bill.totalPrice.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
