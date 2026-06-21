"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  workOrderService,
  WorkOrder,
  WorkOrderStats,
  WorkOrderStatus,
  WorkOrderPriority,
  WorkOrderType,
  WO_TECHNICIANS,
  WORK_ORDER_TYPE_LABELS,
} from "@/services/workOrderService";
import WorkOrderModal from "./WorkOrderModal";

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getStatusConfig(status: WorkOrderStatus) {
  const map: Record<WorkOrderStatus, { label: string; color: string; bg: string; dot: string }> = {
    new: { label: "New", color: "text-sky-700 dark:text-sky-300", bg: "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20", dot: "bg-sky-500" },
    scheduled: { label: "Scheduled", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20", dot: "bg-blue-500" },
    assigned: { label: "Assigned", color: "text-violet-700 dark:text-violet-300", bg: "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20", dot: "bg-violet-500" },
    in_progress: { label: "In Progress", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20", dot: "bg-amber-500" },
    completed: { label: "Completed", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20", dot: "bg-emerald-500" },
    cancelled: { label: "Cancelled", color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700", dot: "bg-gray-400" },
    requires_follow_up: { label: "Requires Follow-up", color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20", dot: "bg-rose-500" },
  };
  return map[status];
}

export function getPriorityConfig(priority: WorkOrderPriority) {
  const map: Record<WorkOrderPriority, { label: string; color: string; bg: string }> = {
    low: { label: "Low", color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-700" },
    medium: { label: "Medium", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
    high: { label: "High", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10" },
    urgent: { label: "Urgent", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10" },
  };
  return map[priority];
}

export function getTypeIcon(type: WorkOrderType): React.ReactNode {
  const icons: Record<WorkOrderType, string> = {
    installation_follow_up: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    repair: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    inspection: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    cleaning: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    replacement: "M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121M7 7l2.121 2.121M7 7H4m3 0V4",
    warranty_service: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    maintenance: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    emergency_visit: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  };
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icons[type]} />
    </svg>
  );
}

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  const cfg = getStatusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
  const cfg = getPriorityConfig(priority);
  const flames: Record<WorkOrderPriority, string> = { low: "↓", medium: "→", high: "↑", urgent: "⚡" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      {flames[priority]} {cfg.label}
    </span>
  );
}

export function TechAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["bg-violet-500", "bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
  const colorIdx = name.charCodeAt(0) % colors.length;
  const sz = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
  return (
    <span className={`${sz} ${colors[colorIdx]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </span>
  );
}

export function SourceBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-[180px] items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
      <span className="truncate">From: {label}</span>
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── Main Component ────────────────────────────────────────────────────────────

type ViewMode = "board" | "list";
type FilterStatus = "all" | WorkOrderStatus;
type OperationalFilter = "all" | "active" | "scheduled" | "completed" | "urgent" | "unassigned";

interface WorkOrderListProps {
  initialFilter?: "active" | "scheduled" | "completed" | "all";
}

export default function WorkOrderList({ initialFilter = "all" }: WorkOrderListProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [stats, setStats] = useState<WorkOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [search, setSearch] = useState("");
  const [operationalFilter, setOperationalFilter] = useState<OperationalFilter>(initialFilter);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | WorkOrderPriority>("all");
  const [techFilter, setTechFilter] = useState("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editOrder, setEditOrder] = useState<WorkOrder | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [all, s] = await Promise.all([
      workOrderService.getAllOrders(),
      workOrderService.getStats(),
    ]);
    setOrders(all);
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

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (
      o.title.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.order_number.toLowerCase().includes(q) ||
      o.site_address.toLowerCase().includes(q) ||
      o.source_label.toLowerCase().includes(q)
    );
    const matchOperational =
      operationalFilter === "all" ||
      (operationalFilter === "active" && !["completed", "cancelled"].includes(o.status)) ||
      (operationalFilter === "scheduled" && o.status === "scheduled") ||
      (operationalFilter === "completed" && ["completed", "cancelled"].includes(o.status)) ||
      (operationalFilter === "urgent" && o.priority === "urgent") ||
      (operationalFilter === "unassigned" && !o.technician_id);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchPriority = priorityFilter === "all" || o.priority === priorityFilter;
    const matchTech = techFilter === "all" || (techFilter === "unassigned" ? !o.technician_id : o.technician_id === techFilter);
    return matchSearch && matchOperational && matchStatus && matchPriority && matchTech;
  });

  const activeFilterCount = [
    statusFilter !== "all",
    priorityFilter !== "all",
    techFilter !== "all",
    operationalFilter !== "all",
  ].filter(Boolean).length;

  // ── Board Columns
  const BOARD_STATUSES: WorkOrderStatus[] = operationalFilter === "completed"
    ? ["completed", "cancelled"]
    : operationalFilter === "scheduled"
    ? ["scheduled"]
    : operationalFilter === "active"
    ? ["new", "assigned", "scheduled", "in_progress", "requires_follow_up"]
    : ["new", "assigned", "scheduled", "in_progress", "requires_follow_up", "completed", "cancelled"];

  const boardColumns = BOARD_STATUSES.map((status) => ({
    status,
    orders: filteredOrders.filter((o) => o.status === status),
  }));

  const handleCreate = (newOrder: WorkOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleUpdate = (updated: WorkOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  // ── Stat Cards
  const statCards = stats
    ? [
        { label: "New", value: stats.new, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/10", icon: "M12 4v16m8-8H4" },
        { label: "Assigned", value: stats.assigned, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
        { label: "Scheduled", value: stats.scheduled, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
        { label: "In Progress", value: stats.in_progress, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
        { label: "Follow-up", value: stats.requires_follow_up, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
        { label: "Completed", value: stats.completed, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
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
              <div key={s.label} className={`rounded-xl border border-gray-100 dark:border-gray-800 ${s.bg} p-4 flex items-center gap-3`}>
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

      {/* Operational Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "active" as OperationalFilter, label: "Active", count: orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length },
          { key: "scheduled" as OperationalFilter, label: "Scheduled", count: orders.filter((o) => o.status === "scheduled").length },
          { key: "completed" as OperationalFilter, label: "Completed", count: orders.filter((o) => ["completed", "cancelled"].includes(o.status)).length },
          { key: "urgent" as OperationalFilter, label: "Urgent", count: orders.filter((o) => o.priority === "urgent").length },
          { key: "unassigned" as OperationalFilter, label: "Unassigned", count: orders.filter((o) => !o.technician_id).length },
          { key: "all" as OperationalFilter, label: "All", count: orders.length },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setOperationalFilter(filter.key)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              operationalFilter === filter.key
                ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
            }`}
          >
            {filter.label} <span className="ml-1 text-xs opacity-70">{filter.count}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              id="wo-view-board"
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
            <button
              id="wo-view-list"
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
          </div>
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
              id="wo-search"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-56 pl-9 pr-4 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
          </div>

          {/* Filters */}
          <div className="relative" ref={filterRef}>
            <button
              id="wo-filter-btn"
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
                      onClick={() => { setOperationalFilter("all"); setStatusFilter("all"); setPriorityFilter("all"); setTechFilter("all"); }}
                      className="text-xs text-brand-500 hover:text-brand-600 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {/* Status */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(["all", "new", "assigned", "scheduled", "in_progress", "requires_follow_up", "completed", "cancelled"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors capitalize ${
                          statusFilter === s
                            ? "bg-brand-500 text-white"
                            : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                      >
                        {s === "in_progress" ? "In Progress" : s === "requires_follow_up" ? "Follow-up" : s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
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
                {/* Technician */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Technician</label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setTechFilter("all")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        techFilter === "all"
                          ? "bg-brand-500 text-white"
                          : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setTechFilter("unassigned")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        techFilter === "unassigned"
                          ? "bg-brand-500 text-white"
                          : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      Unassigned
                    </button>
                    {WO_TECHNICIANS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTechFilter(t.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          techFilter === t.id
                            ? "bg-brand-500 text-white"
                            : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                      >
                        {t.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* New Work Order */}
          <button
            id="wo-create-btn"
            onClick={() => { setEditOrder(null); setShowModal(true); }}
            className="flex items-center gap-2 h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors whitespace-nowrap"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Work Order
          </button>
        </div>
      </div>

      {/* ── Board View ─────────────────────────────────────────────────────── */}
      {viewMode === "board" && (
        <div className={`grid gap-4 ${boardColumns.length <= 3 ? `grid-cols-1 sm:grid-cols-${boardColumns.length} lg:grid-cols-${boardColumns.length}` : "grid-cols-1 sm:grid-cols-3 lg:grid-cols-5"}`}>
          {boardColumns.map(({ status, orders: colOrders }) => {
            const cfg = getStatusConfig(status);
            return (
              <div key={status} className="flex flex-col gap-3">
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{cfg.label}</span>
                  </div>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    {colOrders.length}
                  </span>
                </div>

                {/* Column Drop Zone */}
                <div className="flex flex-col gap-2 min-h-[120px]">
                  {loading
                    ? Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="animate-pulse rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-dark p-4 h-28" />
                      ))
                    : colOrders.length === 0
                    ? (
                        <div className="rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-800 p-6 flex flex-col items-center justify-center text-center">
                          <p className="text-xs text-gray-400 dark:text-gray-500">No {cfg.label.toLowerCase()} orders</p>
                        </div>
                      )
                    : colOrders.map((order) => (
                        <WorkOrderCard
                          key={order.id}
                          order={order}
                          onOpen={() => router.push(`/work-orders/${order.id}`)}
                          onEdit={() => { setEditOrder(order); setShowModal(true); }}
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
              <h2 className="text-base font-semibold text-gray-800 dark:text-white">All Work Orders</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {loading ? "Loading..." : `${filteredOrders.length} of ${orders.length} orders`}
              </p>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setOperationalFilter("all"); setStatusFilter("all"); setPriorityFilter("all"); setTechFilter("all"); setSearch(""); }}
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
                  {["Order", "Title / Customer", "Source", "Type", "Priority", "Technician", "Scheduled", "Status", ""].map((col) => (
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
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} className="px-4 py-4 first:pl-5 last:pr-5">
                            <div className="h-4 rounded bg-gray-100 dark:bg-gray-800" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filteredOrders.length === 0
                  ? (
                      <tr>
                        <td colSpan={9} className="py-16 text-center">
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No work orders found</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
                          </div>
                        </td>
                      </tr>
                    )
                  : filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/work-orders/${order.id}`)}
                        className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3.5 pl-5">
                          <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{order.order_number}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors max-w-[220px] truncate">
                            {order.title}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{order.customer_name}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <SourceBadge label={order.source_label} />
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-gray-600 dark:text-gray-400">{WORK_ORDER_TYPE_LABELS[order.type]}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <PriorityBadge priority={order.priority} />
                        </td>
                        <td className="px-4 py-3.5">
                          {order.technician_name ? (
                            <div className="flex items-center gap-2">
                              <TechAvatar name={order.technician_name} />
                              <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{order.technician_name.split(" ")[0]}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-gray-600 dark:text-gray-400">{formatDate(order.scheduled_date)}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={order.status} />
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
          {!loading && filteredOrders.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">Showing {filteredOrders.length} of {orders.length} work orders</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Click any row to view details</p>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <WorkOrderModal
          order={editOrder}
          onClose={() => { setShowModal(false); setEditOrder(null); }}
          onCreated={handleCreate}
          onUpdated={handleUpdate}
        />
      )}
    </div>
  );
}

// ── Work Order Card (Board) ───────────────────────────────────────────────────

function WorkOrderCard({
  order,
  onOpen,
  onEdit,
}: {
  order: WorkOrder;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const priorityCfg = getPriorityConfig(order.priority);

  return (
    <div
      onClick={onOpen}
      className="group rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-dark p-4 cursor-pointer hover:border-brand-200 dark:hover:border-brand-500/30 hover:shadow-md transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`flex items-center justify-center h-6 w-6 rounded-md flex-shrink-0 ${priorityCfg.bg} ${priorityCfg.color}`}>
            {getTypeIcon(order.type)}
          </span>
          <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 flex-shrink-0">{order.order_number}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <PriorityBadge priority={order.priority} />
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="h-6 w-6 rounded-md flex items-center justify-center text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 mb-2 leading-snug">
        {order.title}
      </h3>

      {/* Customer + Type */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{order.customer_name}</p>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded px-1.5 py-0.5 flex-shrink-0">
            {WORK_ORDER_TYPE_LABELS[order.type]}
          </span>
        </div>
        <span className="inline-flex max-w-full items-center rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400">
          <span className="truncate">From: {order.source_label}</span>
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
        {order.technician_name ? (
          <div className="flex items-center gap-1.5">
            <TechAvatar name={order.technician_name} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{order.technician_name.split(" ")[0]}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Unassigned</span>
        )}
        {order.scheduled_date ? (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatDate(order.scheduled_date)}</span>
        ) : (
          <span className="text-[10px] text-gray-300 dark:text-gray-600">No date set</span>
        )}
      </div>

      {/* Photo count indicator */}
      {order.photos.length > 0 && (
        <div className="flex items-center gap-1 mt-2">
          <svg className="h-3 w-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{order.photos.length} photo{order.photos.length !== 1 ? "s" : ""}</span>
          {order.service_report && (
            <>
              <span className="text-[10px] text-gray-300 dark:text-gray-600">·</span>
              <svg className="h-3 w-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[10px] text-emerald-500">Report</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
