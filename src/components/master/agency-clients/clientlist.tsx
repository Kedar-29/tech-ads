"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Agency type
interface Agency {
  id: string;
  name: string;
}

// AgencyClient type
interface AgencyClient {
  id: string;
  name: string;
  businessName: string;
  businessEmail: string;
  whatsappNumber: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  agency: Agency;
}

// API response for clients with pagination
interface ClientsResponse {
  clients: AgencyClient[];
  totalClients: number;
}

export default function MasterClientsTable() {
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10); // view 10 per page
  const [totalClients, setTotalClients] = useState<number>(0);

  const totalPages = Math.ceil(totalClients / pageSize);

  // Fetch all agencies
  useEffect(() => {
    async function fetchAgencies() {
      try {
        const res = await fetch("/api/master/agencylist");
        if (!res.ok) throw new Error("Failed to fetch agencies");
        const data: Agency[] = await res.json();
        setAgencies(data);
      } catch {
        setError("Unable to load agencies.");
      }
    }
    fetchAgencies();
  }, []);

  // Fetch clients with filters and pagination
  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (selectedAgency !== "all") params.append("agencyId", selectedAgency);
        params.append("page", page.toString());
        params.append("pageSize", pageSize.toString());

        const res = await fetch(`/api/master/clients?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch clients");

        const data: ClientsResponse = await res.json();
        setClients(data.clients);
        setTotalClients(data.totalClients);
      } catch {
        setError("Unable to load clients.");
        setClients([]);
        setTotalClients(0);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, [selectedAgency, page, pageSize]);

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Agency Clients</h2>

      {/* Agency Filter */}
      <div className="flex items-center gap-4">
        <Select
          value={selectedAgency}
          onValueChange={(value: string) => {
            setSelectedAgency(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by Agency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agencies</SelectItem>
            {agencies.map((agency) => (
              <SelectItem key={agency.id} value={agency.id}>
                {agency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Page Size Selector */}
        <Select
          value={pageSize.toString()}
          onValueChange={(value: string) => {
            setPageSize(Number(value));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="View per page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">View 5</SelectItem>
            <SelectItem value="10">View 10</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading / Error */}
      {loading && <p className="text-muted-foreground">Loading clients...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* No clients */}
      {!loading && !error && clients.length === 0 && (
        <p className="text-muted-foreground">No clients found.</p>
      )}

      {/* Client Table */}
      {!loading && clients.length > 0 && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Agency Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.agency.name}</TableCell>
                    <TableCell>{client.businessEmail}</TableCell>
                    <TableCell>{client.whatsappNumber}</TableCell>
                    <TableCell>
                      {client.area}, {client.city}, {client.state},{" "}
                      {client.country} - {client.pincode}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <Button onClick={handlePrev} disabled={page === 1}>
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button onClick={handleNext} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
