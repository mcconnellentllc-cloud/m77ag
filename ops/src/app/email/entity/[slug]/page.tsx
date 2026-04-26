"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import EmailList from "@/components/email/EmailList";
import { getEntityBySlug } from "@/lib/entities";

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

export default function EntityEmailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const entity = getEntityBySlug(slug);

  const [emails, setEmails] = useState<EmailData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/emails?entity=${slug}&page=${page}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Error fetching entity emails:", err);
    } finally {
      setLoading(false);
    }
  }, [slug, page]);

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
      fetchEmails();
    } catch (err) {
      console.error("Email action failed:", err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {entity && (
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: entity.color }}
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {entity?.name || slug}
            </h1>
            <p className="text-sm text-gray-500">{entity?.description}</p>
          </div>
        </div>

        <EmailList
          emails={emails}
          loading={loading}
          onAction={handleAction}
          onRefresh={fetchEmails}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
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
