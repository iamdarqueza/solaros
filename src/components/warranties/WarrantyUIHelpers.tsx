"use client";
import React from "react";
import { Warranty, WarrantyClaim } from "@/services/warrantyService";

// ── Status Badge Helpers ───────────────────────────────────────────────────────

export function getWarrantyStatusBadge(status: Warranty["status"]) {
  const map = {
    active: {
      label: "Active",
      cls: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
      dot: "bg-success-500",
    },
    expiring_soon: {
      label: "Expiring Soon",
      cls: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
      dot: "bg-warning-500",
    },
    expired: {
      label: "Expired",
      cls: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",
      dot: "bg-error-500",
    },
  };
  const { label, cls, dot } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export function getClaimStatusBadge(status: WarrantyClaim["status"]) {
  const map = {
    draft: {
      label: "Draft",
      cls: "bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400",
    },
    submitted: {
      label: "Submitted",
      cls: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    },
    under_review: {
      label: "Under Review",
      cls: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
    },
    approved: {
      label: "Approved",
      cls: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
    },
    rejected: {
      label: "Rejected",
      cls: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",
    },
    replacement_scheduled: {
      label: "Replacement Scheduled",
      cls: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
    },
    completed: {
      label: "Completed",
      cls: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
    },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export function getClaimPriorityBadge(priority: WarrantyClaim["priority"]) {
  const map = {
    low: { label: "Low", cls: "text-gray-500 dark:text-gray-400" },
    medium: { label: "Medium", cls: "text-warning-600 dark:text-warning-400" },
    high: { label: "High", cls: "text-orange-600 dark:text-orange-400" },
    critical: { label: "Critical", cls: "text-error-600 dark:text-error-400 font-semibold" },
  };
  const { label, cls } = map[priority];
  return <span className={`text-xs font-medium ${cls}`}>{label}</span>;
}

export function getWarrantyTypeBadge(type: Warranty["warranty_type"]) {
  const map = {
    manufacturer: { label: "Manufacturer", cls: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
    labor: { label: "Labor", cls: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" },
    installation: { label: "Installation", cls: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" },
    performance: { label: "Performance", cls: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400" },
    battery: { label: "Battery", cls: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400" },
    inverter: { label: "Inverter", cls: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400" },
    panel: { label: "Panel", cls: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400" },
  };
  const { label, cls } = map[type];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ── Expiration Countdown ───────────────────────────────────────────────────────

export function ExpirationCountdown({ daysRemaining }: { daysRemaining: number }) {
  if (daysRemaining < 0) {
    return (
      <span className="text-xs font-medium text-error-600 dark:text-error-400">
        Expired {Math.abs(daysRemaining)}d ago
      </span>
    );
  }
  if (daysRemaining === 0) {
    return (
      <span className="text-xs font-bold text-error-600 dark:text-error-400 animate-pulse">
        Expires Today!
      </span>
    );
  }
  if (daysRemaining <= 30) {
    return (
      <span className="text-xs font-semibold text-error-600 dark:text-error-400">
        {daysRemaining}d left
      </span>
    );
  }
  if (daysRemaining <= 90) {
    return (
      <span className="text-xs font-semibold text-warning-600 dark:text-warning-400">
        {daysRemaining}d left
      </span>
    );
  }
  const years = Math.floor(daysRemaining / 365);
  const months = Math.floor((daysRemaining % 365) / 30);
  if (years > 0) {
    return (
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {years}y {months > 0 ? `${months}m` : ""} remaining
      </span>
    );
  }
  return (
    <span className="text-xs text-gray-500 dark:text-gray-400">
      {Math.floor(daysRemaining / 30)}m remaining
    </span>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

export function WarrantyProgressBar({
  start,
  end,
  status,
}: {
  start: string;
  end: string;
  status: Warranty["status"];
}) {
  const startTs = new Date(start).getTime();
  const endTs = new Date(end).getTime();
  const nowTs = Date.now();
  const total = endTs - startTs;
  const elapsed = Math.min(Math.max(nowTs - startTs, 0), total);
  const pct = total > 0 ? (elapsed / total) * 100 : 100;

  const colorMap = {
    active: "bg-success-500",
    expiring_soon: "bg-warning-500",
    expired: "bg-error-500",
  };

  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mb-1">
        <span>{formatDate(start)}</span>
        <span>{formatDate(end)}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorMap[status]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Utility ───────────────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateLong(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
