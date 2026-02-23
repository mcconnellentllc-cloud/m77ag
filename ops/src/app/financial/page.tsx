"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { ENTITIES } from "@/lib/entities";
import { BarChart3 } from "lucide-react";

interface SummaryData {
  year: number;
  month: number | null;
  summaryByEntity: Record<string, { total: number; byCategory: Record<string, number> }>;
  grandTotal: number;
}

export default function FinancialPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState<number | null>(new Date().getMonth() + 1);
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ year: year.toString() });
        if (month) params.set("month", month.toString());
        const res = await fetch(`/api/expenses/summary?${params.toString()}`);
        if (res.ok) {
          setSummary(await res.json());
        }
      } catch (err) {
        console.error("Error fetching summary:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [year, month]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>

          {/* Period selector */}
          <div className="flex items-center gap-3">
            <select
              value={month || ""}
              onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : null)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">Full Year</option>
              {monthNames.map((name, idx) => (
                <option key={idx} value={idx + 1}>{name}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grand total */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 size={20} className="text-blue-600" />
            <span className="text-sm text-gray-500">
              Total Expenses — {month ? monthNames[month - 1] : "Full Year"} {year}
            </span>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {loading ? "..." : `$${(summary?.grandTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          </p>
        </div>

        {/* Entity breakdown */}
        {!loading && summary && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              By Entity
            </h2>

            {ENTITIES.map((entity) => {
              const data = summary.summaryByEntity[entity.slug];
              if (!data || data.total === 0) return null;

              const isExpanded = expandedEntity === entity.slug;
              const pct = summary.grandTotal > 0
                ? (data.total / summary.grandTotal) * 100
                : 0;

              return (
                <div key={entity.slug} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setExpandedEntity(isExpanded ? null : entity.slug)}
                    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entity.color }}
                    />
                    <span className="font-medium text-gray-900 text-left flex-1">
                      {entity.name}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
                      <span className="font-mono font-semibold text-gray-900">
                        ${data.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </button>

                  {/* Category breakdown */}
                  {isExpanded && (
                    <div className="px-5 pb-4 border-t border-gray-100">
                      <div className="pt-3 space-y-2">
                        {Object.entries(data.byCategory)
                          .sort(([, a], [, b]) => b - a)
                          .map(([category, amount]) => (
                            <div key={category} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 capitalize">{category}</span>
                              <span className="text-sm font-mono text-gray-800">
                                ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          </div>
        )}
      </div>
    </AppShell>
  );
}
