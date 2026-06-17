"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  maintenanceService,
  MaintenanceRecord,
  ChecklistItem,
} from "@/services/maintenanceService";
import {
  getStatusBadge,
  formatDate,
  TechnicianAvatar,
  ChecklistProgress,
} from "./MaintenanceUIHelpers";

interface Props {
  id: string;
}

export default function MaintenanceDetail({ id }: Props) {
  const router = useRouter();
  const [record, setRecord] = useState<MaintenanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    maintenanceService.getRecord(id).then((r) => {
      if (r) {
        setRecord(r);
        setChecklist(r.checklist.map((i) => ({ ...i })));
        setNotes(r.completion_notes ?? "");
        setPhotoUrls(r.photos ?? []);
      }
      setLoading(false);
    });
  }, [id]);

  const toggleItem = (itemId: string) => {
    if (record?.status === "completed") return;
    setChecklist((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i))
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      setPhotoUrls((prev) => [...prev, url]);
    });
  };

  const handleComplete = async () => {
    if (!record) return;
    setSaving(true);
    try {
      const updated = await maintenanceService.completeRecord(record.id, {
        checklist,
        completion_notes: notes,
        photos: photoUrls,
      });
      setRecord(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const doneCount = checklist.filter((i) => i.done).length;
  const allDone = doneCount === checklist.length && checklist.length > 0;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center py-24">
        <svg className="h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">Record not found</p>
        <button
          onClick={() => router.push("/maintenance/schedule")}
          className="mt-4 text-sm text-brand-500 hover:text-brand-600 font-medium"
        >
          ← Back to schedule
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => router.push("/maintenance/schedule")}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors mb-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to schedule
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{record.system_name}</h1>
          <div className="flex items-center gap-3 mt-1.5">
            {getStatusBadge(record.status)}
            <span className="text-sm text-gray-500 dark:text-gray-400">#{record.id}</span>
          </div>
        </div>

        {record.status !== "completed" && record.status !== "cancelled" && (
          <div className="flex items-center gap-2">
            <button
              id="maint-reschedule-btn"
              onClick={() => router.push("/maintenance/schedule")}
              className="h-10 px-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Reschedule
            </button>
            <button
              id="maint-complete-btn"
              onClick={handleComplete}
              disabled={saving || !allDone}
              title={!allDone ? "Complete all checklist items first" : ""}
              className="h-10 px-4 rounded-lg bg-emerald-500 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {saving ? "Saving..." : "Mark Complete"}
            </button>
          </div>
        )}
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-3">
          <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Maintenance visit marked as complete!
          </p>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ),
            label: "Customer",
            value: record.customer_name,
            color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
          },
          {
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
            label: "Site",
            value: record.site_address,
            color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10",
          },
          {
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ),
            label: "Scheduled",
            value: formatDate(record.scheduled_date),
            color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10",
          },
          {
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
            label: "Technician",
            value: record.technician_name,
            color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-dark p-4"
          >
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}>
              {card.icon}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-0.5">
              {card.label}
            </p>
            <p className="text-sm font-semibold text-gray-800 dark:text-white leading-snug">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Checklist */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">Maintenance Checklist</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{doneCount} of {checklist.length} completed</p>
            </div>
            <div className="w-24">
              <ChecklistProgress checklist={checklist} />
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {checklist.map((item, idx) => (
              <label
                key={item.id}
                className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                  record.status === "completed"
                    ? "opacity-60"
                    : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleItem(item.id)}
                  disabled={record.status === "completed"}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-brand-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-xs text-gray-400 tabular-nums w-4 flex-shrink-0 mt-0.5">{idx + 1}.</span>
                  <span className={item.done ? "line-through text-gray-400 dark:text-gray-500" : ""}>
                    {item.label}
                  </span>
                </span>
                {item.done && (
                  <svg className="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </label>
            ))}
          </div>
          {!allDone && record.status !== "completed" && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-amber-50/50 dark:bg-amber-500/5">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Complete all {checklist.length - doneCount} remaining items before marking this visit complete.
              </p>
            </div>
          )}
        </div>

        {/* Right column: Photos + Notes */}
        <div className="space-y-5">
          {/* Photos */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">Site Photos</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{photoUrls.length} photo{photoUrls.length !== 1 ? "s" : ""}</p>
              </div>
              {record.status !== "completed" && (
                <>
                  <button
                    id="maint-upload-photo-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </>
              )}
            </div>
            <div className="p-5">
              {photoUrls.length === 0 ? (
                <button
                  onClick={() => record.status !== "completed" && fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-8 text-gray-400 hover:border-brand-300 dark:hover:border-brand-600 hover:text-brand-400 dark:hover:text-brand-400 transition-colors"
                >
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">
                    {record.status !== "completed" ? "Click to upload site photos" : "No photos uploaded"}
                  </span>
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {photoUrls.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Site photo ${i + 1}`} className="h-full w-full object-cover" />
                      {record.status !== "completed" && (
                        <button
                          onClick={() => setPhotoUrls((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {record.status !== "completed" && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:border-brand-300 hover:text-brand-400 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Completion Notes */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">Completion Notes</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Document findings, issues, or follow-up actions
              </p>
            </div>
            <div className="p-5">
              <textarea
                id="maint-notes"
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={record.status === "completed"}
                placeholder="e.g. Panels cleaned, inverter firmware updated, system operating at 98.5% efficiency. No structural issues found..."
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
              {record.completed_at && (
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                  ✓ Completed on {formatDate(record.completed_at)}
                </p>
              )}
            </div>
          </div>

          {/* Technician Card */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Assigned Technician</h3>
            <div className="flex items-center gap-3">
              <TechnicianAvatar name={record.technician_name} size="md" />
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{record.technician_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Field Technician</p>
              </div>
              {record.status !== "completed" && (
                <button className="ml-auto h-8 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Reassign
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
