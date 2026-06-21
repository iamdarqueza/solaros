"use client";
import React, { useEffect, useState } from "react";
import { warrantyService, Warranty } from "@/services/warrantyService";
import { ExpirationCountdown, getWarrantyTypeBadge, formatDate } from "./WarrantyUIHelpers";
import { useRouter } from "next/navigation";

function AlertBar({ warranty }: { warranty: Warranty }) {
  const isUrgent = warranty.days_remaining <= 30 && warranty.days_remaining >= 0;
  const isCritical = warranty.days_remaining < 0;

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors cursor-pointer group ${
        isCritical
          ? "border-error-200 dark:border-error-800/50 bg-error-50 dark:bg-error-500/[0.08] hover:bg-error-100 dark:hover:bg-error-500/[0.15]"
          : isUrgent
          ? "border-error-200 dark:border-error-800/50 bg-error-50 dark:bg-error-500/[0.08] hover:bg-error-100 dark:hover:bg-error-500/[0.15]"
          : "border-warning-200 dark:border-warning-800/50 bg-warning-50 dark:bg-warning-500/[0.08] hover:bg-warning-100 dark:hover:bg-warning-500/[0.15]"
      }`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${isCritical || isUrgent ? "text-error-500 dark:text-error-400" : "text-warning-500 dark:text-warning-400"}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-semibold truncate ${isCritical || isUrgent ? "text-error-700 dark:text-error-300" : "text-warning-700 dark:text-warning-300"}`}>
            {warranty.product}
          </p>
          {getWarrantyTypeBadge(warranty.warranty_type)}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
          {warranty.customer_name} · {warranty.site_name} · {warranty.supplier}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
          {warranty.manufacturer} · {warranty.serial_number}
        </p>
      </div>

      {/* Expiry */}
      <div className="flex-shrink-0 text-right">
        <p className="text-xs text-gray-500 dark:text-gray-400">Expires {formatDate(warranty.warranty_end)}</p>
        <div className="mt-0.5">
          <ExpirationCountdown daysRemaining={warranty.days_remaining} />
        </div>
      </div>

      {/* Arrow */}
      <svg
        className={`w-4 h-4 flex-shrink-0 transition-colors ${isCritical || isUrgent ? "text-error-400 group-hover:text-error-600" : "text-warning-400 group-hover:text-warning-600"}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

export default function ExpiringWarrantyAlerts() {
  const router = useRouter();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    warrantyService.getAllWarranties().then((all) => {
      // Show expired + expiring soon, sorted by days remaining
      const alerts = all
        .filter((w) => w.days_remaining <= 90)
        .sort((a, b) => a.days_remaining - b.days_remaining);
      setWarranties(alerts);
      setLoading(false);
    });
  }, []);

  const expired = warranties.filter((w) => w.days_remaining < 0);
  const critical = warranties.filter((w) => w.days_remaining >= 0 && w.days_remaining <= 30);
  const warning = warranties.filter((w) => w.days_remaining > 30 && w.days_remaining <= 90);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-5">
        <div className="h-5 w-40 rounded bg-gray-100 dark:bg-gray-800 mb-4 animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (warranties.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-5">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">Warranty Alerts</h2>
        <div className="flex flex-col items-center py-8">
          <svg className="w-12 h-12 text-success-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">All warranties are healthy</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">No warranties expiring in the next 90 days</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Warranty Alerts</h2>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-[10px] font-semibold text-white">
            {warranties.length}
          </span>
        </div>
        <button
          onClick={() => router.push("/warranties/expiring")}
          className="text-xs text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 font-medium"
        >
          View all →
        </button>
      </div>

      <div className="space-y-2">
        {expired.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-error-600 dark:text-error-400 mb-1.5 px-1">
              ● Expired ({expired.length})
            </p>
            <div className="space-y-1.5">
              {expired.map((w) => (
                <div key={w.id} onClick={() => router.push(`/warranties/${w.id}`)}>
                  <AlertBar warranty={w} />
                </div>
              ))}
            </div>
          </div>
        )}

        {critical.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-error-600 dark:text-error-400 mb-1.5 px-1 mt-3">
              ● Critical — within 30 days ({critical.length})
            </p>
            <div className="space-y-1.5">
              {critical.map((w) => (
                <div key={w.id} onClick={() => router.push(`/warranties/${w.id}`)}>
                  <AlertBar warranty={w} />
                </div>
              ))}
            </div>
          </div>
        )}

        {warning.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-warning-600 dark:text-warning-400 mb-1.5 px-1 mt-3">
              ● Warning — within 90 days ({warning.length})
            </p>
            <div className="space-y-1.5">
              {warning.map((w) => (
                <div key={w.id} onClick={() => router.push(`/warranties/${w.id}`)}>
                  <AlertBar warranty={w} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
