"use client";
import React from "react";
import {
  ChecklistItem,
  MAINTENANCE_SERVICE_TYPE_LABELS,
  MaintenanceServiceType,
  MaintenanceStatus,
  RecurrenceFrequency,
} from "@/services/maintenanceService";

// ── Status Badge ──────────────────────────────────────────────────────────────

export function getStatusBadge(status: MaintenanceStatus) {
  const map: Record<MaintenanceStatus, { label: string; className: string }> = {
    scheduled: {
      label: "Scheduled",
      className:
        "inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400",
    },
    due_soon: {
      label: "Due Soon",
      className:
        "inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400",
    },
    in_progress: {
      label: "In Progress",
      className:
        "inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400",
    },
    completed: {
      label: "Completed",
      className:
        "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400",
    },
    overdue: {
      label: "Overdue",
      className:
        "inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-400",
    },
    cancelled: {
      label: "Cancelled",
      className:
        "inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-700/50 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400",
    },
  };

  const dotColors: Record<MaintenanceStatus, string> = {
    scheduled: "bg-blue-500",
    due_soon: "bg-orange-500",
    in_progress: "bg-amber-500",
    completed: "bg-emerald-500",
    overdue: "bg-red-500",
    cancelled: "bg-gray-400",
  };

  const config = map[status];
  return (
    <span className={config.className}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColors[status]}`} />
      {config.label}
    </span>
  );
}

// ── Status Dot (for calendar) ─────────────────────────────────────────────────

export function getStatusDotColor(status: MaintenanceStatus): string {
  return {
    scheduled: "bg-blue-500",
    due_soon: "bg-orange-500",
    in_progress: "bg-amber-500",
    completed: "bg-emerald-500",
    overdue: "bg-red-500",
    cancelled: "bg-gray-400",
  }[status];
}

export function getServiceTypeBadge(serviceType: MaintenanceServiceType) {
  return (
    <span className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
      {MAINTENANCE_SERVICE_TYPE_LABELS[serviceType]}
    </span>
  );
}

// ── Frequency Badge ───────────────────────────────────────────────────────────

export function getFrequencyBadge(frequency: RecurrenceFrequency) {
  const map: Record<RecurrenceFrequency, { label: string; className: string }> = {
    monthly: {
      label: "Monthly",
      className:
        "inline-flex rounded-lg bg-purple-50 dark:bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400",
    },
    quarterly: {
      label: "Quarterly",
      className:
        "inline-flex rounded-lg bg-sky-50 dark:bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-400",
    },
    semi_annual: {
      label: "Semi-Annual",
      className:
        "inline-flex rounded-lg bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400",
    },
    annual: {
      label: "Annual",
      className:
        "inline-flex rounded-lg bg-teal-50 dark:bg-teal-500/10 px-2.5 py-0.5 text-xs font-medium text-teal-600 dark:text-teal-400",
    },
  };
  const config = map[frequency];
  return <span className={config.className}>{config.label}</span>;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Due Date Indicator ────────────────────────────────────────────────────────

export function DueDateBadge({ dateStr }: { dateStr: string }) {
  const days = getDaysUntil(dateStr);
  if (days < 0) {
    return (
      <span className="text-xs font-medium text-red-600 dark:text-red-400">
        {Math.abs(days)}d overdue
      </span>
    );
  }
  if (days === 0) {
    return <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Today</span>;
  }
  if (days <= 7) {
    return (
      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">in {days}d</span>
    );
  }
  if (days <= 30) {
    return (
      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">in {days}d</span>
    );
  }
  return (
    <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(dateStr)}</span>
  );
}

// ── Checklist Progress Bar ────────────────────────────────────────────────────

export function ChecklistProgress({ checklist }: { checklist: ChecklistItem[] }) {
  const total = checklist.length;
  const done = checklist.filter((i) => i.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const color =
    pct === 100
      ? "bg-emerald-500"
      : pct >= 50
      ? "bg-blue-500"
      : pct > 0
      ? "bg-amber-500"
      : "bg-gray-200 dark:bg-gray-700";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400 w-10 text-right">
        {done}/{total}
      </span>
    </div>
  );
}

// ── Technician Avatar ─────────────────────────────────────────────────────────

export function TechnicianAvatar({
  name,
  initials,
  size = "sm",
}: {
  name: string;
  initials?: string;
  size?: "sm" | "md";
}) {
  const avatarInitials =
    initials ||
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const colors = [
    "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
    "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400",
    "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
    "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400",
  ];

  const colorIndex =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;

  const sizeClass = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";

  return (
    <div
      title={name}
      className={`${sizeClass} rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${colors[colorIndex]}`}
    >
      {avatarInitials}
    </div>
  );
}
