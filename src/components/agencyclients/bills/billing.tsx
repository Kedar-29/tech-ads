"use client";

import * as React from "react";
import { format, parseISO, isWithinInterval } from "date-fns";
import { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";

// Shadcn Components
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";

// 📘 Types
type BillStatus = "ALL" | "PAID" | "PENDING" | "DELAYED";

interface Bill {
  id: string;
  invoiceNumber: string;
  totalPrice: number;
  status: Exclude<BillStatus, "ALL">;
  createdAt: string;
  fromDate: string;
  toDate: string;
}

interface BillDetails extends Bill {
  agency: { name: string; email: string };
  client: { businessName: string; businessEmail: string };
  items: {
    id: string;
    playCount: number;
    unitPrice: number;
    totalPrice: number;
    ad: { title: string };
    device: { name: string };
  }[];
}

export function ClientBillsTable() {
  const [bills, setBills] = React.useState<Bill[]>([]);
  const [selectedBillId, setSelectedBillId] = React.useState<string | null>(
    null
  );
  const [selectedBillDetails, setSelectedBillDetails] =
    React.useState<BillDetails | null>(null);
  const [showPDF, setShowPDF] = React.useState(false);
  const [loadingDetails, setLoadingDetails] = React.useState(false);

  const [dateRange, setDateRange] = React.useState<DateRange>();
  const [statusFilter, setStatusFilter] = React.useState<BillStatus>("ALL");

  React.useEffect(() => {
    fetch("/api/agency-clients-api/bills", { credentials: "include" })
      .then((res) => res.json())
      .then((data: Bill[]) => setBills(data))
      .catch(() => {});
  }, []);

  const viewDetails = async (id: string) => {
    setLoadingDetails(true);
    setSelectedBillDetails(null);

    try {
      const res = await fetch(`/api/agency-clients-api/bills/${id}`, {
        credentials: "include",
      });
      const data: BillDetails = await res.json();
      setSelectedBillDetails(data);
    } catch {
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredBills = bills.filter((bill) => {
    const billDate = parseISO(bill.fromDate);
    const matchesDate =
      dateRange?.from && dateRange?.to
        ? isWithinInterval(billDate, {
            start: dateRange.from,
            end: dateRange.to,
          })
        : true;

    const matchesStatus =
      statusFilter === "ALL" || bill.status === statusFilter;

    return matchesDate && matchesStatus;
  });

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="text-center mb-6 space-y-4">
        <h1 className="text-xl font-semibold">Billing History</h1>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6">
          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center justify-start w-full sm:w-[260px] p-2 text-sm text-left"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateRange?.from && dateRange?.to ? (
                  <>
                    {format(dateRange.from, "dd MMM yyyy")} -{" "}
                    {format(dateRange.to, "dd MMM yyyy")}
                  </>
                ) : (
                  <span>Select date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value: BillStatus) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] p-2 text-sm h-auto">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="DELAYED">Delayed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {filteredBills.length === 0 ? (
        <p className="text-center text-muted-foreground mt-6">
          No bills found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">
                    {bill.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    {format(new Date(bill.fromDate), "dd MMM yyyy")} -{" "}
                    {format(new Date(bill.toDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        bill.status === "PAID"
                          ? "default"
                          : bill.status === "DELAYED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {bill.status}
                    </Badge>
                  </TableCell>
                  <TableCell>₹{bill.totalPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    {format(new Date(bill.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="flex justify-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedBillId(bill.id);
                        setShowPDF(true);
                      }}
                    >
                      View PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewDetails(bill.id)}
                    >
                      View More
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* PDF Dialog */}
      <Dialog open={showPDF} onOpenChange={setShowPDF}>
        <DialogContent className="max-w-7xl w-full h-[85vh] p-0 overflow-hidden">
          <iframe
            src={`/api/agency-clients-api/bills/pdf/${selectedBillId}`}
            className="w-full h-full"
            frameBorder="0"
          />
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={!!selectedBillDetails || loadingDetails}
        onOpenChange={() => setSelectedBillDetails(null)}
      >
        <DialogContent className="max-w-4xl w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
          </DialogHeader>

          {loadingDetails ? (
            <p className="text-center text-muted-foreground py-4">Loading...</p>
          ) : selectedBillDetails ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p>
                    <strong>Invoice:</strong>{" "}
                    {selectedBillDetails.invoiceNumber}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <Badge
                      variant={
                        selectedBillDetails.status === "PAID"
                          ? "default"
                          : selectedBillDetails.status === "DELAYED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {selectedBillDetails.status}
                    </Badge>
                  </p>
                  <p>
                    <strong>Period:</strong>{" "}
                    {format(
                      new Date(selectedBillDetails.fromDate),
                      "dd MMM yyyy"
                    )}{" "}
                    -{" "}
                    {format(
                      new Date(selectedBillDetails.toDate),
                      "dd MMM yyyy"
                    )}
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {format(
                      new Date(selectedBillDetails.createdAt),
                      "dd MMM yyyy"
                    )}
                  </p>
                  <p>
                    <strong>Total:</strong> ₹
                    {selectedBillDetails.totalPrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Client:</strong>{" "}
                    {selectedBillDetails.client.businessName}
                  </p>
                  <p>({selectedBillDetails.client.businessEmail})</p>
                  <p>
                    <strong>Agency:</strong> {selectedBillDetails.agency.name}
                  </p>
                  <p>({selectedBillDetails.agency.email})</p>
                </div>
              </div>

              <Separator className="my-4" />

              <ScrollArea className="max-h-[300px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ad Title</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Play Count</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBillDetails.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.ad.title}</TableCell>
                        <TableCell>{item.device.name}</TableCell>
                        <TableCell>{item.playCount}</TableCell>
                        <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>₹{item.totalPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
