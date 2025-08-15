"use client";

import { LoginForm } from "@/components/login-form";
import { LampDemo } from "@/components/ui/lamp-demo";

export default function LoginPage() {
  return (
    // Use grid to guarantee perfectly even halves across breakpoints
    <div className="bg-slate-950 min-h-screen md:h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left - Lamp */}
      <div className="relative">
        {/* Wrap to prevent any overflow weirdness on small screens */}
        <div className="h-[45vh] md:h-screen">
          <LampDemo />
        </div>
      </div>

      {/* Right - Login (same dark bg as lamp for seamless sides) */}
      <div className="bg-slate-950 flex items-center justify-center p-6">
        <LoginForm />
      </div>
    </div>
  );
}
