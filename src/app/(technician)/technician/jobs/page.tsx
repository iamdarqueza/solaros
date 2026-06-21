"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTech } from "@/components/technician/TechContext";
import TechProfileSwitcher from "@/components/technician/TechProfileSwitcher";
import {
  technicianPortalService,
  type WorkOrder,
} from "@/services/technicianPortalService";
import { workOrderService } from "@/services/workOrderService";

type StatusFilter = "all" | "new" | "scheduled" | "in_progress" | "completed";

function priorityColor(p: string) {
  switch (p) {
    case "urgent": return "#ef4444";
    case "high":   return "#f59e0b";
    case "medium": return "#3b82f6";
    default:       return "#6b7280";
  }
}

function statusColor(s: string) {
  switch (s) {
    case "in_progress": return "#f59e0b";
    case "assigned":    return "#8b5cf6";
    case "scheduled":   return "#3b82f6";
    case "requires_follow_up": return "#f43f5e";
    case "completed":   return "#10b981";
    case "cancelled":   return "#6b7280";
    default:            return "#6b7280";
  }
}

function typeIcon(t: string) {
  switch (t) {
    case "cleaning":     return "🧹";
    case "inspection":   return "🔍";
    case "repair":       return "⚡";
    case "replacement":  return "♻️";
    case "warranty_service": return "♻️";
    case "maintenance":  return "🗓️";
    case "installation_follow_up": return "🔧";
    case "emergency_visit": return "🚨";
    default:             return "📋";
  }
}

function JobCard({ job, onStartJob }: { job: WorkOrder; onStartJob: (id: string) => void }) {
  const pc = priorityColor(job.priority);
  const sc = statusColor(job.status);
  const isActive = job.status === "in_progress";

  return (
    <div
      className="rounded-2xl mb-3 overflow-hidden"
      style={{
        background: isActive ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${isActive ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      {/* Priority stripe */}
      <div className="h-0.5 w-full" style={{ background: pc }} />

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0">{typeIcon(job.type)}</span>
            <div className="min-w-0">
              <p className="text-xs font-mono text-white/30">{job.order_number}</p>
              <p className="text-sm font-bold text-white leading-tight">{job.title}</p>
            </div>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 uppercase"
            style={{ background: `${sc}18`, color: sc, border: `1px solid ${sc}30` }}
          >
            {job.status === "in_progress" ? "• Live" : job.status.replace("_", " ")}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-1 mb-3">
          <p className="text-xs text-white/50 flex items-center gap-1.5">
            <span>👤</span> {job.customer_name}
            {job.customer_phone && (
              <a
                href={`tel:${job.customer_phone}`}
                className="ml-auto text-amber-400 font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                Call
              </a>
            )}
          </p>
          <p className="text-xs text-white/40 flex items-start gap-1.5">
            <span>📍</span>
            <span className="truncate">{job.site_address}</span>
          </p>
          {job.scheduled_date && (
            <p className="text-xs text-white/40 flex items-center gap-1.5">
              <span>🗓</span> {job.scheduled_date}{job.scheduled_time ? ` at ${job.scheduled_time}` : ""}
              <span className="ml-auto text-white/30">~{job.estimated_duration}h</span>
            </p>
          )}
          <p className="text-xs text-white/35 flex items-center gap-1.5">
            <span>↳</span> From: {job.source_label}
          </p>
        </div>

        {/* Priority badge */}
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
            style={{ background: `${pc}18`, color: pc }}
          >
            {job.priority}
          </span>
          <div className="flex items-center gap-2">
            {/* Start job button */}
            {(job.status === "assigned" || job.status === "scheduled" || job.status === "requires_follow_up") && (
              <button
                onClick={() => onStartJob(job.id)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }}
              >
                {job.status === "requires_follow_up" ? "Continue" : "Start Job"}
              </button>
            )}
            <Link
              href={`/technician/jobs/${job.id}`}
              className="text-xs font-semibold text-amber-400 px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const { profile } = useTech();
  const router = useRouter();
  const [jobs, setJobs] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await technicianPortalService.getMyJobs(profile.id);
      setJobs(data);
      setLoading(false);
    }
    load();
  }, [profile.id]);

  async function handleStartJob(id: string) {
    if (technicianPortalService.isMaintenanceJob({ id })) {
      router.push(`/technician/jobs/${id}`);
      return;
    }

    await workOrderService.updateStatus(id, "in_progress");
    const data = await technicianPortalService.getMyJobs(profile.id);
    setJobs(data);
    router.push(`/technician/jobs/${id}`);
  }

  const visibleJobs = jobs.filter((j) => j.status !== "cancelled");
  const filtered = filter === "all"
    ? visibleJobs
    : filter === "new"
      ? visibleJobs.filter((j) => j.status === "new" || j.status === "assigned" || j.status === "requires_follow_up")
      : visibleJobs.filter((j) => j.status === filter);

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "new", label: "New" },
    { key: "scheduled", label: "Scheduled" },
    { key: "in_progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
  ];

  const counts = {
    all: visibleJobs.length,
    new: visibleJobs.filter((j) => j.status === "new" || j.status === "assigned" || j.status === "requires_follow_up").length,
    scheduled: visibleJobs.filter((j) => j.status === "scheduled").length,
    in_progress: visibleJobs.filter((j) => j.status === "in_progress").length,
    completed: visibleJobs.filter((j) => j.status === "completed").length,
  };

  return (
    <div className="px-4 pt-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white">Jobs</h1>
          <p className="text-xs text-white/40 mt-0.5">{visibleJobs.length} assigned field jobs</p>
        </div>
        <TechProfileSwitcher />
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-5"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1"
            style={{
              background: filter === t.key ? "linear-gradient(135deg, #f59e0b, #d97706)" : "transparent",
              color: filter === t.key ? "#000" : "rgba(255,255,255,0.4)",
            }}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: filter === t.key ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.1)",
                  color: filter === t.key ? "#000" : "rgba(255,255,255,0.6)",
                }}
              >
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
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
          <p className="text-3xl mb-3">📭</p>
          <p className="text-white/50 text-sm">No {filter === "all" ? "" : filter.replace("_", " ")} jobs</p>
        </div>
      ) : (
        filtered.map((j) => <JobCard key={j.id} job={j} onStartJob={handleStartJob} />)
      )}
    </div>
  );
}
