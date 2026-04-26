"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Archive, Clock, Star, Ban, Receipt, Tag,
  Check, Reply,
} from "lucide-react";
import { ENTITIES } from "@/lib/entities";

interface EmailItem {
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
  account: {
    emailAddress: string;
    displayName: string;
    provider: string;
  };
  entity: {
    slug: string;
    name: string;
    color: string;
    icon: string;
  } | null;
}

interface EmailListProps {
  emails: EmailItem[];
  loading: boolean;
  onAction: (emailId: string, action: string, data?: Record<string, unknown>) => void;
  onRefresh: () => void;
}

export default function EmailList({ emails, loading, onAction, onRefresh }: EmailListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reclassifyId, setReclassifyId] = useState<string | null>(null);
  const [snoozeId, setSnoozeId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-sm">No emails found</p>
      </div>
    );
  }

  const priorityLabel = (p: string) => {
    const labels: Record<string, string> = {
      critical: "Critical",
      high: "High",
      medium: "Medium",
      low: "Low",
      none: "Noise",
    };
    return labels[p] || p;
  };

  const priorityClass = (p: string) => `priority-${p}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
      {emails.map((email) => {
        const isExpanded = expandedId === email.id;
        const isRecent = new Date(email.receivedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);

        return (
          <div key={email.id} className={`email-row ${!email.isRead ? "unread" : ""}`}>
            {/* Email row */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              onClick={() => {
                setExpandedId(isExpanded ? null : email.id);
                if (!email.isRead) {
                  onAction(email.id, "read");
                }
              }}
            >
              {/* Entity dot */}
              <div
                className="entity-dot flex-shrink-0"
                style={{ backgroundColor: email.entity?.color || "#cbd5e1" }}
                title={email.entity?.name || "Unassigned"}
              />

              {/* Star */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(email.id, "star");
                }}
                className="flex-shrink-0"
              >
                <Star
                  size={16}
                  className={email.isStarred ? "text-amber-400 fill-amber-400" : "text-gray-300 hover:text-gray-400"}
                />
              </button>

              {/* Sender + Subject + Summary */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm truncate ${!email.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                    {email.senderName || email.senderEmail}
                  </span>
                  {email.needsResponse && (
                    <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                      Reply needed
                    </span>
                  )}
                  {email.isBill && (
                    <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                      Bill
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-sm truncate ${!email.isRead ? "text-gray-800" : "text-gray-600"}`}>
                    {email.subject || "(No Subject)"}
                  </span>
                  {email.aiSummary && (
                    <span className="text-xs text-gray-400 truncate hidden sm:inline">
                      — {email.aiSummary}
                    </span>
                  )}
                </div>
              </div>

              {/* Priority badge */}
              <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityClass(email.priority)}`}>
                {priorityLabel(email.priority)}
              </span>

              {/* Account indicator */}
              <span className="hidden lg:inline-flex text-[10px] text-gray-400 truncate max-w-[120px]">
                {email.account.displayName}
              </span>

              {/* Time */}
              <span className="flex-shrink-0 text-xs text-gray-400 w-16 text-right">
                {isRecent
                  ? formatDistanceToNow(new Date(email.receivedAt), { addSuffix: false })
                  : format(new Date(email.receivedAt), "MMM d")}
              </span>
            </div>

            {/* Expanded detail + actions */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-1 bg-gray-50/50 border-t border-gray-100">
                {/* Email preview */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span>From: {email.senderName} &lt;{email.senderEmail}&gt;</span>
                    <span>&middot;</span>
                    <span>via {email.account.emailAddress}</span>
                    <span>&middot;</span>
                    <span>{format(new Date(email.receivedAt), "MMM d, yyyy h:mm a")}</span>
                  </div>
                  {email.entity && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: email.entity.color }} />
                      <span>{email.entity.name}</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {email.bodyPreview || email.snippet || "No preview available"}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {/* Reply flow — placeholder */}}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                  >
                    <Reply size={14} /> Reply
                  </button>
                  <button
                    onClick={() => onAction(email.id, "archive")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <Archive size={14} /> Archive
                  </button>
                  <button
                    onClick={() => setSnoozeId(snoozeId === email.id ? null : email.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <Clock size={14} /> Snooze
                  </button>
                  <button
                    onClick={() => onAction(email.id, "block_sender")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Ban size={14} /> Block Sender
                  </button>
                  {!email.isBill && (
                    <button
                      onClick={() => onAction(email.id, "create_bill")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-amber-700 rounded-lg hover:bg-amber-50"
                    >
                      <Receipt size={14} /> Create Bill
                    </button>
                  )}
                  <button
                    onClick={() => setReclassifyId(reclassifyId === email.id ? null : email.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <Tag size={14} /> Reclassify
                  </button>
                </div>

                {/* Snooze picker */}
                {snoozeId === email.id && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { label: "Tomorrow", days: 1 },
                      { label: "3 days", days: 3 },
                      { label: "1 week", days: 7 },
                      { label: "2 weeks", days: 14 },
                    ].map(({ label, days }) => (
                      <button
                        key={days}
                        onClick={() => {
                          const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                          onAction(email.id, "snooze", { until: until.toISOString() });
                          setSnoozeId(null);
                        }}
                        className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Reclassify picker */}
                {reclassifyId === email.id && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {ENTITIES.map((entity) => (
                      <button
                        key={entity.slug}
                        onClick={() => {
                          onAction(email.id, "reclassify", { entitySlug: entity.slug });
                          setReclassifyId(null);
                          onRefresh();
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entity.color }} />
                        <span className="truncate">{entity.name}</span>
                        {email.entity?.slug === entity.slug && (
                          <Check size={12} className="ml-auto text-green-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
