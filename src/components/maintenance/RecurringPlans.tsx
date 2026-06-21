"use client";
import React, { useEffect, useState } from "react";
import {
  maintenanceService,
  RecurringPlan,
} from "@/services/maintenanceService";
import {
  getFrequencyBadge,
  getServiceTypeBadge,
  formatDate,
  getDaysUntil,
  TechnicianAvatar,
} from "./MaintenanceUIHelpers";

export default function RecurringPlans() {
  const [plans, setPlans] = useState<RecurringPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "overdue">("all");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  useEffect(() => {
    maintenanceService.getAllPlans().then((p) => {
      setPlans(p);
      setLoading(false);
    });
  }, []);

  const filtered = plans.filter((p) => {
    if (filter === "active") return p.is_active;
    if (filter === "paused") return !p.is_active;
    if (filter === "overdue") return getDaysUntil(p.next_due) < 0;
    return true;
  });

  const counts = {
    all: plans.length,
    active: plans.filter((p) => p.is_active).length,
    paused: plans.filter((p) => !p.is_active).length,
    overdue: plans.filter((p) => getDaysUntil(p.next_due) < 0).length,
  };

  const handleGenerate = async (plan: RecurringPlan) => {
    setGeneratingId(plan.id);
    try {
      await maintenanceService.createRecord({
        customer_id: plan.customer_id,
        customer_name: plan.customer_name,
        site_address: plan.site_address,
        system_name: plan.system_name,
        system_id: plan.system_id,
        service_type: plan.service_type,
        scheduled_date: plan.next_due,
        scheduled_time: "09:00",
        technician_id: plan.technician_id,
        technician_name: plan.technician_name,
        assigned_team: plan.assigned_team,
        checklist: plan.checklist_template.map((i) => ({ ...i, done: false })),
        photos: [],
        notes: `Generated from ${plan.frequency.replace("_", " ")} maintenance plan.`,
        completion_notes: undefined,
        completion_report: undefined,
        completed_at: undefined,
        recurrence_plan_id: plan.id,
        work_order_id: undefined,
      });
      setSuccessId(plan.id);
      setTimeout(() => setSuccessId(null), 3000);
    } finally {
      setGeneratingId(null);
    }
  };

  const getDueDateStyle = (daysUntil: number) => {
    if (daysUntil < 0) return "text-red-600 dark:text-red-400 font-semibold";
    if (daysUntil <= 14) return "text-amber-600 dark:text-amber-400 font-semibold";
    if (daysUntil <= 30) return "text-blue-600 dark:text-blue-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getDueDateLabel = (daysUntil: number, dateStr: string) => {
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil === 0) return "Due today";
    if (daysUntil === 1) return "Due tomorrow";
    if (daysUntil <= 30) return `Due in ${daysUntil} days`;
    return formatDate(dateStr);
  };

  return (
    <div className="space-y-5">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Plans", value: counts.all, color: "text-gray-800 dark:text-white", bg: "bg-gray-50 dark:bg-gray-800/50" },
          { label: "Active", value: counts.active, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Paused", value: counts.paused, color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-700/30" },
          { label: "Overdue", value: counts.overdue, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl ${stat.bg} p-4 border border-gray-100 dark:border-gray-800`}
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Overdue Alert */}
      {counts.overdue > 0 && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3.5">
          <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {counts.overdue} recurring plan{counts.overdue !== 1 ? "s are" : " is"} past due
            </p>
            <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-0.5">
              Generate visits now to get back on schedule and avoid missed maintenance.
            </p>
          </div>
          <button
            onClick={() => setFilter("overdue")}
            className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0"
          >
            View →
          </button>
        </div>
      )}

      {/* Plans Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recurring Plans</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {loading ? "Loading..." : `${filtered.length} of ${plans.length} plans`}
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(["all", "active", "paused", "overdue"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                  filter === f
                    ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {f} {counts[f] > 0 && `(${counts[f]})`}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {["Customer / System", "Service Type", "Frequency", "Start Date", "Next Due", "Team / Technician", "Status", ""].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 first:pl-5 last:pr-5"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-4 first:pl-5 last:pr-5">
                          <div className="h-4 rounded bg-gray-100 dark:bg-gray-800" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No plans match this filter</p>
                    </td>
                  </tr>
                )
                : filtered.map((plan) => {
                    const daysUntil = getDaysUntil(plan.next_due);
                    return (
                      <tr
                        key={plan.id}
                        className={`group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors ${
                          !plan.is_active ? "opacity-60" : ""
                        }`}
                      >
                        {/* Customer / System */}
                        <td className="px-4 py-3.5 pl-5">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">
                            {plan.customer_name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 max-w-[160px] truncate">
                            {plan.system_name}
                          </p>
                        </td>

                        {/* Service Type */}
                        <td className="px-4 py-3.5">
                          {getServiceTypeBadge(plan.service_type)}
                          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[160px] truncate mt-1">
                            {plan.site_address}
                          </p>
                        </td>

                        {/* Frequency */}
                        <td className="px-4 py-3.5">{getFrequencyBadge(plan.frequency)}</td>

                        {/* Start Date */}
                        <td className="px-4 py-3.5">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(plan.start_date)}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            Last: {plan.last_completed ? formatDate(plan.last_completed) : "Never"}
                          </p>
                        </td>

                        {/* Next Due */}
                        <td className="px-4 py-3.5">
                          <p className={`text-sm ${getDueDateStyle(daysUntil)}`}>
                            {getDueDateLabel(daysUntil, plan.next_due)}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {formatDate(plan.next_due)}
                          </p>
                        </td>

                        {/* Team / Technician */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <TechnicianAvatar name={plan.technician_name} />
                            <div>
                              <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {plan.technician_name}
                              </span>
                              <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{plan.assigned_team}</p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          {plan.status === "active" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-700/50 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                              Paused
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 pr-5">
                          <div className="flex items-center gap-2 justify-end">
                            {successId === plan.id ? (
                              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                Created!
                              </span>
                            ) : (
                              <button
                                id={`gen-visit-${plan.id}`}
                                disabled={!plan.is_active || generatingId === plan.id}
                                onClick={() => handleGenerate(plan)}
                                className="h-8 px-3 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                              >
                                {generatingId === plan.id ? (
                                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : (
                                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                )}
                                {generatingId === plan.id ? "Creating..." : "Generate Visit"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Showing {filtered.length} of {plans.length} plans
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Generate a visit to create a scheduled maintenance visit from a plan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
