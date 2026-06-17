"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { maintenanceService, type MaintenanceRecord, type ChecklistItem } from "@/services/maintenanceService";

function statusColor(s: string) {
  switch (s) {
    case "overdue":     return "#ef4444";
    case "in_progress": return "#f59e0b";
    case "scheduled":   return "#3b82f6";
    case "completed":   return "#10b981";
    default:            return "#6b7280";
  }
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [task, setTask] = useState<MaintenanceRecord | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    maintenanceService.getRecord(taskId).then((t) => {
      setTask(t);
      if (t) setChecklist(t.checklist);
      setLoading(false);
    });
  }, [taskId]);

  function toggleItem(id: string) {
    setChecklist((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  async function handleComplete() {
    if (!task) return;
    setSubmitting(true);
    const updated = await maintenanceService.completeRecord(task.id, {
      checklist,
      completion_notes: notes,
      photos: [],
    });
    setTask(updated);
    setSubmitted(true);
    setSubmitting(false);
    setTimeout(() => router.push("/technician/tasks"), 1500);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 px-8 text-center">
        <p className="text-4xl">🔍</p>
        <p className="text-white/50">Task not found</p>
        <Link href="/technician/tasks" className="text-amber-400 text-sm">← Back to Tasks</Link>
      </div>
    );
  }

  const done = checklist.filter((i) => i.done).length;
  const total = checklist.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const sc = statusColor(task.status);
  const isCompleted = task.status === "completed";
  const allDone = done === total;

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div
        className="px-4 pt-5 pb-6"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <Link href="/technician/tasks" className="flex items-center gap-1 text-sm text-white/50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Tasks
          </Link>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-lg uppercase"
            style={{ background: `${sc}18`, color: sc, border: `1px solid ${sc}30` }}
          >
            {task.status}
          </span>
        </div>

        <h1 className="text-lg font-bold text-white mb-1">🔧 Maintenance Task</h1>
        <p className="text-base font-semibold text-white/80 mb-4">{task.customer_name}</p>

        <div className="space-y-2">
          <p className="text-sm text-white/50 flex items-center gap-2"><span>⚡</span>{task.system_name}</p>
          <p className="text-sm text-white/45 flex items-start gap-2"><span>📍</span>{task.site_address}</p>
          <p className="text-sm text-white/45 flex items-center gap-2"><span>🗓</span>{task.scheduled_date}</p>
        </div>
      </div>

      <div className="px-4 pt-5">
        {/* Big progress ring */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke={pct === 100 ? "#10b981" : "#f59e0b"} strokeWidth="6"
                strokeDasharray={`${(pct / 100) * 213.6} 213.6`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.5s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-white">{pct}%</span>
            </div>
          </div>
          <div>
            <p className="text-base font-bold text-white">{done} of {total} items</p>
            <p className="text-sm text-white/40">Checklist progress</p>
            {task.completion_notes && (
              <p className="text-xs text-emerald-400 mt-1">✅ Completed</p>
            )}
          </div>
        </div>

        {/* Checklist */}
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          ✅ Site Checklist
        </h3>
        <div className="space-y-2 mb-6">
          {checklist.map((item) => (
            <button
              key={item.id}
              disabled={isCompleted}
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-all active:scale-[0.98]"
              style={{
                background: item.done ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${item.done ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <div
                className="w-5 h-5 rounded-md shrink-0 mt-0.5 flex items-center justify-center transition-all"
                style={{
                  background: item.done ? "#10b981" : "transparent",
                  border: `2px solid ${item.done ? "#10b981" : "rgba(255,255,255,0.2)"}`,
                }}
              >
                {item.done && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span
                className="text-sm leading-snug"
                style={{
                  color: item.done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)",
                  textDecoration: item.done ? "line-through" : "none",
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Completion notes + submit */}
        {!isCompleted && (
          <>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">📝 Completion Notes</h3>
            <textarea
              rows={4}
              placeholder="Describe work completed, observations, and any issues found…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl px-3.5 py-3 text-sm text-white placeholder-white/20 resize-none outline-none mb-4"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
            />
            {submitted ? (
              <div
                className="flex flex-col items-center gap-3 p-8 rounded-2xl mb-6"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <span className="text-3xl">✅</span>
                <p className="text-emerald-400 font-bold">Task completed!</p>
              </div>
            ) : (
              <button
                disabled={!allDone || submitting}
                onClick={handleComplete}
                className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-40 mb-6"
                style={{
                  background: allDone && !submitting ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(255,255,255,0.08)",
                  color: allDone && !submitting ? "#fff" : "rgba(255,255,255,0.3)",
                }}
              >
                {submitting ? "Saving…" : allDone ? "✅ Mark Task Complete" : `Complete all checklist items first (${done}/${total})`}
              </button>
            )}
          </>
        )}

        {/* Completion notes readonly */}
        {isCompleted && task.completion_notes && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">📝 Completion Notes</h3>
            <p className="text-sm text-white/60 leading-relaxed">{task.completion_notes}</p>
            <div
              className="flex items-center gap-2 p-3 rounded-xl mt-3"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              <span>✅</span>
              <span className="text-sm text-emerald-400 font-medium">Completed · {task.completed_at}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
