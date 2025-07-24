"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Home,
  FileText,
  MessageSquare,
  Clock,
  History,
  UserCircle,
} from "lucide-react";
import clsx from "clsx";
import LogoutButton from "../template/sidebar/logoutbutton";

type MenuItem = {
  title: string;
  url: string;
  dropdown?: { label: string; url: string; icon: JSX.Element }[];
};

const menuItems: MenuItem[] = [
  { title: "Home", url: "/agencyclient" },
  {
    title: "Ads",
    url: "/agencyclient/ads",
    dropdown: [
      {
        label: "Live Ads",
        url: "/agencyclient/ads",
        icon: <Play className="mr-2 h-4 w-4" />,
      },
      {
        label: "Upcoming Ads",
        url: "/agencyclient/ads/upcoming",
        icon: <Clock className="mr-2 h-4 w-4" />,
      },
      {
        label: "Ads History",
        url: "/agencyclient/ads/history",
        icon: <History className="mr-2 h-4 w-4" />,
      },
    ],
  },
  { title: "Bills", url: "/agencyclient/bills" },
  { title: "Complains", url: "/agencyclient/complaints" },
  { title: "Profile", url: "/agencyclient/profile" },
];

const iconMap: Record<string, JSX.Element> = {
  Home: <Home className="h-5 w-5 mb-1" />,
  Ads: <Play className="h-5 w-5 mb-1" />,
  Bills: <FileText className="h-5 w-5 mb-1" />,
  Complains: <MessageSquare className="h-5 w-5 mb-1" />,
  Profile: <UserCircle className="h-5 w-5 mb-1" />,
};

export const NavbarAgencyClient: React.FC = () => {
  const [adsDropdownOpen, setAdsDropdownOpen] = useState(false);
  const adsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adsRef.current && !adsRef.current.contains(event.target as Node)) {
        setAdsDropdownOpen(false);
      }
    };

    if (adsDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [adsDropdownOpen]);

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 w-[480px] max-w-full -translate-x-1/2 
      rounded-full px-8 py-4 shadow-xl flex items-center justify-between gap-4
      bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700"
    >
      {menuItems.map((item) =>
        item.title === "Ads" ? (
          <div
            key={item.title}
            className="relative flex flex-col items-center"
            ref={adsRef}
          >
            <button
              onClick={() => setAdsDropdownOpen((prev) => !prev)}
              className={clsx(
                "flex flex-col items-center focus:outline-none text-neutral-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400",
                adsDropdownOpen && "text-indigo-600 dark:text-indigo-400"
              )}
            >
              {iconMap[item.title]}
              <span className="text-xs font-medium">{item.title}</span>
            </button>

            {adsDropdownOpen && item.dropdown && (
              <ul
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 
                rounded-md bg-white dark:bg-zinc-900 border dark:border-zinc-700
                shadow-xl ring-1 ring-black ring-opacity-5 z-50 py-2 px-1"
              >
                {item.dropdown.map((sub) => (
                  <li key={sub.url}>
                    <a
                      href={sub.url}
                      className="flex items-center px-3 py-2 rounded text-sm text-gray-800 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition"
                      onClick={() => setAdsDropdownOpen(false)}
                    >
                      {sub.icon}
                      {sub.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <a
            key={item.title}
            href={item.url}
            className="flex flex-col items-center text-neutral-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium"
          >
            {iconMap[item.title]}
            <span className="text-xs">{item.title}</span>
          </a>
        )
      )}

      <div className="flex flex-col items-center">
        <LogoutButton />
      </div>
    </div>
  );
};
