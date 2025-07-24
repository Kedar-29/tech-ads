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
  agency: {
    id: string;
    name: string;
  };
}

export default function MasterClientsTable() {
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/master/clients");
        if (!res.ok) {
          throw new Error("Failed to fetch clients");
        }
        const data: AgencyClient[] = await res.json();
        setClients(data);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Unable to load clients.");
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
  }, []);

  if (loading)
    return <p className="text-muted-foreground">Loading clients...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (clients.length === 0)
    return <p className="text-muted-foreground">No clients found.</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Agency Clients</h2>
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
                  {client.area}, {client.city}, {client.state}, {client.country}{" "}
                  - {client.pincode}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
