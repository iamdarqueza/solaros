"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTech } from "@/app/(technician)/layout";
import TechProfileSwitcher from "@/components/technician/TechProfileSwitcher";
import {
  technicianPortalService,
  type WorkOrder,
  type MaintenanceRecord,
} from "@/services/technicianPortalService";

/* ── Priority colors ────────────────────────────────────────────────────── */
function priorityColor(p: string) {
  switch (p) {
    case "urgent": return "#ef4444";
    case "high":   return "#f59e0b";
    case "medium": return "#3b82f6";
    default:       return "#6b7280";
  }
}

function statusLabel(s: string) {
  switch (s) {
    case "in_progress": return "In Progress";
    case "scheduled":   return "Scheduled";
    case "new":         return "Unassigned";
    default:            return s;
  }
}

function typeIcon(t: string) {
  switch (t) {
    case "installation": return "🔧";
    case "repair":       return "⚡";
    case "inspection":   return "🔍";
    case "cleaning":     return "🧹";
    case "warranty":     return "🛡️";
    case "emergency":    return "🚨";
    default:             return "📋";
  }
}

/* ── Stat Card ──────────────────────────────────────────────────────────── */
function StatCard({
  label, value, sub, accent, icon,
}: {
  label: string; value: string | number; sub?: string; accent: string; icon: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg">{icon}</span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${accent}22`, color: accent }}
        >
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </div>
  );
}

/* ── Active Job Banner ───────────────────────────────────────────────────── */
function ActiveJobBanner({ job }: { job: WorkOrder }) {
  const elapsed = job.started_at
    ? Math.floor((Date.now() - new Date(job.started_at).getTime()) / 60000)
    : 0;
  const hrs = Math.floor(elapsed / 60);
  const mins = elapsed % 60;
  const elapsedStr = hrs > 0 ? `${hrs}h ${mins}m elapsed` : `${mins}m elapsed`;

  return (
    <Link href={`/technician/jobs/${job.id}`}>
      <div
        className="rounded-2xl p-4 mb-6"
        style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.08))",
          border: "1px solid rgba(245,158,11,0.3)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
          </span>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Job In Progress</span>
          <span className="ml-auto text-xs text-white/40">{elapsedStr}</span>
        </div>

        <p className="font-semibold text-white text-base leading-tight mb-1">
          {typeIcon(job.type)} {job.title}
        </p>
        <p className="text-sm text-white/50 mb-3 truncate">📍 {job.site_address}</p>

        {/* Footer CTA */}
        <div
          className="flex items-center justify-between px-3 py-2 rounded-xl"
          style={{ background: "rgba(245,158,11,0.15)" }}
        >
          <span className="text-sm text-white/70">{job.customer_name}</span>
          <span className="text-sm font-semibold text-amber-400 flex items-center gap-1">
            Continue →
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Today Job Card ──────────────────────────────────────────────────────── */
function TodayJobCard({ job }: { job: WorkOrder }) {
  const color = priorityColor(job.priority);
  return (
    <Link href={`/technician/jobs/${job.id}`}>
      <div
        className="flex items-start gap-3 p-3.5 rounded-xl mb-2.5 transition-all active:scale-[0.98]"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Time column */}
        <div className="text-center min-w-[44px]">
          <p className="text-xs font-semibold text-white/60">{job.scheduled_time ?? "—"}</p>
        </div>
        {/* Divider line */}
        <div className="w-px self-stretch" style={{ background: color, opacity: 0.4 }} />
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-white leading-tight truncate">
              {typeIcon(job.type)} {job.title}
            </p>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 uppercase"
              style={{ background: `${color}22`, color }}
            >
              {job.priority}
            </span>
          </div>
          <p className="text-xs text-white/40 mt-0.5 truncate">{job.customer_name}</p>
          <p className="text-xs text-white/30 mt-0.5 truncate">📍 {job.site_address}</p>
        </div>
        <svg className="w-4 h-4 text-white/20 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

/* ── Task Card ───────────────────────────────────────────────────────────── */
function TaskCard({ task }: { task: MaintenanceRecord }) {
  const done = task.checklist.filter((c) => c.done).length;
  const total = task.checklist.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isOverdue = task.status === "overdue";

  return (
    <Link href={`/technician/tasks/${task.id}`}>
      <div
        className="flex items-center gap-3 p-3.5 rounded-xl mb-2.5 transition-all active:scale-[0.98]"
        style={{
          background: isOverdue ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${isOverdue ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)"}`,
        }}
      >
        {/* Ring */}
        <div className="relative w-10 h-10 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke={isOverdue ? "#ef4444" : "#f59e0b"} strokeWidth="3"
              strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">{pct}%</span>
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{task.customer_name}</p>
          <p className="text-xs text-white/40 truncate">{task.system_name}</p>
          <p className="text-xs mt-0.5" style={{ color: isOverdue ? "#ef4444" : "rgba(255,255,255,0.35)" }}>
            {isOverdue ? "⚠️ Overdue · " : "🗓 "}{task.scheduled_date}
          </p>
        </div>
        <svg className="w-4 h-4 text-white/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function TodayPage() {
  const { profile } = useTech();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ todayJobs: 0, activeJob: false, pendingTasks: 0, overdueTasks: 0, completedThisWeek: 0 });
  const [activeJob, setActiveJob] = useState<WorkOrder | null>(null);
  const [todayJobs, setTodayJobs] = useState<WorkOrder[]>([]);
  const [pendingTasks, setPendingTasks] = useState<MaintenanceRecord[]>([]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [s, aj, tj, pt] = await Promise.all([
        technicianPortalService.getDashboardStats(profile.id),
        technicianPortalService.getActiveJob(profile.id),
        technicianPortalService.getTodaysJobs(profile.id),
        technicianPortalService.getPendingTasks(profile.id),
      ]);
      setStats(s);
      setActiveJob(aj);
      setTodayJobs(tj.filter((j) => j.status !== "in_progress"));
      setPendingTasks(pt.slice(0, 3));
      setLoading(false);
    }
    load();
  }, [profile.id]);

  return (
    <div className="px-4 pt-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider font-medium">{dateStr}</p>
          <h1 className="text-xl font-bold text-white mt-0.5">
            {greeting}, {profile.name.split(" ")[0]} 👋
          </h1>
        </div>
        <TechProfileSwitcher />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Active Job Banner */}
          {activeJob && <ActiveJobBanner job={activeJob} />}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard label="Today" value={stats.todayJobs} sub="work orders" accent="#3b82f6" icon="📋" />
            <StatCard label="Tasks" value={stats.pendingTasks} sub={stats.overdueTasks > 0 ? `${stats.overdueTasks} overdue` : "all on track"} accent={stats.overdueTasks > 0 ? "#ef4444" : "#10b981"} icon="✅" />
            <StatCard label="This Week" value={stats.completedThisWeek} sub="completed" accent="#10b981" icon="🏆" />
            <StatCard label="Pipeline" value={stats.pendingTasks + stats.todayJobs} sub="open items" accent="#f59e0b" icon="⚡" />
          </div>

          {/* Today's Schedule */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Today&apos;s Schedule</h2>
              <Link href="/technician/jobs" className="text-xs text-amber-400 font-medium">View all →</Link>
            </div>
            {todayJobs.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-sm text-white/50">No more jobs scheduled for today</p>
              </div>
            ) : (
              todayJobs.map((j) => <TodayJobCard key={j.id} job={j} />)
            )}
          </div>

          {/* Pending Tasks */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Pending Tasks</h2>
              <Link href="/technician/tasks" className="text-xs text-amber-400 font-medium">View all →</Link>
            </div>
            {pendingTasks.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <p className="text-2xl mb-2">✨</p>
                <p className="text-sm text-white/50">No pending maintenance tasks</p>
              </div>
            ) : (
              pendingTasks.map((t) => <TaskCard key={t.id} task={t} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}
