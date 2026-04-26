"use client";

import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import { format } from "date-fns";
import { ENTITIES } from "@/lib/entities";
import { DollarSign, Plus, X } from "lucide-react";

interface ExpenseData {
  id: string;
  vendor: string;
  amount: string;
  category: string;
  subcategory: string | null;
  date: string;
  checkNumber: string | null;
  bankAccount: string | null;
  notes: string | null;
  source: string;
  entity: { slug: string; name: string; color: string } | null;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [addForm, setAddForm] = useState({
    entitySlug: "", vendor: "", amount: "", category: "",
    subcategory: "", checkNumber: "", bankAccount: "",
    notes: "", date: format(new Date(), "yyyy-MM-dd"),
  });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityFilter) params.set("entity", entityFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses);
      }
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [entityFilter, categoryFilter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleAdd = async () => {
    try {
      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, amount: parseFloat(addForm.amount) }),
      });
      setShowAddModal(false);
      setAddForm({
        entitySlug: "", vendor: "", amount: "", category: "",
        subcategory: "", checkNumber: "", bankAccount: "",
        notes: "", date: format(new Date(), "yyyy-MM-dd"),
      });
      fetchExpenses();
    } catch (err) {
      console.error("Error adding expense:", err);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Get categories for selected entity
  const selectedEntity = ENTITIES.find((e) => e.slug === addForm.entitySlug);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <Plus size={16} /> Add Expense
          </button>
        </div>

        {/* Total */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 inline-block">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-green-600" />
            <span className="text-sm text-gray-500">Total Shown</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">All entities</option>
            {ENTITIES.map((e) => (
              <option key={e.slug} value={e.slug}>{e.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="Filter by category..."
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
          />
        </div>

        {/* Expenses table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-20 text-sm text-gray-400">No expenses found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Entity</th>
                    <th className="px-4 py-3 text-left">Vendor</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Check #</th>
                    <th className="px-4 py-3 text-left">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {format(new Date(expense.date), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: expense.entity?.color || "#6b7280" }}
                          />
                          <span>{expense.entity?.name || "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{expense.vendor}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{expense.category}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">
                        ${Number(expense.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{expense.checkNumber || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{expense.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add expense modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Add Expense</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entity *</label>
                  <select
                    value={addForm.entitySlug}
                    onChange={(e) => setAddForm({ ...addForm, entitySlug: e.target.value, category: "" })}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                  >
                    <option value="">Select entity...</option>
                    {ENTITIES.map((e) => (
                      <option key={e.slug} value={e.slug}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={addForm.date}
                    onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
                  <input
                    type="text"
                    value={addForm.vendor}
                    onChange={(e) => setAddForm({ ...addForm, vendor: e.target.value })}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.amount}
                    onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                  >
                    <option value="">Select category...</option>
                    {(selectedEntity?.expenseCategories || []).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check Number</label>
                  <input
                    type="text"
                    value={addForm.checkNumber}
                    onChange={(e) => setAddForm({ ...addForm, checkNumber: e.target.value })}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                  <input
                    type="text"
                    value={addForm.bankAccount}
                    onChange={(e) => setAddForm({ ...addForm, bankAccount: e.target.value })}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={addForm.notes}
                    onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                  />
                </div>
                <button
                  onClick={handleAdd}
                  disabled={!addForm.entitySlug || !addForm.vendor || !addForm.amount || !addForm.category}
                  className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  Add Expense
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
