"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  workOrderService,
  WorkOrder,
  WorkOrderStatus,
  WO_TECHNICIANS,
} from "@/services/workOrderService";
import { StatusBadge, PriorityBadge, TechAvatar, getTypeIcon } from "./WorkOrderList";
import WorkOrderModal from "./WorkOrderModal";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function formatDateTime(isoStr: string | null): string {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

const STATUS_FLOW: WorkOrderStatus[] = ["new", "scheduled", "in_progress", "completed"];
const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  new: "New",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface WorkOrderDetailProps {
  id: string;
}

export default function WorkOrderDetail({ id }: WorkOrderDetailProps) {
  const router = useRouter();
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "photos" | "report">("overview");

  const load = useCallback(async () => {
    setLoading(true);
    const o = await workOrderService.getOrder(id);
    setOrder(o);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleStatusUpdate = async (newStatus: WorkOrderStatus) => {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      const updated = await workOrderService.updateStatus(order.id, newStatus);
      setOrder(updated);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-dark p-6 h-40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 animate-pulse rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-dark h-64" />
          <div className="animate-pulse rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-dark h-64" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Work order not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-brand-500 hover:text-brand-600 font-medium"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const currentStatusIdx = STATUS_FLOW.indexOf(order.status);
  const canProgress = order.status !== "completed" && order.status !== "cancelled";

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: "photos" as const, label: `Photos (${order.photos.length})`, icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { id: "report" as const, label: "Service Report", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  ];

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark overflow-hidden">
        <div className="px-6 py-5">
          {/* Top Row */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex-shrink-0 mt-0.5">
                {getTypeIcon(order.type)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{order.order_number}</span>
                  <span className="text-gray-200 dark:text-gray-700">·</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">{order.type}</span>
                </div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white leading-snug">{order.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge status={order.status} />
              <PriorityBadge priority={order.priority} />
              <button
                id="wo-edit-btn"
                onClick={() => setShowModal(true)}
                className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            </div>
          </div>

          {/* Status Progress */}
          {order.status !== "cancelled" && (
            <div className="mt-4">
              <div className="flex items-center gap-0">
                {STATUS_FLOW.map((s, i) => {
                  const isDone = currentStatusIdx > i;
                  const isCurrent = currentStatusIdx === i;
                  const isNext = currentStatusIdx + 1 === i && canProgress;
                  return (
                    <React.Fragment key={s}>
                      <button
                        onClick={() => isNext && handleStatusUpdate(s)}
                        disabled={!isNext || updatingStatus}
                        className={`flex flex-col items-center gap-1 flex-shrink-0 transition-all ${isNext ? "cursor-pointer" : "cursor-default"}`}
                        title={isNext ? `Move to ${STATUS_LABELS[s]}` : STATUS_LABELS[s]}
                      >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                            ? "bg-brand-500 text-white ring-4 ring-brand-100 dark:ring-brand-500/20"
                            : isNext
                            ? "bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-brand-400 hover:text-brand-400"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600"
                        }`}>
                          {isDone ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-xs font-bold">{i + 1}</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-medium whitespace-nowrap ${
                          isCurrent ? "text-brand-600 dark:text-brand-400" : isDone ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"
                        }`}>
                          {STATUS_LABELS[s]}
                        </span>
                      </button>
                      {i < STATUS_FLOW.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 mb-4 rounded transition-colors ${
                          isDone ? "bg-emerald-400" : isCurrent ? "bg-brand-200 dark:bg-brand-500/30" : "bg-gray-100 dark:bg-gray-800"
                        }`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              {canProgress && currentStatusIdx < STATUS_FLOW.length - 1 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                  Click the next step to advance the work order status
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Description */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {order.description || "No description provided."}
              </p>
              {order.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {order.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Customer & Site */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Customer & Site</h3>
              <div className="space-y-3">
                <InfoRow icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" label="Customer" value={order.customer_name} />
                <InfoRow icon="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" label="Phone" value={order.customer_phone} />
                <InfoRow icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" label="Site Address" value={order.site_address} />
                <InfoRow icon="M13 10V3L4 14h7v7l9-11h-7z" label="System" value={order.system_name || "—"} />
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Timeline</h3>
              <div className="space-y-3">
                <InfoRow icon="M12 4v16m8-8H4" label="Created" value={formatDate(order.created_at)} />
                <InfoRow icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" label="Scheduled" value={order.scheduled_date ? `${formatDate(order.scheduled_date)} at ${order.scheduled_time ?? "TBD"}` : "Not scheduled"} />
                {order.started_at && (
                  <InfoRow icon="M13 10V3L4 14h7v7l9-11h-7z" label="Started" value={formatDateTime(order.started_at)} />
                )}
                {order.completed_at && (
                  <InfoRow icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" label="Completed" value={formatDate(order.completed_at)} />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Technician */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Assigned Technician</h3>
              {order.technician_name ? (
                <div className="flex items-center gap-3">
                  <TechAvatar name={order.technician_name} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{order.technician_name}</p>
                    <p className="text-xs text-gray-400">
                      {WO_TECHNICIANS.find((t) => t.id === order.technician_id)?.specialty ?? "Field Technician"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                    <svg className="h-5 w-5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Unassigned</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-2 text-xs text-brand-500 hover:text-brand-600 font-medium"
                  >
                    Assign technician →
                  </button>
                </div>
              )}
            </div>

            {/* Job Details */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Job Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Est. Duration</span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-white">{order.estimated_duration}h</span>
                </div>
                {order.actual_duration != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Actual Duration</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{order.actual_duration}h</span>
                  </div>
                )}
                {order.maintenance_record_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Linked Maintenance</span>
                    <span className="text-xs text-brand-500 font-medium">{order.maintenance_record_id}</span>
                  </div>
                )}
                {order.warranty_claim_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Warranty Claim</span>
                    <span className="text-xs text-brand-500 font-medium">{order.warranty_claim_id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {order.status === "new" && (
                  <button
                    onClick={() => handleStatusUpdate("scheduled")}
                    disabled={updatingStatus}
                    className="w-full flex items-center gap-2 h-9 px-3 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Mark as Scheduled
                  </button>
                )}
                {order.status === "scheduled" && (
                  <button
                    onClick={() => handleStatusUpdate("in_progress")}
                    disabled={updatingStatus}
                    className="w-full flex items-center gap-2 h-9 px-3 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start Work
                  </button>
                )}
                {order.status === "in_progress" && (
                  <button
                    onClick={() => handleStatusUpdate("completed")}
                    disabled={updatingStatus}
                    className="w-full flex items-center gap-2 h-9 px-3 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mark Complete
                  </button>
                )}
                {order.status !== "cancelled" && order.status !== "completed" && (
                  <button
                    onClick={() => handleStatusUpdate("cancelled")}
                    disabled={updatingStatus}
                    className="w-full flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel Order
                  </button>
                )}
                <button
                  onClick={() => { setActiveTab("report"); setShowModal(true); }}
                  className="w-full flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Photos Tab ──────────────────────────────────────────────────────── */}
      {activeTab === "photos" && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">
              Site Photos ({order.photos.length})
            </h3>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload Photos
            </button>
          </div>
          {order.photos.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No photos uploaded</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Upload photos to document the job site</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {order.photos.map((photo) => (
                <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                  <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <svg className="h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2">{photo.caption || "No caption"}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{photo.uploaded_by}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Service Report Tab ─────────────────────────────────────────────── */}
      {activeTab === "report" && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">Service Report</h3>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {order.service_report ? "Edit Report" : "Create Report"}
            </button>
          </div>
          {!order.service_report ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No service report yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Complete the work and generate a service report</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Metrics */}
              {order.service_report.items.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {order.service_report.items.map((item) => (
                    <div key={item.id} className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
              <ReportSection label="Work Performed" value={order.service_report.work_performed} />
              {order.service_report.parts_used && (
                <ReportSection label="Parts & Materials" value={order.service_report.parts_used} />
              )}
              {order.service_report.findings && (
                <ReportSection label="Findings" value={order.service_report.findings} />
              )}
              {order.service_report.recommendations && (
                <ReportSection label="Recommendations" value={order.service_report.recommendations} />
              )}
              {order.service_report.technician_notes && (
                <ReportSection label="Technician Notes" value={order.service_report.technician_notes} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <WorkOrderModal
          order={order}
          onClose={() => setShowModal(false)}
          onUpdated={(updated) => setOrder(updated)}
        />
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-7 w-7 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ReportSection({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-gray-100 dark:border-gray-800 pt-5 first:border-0 first:pt-0">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{value}</p>
    </div>
  );
}
