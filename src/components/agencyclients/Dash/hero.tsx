"use client";

import { motion } from "framer-motion";
import { BarChart3, Clock4, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface Stats {
  upcomingAds: number;
  adsPlayed: number;
  bills: number;
}

export default function Globe3D() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/agencyclient", {
          method: "GET",
          credentials: "include", // ✅ so cookies (JWT) are sent
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch statistics");
        }

        setStats(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const StatCard = ({
    title,
    icon,
    value,
    suffix,
  }: {
    title: string;
    icon: React.ReactNode;
    value: number | string;
    suffix?: string;
  }) => (
    <div className="rounded-xl bg-white/5 p-6 text-left hover:bg-white/10 transition duration-300 border border-white/10 shadow-md">
      <div className="mb-4 text-[#9b87f5]">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-white/70 text-sm">
        {value} {suffix}
      </p>
    </div>
  );

  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center bg-[#0a0613] font-light text-white antialiased overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0a0613 0%, #150d27 100%)",
      }}
    >
      <div
        className="absolute right-0 top-0 h-1/2 w-1/2"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, rgba(155, 135, 245, 0.15) 0%, rgba(13, 10, 25, 0) 60%)",
        }}
      />
      <div
        className="absolute left-0 top-0 h-1/2 w-1/2 -scale-x-100"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, rgba(155, 135, 245, 0.15) 0%, rgba(13, 10, 25, 0) 60%)",
        }}
      />

      <div className="relative z-10 max-w-7xl px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-light md:text-5xl lg:text-7xl">
            Manage Your <span className="text-[#9b87f5]">Ad Campaigns</span>{" "}
            with Confidence
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/60 md:text-xl">
            Track performance, schedule your ads, and gain real-time insights —
            all in one place.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16 px-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <StatCard
            title="Upcoming Ads"
            icon={<BarChart3 size={28} />}
            value={
              loading ? "Loading..." : error ? error : stats?.upcomingAds ?? 0
            }
            suffix="scheduled"
          />
          <StatCard
            title="Ads Played"
            icon={<Clock4 size={28} />}
            value={
              loading ? "Loading..." : error ? error : stats?.adsPlayed ?? 0
            }
            suffix="completed"
          />
          <StatCard
            title="Total Bills"
            icon={<Zap size={28} />}
            value={loading ? "Loading..." : error ? error : stats?.bills ?? 0}
            suffix="invoices"
          />
        </motion.div>

        <motion.div
          className="relative mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
        >
          <div className="w-full flex h-40 md:h-64 relative overflow-hidden">
            <img
              src="https://blocks.mvp-subha.me/assets/earth.png"
              alt="Earth"
              className="absolute px-4 top-0 left-1/2 -translate-x-1/2 mx-auto opacity-80"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
