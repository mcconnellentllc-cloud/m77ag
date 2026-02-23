"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ENTITIES } from "@/lib/entities";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [entityStats, setEntityStats] = useState<Record<string, number>>({});

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch email stats for entity unread counts
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/emails/stats");
      if (res.ok) {
        const data = await res.json();
        setEntityStats(data.unreadByEntity || {});
      }
    } catch {
      // Silently fail — stats are non-critical
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStats();
      // Refresh stats every 60 seconds
      const interval = setInterval(fetchStats, 60000);
      return () => clearInterval(interval);
    }
  }, [status, fetchStats]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const entitiesWithCounts = ENTITIES.map((e) => ({
    ...e,
    unreadCount: entityStats[e.slug] || 0,
  }));

  const handleSearch = (query: string) => {
    router.push(`/email?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        entities={entitiesWithCounts}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 md:ml-[260px] flex flex-col min-h-screen">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          onSearch={handleSearch}
        />

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
