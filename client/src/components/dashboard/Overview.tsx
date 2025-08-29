import React, { useEffect, useState } from "react";
import { env } from "@/config/env";

const API_BASE = env.NEXT_PUBLIC_API_URL;

export default function Overview({ isAdmin }: { isAdmin: boolean }) {
  const [activeModules, setActiveModules] = useState<number>(0);
  const [activeRules, setActiveRules] = useState<number>(0);
  const [blockedPackets, setBlockedPackets] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch rules and count active ones
        const res = await fetch(`${API_BASE}/rules/api/firewall/rules`);
        if (res.ok) {
          const data = await res.json();
          const countActive = (
            ["ips", "urls", "ports"] as Array<"ips" | "urls" | "ports">
          ).reduce((sum, key) => {
            const wl = data[key]?.whitelist ?? [];
            const bl = data[key]?.blacklist ?? [];
            const all = [...wl, ...bl];
            return (
              sum + all.reduce((s: number, r: any) => (r.active ? s + 1 : s), 0)
            );
          }, 0);
          setActiveRules(countActive);
        }

        // Placeholders for now until endpoints exist
        setActiveModules(0);
        setBlockedPackets(0);
      } catch (e) {
        // Silently ignore for now
      }
    };
    load();
  }, []);

  const stats = [
    { label: "Active modules", value: activeModules },
    { label: "Active rules", value: activeRules },
    { label: "Blocked packets", value: blockedPackets },
  ];

  return (
    <div className="w-full h-full p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Overview</h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Welcome back. {isAdmin ? "You have full administrative control." : "You have limited access."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 p-5 shadow-sm"
          >
            <div className="text-sm text-neutral-500 dark:text-neutral-400">{s.label}</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
