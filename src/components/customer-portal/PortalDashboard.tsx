"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCustomerPortal } from "@/app/(customer)/layout";
import {
  customerPortalService,
  type PortalOverview,
  type PortalServiceHistoryItem,
} from "@/services/customerPortalService";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "None scheduled";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function SystemStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    operational: { label: "Operating Normally", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
    degraded:    { label: "Reduced Output",     color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",   dot: "bg-amber-500"   },
    offline:     { label: "System Offline",     color: "text-red-700",     bg: "bg-red-50 border-red-200",       dot: "bg-red-500"     },
    maintenance: { label: "In Maintenance",     color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",     dot: "bg-blue-500"    },
  };
  const s = map[status] ?? map.operational;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${s.bg} ${s.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} animate-pulse`} />
      {s.label}
    </span>
  );
}

const ACTIVITY_META: Record<PortalServiceHistoryItem["type"], { label: string; icon: string; bg: string; text: string }> = {
  support: { label: "Support", icon: "🎫", bg: "bg-blue-50", text: "text-blue-700" },
  work_order: { label: "Service Visit", icon: "🔧", bg: "bg-brand-50", text: "text-brand-700" },
  maintenance: { label: "Maintenance", icon: "🗓️", bg: "bg-emerald-50", text: "text-emerald-700" },
  warranty: { label: "Warranty", icon: "🛡️", bg: "bg-amber-50", text: "text-amber-700" },
};

const QUICK_ACTIONS = [
  {
    href: "/portal/support",
    label: "Request Support",
    description: "Report an issue or ask a question",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    color: "text-brand-600",
    bg: "bg-brand-50",
  },
  {
    href: "/portal/maintenance",
    label: "Request Maintenance",
    description: "Schedule a service visit",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    href: "/portal/system",
    label: "My Solar Systems",
    description: "View system and equipment details",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    href: "/portal/documents",
    label: "Download Documents",
    description: "Contracts, permits, reports",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    href: "/portal/warranties",
    label: "View Warranties",
    description: "Check coverage and expiry dates",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

export default function PortalDashboard() {
  const { customer } = useCustomerPortal();
  const [overview, setOverview] = useState<PortalOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    customerPortalService.getOverview(customer.id).then((data) => {
      setOverview(data);
      setLoading(false);
    });
  }, [customer]);

  if (loading || !customer) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="h-40 rounded-2xl bg-gray-200" />
      </div>
    );
  }

  const primaryInstallation = overview?.installations[0];
  const totalSystemKw = overview?.installations.reduce((s, i) => s + i.system_size_kw, 0) ?? 0;
  const totalMonthlySavings = overview?.installations.reduce((s, i) => s + i.monthly_savings_usd, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-blue-700 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />
        <div className="relative">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium text-blue-200 mb-1">Your Solar System</p>
              <h1 className="text-2xl font-bold">
                {totalSystemKw.toFixed(1)} kW System
              </h1>
              <p className="text-sm text-blue-100 mt-1">
                {overview?.installations.length ?? 0} installation{(overview?.installations.length ?? 0) !== 1 ? "s" : ""} · {customer.system_type}
              </p>
            </div>
            {primaryInstallation && (
              <SystemStatusPill status={primaryInstallation.status} />
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <div className="rounded-lg bg-white/10 backdrop-blur px-3 py-1.5 text-sm font-medium">
              ☀️ Est. saving <span className="font-bold">${totalMonthlySavings}/mo</span>
            </div>
            <div className="rounded-lg bg-white/10 backdrop-blur px-3 py-1.5 text-sm font-medium">
              🛡️ <span className="font-bold">{overview?.activeWarranties ?? 0}</span> active warranties
            </div>
            {overview?.nextServiceDate && (
              <div className="rounded-lg bg-white/10 backdrop-blur px-3 py-1.5 text-sm font-medium">
                🔧 Service on <span className="font-bold">{formatDate(overview.nextServiceDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "System Status",
            value: primaryInstallation ? (primaryInstallation.status === "operational" ? "Online" : primaryInstallation.status.replace("_", " ")) : "—",
            icon: "⚡",
            color: primaryInstallation?.status === "operational" ? "text-emerald-600" : "text-amber-600",
            bg: primaryInstallation?.status === "operational" ? "bg-emerald-50" : "bg-amber-50",
          },
          {
            label: "Monthly Savings",
            value: `$${totalMonthlySavings.toLocaleString()}`,
            icon: "💰",
            color: "text-brand-600",
            bg: "bg-brand-50",
          },
          {
            label: "Active Warranties",
            value: overview?.activeWarranties ?? 0,
            icon: "🛡️",
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Open Tickets",
            value: overview?.openTickets ?? 0,
            icon: overview?.openTickets ? "🎫" : "✅",
            color: overview?.openTickets ? "text-amber-600" : "text-emerald-600",
            bg: overview?.openTickets ? "bg-amber-50" : "bg-emerald-50",
          },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl ${stat.bg} p-4 border border-gray-100`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Next service card */}
      {overview?.nextServiceDate && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl">
              🔧
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Upcoming Service Visit</p>
              <p className="text-sm text-amber-700 mt-0.5">{overview.nextServiceTitle}</p>
              <p className="text-sm font-medium text-amber-900 mt-1">
                Scheduled for {formatDate(overview.nextServiceDate)}
              </p>
            </div>
            <Link
              href="/portal/work-orders"
              className="flex-shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
            >
              Track
            </Link>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${action.bg} ${action.color} transition-transform group-hover:scale-105`}>
                {action.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent service activity */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Recent Service Activity</h2>
            <p className="text-xs text-gray-500 mt-0.5">Updates from your support requests, visits, warranties, and reports.</p>
          </div>
          <Link
            href="/portal/service-history"
            className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            View all
          </Link>
        </div>

        {overview?.recentActivity.length ? (
          <div className="space-y-3">
            {overview.recentActivity.map((item) => {
              const meta = ACTIVITY_META[item.type];
              return (
                <Link
                  href={item.href ?? "/portal/service-history"}
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-gray-100 p-3 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${meta.bg}`}>
                    <span className="text-lg">{meta.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.bg} ${meta.text}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{item.description}</p>
                  </div>
                  <p className="flex-shrink-0 text-xs text-gray-400">
                    {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-gray-700">No service activity yet</p>
            <p className="mt-1 text-xs text-gray-500">Support requests and completed visits will appear here.</p>
          </div>
        )}
      </div>

      {/* System info footer */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Account Info</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
          {[
            { label: "Account Number", value: customer.account_number },
            { label: "System Type", value: customer.system_type.charAt(0).toUpperCase() + customer.system_type.slice(1) },
            { label: "Address", value: `${customer.address}, ${customer.city}, ${customer.state} ${customer.zip}` },
            { label: "Last Service", value: customer.last_service_date ? new Date(customer.last_service_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not on record" },
          ].map((row) => (
            <div key={row.label}>
              <p className="text-xs text-gray-400 font-medium">{row.label}</p>
              <p className="text-gray-800 font-medium mt-0.5">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
