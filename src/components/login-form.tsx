"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        let errorMsg = "Login failed";
        try {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        } catch {}
        toast.error(errorMsg);
      } else {
        const data = await res.json();
        toast.success("Login successful");

        setTimeout(() => {
          if (data.role === "MASTER")
            router.push("/roles/master/dashboard/overview");
          else if (data.role === "AGENCY") router.push("/roles/agency/dash");
          else if (data.role === "AGENCY_CLIENT") router.push("/agencyclient");
          else toast.error("Unknown user role");
        }, 500);
      }
    } catch {
      toast.error("Network or server error");
    }

    setLoading(false);
  };

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center px-6 py-10",
        className
      )}
      {...props}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        {/* Glow Effect Behind Card */}
        <div className="pointer-events-none absolute inset-0 -z-10 blur-3xl opacity-40 bg-cyan-500/60 rounded-3xl" />

        <Card className="rounded-2xl bg-slate-900/80 border border-cyan-500/20 shadow-[0_0_28px_rgba(34,211,238,0.22)] backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent text-center">
              Welcome User
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800/60 border-cyan-500/30 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400"
                />
              </div>

              {/* Password Field */}
              <div className="grid gap-2 relative">
                <Label htmlFor="password" className="text-gray-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800/60 border-cyan-500/30 text-white placeholder-gray-400 pr-10 focus:border-cyan-400 focus:ring-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-cyan-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Submit Button */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.01 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/30"
                  disabled={loading}
                >
                  {loading ? (
                    "Logging in..."
                  ) : (
                    <span className="flex items-center justify-center">
                      Login
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
