"use client";

import React, { useState, useRef, useEffect, JSX } from "react";
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
        icon: <Play className="mr-2 h-5 w-5" />,
      },
      {
        label: "Upcoming Ads",
        url: "/agencyclient/ads/upcoming",
        icon: <Clock className="mr-2 h-5 w-5" />,
      },
      {
        label: "Ads History",
        url: "/agencyclient/ads/history",
        icon: <History className="mr-2 h-5 w-5" />,
      },
    ],
  },
  { title: "Bills", url: "/agencyclient/bills" },
  { title: "Complains", url: "/agencyclient/complaints" },
  { title: "Profile", url: "/agencyclient/profile" },
];

const iconMap: Record<string, JSX.Element> = {
  Home: <Home className="h-6 w-6" />,
  Ads: <Play className="h-6 w-6" />,
  Bills: <FileText className="h-6 w-6" />,
  Complains: <MessageSquare className="h-6 w-6" />,
  Profile: <UserCircle className="h-6 w-6" />,
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
    <>
      {/* Floating Nav */}
      <nav
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 
        bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700
        shadow-xl rounded-full px-6 py-3 flex items-center justify-around
        w-[90%] max-w-md"
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
                  "p-2 rounded-full flex flex-col items-center focus:outline-none text-neutral-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400",
                  adsDropdownOpen && "text-indigo-600 dark:text-indigo-400"
                )}
              >
                {iconMap[item.title]}
                <span className="hidden md:block text-sm mt-1">
                  {item.title}
                </span>
              </button>

              {adsDropdownOpen && item.dropdown && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"></div>

                  {/* Dropdown Floating */}
                  <ul
                    className="absolute bottom-16 left-1/2 -translate-x-1/2 w-44 
                    rounded-lg bg-white dark:bg-zinc-900 border dark:border-zinc-700
                    shadow-xl ring-1 ring-black ring-opacity-5 z-50 py-2 animate-in fade-in slide-in-from-bottom-2"
                  >
                    {item.dropdown.map((sub) => (
                      <li key={sub.url}>
                        <a
                          href={sub.url}
                          className="flex items-center px-3 py-2 rounded-md text-sm 
                          text-gray-800 dark:text-gray-100 hover:bg-indigo-50 
                          dark:hover:bg-zinc-800 transition"
                          onClick={() => setAdsDropdownOpen(false)}
                        >
                          {sub.icon}
                          {sub.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <a
              key={item.title}
              href={item.url}
              className="p-2 rounded-full flex flex-col items-center text-neutral-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {iconMap[item.title]}
              <span className="hidden md:block text-sm mt-1">{item.title}</span>
            </a>
          )
        )}

        {/* Logout button */}
        <div className="p-2 flex flex-col items-center">
          <LogoutButton />
        </div>
      </nav>
    </>
  );
};
