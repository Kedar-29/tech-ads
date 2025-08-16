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

  const formatAddress = (client: Client) =>
    [client.area, client.city, client.state, client.country, client.pincode]
      .filter(Boolean)
      .join(", ") || "N/A";

  const handleWhatsapp = (bill: Bill) => {
    if (!bill.client.whatsappNumber)
      return alert("Client WhatsApp number not available.");
    const pdfUrl = `${window.location.origin}/api/billing/pdf/${bill.id}`;
    const msg = `Hello ${bill.client.businessName},\nInvoice #: ${
      bill.invoiceNumber ?? "N/A"
    }\nTotal: ₹${bill.totalPrice.toFixed(2)}\nAddress: ${formatAddress(
      bill.client
    )}\n\nDownload: ${pdfUrl}`;
    window.open(
      `https://wa.me/${bill.client.whatsappNumber}?text=${encodeURIComponent(
        msg
      )}`,
      "_blank"
    );
  };

  const handleViewPdf = (id: string) =>
    window.open(`/api/billing/pdf/${id}`, "_blank");

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

  const updateBillStatus = async (billId: string, status: string) => {
    try {
      const res = await fetch(`/api/billing/update-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId, status }),
      });
      if (!res.ok) throw new Error("Failed");
      fetchBills();
    } catch {
      alert("Failed to update status.");
    }
  };

  const renderStatusBadge = (status: Bill["status"]) => {
    switch (status) {
      case "PAID":
        return <Badge variant="secondary">Paid</Badge>;
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
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
        <div className="flex-1 min-w-[200px]">
          <Label>Select Client</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.businessName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[180px]">
          <Label htmlFor="fromDate">From Date</Label>
          <Input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="min-w-[180px]">
          <Label htmlFor="toDate">To Date</Label>
          <Input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
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
                    <div className="text-xs text-muted-foreground">
                      {formatAddress(bill.client)}
                    </div>
                  </div>
                  {renderStatusBadge(bill.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <strong>Invoice:</strong> {bill.invoiceNumber ?? "N/A"}
                </div>
                <div>
                  <strong>From:</strong>{" "}
                  {format(new Date(bill.fromDate), "dd/MM/yyyy")} |{" "}
                  <strong>To:</strong>{" "}
                  {format(new Date(bill.toDate), "dd/MM/yyyy")}
                </div>
                <div>
                  <strong>Total:</strong> ₹{bill.totalPrice.toFixed(2)}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => handleViewPdf(bill.id)}>
                    View PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleWhatsapp(bill)}
                  >
                    WhatsApp
                  </Button>
                  <Select
                    defaultValue={bill.status}
                    onValueChange={(val) =>
                      updateBillStatus(bill.id, val as Bill["status"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="DELAYED">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
