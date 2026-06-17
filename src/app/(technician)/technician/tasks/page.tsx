"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTech } from "@/app/(technician)/layout";
import TechProfileSwitcher from "@/components/technician/TechProfileSwitcher";
import {
  technicianPortalService,
  type MaintenanceRecord,
} from "@/services/technicianPortalService";

type StatusFilter = "all" | "overdue" | "scheduled" | "in_progress" | "completed";

function statusColor(s: string) {
  switch (s) {
    case "overdue":     return "#ef4444";
    case "in_progress": return "#f59e0b";
    case "scheduled":   return "#3b82f6";
    case "completed":   return "#10b981";
    default:            return "#6b7280";
  }
}

function TaskCard({ task }: { task: MaintenanceRecord }) {
  const done = task.checklist.filter((c) => c.done).length;
  const total = task.checklist.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const sc = statusColor(task.status);
  const isOverdue = task.status === "overdue";

  return (
    <Link href={`/technician/tasks/${task.id}`}>
      <div
        className="rounded-2xl p-4 mb-3 transition-all active:scale-[0.98]"
        style={{
          background: isOverdue ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${isOverdue ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}`,
        }}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{task.customer_name}</p>
            <p className="text-xs text-white/45 mt-0.5 truncate">{task.system_name}</p>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 uppercase"
            style={{ background: `${sc}18`, color: sc, border: `1px solid ${sc}30` }}
          >
            {task.status === "in_progress" ? "• Active" : task.status}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-white/30">Checklist</span>
            <span className="text-[10px] font-bold" style={{ color: pct === 100 ? "#10b981" : "#f59e0b" }}>
              {done}/{total} · {pct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: pct === 100 ? "#10b981" : "linear-gradient(90deg, #f59e0b, #d97706)",
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-xs text-white/35 flex items-center gap-1">
              <span>📍</span>
              <span className="truncate max-w-[140px]">{task.site_address.split(",")[0]}</span>
            </p>
          </div>
          <p
            className="text-xs font-medium flex items-center gap-1"
            style={{ color: isOverdue ? "#ef4444" : "rgba(255,255,255,0.35)" }}
          >
            {isOverdue && "⚠️ "}{task.scheduled_date}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function TasksPage() {
  const { profile } = useTech();
  const [tasks, setTasks] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await technicianPortalService.getMyTasks(profile.id);
      setTasks(data);
      setLoading(false);
    }
    load();
  }, [profile.id]);

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "overdue", label: "Overdue" },
    { key: "in_progress", label: "Active" },
    { key: "scheduled", label: "Upcoming" },
    { key: "completed", label: "Done" },
  ];

  const counts = {
    all: tasks.length,
    overdue: tasks.filter((t) => t.status === "overdue").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    scheduled: tasks.filter((t) => t.status === "scheduled").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  return (
    <div className="px-4 pt-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white">Maintenance Tasks</h1>
          <p className="text-xs text-white/40 mt-0.5">{tasks.length} assigned to you</p>
        </div>
        <TechProfileSwitcher />
      </div>

      {/* Overdue alert */}
      {counts.overdue > 0 && (
        <div
          className="flex items-center gap-2.5 p-3.5 rounded-xl mb-4"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-bold text-red-400">{counts.overdue} overdue task{counts.overdue > 1 ? "s" : ""}</p>
            <p className="text-xs text-white/40">These require immediate attention</p>
          </div>
        </div>
      )}

      {/* Filter tabs — scrollable */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-5">
        {tabs.map((t) => {
          const active = filter === t.key;
          const hasOverdue = t.key === "overdue" && counts.overdue > 0;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: active
                  ? hasOverdue ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #f59e0b, #d97706)"
                  : "rgba(255,255,255,0.05)",
                color: active ? "#000" : hasOverdue ? "#ef4444" : "rgba(255,255,255,0.45)",
                border: hasOverdue && !active ? "1px solid rgba(239,68,68,0.3)" : "none",
              }}
            >
              {t.label} {counts[t.key] > 0 && `(${counts[t.key]})`}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-3xl mb-3">✨</p>
          <p className="text-white/50 text-sm">No {filter === "all" ? "" : filter.replace("_", " ")} tasks</p>
        </div>
      ) : (
        filtered.map((t) => <TaskCard key={t.id} task={t} />)
      )}
    </div>
  );
}
