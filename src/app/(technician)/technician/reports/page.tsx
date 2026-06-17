"use client";
import { useEffect, useState } from "react";
import { useTech } from "@/app/(technician)/layout";
import TechProfileSwitcher from "@/components/technician/TechProfileSwitcher";
import { technicianPortalService, type WorkOrder } from "@/services/technicianPortalService";

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

function ReportCard({ job }: { job: WorkOrder }) {
  const [expanded, setExpanded] = useState(false);
  const r = job.service_report!;

  return (
    <div
      className="rounded-2xl mb-3 overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="text-xl shrink-0 mt-0.5">{typeIcon(job.type)}</span>
            <div className="min-w-0">
              <p className="text-xs font-mono text-white/30">{job.order_number}</p>
              <p className="text-sm font-bold text-white leading-tight">{job.title}</p>
              <p className="text-xs text-white/40 mt-0.5">{job.customer_name}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div
              className="text-[10px] font-bold px-2 py-1 rounded-lg mb-1"
              style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
            >
              ✅ Completed
            </div>
            <p className="text-[10px] text-white/30">{job.completed_at}</p>
          </div>
        </div>

        {/* Preview */}
        <p className="text-xs text-white/40 mt-2 line-clamp-2">{r.work_performed}</p>

        {/* Expand toggle */}
        <div className="flex items-center gap-1 mt-3">
          <span className="text-[10px] text-amber-400 font-semibold">{expanded ? "Collapse" : "View Report"}</span>
          <svg
            className={`w-3 h-3 text-amber-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="px-4 pb-4 space-y-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {[
            { label: "Work Performed", val: r.work_performed },
            { label: "Findings", val: r.findings },
            { label: "Parts / Materials", val: r.parts_used },
            { label: "Recommendations", val: r.recommendations },
            { label: "Technician Notes", val: r.technician_notes },
          ].filter((f) => f.val).map((f) => (
            <div key={f.label} className="pt-3">
              <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-1.5">{f.label}</p>
              <p className="text-sm text-white/65 leading-relaxed">{f.val}</p>
            </div>
          ))}

          {/* Service items */}
          {r.items && r.items.length > 0 && (
            <div className="pt-3">
              <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-2">Service Readings</p>
              <div className="space-y-2">
                {r.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-xs text-white/45">{item.label}</span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-md"
                      style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duration */}
          {job.actual_duration && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-white/30">⏱ Duration</span>
              <span className="text-xs font-semibold text-white/60">{job.actual_duration}h (est. {job.estimated_duration}h)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { profile } = useTech();
  const [reports, setReports] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await technicianPortalService.getCompletedReports(profile.id);
      setReports(data);
      setLoading(false);
    }
    load();
  }, [profile.id]);

  return (
    <div className="px-4 pt-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white">Completion Reports</h1>
          <p className="text-xs text-white/40 mt-0.5">{reports.length} submitted reports</p>
        </div>
        <TechProfileSwitcher />
      </div>

      {/* Stats strip */}
      {reports.length > 0 && (
        <div
          className="flex gap-3 p-4 rounded-2xl mb-5"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}
        >
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-white">{reports.length}</p>
            <p className="text-[10px] text-white/35 uppercase tracking-wide">Jobs Done</p>
          </div>
          <div className="w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-white">
              {(reports.reduce((s, j) => s + (j.actual_duration ?? j.estimated_duration), 0)).toFixed(1)}h
            </p>
            <p className="text-[10px] text-white/35 uppercase tracking-wide">Total Hours</p>
          </div>
          <div className="w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold" style={{ color: "#10b981" }}>
              {reports.filter((r) => r.photos.length > 0).length}
            </p>
            <p className="text-[10px] text-white/35 uppercase tracking-wide">With Photos</p>
          </div>
        </div>
      )}

      {/* Report list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-3xl mb-3">📋</p>
          <p className="text-white/50 text-sm">No completion reports yet</p>
          <p className="text-white/25 text-xs mt-1">Reports appear after you complete jobs</p>
        </div>
      ) : (
        reports.map((r) => <ReportCard key={r.id} job={r} />)
      )}
    </div>
  );
}
