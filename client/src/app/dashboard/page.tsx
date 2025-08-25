"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Validate token by making a request to /access/me
    const validateToken = async () => {
      try {
        const response = await fetch('http://localhost:5000/access/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setIsValidToken(true);
        } else {
          // Token is invalid, remove it and redirect to login
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    validateToken();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (isValidToken === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (isValidToken === false) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Firewall Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
        
        <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow">
          <h2 className="text-2xl font-semibold mb-4">Hello there!</h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Welcome to your firewall management dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
