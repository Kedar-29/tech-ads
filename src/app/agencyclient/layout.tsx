"use client";

import { ReactNode } from "react";
import HeaderBar from "@/components/nav/navbar";
import { NavbarAgencyClient } from "@/components/agencyclients/menudock";

export default function AgencyClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <HeaderBar />
      {children}
      <NavbarAgencyClient />
    </div>
  );
}
