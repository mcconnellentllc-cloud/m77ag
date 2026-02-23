"use client";

import { useEffect, useState } from "react";
import { ENTITIES } from "@/lib/entities";
import {
  Mail, AlertCircle, Receipt, DollarSign,
  Clock, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface OverviewData {
  billsDueThisWeek: Array<{
    id: string;
    vendor: string;
    amount: string;
    dueDate: string;
    entity: { slug: string; name: string; color: string };
  }>;
  billsDueAmount: number;
  overdueBills: Array<{
    id: string;
    vendor: string;
    amount: string;
  }>;
  expensesByEntity: Record<string, number>;
  totalExpensesThisMonth: number;
  recentActivity: Array<{
    id: string;
    actionType: string;
    description: string;
    user: { name: string };
    entity?: { slug: string; name: string; color: string } | null;
    createdAt: string;
  }>;
}

interface EmailStats {
  unreadByEntity: Record<string, number>;
  actionRequired: number;
  noiseCount: number;
  totalUnread: number;
  billCount: number;
}

export default function Dashboard() {
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, overviewRes] = await Promise.all([
          fetch("/api/emails/stats"),
          fetch("/api/financial/overview"),
        ]);

        if (statsRes.ok) setEmailStats(await statsRes.json());
        if (overviewRes.ok) setOverview(await overviewRes.json());
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/email" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Mail size={18} className="text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Unread</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{emailStats?.totalUnread || 0}</p>
        </Link>

        <Link href="/email?view=action_required" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircle size={18} className="text-red-600" />
            </div>
            <span className="text-sm text-gray-500">Action Required</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{emailStats?.actionRequired || 0}</p>
        </Link>

        <Link href="/bills?view=upcoming" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Receipt size={18} className="text-amber-600" />
            </div>
            <span className="text-sm text-gray-500">Bills Due This Week</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${overview?.billsDueAmount?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
          </p>
        </Link>

        <Link href="/expenses" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign size={18} className="text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Expenses This Month</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${overview?.totalExpensesThisMonth?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
          </p>
        </Link>
      </div>

      {/* Entity unread cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Unread by Entity
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {ENTITIES.map((entity) => {
            const count = emailStats?.unreadByEntity?.[entity.slug] || 0;
            return (
              <Link
                key={entity.slug}
                href={`/email/entity/${entity.slug}`}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entity.color }}
                  />
                  <span className="text-xs font-medium text-gray-600 truncate">
                    {entity.name}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{count}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two-column: Bills Due + Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Bills due this week */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Bills Due This Week</h2>
            <Link href="/bills" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {overview?.billsDueThisWeek?.length ? (
              overview.billsDueThisWeek.slice(0, 5).map((bill) => (
                <div key={bill.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: bill.entity?.color || "#6b7280" }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{bill.vendor}</p>
                      <p className="text-xs text-gray-400">
                        {bill.dueDate ? format(new Date(bill.dueDate), "MMM d") : "No due date"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ${Number(bill.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                No bills due this week
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {overview?.recentActivity?.length ? (
              overview.recentActivity.slice(0, 8).map((activity) => (
                <div key={activity.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="p-1.5 bg-gray-100 rounded-full mt-0.5">
                    <Clock size={12} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {activity.user?.name} &middot; {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                  {activity.entity && (
                    <div
                      className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: activity.entity.color }}
                    />
                  )}
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expenses by entity bar chart (simplified) */}
      {overview?.expensesByEntity && Object.keys(overview.expensesByEntity).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Expenses This Month by Entity</h2>
          <div className="space-y-3">
            {ENTITIES.map((entity) => {
              const amount = overview.expensesByEntity[entity.slug] || 0;
              const maxAmount = Math.max(
                ...Object.values(overview.expensesByEntity),
                1
              );
              const pct = (amount / maxAmount) * 100;

              if (amount === 0) return null;

              return (
                <div key={entity.slug} className="flex items-center gap-3">
                  <div className="w-32 text-sm text-gray-600 truncate">{entity.name}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: entity.color,
                        minWidth: amount > 0 ? "2px" : "0",
                      }}
                    />
                  </div>
                  <div className="w-24 text-right text-sm font-medium text-gray-700">
                    ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>
      )}
    </div>
  );
}
