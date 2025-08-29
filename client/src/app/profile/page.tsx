"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface UserProfile {
  email: string;
  role: string;
  fullName?: string;
  phone?: string;
  createdAt?: string;
  lastLogin?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    email: ""
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const load = async () => {
      try {
        const res = await fetch("http://localhost:5000/access/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        const userData = data?.user || data;
        setUser({
          email: userData?.email || "",
          role: userData?.role || "user",
          fullName: userData?.fullName || userData?.email?.split("@")[0] || "",
          phone: userData?.phone || "",
          createdAt: userData?.createdAt || new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
        setEditForm({
          fullName: userData?.fullName || userData?.email?.split("@")[0] || "",
          phone: userData?.phone || "",
          email: userData?.email || ""
        });
      } catch (e) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    };
    load();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Here you would typically make an API call to update the user profile
      // For now, we'll just update the local state
      setUser(prev => prev ? {
        ...prev,
        fullName: editForm.fullName,
        phone: editForm.phone,
        email: editForm.email
      } : null);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      email: user?.email || ""
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const initials = (() => {
    if (user.fullName && user.fullName !== user.email) {
      const parts = user.fullName.split(" ").filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return user.fullName.substring(0, 2).toUpperCase();
    }
    const name = user.email.split("@")[0] || "user";
    const parts = name.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  })();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Profile</h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              {user.fullName && user.fullName !== user.email ? user.fullName : user.email} • {user.role}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow border border-black/5 dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Personal Information</h2>
              {!isEditing ? (
                <Button onClick={handleEdit} className="bg-neutral-700 hover:bg-neutral-800 text-white">
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={loading} className="bg-neutral-700 hover:bg-neutral-800 text-white">
                    {loading ? "Saving..." : "Save"}
                  </Button>
                  <Button onClick={handleCancel} className="bg-neutral-700 hover:bg-neutral-800 text-white">
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Full Name</label>
                  <p className="text-lg font-medium">{user.fullName || "Not set"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Email</label>
                  <p className="text-lg font-medium">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Phone</label>
                  <p className="text-lg font-medium">{user.phone || "Not set"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Role</label>
                  <p className="text-lg font-medium capitalize">{user.role}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Full Name</label>
                  <Input
                    value={editForm.fullName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Email</label>
                  <Input
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    type="email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Phone</label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                    type="tel"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Account & Security */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow border border-black/5 dark:border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-4">Account & Security</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Account Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Last Login</label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Unknown'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Member Since</label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <Button 
                  onClick={handleLogout} 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white dark:bg-neutral-900 rounded-lg shadow border border-black/5 dark:border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => router.push("/dashboard")}
              className="bg-neutral-700 hover:bg-neutral-800 text-white h-12"
            >
              Go to Dashboard
            </Button>
            <Button 
              onClick={() => window.open("mailto:" + user.email, "_blank")}
              className="bg-neutral-700 hover:bg-neutral-800 text-white h-12"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
