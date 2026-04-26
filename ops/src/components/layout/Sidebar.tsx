"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Mail, LayoutDashboard, Receipt, DollarSign, BarChart3,
  Camera, Settings, AlertCircle, Ban, Tractor, Target,
  Wheat, Store, FlaskConical, Sprout, Building2, Users,
  Flame, X, ChevronDown, ChevronRight,
} from "lucide-react";
import { useState } from "react";

// Map entity icon names to Lucide components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ENTITY_ICONS: Record<string, any> = {
  Tractor, Target, Wheat, Store, FlaskConical, Sprout, Building2, Users, Flame,
  Beef: Tractor, // Fallback — no beef icon in Lucide
};

interface Entity {
  slug: string;
  name: string;
  color: string;
  icon: string;
  unreadCount?: number;
}

interface SidebarProps {
  entities: Entity[];
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/email", label: "Email Hub", icon: Mail },
  { href: "/email?view=action_required", label: "Action Required", icon: AlertCircle },
  { href: "/email?view=noise", label: "Noise", icon: Ban },
  { href: "/bills", label: "Bills", icon: Receipt },
  { href: "/expenses", label: "Expenses", icon: DollarSign },
  { href: "/financial", label: "Financials", icon: BarChart3 },
  { href: "/scan", label: "Scan", icon: Camera },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ entities, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [entitiesExpanded, setEntitiesExpanded] = useState(true);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[260px] bg-gray-900 text-white flex flex-col transition-transform duration-200 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h1 className="text-lg font-bold tracking-tight">OPS HUB</h1>
            <p className="text-xs text-gray-400">McConnell Operations</p>
          </div>
          <button onClick={onClose} className="md:hidden p-1 hover:bg-gray-800 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          {/* Main nav */}
          <div className="px-3 mb-4">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href.split("?")[0]);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${
                    isActive
                      ? "bg-gray-700 text-white font-medium"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                  {item.label === "Action Required" && (
                    <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {entities.reduce((sum, e) => sum + (e.unreadCount || 0), 0) || ""}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Entity mailboxes */}
          <div className="px-3">
            <button
              onClick={() => setEntitiesExpanded(!entitiesExpanded)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300"
            >
              {entitiesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Entities
            </button>

            {entitiesExpanded && (
              <div className="space-y-0.5">
                {entities.map((entity) => {
                  const IconComponent = ENTITY_ICONS[entity.icon] || Building2;
                  const isActive = pathname === `/email/entity/${entity.slug}`;

                  return (
                    <Link
                      key={entity.slug}
                      href={`/email/entity/${entity.slug}`}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-gray-700 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entity.color }}
                      />
                      <IconComponent size={16} className="flex-shrink-0 opacity-60" />
                      <span className="truncate">{entity.name}</span>
                      {entity.unreadCount ? (
                        <span className="ml-auto text-xs text-gray-400">
                          {entity.unreadCount}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 text-xs text-gray-500">
          ops.m77ag.com
        </div>
      </aside>
    </>
  );
}
