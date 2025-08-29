"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Overview from "@/components/dashboard/Overview";
import FirewallRules from "@/components/dashboard/FirewallRules";
import ApiInterface from "@/components/dashboard/ApiInterface";
import LogsAndTesting from "@/components/dashboard/LogsAndTesting";
import { env } from "@/config/env";

const API_BASE = env.NEXT_PUBLIC_API_URL;


type TabKey = "overview" | "firewall" | "api" | "logs";

export default function DashboardPage() {
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`${API_BASE}/access/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsValidToken(true);
          setRole(data?.user?.role || null);
          setEmail(data?.user?.email || null);
        } else {
          localStorage.removeItem("token");
          router.push("/login");
        }
      } catch (error) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    };

    validateToken();
  }, [router]);

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    );
  }

  const isAdmin = role === "admin";

  const initials = (() => {
    if (!email) return "U";
    const name = email.split("@")[0] || "user";
    const parts = name.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  })();

  const TabButton = ({ keyId, label }: { keyId: TabKey; label: string }) => (
    <button
      onClick={() => setActiveTab(keyId)}
      className={
        "px-15 py-2 text-base font-medium rounded-md transition-transform will-change-transform border hover:-translate-y-0.5 active:translate-y-0 cursor-pointer " +
        (activeTab === keyId
          ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
          : "bg-transparent text-inherit border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10")
      }
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-background p-0">
      <div className="flex flex-col min-h-screen">
        {/* Header without borders; unified width via outer 85vw wrapper */}
        <div className="flex justify-between items-center py-5">
          <h1 className="text-2xl sm:text-3xl font-bold">Firewall Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/profile')}
              title={email || 'Profile'}
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black flex items-center justify-center text-sm sm:text-base font-semibold hover:opacity-90 transition cursor-pointer"
            >
              {initials}
            </button>
          </div>
        </div>

        {/* Navbar with subtle background; same width as layout */}
        <div className="w-full py-3 bg-neutral-50 dark:bg-neutral-900/60">
          <div className="flex justify-center">
            <div className="inline-flex gap-3">
              <TabButton keyId="overview" label="Overview" />
              <TabButton keyId="firewall" label="Firewall Rules" />
              <TabButton keyId="api" label="API Interface" />
              <TabButton keyId="logs" label="Logs & Testing" />
            </div>
          </div>
        </div>

        {/* Content with top spacing; shares same width via outer wrapper */}
        <div className="flex-1 min-h-0 mt-4">
          {activeTab === "overview" && <Overview isAdmin={isAdmin} />}
          {activeTab === "firewall" && <FirewallRules isAdmin={isAdmin} />}
          {activeTab === "api" && <ApiInterface isAdmin={isAdmin} />}
          {activeTab === "logs" && <LogsAndTesting isAdmin={isAdmin} />}
        </div>
      </div>
    </div>
  );
}
