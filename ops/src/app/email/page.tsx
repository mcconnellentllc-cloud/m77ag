"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import EmailList from "@/components/email/EmailList";
import { Mail, AlertCircle, Ban, Receipt, Filter } from "lucide-react";

interface EmailData {
  id: string;
  subject: string | null;
  senderEmail: string;
  senderName: string | null;
  snippet: string | null;
  bodyPreview: string | null;
  aiSummary: string | null;
  priority: string;
  entityId: string | null;
  isBill: boolean;
  needsResponse: boolean;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  receivedAt: string;
  account: { emailAddress: string; displayName: string; provider: string; color: string | null };
  entity: { slug: string; name: string; color: string; icon: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const VIEW_TABS = [
  { key: "", label: "Unified Inbox", icon: Mail },
  { key: "action_required", label: "Action Required", icon: AlertCircle },
  { key: "bills", label: "Bills", icon: Receipt },
  { key: "noise", label: "Noise", icon: Ban },
];

export default function EmailPageWrapper() {
  return (
    <Suspense fallback={<AppShell><div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" /></div></AppShell>}>
      <EmailPage />
    </Suspense>
  );
}

function EmailPage() {
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") || "";
  const initialSearch = searchParams.get("search") || "";
  const initialPriority = searchParams.get("priority") || "";

  const [view, setView] = useState(initialView);
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [priorityFilter, setPriorityFilter] = useState(initialPriority);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (view) params.set("view", view);
      if (initialSearch) params.set("search", initialSearch);
      if (priorityFilter) params.set("priority", priorityFilter);
      params.set("page", page.toString());

      const res = await fetch(`/api/emails?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Error fetching emails:", err);
    } finally {
      setLoading(false);
    }
  }, [view, initialSearch, priorityFilter, page]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleAction = async (
    emailId: string,
    action: string,
    data?: Record<string, unknown>
  ) => {
    try {
      await fetch(`/api/emails/${emailId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data }),
      });
      // Refresh the list after action
      fetchEmails();
    } catch (err) {
      console.error("Email action failed:", err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Hub</h1>
            {initialSearch && (
              <p className="text-sm text-gray-500 mt-1">
                Search results for &ldquo;{initialSearch}&rdquo;
              </p>
            )}
          </div>
          {pagination && (
            <span className="text-sm text-gray-400">
              {pagination.total} email{pagination.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* View tabs */}
        <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-100 overflow-x-auto">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setView(tab.key); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md whitespace-nowrap transition-colors ${
                view === tab.key
                  ? "bg-gray-900 text-white font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}

          {/* Priority filter */}
          <div className="ml-auto flex items-center gap-2 pl-3 border-l border-gray-200">
            <Filter size={14} className="text-gray-400" />
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="text-sm border-0 bg-transparent text-gray-600 focus:outline-none cursor-pointer"
            >
              <option value="">All priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Email list */}
        <EmailList
          emails={emails}
          loading={loading}
          onAction={handleAction}
          onRefresh={fetchEmails}
        />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
