"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTech } from "@/components/technician/TechContext";
import TechProfileSwitcher from "@/components/technician/TechProfileSwitcher";
import { technicianPortalService, type WorkOrder } from "@/services/technicianPortalService";

function typeIcon(t: string) {
  switch (t) {
    case "cleaning": return "🧹";
    case "inspection": return "🔍";
    case "repair": return "⚡";
    case "replacement": return "♻️";
    case "warranty_service": return "♻️";
    case "maintenance": return "🗓️";
    case "installation_follow_up": return "🔧";
    case "emergency_visit": return "🚨";
    default: return "📋";
  }
}

function CompletedJobCard({ job }: { job: WorkOrder }) {
  const hours = job.actual_duration ?? job.estimated_duration;

  return (
    <Link href={`/technician/jobs/${job.id}`}>
      <div
        className="rounded-2xl p-4 mb-3 transition-all active:scale-[0.98]"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="text-xl shrink-0">{typeIcon(job.type)}</span>
            <div className="min-w-0">
              <p className="text-xs font-mono text-white/30">{job.order_number}</p>
              <p className="text-sm font-bold text-white leading-tight">{job.title}</p>
              <p className="text-xs text-white/40 mt-1 truncate">{job.customer_name}</p>
              <p className="text-xs text-white/30 mt-0.5 truncate">📍 {job.site_address}</p>
            </div>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 uppercase"
            style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}
          >
            Complete
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="text-[10px] text-white/30 uppercase tracking-wide">Hours</p>
            <p className="text-sm font-bold text-white">{hours}h</p>
          </div>
          <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="text-[10px] text-white/30 uppercase tracking-wide">Status</p>
            <p className="text-sm font-bold text-emerald-400">Done</p>
          </div>
          <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="text-[10px] text-white/30 uppercase tracking-wide">Date</p>
            <p className="text-sm font-bold text-white">{job.completed_at ?? "—"}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CompletedPage() {
  const { profile } = useTech();
  const [jobs, setJobs] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await technicianPortalService.getCompletedJobs(profile.id);
      setJobs(data);
      setLoading(false);
    }
    load();
  }, [profile.id]);

  const totalHours = jobs.reduce((sum, job) => sum + (job.actual_duration ?? job.estimated_duration), 0);

  return (
    <div className="px-4 pt-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white">Completed</h1>
          <p className="text-xs text-white/40 mt-0.5">Finished jobs and hours worked</p>
        </div>
        <TechProfileSwitcher />
      </div>

      <div
        className="grid grid-cols-2 gap-3 p-4 rounded-2xl mb-5"
        style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}
      >
        <div>
          <p className="text-3xl font-bold text-white">{jobs.length}</p>
          <p className="text-xs text-white/35">completed jobs</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-white">{totalHours.toFixed(1)}h</p>
          <p className="text-xs text-white/35">hours worked</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-3xl mb-3">🏁</p>
          <p className="text-white/50 text-sm">No completed jobs yet</p>
        </div>
      ) : (
        jobs.map((job) => <CompletedJobCard key={job.id} job={job} />)
      )}
    </div>
  );
}
