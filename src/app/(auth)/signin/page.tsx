"use client";

import { LoginForm } from "@/components/login-form";
import { LampDemo } from "@/components/ui/lamp-demo";

export default function LoginPage() {
  return (
    <div className="bg-slate-950 min-h-screen md:h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="relative hidden md:block">
        <div className="h-screen">
          <LampDemo />
        </div>
      </div>

      {/* Right - Login (takes full width on mobile) */}
      <div className="bg-slate-950 flex items-center justify-center p-6">
        <LoginForm />
      </div>
    </div>
  );
}
