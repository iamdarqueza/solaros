"use client";
import React, { useEffect, useState } from "react";
import { useCustomerPortal } from "@/app/(customer)/layout";
import { customerPortalService, type WorkOrder } from "@/services/customerPortalService";

type FilterTab = "active" | "past";

const STATUS_STEPS = ["new", "scheduled", "in_progress", "completed"] as const;

const STATUS_LABELS: Record<WorkOrder["status"], string> = {
  new: "Request Received",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const TYPE_LABELS: Record<WorkOrder["type"], string> = {
  installation: "Installation",
  repair: "Repair",
  inspection: "Inspection",
  cleaning: "Cleaning",
  warranty: "Warranty Work",
  emergency: "Emergency Repair",
};

const TYPE_ICONS: Record<WorkOrder["type"], string> = {
  installation: "🏗️",
  repair: "🔧",
  inspection: "🔍",
  cleaning: "🧹",
  warranty: "🛡️",
  emergency: "🚨",
};

const PRIORITY_MAP: Record<WorkOrder["priority"], { label: string; color: string }> = {
  low: { label: "Low", color: "text-gray-500" },
  medium: { label: "Normal", color: "text-blue-600" },
  high: { label: "High", color: "text-amber-600" },
  urgent: { label: "Urgent", color: "text-red-600" },
};

function formatScheduledDate(date: string | null): string {
  if (!date) return "Date to be confirmed";
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function StatusTracker({ status }: { status: WorkOrder["status"] }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
          <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="text-sm font-medium text-red-600">Cancelled</span>
      </div>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number]);

  return (
    <div className="flex items-center gap-0 mt-3">
      {STATUS_STEPS.map((step, idx) => {
        const isCompleted = idx <= currentStep;
        const isCurrent = idx === currentStep;
        const isLast = idx === STATUS_STEPS.length - 1;

        return (
          <React.Fragment key={step}>
            {/* Step dot */}
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                isCompleted
                  ? "border-brand-500 bg-brand-500"
                  : "border-gray-200 bg-white"
              }`}>
                {isCompleted && (
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className={`text-[10px] mt-1 whitespace-nowrap ${
                isCurrent ? "font-semibold text-brand-600" : isCompleted ? "font-medium text-gray-700" : "text-gray-400"
              }`}>
                {STATUS_LABELS[step]}
              </p>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className={`h-0.5 flex-1 mx-1 mb-5 rounded-full transition-colors ${
                idx < currentStep ? "bg-brand-500" : "bg-gray-200"
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function WorkOrderCard({ order }: { order: WorkOrder }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = order.status !== "completed" && order.status !== "cancelled";
  const priority = PRIORITY_MAP[order.priority];

  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${
      isActive ? "border-brand-200" : "border-gray-200"
    }`}>
      {/* Header strip */}
      <div className={`h-1 w-full ${
        order.status === "in_progress" ? "bg-brand-500" :
        order.status === "scheduled" ? "bg-blue-400" :
        order.status === "new" ? "bg-amber-400" :
        order.status === "completed" ? "bg-emerald-500" :
        "bg-gray-300"
      }`} />

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{TYPE_ICONS[order.type]}</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{order.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400 font-mono">{order.order_number}</span>
                <span className="text-gray-200">·</span>
                <span className="text-xs text-gray-500">{TYPE_LABELS[order.type]}</span>
                <span className="text-gray-200">·</span>
                <span className={`text-xs font-medium ${priority.color}`}>{priority.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status tracker — active only */}
        {isActive && <StatusTracker status={order.status} />}

        {/* Key info */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
          {order.scheduled_date && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatScheduledDate(order.scheduled_date)}{order.scheduled_time ? ` at ${order.scheduled_time}` : ""}</span>
            </div>
          )}
          {order.technician_name && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Technician: <span className="font-medium text-gray-900">{order.technician_name}</span></span>
            </div>
          )}
          {order.completed_at && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Completed {new Date(order.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          )}
        </div>

        {/* Expand/collapse for service report */}
        {order.service_report && (
          <div className="mt-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {expanded ? "Hide" : "View"} Service Report
            </button>

            {expanded && (
              <div className="mt-3 space-y-3 rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm">
                {[
                  { label: "Work Performed", value: order.service_report.work_performed },
                  { label: "Findings", value: order.service_report.findings },
                  { label: "Parts Used", value: order.service_report.parts_used },
                  { label: "Recommendations", value: order.service_report.recommendations },
                ].map((row) => row.value && (
                  <div key={row.label}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{row.label}</p>
                    <p className="text-gray-700">{row.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyWorkOrdersPage() {
  const { customer } = useCustomerPortal();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>("active");

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    customerPortalService.getMyWorkOrders(customer.id).then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, [customer?.id]);

  const activeOrders = orders.filter(
    (o) => o.status === "new" || o.status === "scheduled" || o.status === "in_progress"
  );
  const pastOrders = orders.filter(
    (o) => o.status === "completed" || o.status === "cancelled"
  );

  const displayed = filterTab === "active" ? activeOrders : pastOrders;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Track scheduled visits and view past service records.</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
        {[
          { key: "active" as FilterTab, label: `Active (${activeOrders.length})` },
          { key: "past" as FilterTab, label: `Past (${pastOrders.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilterTab(t.key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              filterTab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(2)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-gray-200" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">{filterTab === "active" ? "📋" : "📂"}</div>
          <p className="text-base font-semibold text-gray-700">
            {filterTab === "active" ? "No active work orders" : "No past work orders"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {filterTab === "active"
              ? "You have no scheduled or in-progress work orders right now."
              : "Completed work orders will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((order) => (
            <WorkOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
