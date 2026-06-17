"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { workOrderService, type WorkOrder, type WorkOrderStatus, type ServiceReport } from "@/services/workOrderService";

function priorityColor(p: string) {
  switch (p) {
    case "urgent": return "#ef4444";
    case "high":   return "#f59e0b";
    case "medium": return "#3b82f6";
    default:       return "#6b7280";
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

/* ── Checklist Panel ───────────────────────────────────────────────────── */
function ChecklistPanel({
  items,
  onChange,
  disabled,
}: {
  items: { id: string; label: string; done: boolean }[];
  onChange: (id: string, done: boolean) => void;
  disabled: boolean;
}) {
  const done = items.filter((i) => i.done).length;
  const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-white/40">{done} / {items.length} completed</p>
        <p className="text-xs font-bold" style={{ color: pct === 100 ? "#10b981" : "#f59e0b" }}>{pct}%</p>
      </div>
      <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct === 100 ? "#10b981" : "linear-gradient(90deg, #f59e0b, #d97706)",
          }}
        />
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            disabled={disabled}
            onClick={() => onChange(item.id, !item.done)}
            className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all active:scale-[0.98]"
            style={{
              background: item.done ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${item.done ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {/* Checkbox */}
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
              style={{ color: item.done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)", textDecoration: item.done ? "line-through" : "none" }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Photo Upload Panel ────────────────────────────────────────────────── */
interface PhotoEntry {
  id: string;
  dataUrl: string;
  caption: string;
}

function PhotoUploadPanel({ jobId, disabled }: { jobId: string; disabled: boolean }) {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [captionInputs, setCaptionInputs] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const id = `photo-${Date.now()}-${Math.random()}`;
        setPhotos((prev) => [...prev, { id, dataUrl, caption: "" }]);
        setCaptionInputs((prev) => ({ ...prev, [id]: "" }));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    });
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function updateCaption(id: string, val: string) {
    setCaptionInputs((prev) => ({ ...prev, [id]: val }));
  }

  return (
    <div>
      {/* Upload button */}
      {!disabled && (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-4 rounded-2xl mb-4 flex flex-col items-center gap-2 transition-all active:scale-[0.98]"
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "2px dashed rgba(245,158,11,0.3)",
          }}
        >
          <span className="text-2xl">📷</span>
          <span className="text-sm font-semibold text-amber-400">Add Photo</span>
          <span className="text-xs text-white/30">Tap to capture or choose from gallery</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {uploading && (
        <div className="flex items-center gap-2 mb-3 px-2">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-white/40">Processing…</span>
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="space-y-3">
          {photos.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.dataUrl} alt="Site photo" className="w-full h-48 object-cover" />
              <div className="p-3">
                <input
                  type="text"
                  placeholder="Add a caption…"
                  value={captionInputs[p.id] || ""}
                  onChange={(e) => updateCaption(p.id, e.target.value)}
                  className="w-full bg-transparent text-sm text-white/80 placeholder-white/25 outline-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-white/20">✓ Uploaded</span>
                  <button onClick={() => removePhoto(p.id)} className="text-xs text-red-400">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && disabled && (
        <p className="text-xs text-white/30 text-center py-4">No photos attached</p>
      )}
    </div>
  );
}

/* ── Completion Report Form ────────────────────────────────────────────── */
function CompletionReportForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (report: ServiceReport) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<ServiceReport>({
    work_performed: "",
    parts_used: "",
    findings: "",
    recommendations: "",
    technician_notes: "",
    items: [],
  });

  function set(key: keyof ServiceReport, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  const fields: { key: keyof ServiceReport; label: string; placeholder: string; required: boolean }[] = [
    { key: "work_performed", label: "Work Performed", placeholder: "Describe all work completed…", required: true },
    { key: "findings", label: "Findings", placeholder: "What did you find on site?", required: true },
    { key: "parts_used", label: "Parts / Materials Used", placeholder: "e.g. 40A DC Fuse (1x) — $18", required: false },
    { key: "recommendations", label: "Recommendations", placeholder: "Any follow-up actions needed?", required: false },
    { key: "technician_notes", label: "Technician Notes", placeholder: "Internal notes, customer feedback…", required: false },
  ];

  const isValid = form.work_performed.trim() && form.findings.trim();

  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
            {f.label} {f.required && <span className="text-amber-400">*</span>}
          </label>
          <textarea
            rows={3}
            placeholder={f.placeholder}
            value={form[f.key] as string}
            onChange={(e) => set(f.key, e.target.value)}
            className="w-full rounded-xl px-3.5 py-3 text-sm text-white placeholder-white/20 resize-none outline-none transition-colors"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          />
        </div>
      ))}

      {/* Signature placeholder */}
      <div
        className="rounded-xl p-4 text-center"
        style={{ background: "rgba(255,255,255,0.03)", border: "2px dashed rgba(255,255,255,0.1)" }}
      >
        <p className="text-xs text-white/30 mb-1">Customer Signature</p>
        <p className="text-sm text-white/20 italic">Tap to sign (coming soon)</p>
      </div>

      <button
        disabled={!isValid || submitting}
        onClick={() => onSubmit(form)}
        className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-40"
        style={{
          background: isValid && !submitting ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(255,255,255,0.08)",
          color: isValid && !submitting ? "#fff" : "rgba(255,255,255,0.3)",
        }}
      >
        {submitting ? "Submitting…" : "✅ Submit Completion Report"}
      </button>
    </div>
  );
}

/* ── Status Steps ──────────────────────────────────────────────────────── */
function StatusStepper({ status, onUpdate }: { status: WorkOrderStatus; onUpdate: (s: WorkOrderStatus) => void }) {
  const steps: { key: WorkOrderStatus; label: string; color: string }[] = [
    { key: "scheduled", label: "Scheduled", color: "#3b82f6" },
    { key: "in_progress", label: "In Progress", color: "#f59e0b" },
    { key: "completed", label: "Completed", color: "#10b981" },
  ];
  const idx = steps.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((step, i) => {
        const active = i === idx;
        const done = i < idx;
        const canClick = i === idx + 1 && status !== "completed";

        return (
          <div key={step.key} className="flex-1 flex items-center">
            <button
              disabled={!canClick}
              onClick={() => canClick && onUpdate(step.key)}
              className="flex-1 text-center py-2.5 text-xs font-bold transition-all"
              style={{
                background: active ? step.color : done ? `${step.color}22` : "rgba(255,255,255,0.04)",
                color: active ? "#000" : done ? step.color : "rgba(255,255,255,0.3)",
                borderRadius: i === 0 ? "10px 0 0 10px" : i === steps.length - 1 ? "0 10px 10px 0" : "0",
                border: `1px solid ${active ? step.color : done ? `${step.color}30` : "rgba(255,255,255,0.07)"}`,
                cursor: canClick ? "pointer" : "default",
              }}
            >
              {done ? "✓ " : ""}{step.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ── Section wrapper ───────────────────────────────────────────────────── */
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */
export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [job, setJob] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<{ id: string; label: string; done: boolean }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    workOrderService.getOrder(jobId).then((j) => {
      setJob(j);
      // Generate a checklist if not present
      if (j) {
        setChecklist([
          { id: "c1", label: "Confirm site access and safety clearance", done: false },
          { id: "c2", label: "Review job notes and customer requirements", done: false },
          { id: "c3", label: "Inspect system / site conditions before starting", done: false },
          { id: "c4", label: "Complete required work as described", done: false },
          { id: "c5", label: "Test and verify system functionality", done: false },
          { id: "c6", label: "Document all findings and work completed", done: false },
          { id: "c7", label: "Clean up work area and restore site", done: false },
          { id: "c8", label: "Brief customer on completed work", done: false },
        ]);
      }
      setLoading(false);
    });
  }, [jobId]);

  async function handleStatusUpdate(newStatus: WorkOrderStatus) {
    if (!job) return;
    const updated = await workOrderService.updateStatus(job.id, newStatus);
    setJob(updated);
  }

  async function handleChecklistChange(id: string, done: boolean) {
    setChecklist((prev) => prev.map((i) => (i.id === id ? { ...i, done } : i)));
  }

  async function handleSubmitReport(report: ServiceReport) {
    if (!job) return;
    setSubmitting(true);
    const updated = await workOrderService.submitServiceReport(job.id, report);
    setJob(updated);
    setSubmitted(true);
    setSubmitting(false);
    setTimeout(() => router.push("/technician/jobs"), 1500);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 px-8 text-center">
        <p className="text-4xl">🔍</p>
        <p className="text-white/50">Job not found</p>
        <Link href="/technician/jobs" className="text-amber-400 text-sm">← Back to Jobs</Link>
      </div>
    );
  }

  const pc = priorityColor(job.priority);
  const isCompleted = job.status === "completed";
  const canSubmitReport = job.status === "in_progress" && !submitted;

  return (
    <div className="max-w-lg mx-auto">
      {/* Hero header */}
      <div
        className="px-4 pt-5 pb-6"
        style={{ background: `linear-gradient(180deg, ${pc}12 0%, transparent 100%)`, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Back */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/technician/jobs" className="flex items-center gap-1 text-sm text-white/50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Jobs
          </Link>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-lg uppercase"
            style={{ background: `${pc}20`, color: pc, border: `1px solid ${pc}30` }}
          >
            {job.priority}
          </span>
        </div>

        {/* Title */}
        <div className="flex items-start gap-3">
          <span className="text-3xl mt-1">{typeIcon(job.type)}</span>
          <div>
            <p className="text-xs font-mono text-white/30 mb-0.5">{job.order_number}</p>
            <h1 className="text-lg font-bold text-white leading-tight">{job.title}</h1>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">👤</span>
            <span className="text-sm text-white/70">{job.customer_name}</span>
            {job.customer_phone && (
              <a
                href={`tel:${job.customer_phone}`}
                className="ml-auto text-xs font-bold text-amber-400 px-3 py-1 rounded-lg"
                style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}
              >
                📞 Call
              </a>
            )}
          </div>
          <div className="flex items-start gap-2">
            <span className="text-sm">📍</span>
            <span className="text-sm text-white/60">{job.site_address}</span>
          </div>
          {job.scheduled_date && (
            <div className="flex items-center gap-2">
              <span className="text-sm">🗓</span>
              <span className="text-sm text-white/60">
                {job.scheduled_date}{job.scheduled_time ? ` at ${job.scheduled_time}` : ""}
                <span className="text-white/30 ml-2">· {job.estimated_duration}h estimated</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-5">
        {/* Status stepper */}
        <StatusStepper status={job.status} onUpdate={handleStatusUpdate} />

        {/* Description */}
        {job.description && (
          <Section title="Job Description" icon="📄">
            <p className="text-sm text-white/60 leading-relaxed">{job.description}</p>
          </Section>
        )}

        {/* Checklist */}
        <Section title="Checklist" icon="✅">
          <ChecklistPanel
            items={checklist}
            onChange={handleChecklistChange}
            disabled={isCompleted}
          />
        </Section>

        {/* Photos */}
        <Section title="Photo Documentation" icon="📷">
          <PhotoUploadPanel jobId={job.id} disabled={isCompleted} />
        </Section>

        {/* Completion Report */}
        {(canSubmitReport || isCompleted) && (
          <Section title={isCompleted ? "Completion Report" : "Submit Completion Report"} icon="📝">
            {isCompleted && job.service_report ? (
              <div className="space-y-4">
                {[
                  { label: "Work Performed", val: job.service_report.work_performed },
                  { label: "Findings", val: job.service_report.findings },
                  { label: "Parts Used", val: job.service_report.parts_used },
                  { label: "Recommendations", val: job.service_report.recommendations },
                  { label: "Notes", val: job.service_report.technician_notes },
                ].filter((r) => r.val).map((r) => (
                  <div key={r.label}>
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">{r.label}</p>
                    <p className="text-sm text-white/70">{r.val}</p>
                  </div>
                ))}
                <div
                  className="flex items-center gap-2 p-3 rounded-xl mt-2"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  <span>✅</span>
                  <span className="text-sm text-emerald-400 font-medium">Report submitted · {job.completed_at}</span>
                </div>
              </div>
            ) : submitted ? (
              <div
                className="flex flex-col items-center gap-3 p-8 rounded-2xl"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <span className="text-3xl">✅</span>
                <p className="text-emerald-400 font-bold">Report submitted!</p>
                <p className="text-white/40 text-xs">Redirecting…</p>
              </div>
            ) : (
              <CompletionReportForm onSubmit={handleSubmitReport} submitting={submitting} />
            )}
          </Section>
        )}

        {/* Tags */}
        {job.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {job.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
