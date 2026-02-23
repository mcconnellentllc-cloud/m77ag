"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { format } from "date-fns";
import { ENTITIES } from "@/lib/entities";
import {
  AlertCircle, CheckCircle, Clock,
  Plus, DollarSign, X,
} from "lucide-react";

interface BillData {
  id: string;
  vendor: string;
  invoiceNumber: string | null;
  amount: string;
  dueDate: string | null;
  paymentTerms: string | null;
  status: string;
  expenseCategory: string | null;
  source: string;
  createdAt: string;
  entity: { slug: string; name: string; color: string } | null;
  user: { name: string } | null;
}

export default function BillsPageWrapper() {
  return (
    <Suspense fallback={<AppShell><div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" /></div></AppShell>}>
      <BillsPage />
    </Suspense>
  );
}

function BillsPage() {
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") || "";

  const [bills, setBills] = useState<BillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialView === "upcoming" ? "pending" : "");
  const [entityFilter, setEntityFilter] = useState("");
  const [showPayModal, setShowPayModal] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Pay form state
  const [payForm, setPayForm] = useState({
    checkNumber: "",
    paymentDate: format(new Date(), "yyyy-MM-dd"),
    bankAccount: "",
    notes: "",
  });

  // Add bill form state
  const [addForm, setAddForm] = useState({
    entitySlug: "",
    vendor: "",
    amount: "",
    invoiceNumber: "",
    dueDate: "",
    paymentTerms: "",
    expenseCategory: "",
  });

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (entityFilter) params.set("entity", entityFilter);
      const res = await fetch(`/api/bills?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBills(data.bills);
      }
    } catch (err) {
      console.error("Error fetching bills:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, entityFilter]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handlePay = async (billId: string) => {
    try {
      await fetch(`/api/bills/${billId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payForm),
      });
      setShowPayModal(null);
      setPayForm({ checkNumber: "", paymentDate: format(new Date(), "yyyy-MM-dd"), bankAccount: "", notes: "" });
      fetchBills();
    } catch (err) {
      console.error("Error paying bill:", err);
    }
  };

  const handleAddBill = async () => {
    try {
      await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          amount: parseFloat(addForm.amount),
        }),
      });
      setShowAddModal(false);
      setAddForm({ entitySlug: "", vendor: "", amount: "", invoiceNumber: "", dueDate: "", paymentTerms: "", expenseCategory: "" });
      fetchBills();
    } catch (err) {
      console.error("Error adding bill:", err);
    }
  };

  const pendingBills = bills.filter((b) => b.status === "pending");
  const overdueBills = bills.filter(
    (b) => b.status === "pending" && b.dueDate && new Date(b.dueDate) < new Date()
  );
  const paidBills = bills.filter((b) => b.status === "paid");
  const totalDue = pendingBills.reduce((sum, b) => sum + Number(b.amount), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Bills</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <Plus size={16} /> Add Bill
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-blue-600" />
              <span className="text-sm text-gray-500">Total Due</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${totalDue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-amber-600" />
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{pendingBills.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-red-600" />
              <span className="text-sm text-gray-500">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{overdueBills.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm text-gray-500">Paid This Month</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{paidBills.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
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
        </div>

        {/* Bills table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-20 text-sm text-gray-400">No bills found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Entity</th>
                    <th className="px-4 py-3 text-left">Vendor</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Due Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Source</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bills.map((bill) => {
                    const isOverdue = bill.status === "pending" && bill.dueDate && new Date(bill.dueDate) < new Date();
                    return (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: bill.entity?.color || "#6b7280" }}
                            />
                            <span className="text-gray-600">{bill.entity?.name || "Unassigned"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{bill.vendor}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">
                          ${Number(bill.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`px-4 py-3 ${isOverdue ? "text-red-600 font-medium" : "text-gray-600"}`}>
                          {bill.dueDate ? format(new Date(bill.dueDate), "MMM d, yyyy") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            bill.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : isOverdue
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {isOverdue ? "Overdue" : bill.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 capitalize">{bill.source}</td>
                        <td className="px-4 py-3 text-right">
                          {bill.status === "pending" && (
                            <button
                              onClick={() => setShowPayModal(bill.id)}
                              className="text-xs px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pay bill modal */}
        {showPayModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Mark Bill as Paid</h2>
                <button onClick={() => setShowPayModal(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check Number</label>
                  <input
                    type="text"
                    value={payForm.checkNumber}
                    onChange={(e) => setPayForm({ ...payForm, checkNumber: e.target.value })}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={payForm.paymentDate}
                    onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                  <input
                    type="text"
                    value={payForm.bankAccount}
                    onChange={(e) => setPayForm({ ...payForm, bankAccount: e.target.value })}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={payForm.notes}
                    onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                  />
                </div>
                <button
                  onClick={() => handlePay(showPayModal)}
                  className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add bill modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Add Bill</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entity *</label>
                  <select
                    value={addForm.entitySlug}
                    onChange={(e) => setAddForm({ ...addForm, entitySlug: e.target.value })}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                  >
                    <option value="">Select entity...</option>
                    {ENTITIES.map((e) => (
                      <option key={e.slug} value={e.slug}>{e.name}</option>
                    ))}
                  </select>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={addForm.invoiceNumber}
                    onChange={(e) => setAddForm({ ...addForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={addForm.dueDate}
                    onChange={(e) => setAddForm({ ...addForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                  />
                </div>
                <button
                  onClick={handleAddBill}
                  disabled={!addForm.entitySlug || !addForm.vendor || !addForm.amount}
                  className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  Add Bill
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
