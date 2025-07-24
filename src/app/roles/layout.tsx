"use client";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/template/sidebar/app-sidebar";
import HeaderBar from "@/components/nav/navbar";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <HeaderBar />
          <header className="flex h-16 items-center gap-2 px-2 transition-all ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger className="-ml-1" />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
