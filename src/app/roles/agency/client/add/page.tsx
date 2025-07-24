// app/agency-clients/page.tsx

import { AddAgencyClientForm } from "@/components/agency/clients/AddAgencyClientForm";

export default function AgencyClientsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      <AddAgencyClientForm />
    </div>
  );
}
