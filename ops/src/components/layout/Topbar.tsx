"use client";

import { useSession, signOut } from "next-auth/react";
import { Menu, Search, Bell, Camera, LogOut, RefreshCw } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface TopbarProps {
  onMenuClick: () => void;
  onSearch?: (query: string) => void;
}

export default function Topbar({ onMenuClick, onSearch }: TopbarProps) {
  const { data: session } = useSession();
  const [searchValue, setSearchValue] = useState("");
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/accounts/sync", { method: "POST" });
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search emails, bills, expenses..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
            title="Sync all email accounts"
          >
            <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
          </button>

          {/* Quick scan */}
          <Link
            href="/scan"
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
            title="Scan a document"
          >
            <Camera size={18} />
          </Link>

          {/* Notifications */}
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 relative">
            <Bell size={18} />
          </button>

          {/* User */}
          <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700">
                {session?.user?.name || "User"}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
