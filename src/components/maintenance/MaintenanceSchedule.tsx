"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  maintenanceService,
  MaintenanceRecord,
  MaintenanceStats,
  MaintenanceStatus,
} from "@/services/maintenanceService";
import {
  getStatusBadge,
  getStatusDotColor,
  formatDate,
  formatDateShort,
  getDaysUntil,
  ChecklistProgress,
  TechnicianAvatar,
} from "./MaintenanceUIHelpers";
import ScheduleModal from "./ScheduleModal";
import { TECHNICIANS } from "@/services/maintenanceService";

type ViewMode = "calendar" | "list";

// ── Calendar helpers ──────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Main Component ────────────────────────────────────────────────────────────

export default function MaintenanceSchedule() {
  const router = useRouter();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // List state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MaintenanceStatus>("all");
  const [techFilter, setTechFilter] = useState("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState<string | undefined>();

  const load = useCallback(async () => {
    const [recs, s] = await Promise.all([
      maintenanceService.getAllRecords(),
      maintenanceService.getStats(),
    ]);
    setRecords(recs);
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

  // ── Calendar ──────────────────────────────────────────────────────────────

  const getRecordsForDate = (year: number, month: number, day: number) => {
    const d = new Date(year, month, day);
    return records.filter((r) => isSameDay(new Date(r.scheduled_date + "T00:00:00"), d));
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11); }
    else setCalMonth(calMonth - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0); }
    else setCalMonth(calMonth + 1);
    setSelectedDate(null);
  };

  const goToday = () => {
    setCalYear(today.getFullYear());
    setCalMonth(today.getMonth());
    setSelectedDate(today);
  };

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfWeek(calYear, calMonth);

  const selectedDayRecords = selectedDate
    ? getRecordsForDate(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    : [];

  // ── List ──────────────────────────────────────────────────────────────────

  const filteredRecords = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (
      r.customer_name.toLowerCase().includes(q) ||
      r.site_address.toLowerCase().includes(q) ||
      r.system_name.toLowerCase().includes(q) ||
      r.technician_name.toLowerCase().includes(q)
    );
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchTech = techFilter === "all" || r.technician_id === techFilter;
    return matchSearch && matchStatus && matchTech;
  });

  const activeFilterCount = [statusFilter !== "all", techFilter !== "all"].filter(Boolean).length;

  const overdueCount = records.filter((r) => r.status === "overdue").length;

  return (
    <div className="space-y-5">
      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {overdueCount} maintenance visit{overdueCount !== 1 ? "s are" : " is"} overdue
            </p>
            <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-0.5 truncate">
              Address these visits now to prevent equipment degradation and warranty voids.
            </p>
          </div>
          <button
            onClick={() => { setViewMode("list"); setStatusFilter("overdue"); }}
            className="flex-shrink-0 h-8 px-3 rounded-lg bg-red-100 dark:bg-red-500/20 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors whitespace-nowrap"
          >
            View Overdue →
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Scheduled", value: stats?.scheduled ?? "—", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
          { label: "Due This Week", value: stats?.due_this_week ?? "—", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "Overdue", value: stats?.overdue ?? "—", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
          { label: "Completed", value: stats?.completed ?? "—", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border border-gray-100 dark:border-gray-800 ${s.bg} p-4 flex items-center gap-3`}>
            <div className={`h-9 w-9 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm flex-shrink-0`}>
              <svg className={`h-5 w-5 ${s.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
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
              id="view-calendar-btn"
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "calendar"
                  ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
            </button>
            <button
              id="view-list-btn"
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

          {/* Calendar Nav (only in calendar mode) */}
          {viewMode === "calendar" && (
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="px-2 text-sm font-semibold text-gray-800 dark:text-white min-w-[120px] text-center">
                {MONTH_NAMES[calMonth]} {calYear}
              </span>
              <button
                onClick={nextMonth}
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={goToday}
                className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Today
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* List search & filters */}
          {viewMode === "list" && (
            <>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="maint-search"
                  placeholder="Search customer, site, system..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-64 pl-9 pr-4 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
              </div>
              <div className="relative" ref={filterRef}>
                <button
                  id="maint-filter-btn"
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
                  <div className="absolute right-0 top-12 z-20 w-72 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-dark shadow-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Filters</h3>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={() => { setStatusFilter("all"); setTechFilter("all"); }}
                          className="text-xs text-brand-500 hover:text-brand-600 font-medium"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</label>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(["all", "scheduled", "in_progress", "completed", "overdue", "cancelled"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors capitalize ${
                              statusFilter === s
                                ? "bg-brand-500 text-white"
                                : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                            }`}
                          >
                            {s === "in_progress" ? "In Progress" : s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
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
                        {TECHNICIANS.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setTechFilter(t.id)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                              techFilter === t.id
                                ? "bg-brand-500 text-white"
                                : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                            }`}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Schedule button */}
          <button
            id="schedule-maint-btn"
            onClick={() => { setModalDate(undefined); setShowModal(true); }}
            className="flex items-center gap-2 h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Schedule Visit
          </button>
        </div>
      </div>

      {/* ── Calendar View ─────────────────────────────────────────────────── */}
      {viewMode === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark overflow-hidden">
            {/* Legend */}
            <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              {[
                { color: "bg-blue-500", label: "Scheduled" },
                { color: "bg-amber-500", label: "In Progress" },
                { color: "bg-red-500", label: "Overdue" },
                { color: "bg-emerald-500", label: "Completed" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${l.color}`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{l.label}</span>
                </div>
              ))}
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
              {DAY_NAMES.map((d) => (
                <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="border-b border-r border-gray-50 dark:border-gray-800/50 min-h-[80px]" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayDate = new Date(calYear, calMonth, day);
                const dayRecords = getRecordsForDate(calYear, calMonth, day);
                const isToday = isSameDay(dayDate, today);
                const isSelected = selectedDate ? isSameDay(dayDate, selectedDate) : false;
                const isLastRow = Math.floor((firstDay + i) / 7) === Math.floor((firstDay + daysInMonth - 1) / 7);

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(dayDate)}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`relative min-h-[80px] p-1.5 cursor-pointer border-gray-50 dark:border-gray-800/50 transition-colors
                      ${!isLastRow ? "border-b" : ""}
                      ${(firstDay + i + 1) % 7 !== 0 ? "border-r" : ""}
                      ${isSelected ? "bg-brand-50 dark:bg-brand-500/10" : hoveredDay === day ? "bg-gray-50 dark:bg-white/[0.02]" : ""}
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          isToday
                            ? "bg-brand-500 text-white"
                            : isSelected
                            ? "bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-semibold"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {day}
                      </span>
                      {dayRecords.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const iso = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            setModalDate(iso);
                            setShowModal(true);
                          }}
                          className="h-4 w-4 rounded flex items-center justify-center text-gray-300 hover:text-brand-400 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Event dots */}
                    <div className="space-y-0.5">
                      {dayRecords.slice(0, 2).map((r) => (
                        <div
                          key={r.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/maintenance/${r.id}`);
                          }}
                          className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-white dark:hover:bg-gray-700 transition-colors group"
                        >
                          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${getStatusDotColor(r.status)}`} />
                          <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate leading-tight group-hover:text-brand-500 dark:group-hover:text-brand-400">
                            {r.customer_name.split(" ")[0]}
                          </span>
                        </div>
                      ))}
                      {dayRecords.length > 2 && (
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 px-1">
                          +{dayRecords.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side Panel — selected day */}
          <div className="space-y-4">
            {selectedDate ? (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                      {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {selectedDayRecords.length} visit{selectedDayRecords.length !== 1 ? "s" : ""} scheduled
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const iso = selectedDate.toISOString().split("T")[0];
                      setModalDate(iso);
                      setShowModal(true);
                    }}
                    className="h-8 w-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-brand-500 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                {selectedDayRecords.length === 0 ? (
                  <div className="py-10 flex flex-col items-center text-center px-5">
                    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No visits scheduled</p>
                    <button
                      onClick={() => {
                        const iso = selectedDate.toISOString().split("T")[0];
                        setModalDate(iso);
                        setShowModal(true);
                      }}
                      className="mt-3 text-sm text-brand-500 hover:text-brand-600 font-medium"
                    >
                      + Schedule a visit
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {selectedDayRecords.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => router.push(`/maintenance/${r.id}`)}
                        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug">
                            {r.customer_name}
                          </p>
                          {getStatusBadge(r.status)}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">{r.system_name}</p>
                        <div className="flex items-center gap-2">
                          <TechnicianAvatar name={r.technician_name} />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{r.technician_name}</span>
                        </div>
                        <div className="mt-2">
                          <ChecklistProgress checklist={r.checklist} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-8 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Select a day</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click any date to see scheduled visits</p>
              </div>
            )}

            {/* Upcoming summary */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Upcoming This Month</h3>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 animate-pulse">
                        <div className="h-3 rounded bg-gray-100 dark:bg-gray-800 mb-2" />
                        <div className="h-3 rounded bg-gray-100 dark:bg-gray-800 w-2/3" />
                      </div>
                    ))
                  : records
                      .filter((r) => {
                        const days = getDaysUntil(r.scheduled_date);
                        return r.status === "scheduled" && days >= 0 && days <= 30;
                      })
                      .slice(0, 5)
                      .map((r) => (
                        <div
                          key={r.id}
                          onClick={() => router.push(`/maintenance/${r.id}`)}
                          className="px-5 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors flex items-center gap-3"
                        >
                          <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${getStatusDotColor(r.status)}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{r.customer_name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{r.system_name}</p>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {formatDateShort(r.scheduled_date)}
                          </span>
                        </div>
                      ))}
                {!loading && records.filter((r) => {
                  const days = getDaysUntil(r.scheduled_date);
                  return r.status === "scheduled" && days >= 0 && days <= 30;
                }).length === 0 && (
                  <div className="py-6 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500">No upcoming visits this month</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── List View ─────────────────────────────────────────────────────── */}
      {viewMode === "list" && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">All Visits</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {loading ? "Loading..." : `${filteredRecords.length} of ${records.length} records`}
              </p>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setStatusFilter("all"); setTechFilter("all"); setSearch(""); }}
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
                  {["Customer", "Site / System", "Scheduled Date", "Technician", "Status", "Checklist", ""].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 first:pl-5 last:pr-5"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-4 first:pl-5 last:pr-5">
                            <div className="h-4 rounded bg-gray-100 dark:bg-gray-800" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filteredRecords.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No visits found</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
                          {(search || activeFilterCount > 0) && (
                            <button
                              onClick={() => { setStatusFilter("all"); setTechFilter("all"); setSearch(""); }}
                              className="mt-3 text-sm text-brand-500 hover:text-brand-600 font-medium"
                            >
                              Clear all filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                  : filteredRecords.map((record) => (
                      <tr
                        key={record.id}
                        onClick={() => router.push(`/maintenance/${record.id}`)}
                        className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                      >
                        {/* Customer */}
                        <td className="px-4 py-3.5 pl-5">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {record.customer_name}
                          </p>
                          {record.recurrence_plan_id && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Recurring
                            </span>
                          )}
                        </td>

                        {/* Site / System */}
                        <td className="px-4 py-3.5">
                          <p className="text-sm text-gray-700 dark:text-gray-300 max-w-[180px] truncate">{record.system_name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[180px] truncate mt-0.5">{record.site_address}</p>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(record.scheduled_date)}</p>
                          {record.status === "overdue" && (
                            <p className="text-xs text-red-500 font-medium mt-0.5">
                              {Math.abs(getDaysUntil(record.scheduled_date))}d overdue
                            </p>
                          )}
                        </td>

                        {/* Technician */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <TechnicianAvatar name={record.technician_name} />
                            <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {record.technician_name}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">{getStatusBadge(record.status)}</td>

                        {/* Checklist */}
                        <td className="px-4 py-3.5 w-32">
                          <ChecklistProgress checklist={record.checklist} />
                        </td>

                        {/* Arrow */}
                        <td className="px-4 py-3.5 pr-5">
                          <svg
                            className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-brand-400 dark:group-hover:text-brand-500 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {!loading && filteredRecords.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Showing {filteredRecords.length} of {records.length} records
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Click any row to view details</p>
            </div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <ScheduleModal
          initialDate={modalDate}
          onClose={() => setShowModal(false)}
          onCreated={(r) => {
            setRecords((prev) => [r, ...prev]);
          }}
        />
      )}
    </div>
  );
}
