"use client";
import React, { useEffect, useState } from "react";
import { warrantyService, WarrantyStats } from "@/services/warrantyService";

export default function WarrantyDashboard() {
  const [stats, setStats] = useState<WarrantyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    warrantyService.getStats().then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, []);

  const cards = stats
    ? [
        {
          id: "stat-total",
          label: "Total Warranties",
          value: stats.total,
          sub: "across all customers",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          color: "from-blue-500 to-blue-600",
          bg: "bg-blue-50 dark:bg-blue-500/10",
          text: "text-blue-600 dark:text-blue-400",
        },
        {
          id: "stat-active",
          label: "Active",
          value: stats.active,
          sub: "in good standing",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
          color: "from-success-500 to-success-600",
          bg: "bg-success-50 dark:bg-success-500/10",
          text: "text-success-600 dark:text-success-400",
        },
        {
          id: "stat-expiring",
          label: "Expiring Soon",
          value: stats.expiring_soon,
          sub: `${stats.expiring_30_days} within 30 days`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: "from-warning-500 to-warning-600",
          bg: "bg-warning-50 dark:bg-warning-500/10",
          text: "text-warning-600 dark:text-warning-400",
          highlight: stats.expiring_soon > 0,
        },
        {
          id: "stat-expired",
          label: "Expired",
          value: stats.expired,
          sub: "need renewal action",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: "from-error-500 to-error-600",
          bg: "bg-error-50 dark:bg-error-500/10",
          text: "text-error-600 dark:text-error-400",
          highlight: stats.expired > 0,
        },
        {
          id: "stat-claims",
          label: "Open Claims",
          value: stats.pending_claims,
          sub: `of ${stats.total_claims} total claims`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          ),
          color: "from-purple-500 to-purple-600",
          bg: "bg-purple-50 dark:bg-purple-500/10",
          text: "text-purple-600 dark:text-purple-400",
        },
      ]
    : [];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {loading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-5">
              <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800 mb-3" />
              <div className="h-8 w-16 rounded bg-gray-100 dark:bg-gray-800 mb-2" />
              <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          ))
        : cards.map((card) => (
            <div
              key={card.id}
              id={card.id}
              className={`relative rounded-2xl border bg-white dark:bg-gray-dark p-5 transition-shadow hover:shadow-md ${
                card.highlight
                  ? "border-warning-200 dark:border-warning-800/50"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              {card.highlight && (
                <span className="absolute right-3 top-3 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-warning-500"></span>
                </span>
              )}
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} ${card.text}`}>
                {card.icon}
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {card.label}
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-800 dark:text-white/90">{card.value}</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{card.sub}</p>
            </div>
          ))}
    </div>
  );
}
