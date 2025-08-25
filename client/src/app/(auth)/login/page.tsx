"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // TODO: integrate with server auth endpoint
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-white/80 dark:bg-neutral-900/60 backdrop-blur rounded-2xl shadow-lg border border-black/5 dark:border-white/10 p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Firewall Login</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Sign in to your account
          </p>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded p-2">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-neutral-500">
          <span>Don&apos;t have an account? </span>
          <Link href="/register" className="underline underline-offset-4">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}


