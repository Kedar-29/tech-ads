"use client";

import { ModeToggle } from "../theme/theme-button";

export default function HeaderBar() {
  return (
    <header className=" top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <nav className="flex items-center justify-between px-4 py-3 max-w-screen-xl mx-auto">
        <div className="text-lg font-semibold">TechAds</div>
        <ModeToggle />
      </nav>
    </header>
  );
}
