"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { ENTITIES } from "@/lib/entities";
import {
  Mail, Tag, Shield, Plus, Trash2,
  CheckCircle, XCircle, X,
} from "lucide-react";

interface EmailAccountData {
  id: string;
  emailAddress: string;
  displayName: string;
  provider: string;
  lastSyncAt: string | null;
  syncEnabled: boolean;
  entity: { slug: string; name: string; color: string } | null;
}

interface RuleData {
  id: string;
  conditionType: string;
  conditionValue: string;
  assignPriority: string | null;
  isActive: boolean;
  entity: { slug: string; name: string; color: string } | null;
}

type ActiveTab = "accounts" | "rules" | "entities";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("accounts");
  const [accounts, setAccounts] = useState<EmailAccountData[]>([]);
  const [rules, setRules] = useState<RuleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRule, setShowAddRule] = useState(false);

  const [ruleForm, setRuleForm] = useState({
    conditionType: "sender",
    conditionValue: "",
    entitySlug: "",
    priority: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accountsRes, rulesRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/rules"),
      ]);
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data.accounts);
      }
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setRules(data.rules);
      }
    } catch (err) {
      console.error("Error fetching settings data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async () => {
    try {
      await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleForm),
      });
      setShowAddRule(false);
      setRuleForm({ conditionType: "sender", conditionValue: "", entitySlug: "", priority: "" });
      fetchData();
    } catch (err) {
      console.error("Error adding rule:", err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await fetch(`/api/rules/${ruleId}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Error deleting rule:", err);
    }
  };

  const tabs = [
    { key: "accounts" as const, label: "Email Accounts", icon: Mail },
    { key: "rules" as const, label: "Email Rules", icon: Tag },
    { key: "entities" as const, label: "Entities", icon: Shield },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-gray-900 text-white font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Email Accounts tab */}
            {activeTab === "accounts" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Connected email accounts. OAuth tokens must be configured to enable sync.
                </p>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                  {accounts.map((account) => (
                    <div key={account.id} className="px-5 py-4 flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                        account.provider === "gmail" ? "bg-red-500" : "bg-blue-500"
                      }`}>
                        {account.provider === "gmail" ? "G" : "M"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{account.displayName}</p>
                        <p className="text-xs text-gray-500">{account.emailAddress}</p>
                      </div>
                      {account.entity && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: account.entity.color }} />
                          <span className="text-xs text-gray-500">{account.entity.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {account.syncEnabled ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircle size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            <XCircle size={12} /> Not connected
                          </span>
                        )}
                      </div>
                      {account.lastSyncAt && (
                        <span className="text-xs text-gray-400 hidden sm:inline">
                          Last sync: {new Date(account.lastSyncAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Rules tab */}
            {activeTab === "rules" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Rules override AI categorization. Checked in order before AI is called.
                  </p>
                  <button
                    onClick={() => setShowAddRule(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                  >
                    <Plus size={16} /> Add Rule
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                  {rules.length === 0 ? (
                    <div className="px-5 py-12 text-center text-sm text-gray-400">
                      No rules yet. Create one to automatically categorize emails.
                    </div>
                  ) : (
                    rules.map((rule) => (
                      <div key={rule.id} className="px-5 py-4 flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            When <span className="font-medium">{rule.conditionType}</span> is{" "}
                            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                              {rule.conditionValue}
                            </span>
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            {rule.entity && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: rule.entity.color }} />
                                <span className="text-xs text-gray-500">→ {rule.entity.name}</span>
                              </div>
                            )}
                            {rule.assignPriority && (
                              <span className="text-xs text-gray-500">Priority: {rule.assignPriority}</span>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          rule.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {rule.isActive ? "Active" : "Disabled"}
                        </span>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add rule modal */}
                {showAddRule && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Add Email Rule</h2>
                        <button onClick={() => setShowAddRule(false)} className="p-1 hover:bg-gray-100 rounded">
                          <X size={20} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Condition Type</label>
                          <select
                            value={ruleForm.conditionType}
                            onChange={(e) => setRuleForm({ ...ruleForm, conditionType: e.target.value })}
                            className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                          >
                            <option value="sender">Sender Email</option>
                            <option value="domain">Sender Domain</option>
                            <option value="subject">Subject Contains</option>
                            <option value="keyword">Keyword</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                          <input
                            type="text"
                            value={ruleForm.conditionValue}
                            onChange={(e) => setRuleForm({ ...ruleForm, conditionValue: e.target.value })}
                            placeholder={
                              ruleForm.conditionType === "sender" ? "john@example.com" :
                              ruleForm.conditionType === "domain" ? "corteva.com" :
                              "keyword or phrase"
                            }
                            className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Entity</label>
                          <select
                            value={ruleForm.entitySlug}
                            onChange={(e) => setRuleForm({ ...ruleForm, entitySlug: e.target.value })}
                            className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                          >
                            <option value="">No entity assignment</option>
                            {ENTITIES.map((e) => (
                              <option key={e.slug} value={e.slug}>{e.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Set Priority</label>
                          <select
                            value={ruleForm.priority}
                            onChange={(e) => setRuleForm({ ...ruleForm, priority: e.target.value })}
                            className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                          >
                            <option value="">No priority override</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                            <option value="none">Noise</option>
                          </select>
                        </div>
                        <button
                          onClick={handleAddRule}
                          disabled={!ruleForm.conditionValue}
                          className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
                        >
                          Create Rule
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Entities tab */}
            {activeTab === "entities" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Business entities. Every email, bill, and expense is tagged to one of these.
                </p>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                  {ENTITIES.map((entity) => (
                    <div key={entity.slug} className="px-5 py-4 flex items-center gap-4">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: entity.color }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{entity.name}</p>
                        <p className="text-xs text-gray-500">{entity.description}</p>
                      </div>
                      <span className="text-xs font-mono text-gray-400">{entity.slug}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
