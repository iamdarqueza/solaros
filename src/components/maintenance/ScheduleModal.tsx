"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  maintenanceService,
  MaintenanceRecord,
  TECHNICIANS,
  DEFAULT_CHECKLIST_TEMPLATE,
  ChecklistItem,
  RecurrenceFrequency,
  MaintenanceServiceType,
  MAINTENANCE_SERVICE_TYPE_LABELS,
} from "@/services/maintenanceService";

interface Props {
  onClose: () => void;
  onCreated: (record: MaintenanceRecord) => void;
  initialDate?: string; // pre-fill scheduled date
}

const CUSTOMERS = [
  { id: "cust-001", name: "Marcus Delgado", sites: ["4821 Sunset Ridge Dr, San Diego, CA 92103", "200 Harbor View Ct, Coronado, CA 92118"] },
  { id: "cust-002", name: "Priya Nair", sites: ["1100 Innovation Way, San Jose, CA 95110"] },
  { id: "cust-003", name: "James Thornton", sites: ["7832 Desert Palm Ave, Scottsdale, AZ 85251"] },
  { id: "cust-004", name: "Amara Osei", sites: ["2200 Commerce Blvd, Las Vegas, NV 89101"] },
  { id: "cust-005", name: "Elena Vasquez", sites: ["3311 Hillcrest Blvd, Portland, OR 97201"] },
  { id: "cust-006", name: "Richard Chen", sites: ["905 Bay Area Tech Park, Fremont, CA 94538"] },
  { id: "cust-007", name: "Fatima Al-Hassan", sites: ["88 Ocean Drive, Miami, FL 33139"] },
  { id: "cust-008", name: "Roberto Morales", sites: ["14200 Valley Ranch Rd, Fresno, CA 93706"] },
];

const SYSTEMS_BY_SITE: Record<string, string[]> = {
  "4821 Sunset Ridge Dr, San Diego, CA 92103": ["Sunset Ridge 9.6 kW PV"],
  "200 Harbor View Ct, Coronado, CA 92118": ["LG NeON 8kW Secondary Array"],
  "1100 Innovation Way, San Jose, CA 95110": ["First Solar 80kW Commercial Array"],
  "7832 Desert Palm Ave, Scottsdale, AZ 85251": ["Canadian Solar 15kW Residential Array"],
  "2200 Commerce Blvd, Las Vegas, NV 89101": ["Trina Solar 60kW + Powerwall Array"],
  "3311 Hillcrest Blvd, Portland, OR 97201": ["LG NeON 12kW Residential Array"],
  "905 Bay Area Tech Park, Fremont, CA 94538": ["SolarEdge 45kW Commercial Array"],
  "88 Ocean Drive, Miami, FL 33139": ["Panasonic EverVolt 18kW Array"],
  "14200 Valley Ranch Rd, Fresno, CA 93706": ["Jinko Solar Tiger 30kW Array"],
};

const FREQ_LABELS: Record<RecurrenceFrequency, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Semi-Annual (every 6 months)",
  annual: "Annual",
};

const SERVICE_TEAMS = [
  "Residential Service Team",
  "Commercial O&M Team",
  "Storage Service Team",
  "Coastal Service Team",
  "Agricultural Service Team",
  "Desert Region Service Team",
];

const frequencyMonths: Record<RecurrenceFrequency, number> = {
  monthly: 1,
  quarterly: 3,
  semi_annual: 6,
  annual: 12,
};

function nextDueDate(startDate: string, frequency: RecurrenceFrequency): string {
  const next = new Date(startDate);
  next.setMonth(next.getMonth() + frequencyMonths[frequency]);
  return next.toISOString().split("T")[0];
}

export default function ScheduleModal({ onClose, onCreated, initialDate }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form fields
  const [customerId, setCustomerId] = useState("");
  const [site, setSite] = useState("");
  const [system, setSystem] = useState("");
  const [serviceType, setServiceType] = useState<MaintenanceServiceType>("panel_cleaning");
  const [scheduledDate, setScheduledDate] = useState(initialDate ?? "");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [technicianId, setTechnicianId] = useState("");
  const [assignedTeam, setAssignedTeam] = useState(SERVICE_TEAMS[0]);
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("quarterly");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    DEFAULT_CHECKLIST_TEMPLATE.map((i) => ({ ...i, done: false }))
  );
  const [newCheckItem, setNewCheckItem] = useState("");

  const customer = CUSTOMERS.find((c) => c.id === customerId);
  const sites = customer?.sites ?? [];
  const systems = site ? SYSTEMS_BY_SITE[site] ?? [] : [];
  const tech = TECHNICIANS.find((t) => t.id === technicianId);

  useEffect(() => {
    setSite("");
    setSystem("");
  }, [customerId]);

  useEffect(() => {
    setSystem("");
  }, [site]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!customerId) e.customer = "Select a customer";
    if (!site) e.site = "Select a site";
    if (!system) e.system = "Select a system";
    if (!scheduledDate) e.date = "Set a scheduled date";
    if (!technicianId) e.technician = "Assign a technician";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep(2);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const techObj = TECHNICIANS.find((t) => t.id === technicianId)!;
      const custObj = CUSTOMERS.find((c) => c.id === customerId)!;
      const recurrencePlan = isRecurring
        ? await maintenanceService.createPlan({
            customer_id: customerId,
            customer_name: custObj.name,
            site_address: site,
            system_name: system,
            system_id: `sys-${Date.now()}`,
            service_type: serviceType,
            frequency,
            start_date: scheduledDate,
            last_completed: undefined,
            next_due: nextDueDate(scheduledDate, frequency),
            technician_id: technicianId,
            technician_name: techObj.name,
            assigned_team: assignedTeam,
            checklist_template: checklist.map(({ id, label }) => ({ id, label })),
            status: "active",
            is_active: true,
            notes: notes || undefined,
          })
        : null;
      const record = await maintenanceService.createRecord({
        customer_id: customerId,
        customer_name: custObj.name,
        site_address: site,
        system_name: system,
        system_id: `sys-${Date.now()}`,
        service_type: serviceType,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        technician_id: technicianId,
        technician_name: techObj.name,
        assigned_team: assignedTeam,
        checklist,
        photos: [],
        notes: notes || undefined,
        completion_notes: undefined,
        completion_report: undefined,
        completed_at: undefined,
        recurrence_plan_id: recurrencePlan?.id,
        work_order_id: undefined,
      });
      onCreated(record);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const toggleCheckItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i))
    );
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklist((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, label: newCheckItem.trim(), done: false },
    ]);
    setNewCheckItem("");
  };

  const removeCheckItem = (id: string) => {
    setChecklist((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Schedule Maintenance Visit
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Step {step} of 2 — {step === 1 ? "Details" : "Checklist"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-3">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      step >= s
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    }`}
                  >
                    {step > s ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s
                    )}
                  </div>
                  <span className={`text-sm font-medium ${step >= s ? "text-gray-800 dark:text-white" : "text-gray-400"}`}>
                    {s === 1 ? "Details" : "Checklist"}
                  </span>
                </div>
                {s < 2 && (
                  <div className={`flex-1 h-px ${step > s ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {step === 1 ? (
            <>
              {/* Customer */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="modal-customer"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className={`w-full h-10 px-3 text-sm rounded-lg border bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${
                      errors.customer ? "border-red-400 dark:border-red-500" : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <option value="">Select customer...</option>
                    {CUSTOMERS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.customer && <p className="mt-1 text-xs text-red-500">{errors.customer}</p>}
                </div>

                {/* Site */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Site <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="modal-site"
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    disabled={!customerId}
                    className={`w-full h-10 px-3 text-sm rounded-lg border bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.site ? "border-red-400 dark:border-red-500" : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <option value="">Select site...</option>
                    {sites.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.site && <p className="mt-1 text-xs text-red-500">{errors.site}</p>}
                </div>

                {/* System */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Solar System <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="modal-system"
                    value={system}
                    onChange={(e) => setSystem(e.target.value)}
                    disabled={!site}
                    className={`w-full h-10 px-3 text-sm rounded-lg border bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.system ? "border-red-400 dark:border-red-500" : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <option value="">Select system...</option>
                    {systems.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.system && <p className="mt-1 text-xs text-red-500">{errors.system}</p>}
                </div>
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Service Type
                </label>
                <select
                  id="modal-service-type"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as MaintenanceServiceType)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                >
                  {(Object.entries(MAINTENANCE_SERVICE_TYPE_LABELS) as [MaintenanceServiceType, string][]).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date, time & Technician */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Scheduled Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="modal-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className={`w-full h-10 px-3 text-sm rounded-lg border bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${
                      errors.date ? "border-red-400 dark:border-red-500" : "border-gray-200 dark:border-gray-700"
                    }`}
                  />
                  {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Time
                  </label>
                  <input
                    id="modal-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Technician <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="modal-technician"
                    value={technicianId}
                    onChange={(e) => setTechnicianId(e.target.value)}
                    className={`w-full h-10 px-3 text-sm rounded-lg border bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${
                      errors.technician ? "border-red-400 dark:border-red-500" : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <option value="">Assign technician...</option>
                    {TECHNICIANS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {errors.technician && <p className="mt-1 text-xs text-red-500">{errors.technician}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Assigned Team
                  </label>
                  <select
                    id="modal-team"
                    value={assignedTeam}
                    onChange={(e) => setAssignedTeam(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  >
                    {SERVICE_TEAMS.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Notes
                </label>
                <textarea
                  id="modal-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions for the technician..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
                />
              </div>

              {/* Recurring toggle */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      Make this a recurring visit
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Create a maintenance plan rule and link this visit to it
                    </p>
                  </div>
                  <button
                    id="modal-recurring-toggle"
                    onClick={() => setIsRecurring(!isRecurring)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isRecurring ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        isRecurring ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                {isRecurring && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {(Object.entries(FREQ_LABELS) as [RecurrenceFrequency, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setFrequency(key)}
                        className={`rounded-lg border py-2 px-3 text-sm font-medium transition-colors text-left ${
                          frequency === key
                            ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Summary pill */}
              {tech && customer && site && (
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
                    <svg className="h-4 w-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                      {system}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {customer.name} · {scheduledDate} · {tech.name}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Maintenance Checklist ({checklist.filter((i) => i.done).length}/{checklist.length})
                  </label>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Pre-loaded with standard template
                  </span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 dark:border-gray-800 p-2.5 group"
                    >
                      <button
                        onClick={() => toggleCheckItem(item.id)}
                        className={`flex-shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                          item.done
                            ? "border-brand-500 bg-brand-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {item.done && (
                          <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          item.done
                            ? "line-through text-gray-400 dark:text-gray-500"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {item.label}
                      </span>
                      <button
                        onClick={() => removeCheckItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                {/* Add item */}
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCheckItem()}
                    placeholder="Add custom checklist item..."
                    className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                  <button
                    onClick={addCheckItem}
                    disabled={!newCheckItem.trim()}
                    className="h-9 px-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <button
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="h-10 px-4 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {step === 1 ? "Cancel" : "← Back"}
          </button>
          {step === 1 ? (
            <button
              id="modal-next-btn"
              onClick={handleNext}
              className="h-10 px-6 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              Next: Checklist →
            </button>
          ) : (
            <button
              id="modal-save-btn"
              onClick={handleSubmit}
              disabled={saving}
              className="h-10 px-6 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {saving && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {saving ? "Saving..." : "Schedule Visit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
