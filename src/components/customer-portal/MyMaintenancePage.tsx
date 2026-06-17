"use client";
import React, { useEffect, useState } from "react";
import { useCustomerPortal } from "@/app/(customer)/layout";
import {
  customerPortalService,
  type MaintenanceRecord,
  type MaintenanceRequestForm,
} from "@/services/customerPortalService";

type Tab = "history" | "request";

const WORK_TYPE_ICONS: Record<string, string> = {
  "Annual Inspection": "🔍",
  "Performance Diagnostic": "📊",
  "Panel Cleaning": "🧹",
  "Emergency Repair": "🚨",
};

export default function MyMaintenancePage() {
  const { customer } = useCustomerPortal();
  const [tab, setTab] = useState<Tab>("history");
  const [history, setHistory] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<MaintenanceRequestForm>({
    description: "",
    preferredDate: "",
    urgency: "routine",
    contactPhone: "",
  });

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    customerPortalService.getMyMaintenanceHistory(customer.id).then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, [customer?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
    setSubmitting(true);
    const result = await customerPortalService.submitMaintenanceRequest(customer.id, form);
    setSuccess(result.referenceId);
    setSubmitting(false);
    setForm({ description: "", preferredDate: "", urgency: "routine", contactPhone: "" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
        <p className="text-sm text-gray-500 mt-1">Schedule a service visit or view your service history.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
        {[
          { key: "history" as Tab, label: "Service History" },
          { key: "request" as Tab, label: "Request a Visit" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* History tab */}
      {tab === "history" && (
        <div>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-gray-200" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-base font-semibold text-gray-700">No service history yet</p>
              <p className="text-sm text-gray-400 mt-1">Your past maintenance visits will appear here.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 hidden sm:block" />
              <div className="space-y-4">
                {history.map((record) => (
                  <div key={record.id} className="sm:pl-14 relative">
                    {/* Timeline dot */}
                    <div className="hidden sm:flex absolute left-3 top-4 h-4 w-4 items-center justify-center rounded-full border-2 border-brand-500 bg-white z-10">
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{WORK_TYPE_ICONS[record.work_type] ?? "🔧"}</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{record.work_type}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(record.date).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                              {" · "}by {record.technician_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {record.cost_usd === 0 ? (
                            <span className="inline-flex rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                              Warranty (No Charge)
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-gray-800">${record.cost_usd}</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 text-sm">
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">What Was Done</p>
                          <p className="text-gray-700 mt-0.5">{record.description}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Outcome</p>
                          <p className="text-gray-700 mt-0.5">{record.outcome}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                        <span>⏱ {record.duration_hours}h</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Request form */}
      {tab === "request" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {success ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-lg font-bold text-gray-900">Request Received!</p>
              <p className="text-sm text-gray-500 mt-1">
                Your reference number is{" "}
                <span className="font-mono font-semibold text-brand-600">{success}</span>.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Our scheduling team will contact you within 1–2 business days to confirm your appointment.
              </p>
              <button
                onClick={() => { setSuccess(null); setTab("history"); }}
                className="mt-5 rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
              >
                Back to Service History
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm font-semibold text-blue-800">What to Expect</p>
                <p className="text-xs text-blue-700 mt-1">
                  After submitting, our scheduling team will call or email you within 1–2 business days to confirm your appointment. Routine visits typically take 1–3 hours.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="maint-description">
                  Describe what you need
                </label>
                <textarea
                  id="maint-description"
                  required
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="E.g. My app shows reduced production, or I'd like my annual inspection..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="preferred-date">
                  Preferred Date (optional)
                </label>
                <input
                  id="preferred-date"
                  type="date"
                  value={form.preferredDate}
                  onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How urgent is this?</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "routine" as const, label: "Routine", desc: "No rush", icon: "🗓️" },
                    { value: "soon" as const, label: "Soon", desc: "Within 2 weeks", icon: "⏰" },
                    { value: "urgent" as const, label: "Urgent", desc: "ASAP", icon: "🚨" },
                  ].map((u) => (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => setForm({ ...form, urgency: u.value })}
                      className={`rounded-xl border p-3 text-center transition-colors ${
                        form.urgency === u.value
                          ? "border-brand-500 bg-brand-50"
                          : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="text-xl mb-1">{u.icon}</div>
                      <p className="text-xs font-semibold text-gray-900">{u.label}</p>
                      <p className="text-xs text-gray-400">{u.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="contact-phone">
                  Best phone number to reach you
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder={customer?.phone ?? "(555) 000-0000"}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
              >
                {submitting ? "Submitting..." : "Request Service Visit"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
