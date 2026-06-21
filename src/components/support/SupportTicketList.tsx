"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  supportService,
  SupportTicket,
  SupportStats,
  TicketStatus,
  TicketPriority,
  TicketIssueType,
  SUPPORT_AGENTS,
  ISSUE_TYPE_OPTIONS,
} from "@/services/supportService";
import SupportTicketModal from "./SupportTicketModal";

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getStatusConfig(status: TicketStatus) {
  const map: Record<TicketStatus, { label: string; color: string; bg: string; dot: string }> = {
    open: {
      label: "Open",
      color: "text-sky-700 dark:text-sky-300",
      bg: "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20",
      dot: "bg-sky-500",
    },
    in_progress: {
      label: "In Progress",
      color: "text-amber-700 dark:text-amber-300",
      bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
      dot: "bg-amber-500",
    },
    waiting_customer: {
      label: "Waiting Customer",
      color: "text-violet-700 dark:text-violet-300",
      bg: "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
      dot: "bg-violet-500",
    },
    waiting_technician: {
      label: "Waiting Technician",
      color: "text-indigo-700 dark:text-indigo-300",
      bg: "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
      dot: "bg-indigo-500",
    },
    resolved: {
      label: "Resolved",
      color: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
      dot: "bg-emerald-500",
    },
    closed: {
      label: "Closed",
      color: "text-gray-600 dark:text-gray-300",
      bg: "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
      dot: "bg-gray-400",
    },
  };
  return map[status];
}

export function getPriorityConfig(priority: TicketPriority) {
  const map: Record<TicketPriority, { label: string; color: string; bg: string; icon: string }> = {
    low: { label: "Low", color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-700", icon: "↓" },
    medium: { label: "Medium", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", icon: "→" },
    high: { label: "High", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10", icon: "↑" },
    urgent: { label: "Urgent", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", icon: "⚡" },
  };
  return map[priority];
}

export function getIssueTypeLabel(issueType: TicketIssueType): string {
  return ISSUE_TYPE_OPTIONS.find((option) => option.value === issueType)?.label ?? "Other";
}

export function getIssueTypeIcon(issueType: TicketIssueType): React.ReactNode {
  const paths: Record<TicketIssueType, string> = {
    low_production: "M3 17l6-6 4 4 8-8M14 7h7v7",
    inverter_error: "M13 10V3L4 14h7v7l9-11h-7z",
    battery_issue: "M21 10h-1V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h13a2 2 0 002-2v-3h1v-4z M7 13h4",
    panel_damage: "M4 6h16M4 12h16M4 18h16M8 6v12m8-12v12M6 4l12 16",
    cleaning_request: "M5 3v4M3 5h4m9-2l1.5 4.5L22 9l-4.5 1.5L16 15l-1.5-4.5L10 9l4.5-1.5L16 3zM6 17v4m-2-2h4",
    warranty_request: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    billing_question: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    document_request: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    maintenance_request: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    other: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  };
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={paths[issueType]} />
    </svg>
  );
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const cfg = getStatusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const cfg = getPriorityConfig(priority);
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export function AgentAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["bg-violet-500", "bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
  const idx = name.charCodeAt(0) % colors.length;
  const sz = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
  return (
    <span className={`${sz} ${colors[idx]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </span>
  );
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Main Component ────────────────────────────────────────────────────────────

type ViewMode = "board" | "list";
type FilterStatus = "all" | TicketStatus;
type SupportTicketListProps = {
  initialStatusFilter?: FilterStatus;
  initialViewMode?: ViewMode;
};

export default function SupportTicketList({
  initialStatusFilter = "all",
  initialViewMode = "list",
}: SupportTicketListProps = {}) {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>(initialStatusFilter);
  const [priorityFilter, setPriorityFilter] = useState<"all" | TicketPriority>("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [all, s] = await Promise.all([
      supportService.getAllTickets(),
      supportService.getStats(),
    ]);
    setTickets(all);
    setStats(s);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredTickets = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (
      t.subject.toLowerCase().includes(q) ||
      t.customer_name.toLowerCase().includes(q) ||
      t.site_name.toLowerCase().includes(q) ||
      t.solar_system_name.toLowerCase().includes(q) ||
      getIssueTypeLabel(t.issue_type).toLowerCase().includes(q) ||
      t.ticket_number.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
    const matchAgent = agentFilter === "all" || t.assigned_agent_id === agentFilter;
    return matchSearch && matchStatus && matchPriority && matchAgent;
  });

  const activeFilterCount = [
    statusFilter !== "all",
    priorityFilter !== "all",
    agentFilter !== "all",
  ].filter(Boolean).length;

  const BOARD_STATUSES: TicketStatus[] = ["open", "in_progress", "waiting_customer", "waiting_technician", "resolved", "closed"];

  const boardColumns = BOARD_STATUSES.map((status) => ({
    status,
    tickets: filteredTickets.filter((t) => t.status === status),
  }));

  const handleCreated = (ticket: SupportTicket) => {
    setTickets((prev) => [ticket, ...prev]);
    setShowModal(false);
  };

  const statCards = stats
    ? [
        { label: "Open", status: "open" as TicketStatus, value: stats.open, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/10", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
        { label: "In Progress", status: "in_progress" as TicketStatus, value: stats.in_progress, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
        { label: "Waiting Customer", status: "waiting_customer" as TicketStatus, value: stats.waiting_customer, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
        { label: "Waiting Tech", status: "waiting_technician" as TicketStatus, value: stats.waiting_technician, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10", icon: "M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m4-4.13a4 4 0 100-8 4 4 0 000 8zm6 4a4 4 0 10-2.99-6.66" },
        { label: "Resolved", status: "resolved" as TicketStatus, value: stats.resolved, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
        { label: "Closed", status: "closed" as TicketStatus, value: stats.closed, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800", icon: "M5 8h14M7 8v10a2 2 0 002 2h6a2 2 0 002-2V8m-9 0V6a2 2 0 012-2h2a2 2 0 012 2v2" },
      ]
    : [];

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-dark p-4 h-20" />
            ))
          : statCards.map((s) => (
              <div
                key={s.label}
                className={`rounded-xl border border-gray-100 dark:border-gray-800 ${s.bg} p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => setStatusFilter(s.status)}
              >
                <div className="h-10 w-10 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm flex-shrink-0">
                  <svg className={`h-5 w-5 ${s.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              </div>
            ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              id="support-view-list"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
            </button>
            <button
              id="support-view-board"
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "board"
                  ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Board
            </button>
          </div>

          {/* Active status filter chip */}
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusConfig(statusFilter as TicketStatus).bg} ${getStatusConfig(statusFilter as TicketStatus).color}`}
            >
              {getStatusConfig(statusFilter as TicketStatus).label}
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="support-search"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-56 pl-9 pr-4 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
          </div>

          {/* Filters */}
          <div className="relative" ref={filterRef}>
            <button
              id="support-filter-btn"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 h-10 rounded-lg border px-3 text-sm font-medium transition-colors ${
                activeFilterCount > 0
                  ? "border-brand-300 dark:border-brand-600 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {showFilterPanel && (
              <div className="absolute right-0 top-12 z-20 w-72 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-dark shadow-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Filters</h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { setStatusFilter("all"); setPriorityFilter("all"); setAgentFilter("all"); }}
                      className="text-xs text-brand-500 hover:text-brand-600 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {/* Priority */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Priority</label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(["all", "urgent", "high", "medium", "low"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriorityFilter(p)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors capitalize ${
                          priorityFilter === p
                            ? "bg-brand-500 text-white"
                            : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                      >
                        {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Agent */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Assigned Agent</label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setAgentFilter("all")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        agentFilter === "all"
                          ? "bg-brand-500 text-white"
                          : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      All
                    </button>
                    {SUPPORT_AGENTS.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAgentFilter(a.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          agentFilter === a.id
                            ? "bg-brand-500 text-white"
                            : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                      >
                        {a.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* New Ticket */}
          <button
            id="support-create-btn"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors whitespace-nowrap"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Ticket
          </button>
        </div>
      </div>

      {/* ── Board View ─────────────────────────────────────────────────────── */}
      {viewMode === "board" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
          {boardColumns.map(({ status, tickets: colTickets }) => {
            const cfg = getStatusConfig(status);
            return (
              <div key={status} className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{cfg.label}</span>
                  </div>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    {colTickets.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2 min-h-[120px]">
                  {loading
                    ? Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="animate-pulse rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-dark p-4 h-28" />
                      ))
                    : colTickets.length === 0
                    ? (
                        <div className="rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-800 p-6 flex flex-col items-center justify-center text-center">
                          <p className="text-xs text-gray-400 dark:text-gray-500">No {cfg.label.toLowerCase()} tickets</p>
                        </div>
                      )
                    : colTickets.map((ticket) => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          onOpen={() => router.push(`/support/tickets/${ticket.id}`)}
                        />
                      ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── List View ──────────────────────────────────────────────────────── */}
      {viewMode === "list" && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-base font-semibold text-gray-800 dark:text-white">Support Tickets</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {loading ? "Loading..." : `${filteredTickets.length} of ${tickets.length} tickets`}
              </p>
            </div>
            {(activeFilterCount > 0 || search) && (
              <button
                onClick={() => { setStatusFilter("all"); setPriorityFilter("all"); setAgentFilter("all"); setSearch(""); }}
                className="text-sm text-brand-500 hover:text-brand-600 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {["Ticket", "Subject / Context", "Issue Type", "Priority", "Assigned To", "Related", "Status", ""].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 first:pl-5 last:pr-5"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-4 first:pl-5 last:pr-5">
                            <div className="h-4 rounded bg-gray-100 dark:bg-gray-800" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filteredTickets.length === 0
                  ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center">
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No tickets found</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
                          </div>
                        </td>
                      </tr>
                    )
                  : filteredTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        onClick={() => router.push(`/support/tickets/${ticket.id}`)}
                        className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3.5 pl-5">
                          <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{ticket.ticket_number}</span>
                        </td>
                        <td className="px-4 py-3.5 max-w-[240px]">
                          <div className="flex items-start gap-2">
                            {ticket.priority === "urgent" && (
                              <span className="mt-0.5 h-2 w-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
                            )}
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                                {ticket.subject}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {ticket.customer_name} · {ticket.site_name}
                              </p>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                                {ticket.solar_system_name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            {getIssueTypeIcon(ticket.issue_type)}
                            <span className="text-xs whitespace-nowrap">{getIssueTypeLabel(ticket.issue_type)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="px-4 py-3.5">
                          {ticket.assigned_agent_name ? (
                            <div className="flex items-center gap-2">
                              <AgentAvatar name={ticket.assigned_agent_name} />
                              <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {ticket.assigned_agent_name.split(" ")[0]}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-orange-500 dark:text-orange-400 font-medium">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {ticket.related_work_order_id && (
                              <span className="rounded-full bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-600 dark:text-brand-400">
                                WO
                              </span>
                            )}
                            {ticket.related_warranty_id && (
                              <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                Warranty
                              </span>
                            )}
                            {ticket.related_maintenance_visit_id && (
                              <span className="rounded-full bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                Maint.
                              </span>
                            )}
                            {!ticket.related_work_order_id && !ticket.related_warranty_id && !ticket.related_maintenance_visit_id && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">{formatRelative(ticket.created_at)}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-4 py-3.5 pr-5">
                          <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-brand-400 dark:group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {!loading && filteredTickets.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">Showing {filteredTickets.length} of {tickets.length} tickets</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Click any row to view details</p>
            </div>
          )}
        </div>
      )}

      {/* Create Ticket Modal */}
      {showModal && (
        <SupportTicketModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

// ── Ticket Card (Board) ───────────────────────────────────────────────────────

function TicketCard({
  ticket,
  onOpen,
}: {
  ticket: SupportTicket;
  onOpen: () => void;
}) {
  const priorityCfg = getPriorityConfig(ticket.priority);

  return (
    <div
      onClick={onOpen}
      className="group rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-dark p-4 cursor-pointer hover:border-brand-200 dark:hover:border-brand-500/30 hover:shadow-md transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className={`flex items-center justify-center h-6 w-6 rounded-md flex-shrink-0 ${priorityCfg.bg} ${priorityCfg.color}`}>
            {getIssueTypeIcon(ticket.issue_type)}
          </span>
          <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{ticket.ticket_number}</span>
        </div>
        <PriorityBadge priority={ticket.priority} />
      </div>

      {/* Subject */}
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 mb-2 leading-snug">
        {ticket.subject}
      </h3>

      {/* Customer */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{ticket.customer_name}</p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{ticket.site_name}</p>
      </div>

      <div className="mb-3 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
        {getIssueTypeIcon(ticket.issue_type)}
        <span className="truncate">{getIssueTypeLabel(ticket.issue_type)}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
        {ticket.assigned_agent_name ? (
          <div className="flex items-center gap-1.5">
            <AgentAvatar name={ticket.assigned_agent_name} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{ticket.assigned_agent_name.split(" ")[0]}</span>
          </div>
        ) : (
          <span className="text-xs text-orange-500 dark:text-orange-400 font-medium">Unassigned</span>
        )}
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>

      {/* Note/attachment indicators */}
      {(ticket.notes.length > 0 || ticket.attachments.length > 0) && (
        <div className="flex items-center gap-3 mt-2">
          {ticket.notes.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {ticket.notes.length}
            </span>
          )}
          {ticket.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {ticket.attachments.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
