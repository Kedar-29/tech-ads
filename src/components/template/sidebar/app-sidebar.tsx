"use client";

import * as React from "react";
import { usePathname } from "next/navigation"; // to get current path
import {
  LayoutDashboard,
  Users,
  MonitorPlay,
  BadgeDollarSign,
  MessageCircleMore,
  HardDrive,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { TeamSwitcher } from "./team-switcher";
import { NavMain } from "./nav-main";
import LogoutButton from "./logoutbutton";

// Define menus per role
const roleMenus = {
  master: [
    {
      title: "Dashboard",
      url: "/roles/master/dashboard",
      icon: LayoutDashboard,
      items: [
        { title: "View Overview", url: "/roles/master/dashboard/overview" },
      ],
    },
    {
      title: "Agency",
      url: "/roles/master/agencies",
      icon: Users,
      items: [
        { title: "Add Agency", url: "/roles/master/agency/add-agency" },
        { title: "View Agencies", url: "/roles/master/agency" },
      ],
    },
    {
      title: "Devices",
      url: "/roles/master/devices",
      icon: HardDrive,
      items: [
        { title: "Add Devices", url: "/roles/master/device/add" },
        { title: "View All Devices", url: "/roles/master/device" },
        { title: "View Devices APIs", url: "/roles/master/device/card" },
      ],
    },
    {
      title: "Complains",
      url: "",
      icon: MessageCircleMore,
      items: [
        { title: "View agency Complains", url: "/roles/master/complaints" },
      ],
    },
    {
      title: "Agency Overview",
      url: "",
      icon: MessageCircleMore,
      items: [
        { title: "View agency Clients", url: "/roles/master/agency-clients" },
        { title: "View agency live ads", url: "/roles/master/agency-ads" },
        {
          title: "Ads history",
          url: "/roles/master/agency-ads/history",
        },
      ],
    },
    {
      title: "Profile",
      url: "/roles/master/profile",
      icon: Settings, // You can replace with a profile icon like `UserCircle`
      items: [{ title: "View Profile", url: "/roles/master/profile" }],
    },
  ],

  agency: [
    {
      title: "Dashboard",
      url: "/roles/agency/dashboard",
      icon: LayoutDashboard,
      items: [{ title: "Overview", url: "/roles/agency/dash" }],
    },
    {
      title: "Clients",
      url: "/roles/agency/clients",
      icon: Users,
      items: [
        { title: "Add New Client", url: "/roles/agency/client/add" },
        { title: "View Clients", url: "/roles/agency/client" },
      ],
    },
    {
      title: "Ads",
      url: "/roles/agency/ads",
      icon: MonitorPlay,
      items: [
        { title: "Upload Ads", url: "/roles/agency/ads/add" },
        { title: "View uploaded Ads", url: "/roles/agency/ads" },
      ],
    },
    {
      title: "Devices",
      url: "/roles/agency/devices",
      icon: HardDrive,
      items: [
        { title: "View My Devices", url: "/roles/agency/devices" },
        { title: "Assign Devices", url: "/roles/agency/assign" },
        { title: "View Assignments", url: "/roles/agency/assign/view" },
      ],
    },
    {
      title: "Timeline",
      url: "",
      icon: MessageCircleMore,
      items: [
        { title: "Live View", url: "/roles/agency/timeline" },
        { title: "Past Logs", url: "/roles/agency/timeline/history" },
      ],
    },
    {
      title: "Bills",
      url: "/roles/agency/bills",
      icon: BadgeDollarSign,
      items: [
        { title: "Generate Bill", url: "/roles/agency/billing" },
        { title: "View Bills", url: "/roles/agency/billing/view" },
      ],
    },
    {
      title: "Complaints",
      url: "/roles/agency/complaints",
      icon: MessageCircleMore,
      items: [
        { title: "Master", url: "/roles/agency/complaints" },
        { title: "Clients", url: "/roles/agency/complaints/clients" },
      ],
    },
    {
      title: "Profile",
      url: "/roles/agency/profile",
      icon: Settings, // You may swap with a `User` icon from lucide-react if needed
      items: [{ title: "View Profile", url: "/roles/agency/profile" }],
    },
  ],

  client: [
    {
      title: "Dashboard",
      url: "/roles/agencyclient/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Ads",
      url: "/roles/agencyclient/ads",
      icon: MonitorPlay,
      items: [
        { title: "Live ads", url: "/roles/agencyclient/ads" },
        { title: "Up-comming", url: "/roles/agencyclient/ads/upcoming" },
        { title: "History", url: "/roles/agencyclient/ads/history" },
      ],
    },
    {
      title: "Devices",
      url: "/roles/agencyclient/devices",
      icon: HardDrive,
    },
    {
      title: "Bills",
      url: "/roles/agencyclient/bills",
      icon: BadgeDollarSign,
      items: [{ title: "View Bills", url: "/roles/agencyclient/bills/view" }],
    },
    {
      title: "Feedback",
      url: "/roles/agencyclient/feedback",
      icon: MessageCircleMore,
      items: [
        { title: "Give Feedback", url: "/roles/agencyclient/feedback/new" },
        {
          title: "View Responses",
          url: "/roles/agencyclient/feedback/responses",
        },
      ],
    },
  ],
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  // normalize to lower case and remove trailing slash
  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, "");

  let role: keyof typeof roleMenus = "client"; // default

  if (normalizedPath.startsWith("/roles/master")) {
    role = "master";
  } else if (normalizedPath.startsWith("/roles/agencyclient")) {
    role = "client";
  } else if (normalizedPath.startsWith("/roles/agency")) {
    role = "agency";
  }

  console.log("Current path:", pathname);
  console.log("Normalized path:", normalizedPath);
  console.log("Detected role:", role);

  const navMain = roleMenus[role] || [];

  const teams = [
    {
      name: "TechAds",
      logo: navMain[0]?.icon || LayoutDashboard,
      plan: "Enterprise",
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <LogoutButton />
    </Sidebar>
  );
}
