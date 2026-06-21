"use client";
import React from "react";
import {
  Installation,
  MaintenanceRecord,
  SupportTicket,
  Warranty,
  Customer,
} from "@/services/customersService";

// ─── Shared Stat Card ────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "amber" | "purple";
}

const colorMap = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-500/10",
    icon: "text-blue-600 dark:text-blue-400",
    border: "border-blue-100 dark:border-blue-500/20",
  },
  green: {
    bg: "bg-success-50 dark:bg-success-500/10",
    icon: "text-success-600 dark:text-success-400",
    border: "border-success-100 dark:border-success-500/20",
  },
  amber: {
    bg: "bg-warning-50 dark:bg-warning-500/10",
    icon: "text-warning-600 dark:text-warning-400",
    border: "border-warning-100 dark:border-warning-500/20",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-500/10",
    icon: "text-purple-600 dark:text-purple-400",
    border: "border-purple-100 dark:border-purple-500/20",
  },
};

export function StatCard({ label, value, sub, icon, color }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`flex items-center gap-4 rounded-xl border ${c.border} ${c.bg} p-4`}>
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-white/70 dark:bg-gray-900/50 ${c.icon}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-800 dark:text-white/90 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Installation Status Helpers ─────────────────────────────────────────────
export function getInstallationStatusBadge(status: Installation["status"]) {
  const styles = {
    operational: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
    degraded: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
    offline: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",
    maintenance: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  };
  const labels = {
    operational: "Operational",
    degraded: "Degraded",
    offline: "Offline",
    maintenance: "In Maintenance",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
        status === 'operational' ? 'bg-success-500' :
        status === 'degraded' ? 'bg-warning-500' :
        status === 'offline' ? 'bg-error-500' : 'bg-blue-500'
      }`} />
      {labels[status]}
    </span>
  );
}

// ─── Warranty Status Helpers ──────────────────────────────────────────────────
export function getWarrantyStatusBadge(status: Warranty["status"]) {
  const styles = {
    active: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
    expiring_soon: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
    expired: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",
  };
  const labels = {
    active: "Active",
    expiring_soon: "Expiring Soon",
    expired: "Expired",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ─── Ticket Priority & Status ─────────────────────────────────────────────────
export function getTicketPriorityBadge(priority: SupportTicket["priority"]) {
  const styles = {
    critical: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",
    high: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
    medium: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
    low: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  };
  const labels = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[priority]}`}>
      {labels[priority]}
    </span>
  );
}

export function getTicketStatusBadge(status: SupportTicket["status"]) {
  const styles = {
    open: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    in_progress: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
    resolved: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
    closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  const labels = { open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ─── Customer Status Badge ────────────────────────────────────────────────────
export function getCustomerStatusBadge(status: Customer["status"]) {
  const styles = {
    active: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
    inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    prospect: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    suspended: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",
  };
  const labels = { active: "Active", inactive: "Inactive", prospect: "Prospect", suspended: "Suspended" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function getPortalStatusBadge(status: Customer["portal_status"] = "not_invited") {
  const styles = {
    active: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
    invited: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    invite_sent: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    not_invited: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    expired: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
    revoked: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",
  };
  const labels = {
    active: "Portal Active",
    invited: "Invited",
    invite_sent: "Invite Sent",
    not_invited: "Not Invited",
    expired: "Expired",
    revoked: "Revoked",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function getWarrantyHealthBadge(status: Customer["warranty_status"] = "none") {
  const styles = {
    active: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
    expiring_soon: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
    expired: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",
    none: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  const labels = {
    active: "Active",
    expiring_soon: "Expiring Soon",
    expired: "Expired",
    none: "No Warranty",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ─── Date Formatter ───────────────────────────────────────────────────────────
export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4 text-gray-400 dark:text-gray-500">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-xs">{message}</p>
    </div>
  );
}

// ─── Section Card wrapper ─────────────────────────────────────────────────────
export function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark ${className}`}>
      {children}
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
export function TabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800" />
      ))}
    </div>
  );
}

// ─── Maintenance work type icon ────────────────────────────────────────────────
export function getMaintenanceIcon(workType: MaintenanceRecord["work_type"]) {
  if (workType.toLowerCase().includes("inspect")) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    );
  }
  if (workType.toLowerCase().includes("clean")) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
