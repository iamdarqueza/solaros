"use client";
import React, { useState } from "react";
import {
  workOrderService,
  WorkOrder,
  WorkOrderStatus,
  WorkOrderPriority,
  WorkOrderType,
  WorkOrderSource,
  WO_TECHNICIANS,
  WORK_ORDER_SOURCE_LABELS,
} from "@/services/workOrderService";

interface WorkOrderModalProps {
  order: WorkOrder | null; // null = create mode
  onClose: () => void;
  onCreated?: (order: WorkOrder) => void;
  onUpdated?: (order: WorkOrder) => void;
}

const TYPE_OPTIONS: { value: WorkOrderType; label: string }[] = [
  { value: "cleaning", label: "Cleaning" },
  { value: "inspection", label: "Inspection" },
  { value: "repair", label: "Repair" },
  { value: "replacement", label: "Replacement" },
  { value: "warranty_service", label: "Covered Component Service" },
  { value: "maintenance", label: "Maintenance" },
  { value: "installation_follow_up", label: "Installation Follow-up" },
  { value: "emergency_visit", label: "Emergency Visit" },
];

const PRIORITY_OPTIONS: { value: WorkOrderPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-gray-500" },
  { value: "medium", label: "Medium", color: "text-blue-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "urgent", label: "⚡ Urgent", color: "text-red-600" },
];

const STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "assigned", label: "Assigned" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "requires_follow_up", label: "Requires Follow-up" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const SOURCE_OPTIONS: { value: WorkOrderSource; label: string }[] = Object.entries(WORK_ORDER_SOURCE_LABELS).map(
  ([value, label]) => ({ value: value as WorkOrderSource, label })
);

// Simple mock customers for the dropdown
const MOCK_CUSTOMERS = [
  { id: "cust-001", name: "Marcus Delgado", phone: "+1 (619) 555-0182" },
  { id: "cust-002", name: "Priya Nair", phone: "+1 (408) 555-0219" },
  { id: "cust-003", name: "James Thornton", phone: "+1 (480) 555-0561" },
  { id: "cust-004", name: "Amara Osei", phone: "+1 (702) 555-0341" },
  { id: "cust-005", name: "Elena Vasquez", phone: "+1 (503) 555-0447" },
  { id: "cust-006", name: "Richard Chen", phone: "+1 (510) 555-0623" },
  { id: "cust-007", name: "Fatima Al-Hassan", phone: "+1 (305) 555-0882" },
  { id: "cust-008", name: "Roberto Morales", phone: "+1 (559) 555-0314" },
  { id: "cust-009", name: "Kenji Watanabe", phone: "+1 (408) 555-0772" },
];

export default function WorkOrderModal({
  order,
  onClose,
  onCreated,
  onUpdated,
}: WorkOrderModalProps) {
  const isEdit = !!order;

  // ── Form State ────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [title, setTitle] = useState(order?.title ?? "");
  const [description, setDescription] = useState(order?.description ?? "");
  const [type, setType] = useState<WorkOrderType>(order?.type ?? "repair");
  const [priority, setPriority] = useState<WorkOrderPriority>(order?.priority ?? "medium");
  const [status, setStatus] = useState<WorkOrderStatus>(order?.status ?? "new");
  const [source, setSource] = useState<WorkOrderSource>(order?.source ?? "manual_job");
  const [relatedTicketId, setRelatedTicketId] = useState(order?.related_ticket_id ?? "");
  const [relatedWarrantyClaimId, setRelatedWarrantyClaimId] = useState(order?.related_warranty_claim_id ?? "");
  const [relatedMaintenanceVisitId, setRelatedMaintenanceVisitId] = useState(order?.related_maintenance_visit_id ?? "");
  const [customerId, setCustomerId] = useState(order?.customer_id ?? "");
  const [siteAddress, setSiteAddress] = useState(order?.site_address ?? "");
  const [systemName, setSystemName] = useState(order?.system_name ?? "");
  const [technicianId, setTechnicianId] = useState(order?.technician_id ?? "");
  const [scheduledDate, setScheduledDate] = useState(order?.scheduled_date ?? "");
  const [scheduledTime, setScheduledTime] = useState(order?.scheduled_time ?? "");
  const [estimatedDuration, setEstimatedDuration] = useState(String(order?.estimated_duration ?? "2"));
  const [partsNeeded, setPartsNeeded] = useState(order?.parts_needed.join("\n") ?? "");
  const [technicianNotes, setTechnicianNotes] = useState(order?.technician_notes ?? "");

  // Photos (simulated — in real app would upload to storage)
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoCaptions, setPhotoCaptions] = useState<string[]>([]);
  const [existingPhotos] = useState(order?.photos ?? []);

  // Service Report
  const [reportWorkPerformed, setReportWorkPerformed] = useState(order?.service_report?.work_performed ?? "");
  const [reportPartsUsed, setReportPartsUsed] = useState(order?.service_report?.parts_used ?? "");
  const [reportFindings, setReportFindings] = useState(order?.service_report?.findings ?? "");
  const [reportRecommendations, setReportRecommendations] = useState(order?.service_report?.recommendations ?? "");
  const [reportNotes, setReportNotes] = useState(order?.service_report?.technician_notes ?? "");
  const [customerSignature, setCustomerSignature] = useState(order?.customer_signature ?? order?.service_report?.customer_signature ?? "");

  const selectedCustomer = MOCK_CUSTOMERS.find((c) => c.id === customerId);

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    // Auto-fill address for demo
    const customer = MOCK_CUSTOMERS.find((c) => c.id === id);
    if (customer && !siteAddress) {
      const addresses: Record<string, string> = {
        "cust-001": "4821 Sunset Ridge Dr, San Diego, CA 92103",
        "cust-002": "1100 Innovation Way, San Jose, CA 95110",
        "cust-003": "7832 Desert Palm Ave, Scottsdale, AZ 85251",
        "cust-004": "2200 Commerce Blvd, Las Vegas, NV 89101",
        "cust-005": "3311 Hillcrest Blvd, Portland, OR 97201",
        "cust-006": "905 Bay Area Tech Park, Fremont, CA 94538",
        "cust-007": "88 Ocean Drive, Miami, FL 33139",
        "cust-008": "14200 Valley Ranch Rd, Fresno, CA 93706",
        "cust-009": "451 Cherry Blossom Lane, Cupertino, CA 95014",
      };
      setSiteAddress(addresses[id] ?? "");
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required";
    if (!customerId) errs.customerId = "Customer is required";
    if (!siteAddress.trim()) errs.siteAddress = "Site address is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPhotoFiles((prev) => [...prev, ...files]);
    setPhotoCaptions((prev) => [...prev, ...files.map(() => "")]);
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      const tech = WO_TECHNICIANS.find((t) => t.id === technicianId);
      const customer = MOCK_CUSTOMERS.find((c) => c.id === customerId);

      const hasReport = reportWorkPerformed.trim() || reportFindings.trim();
      const normalizedParts = partsNeeded
        .split(/\n|,/)
        .map((part) => part.trim())
        .filter(Boolean);
      const serviceReport = hasReport
        ? {
            work_performed: reportWorkPerformed,
            parts_used: reportPartsUsed,
            findings: reportFindings,
            recommendations: reportRecommendations,
            customer_signature: customerSignature || undefined,
            technician_notes: reportNotes,
            items: [],
          }
        : null;

      if (isEdit && order) {
        const updated = await workOrderService.updateOrder(order.id, {
          title,
          description,
          type,
          priority,
          status,
          source,
          source_label: source === "support_ticket" && relatedTicketId
            ? `${WORK_ORDER_SOURCE_LABELS[source]} ${relatedTicketId}`
            : source === "warranty_claim" && relatedWarrantyClaimId
            ? `${WORK_ORDER_SOURCE_LABELS[source]} ${relatedWarrantyClaimId}`
            : source === "maintenance_schedule" && relatedMaintenanceVisitId
            ? `${WORK_ORDER_SOURCE_LABELS[source]} ${relatedMaintenanceVisitId}`
            : WORK_ORDER_SOURCE_LABELS[source],
          related_ticket_id: relatedTicketId || null,
          related_warranty_claim_id: relatedWarrantyClaimId || null,
          related_maintenance_visit_id: relatedMaintenanceVisitId || null,
          customer_id: customerId,
          customer_name: customer?.name ?? order.customer_name,
          customer_phone: customer?.phone ?? order.customer_phone,
          site_address: siteAddress,
          system_name: systemName,
          technician_id: technicianId || null,
          technician_name: tech?.name ?? null,
          scheduled_date: scheduledDate || null,
          scheduled_time: scheduledTime || null,
          estimated_duration: Number(estimatedDuration) || 2,
          parts_needed: normalizedParts,
          technician_notes: technicianNotes,
          customer_signature: customerSignature || null,
          service_report: serviceReport,
          completion_report: serviceReport,
        });
        onUpdated?.(updated);
      } else {
        const created = await workOrderService.createOrder({
          title,
          description,
          type,
          priority,
          status,
          source,
          source_label: source === "support_ticket" && relatedTicketId
            ? `${WORK_ORDER_SOURCE_LABELS[source]} ${relatedTicketId}`
            : source === "warranty_claim" && relatedWarrantyClaimId
            ? `${WORK_ORDER_SOURCE_LABELS[source]} ${relatedWarrantyClaimId}`
            : source === "maintenance_schedule" && relatedMaintenanceVisitId
            ? `${WORK_ORDER_SOURCE_LABELS[source]} ${relatedMaintenanceVisitId}`
            : WORK_ORDER_SOURCE_LABELS[source],
          related_ticket_id: relatedTicketId || null,
          related_warranty_claim_id: relatedWarrantyClaimId || null,
          related_maintenance_visit_id: relatedMaintenanceVisitId || null,
          customer_id: customerId,
          customer_name: customer?.name ?? "",
          customer_phone: customer?.phone ?? "",
          site_address: siteAddress,
          system_name: systemName,
          system_id: `sys-${Date.now()}`,
          technician_id: technicianId || null,
          technician_name: tech?.name ?? null,
          scheduled_date: scheduledDate || null,
          scheduled_time: scheduledTime || null,
          started_at: null,
          completed_at: null,
          estimated_duration: Number(estimatedDuration) || 2,
          actual_duration: null,
          checklist: [],
          parts_needed: normalizedParts,
          photos: [],
          photos_before: [],
          photos_after: [],
          technician_notes: technicianNotes,
          customer_signature: customerSignature || null,
          service_report: serviceReport,
          completion_report: serviceReport,
          maintenance_record_id: null,
          warranty_claim_id: null,
          tags: [],
        });
        onCreated?.(created);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const STEPS = [
    { label: "Details", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { label: "Assign", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { label: "Photos", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { label: "Report", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-gray-dark border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {isEdit ? `Edit ${order.order_number}` : "New Work Order"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {isEdit ? "Update work order details" : "Create a new service work order"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step Tabs */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === i
                  ? "bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
              </svg>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Step 0: Details ─────────────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="wo-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of work to be done"
                  className={`w-full h-10 px-3 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition ${
                    errors.title ? "border-red-300 dark:border-red-500" : "border-gray-200 dark:border-gray-700"
                  }`}
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
              </div>

              {/* Type + Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                  <select
                    id="wo-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as WorkOrderType)}
                    className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  >
                    {TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
                  <select
                    id="wo-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
                    className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  >
                    {PRIORITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Source */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Work Order Source
                </label>
                <select
                  id="wo-source"
                  value={source}
                  onChange={(e) => setSource(e.target.value as WorkOrderSource)}
                  className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                >
                  {SOURCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    value={relatedTicketId}
                    onChange={(e) => setRelatedTicketId(e.target.value)}
                    placeholder="Related ticket ID"
                    className="h-10 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                  <input
                    type="text"
                    value={relatedMaintenanceVisitId}
                    onChange={(e) => setRelatedMaintenanceVisitId(e.target.value)}
                    placeholder="Maintenance visit ID"
                    className="h-10 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                  <input
                    type="text"
                    value={relatedWarrantyClaimId}
                    onChange={(e) => setRelatedWarrantyClaimId(e.target.value)}
                    placeholder="Warranty claim ID"
                    className="h-10 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
              </div>

              {/* Status (edit only) */}
              {isEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setStatus(s.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                          status === s.value
                            ? "bg-brand-500 text-white border-brand-500"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea
                  id="wo-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the work to be performed..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition resize-none"
                />
              </div>

              {/* Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  id="wo-customer"
                  value={customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className={`w-full h-10 px-3 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${
                    errors.customerId ? "border-red-300 dark:border-red-500" : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <option value="">Select a customer...</option>
                  {MOCK_CUSTOMERS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.customerId && <p className="mt-1 text-xs text-red-500">{errors.customerId}</p>}
                {selectedCustomer && (
                  <p className="mt-1 text-xs text-gray-400">{selectedCustomer.phone}</p>
                )}
              </div>

              {/* Site Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Site Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="wo-site"
                  type="text"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  placeholder="123 Main St, City, State, ZIP"
                  className={`w-full h-10 px-3 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${
                    errors.siteAddress ? "border-red-300 dark:border-red-500" : "border-gray-200 dark:border-gray-700"
                  }`}
                />
                {errors.siteAddress && <p className="mt-1 text-xs text-red-500">{errors.siteAddress}</p>}
              </div>

              {/* System */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">System Name</label>
                <input
                  id="wo-system"
                  type="text"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  placeholder="e.g. Sunset Ridge 9.6 kW PV"
                  className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>

              {/* Estimated Duration */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[9rem_1fr]">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Estimated Hours
                  </label>
                  <input
                    id="wo-duration"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Parts Needed
                  </label>
                  <input
                    id="wo-parts"
                    type="text"
                    value={partsNeeded}
                    onChange={(e) => setPartsNeeded(e.target.value)}
                    placeholder="Replacement inverter, sealant, MC4 connectors"
                    className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                  <p className="mt-1 text-xs text-gray-400">Separate parts with commas or new lines.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Assign Technician ────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Technician</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setTechnicianId("")}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                      technicianId === ""
                        ? "border-brand-300 dark:border-brand-500/50 bg-brand-50 dark:bg-brand-500/10"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unassigned</p>
                      <p className="text-xs text-gray-400">Assign later</p>
                    </div>
                    {technicianId === "" && (
                      <svg className="h-5 w-5 text-brand-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  {WO_TECHNICIANS.map((tech) => {
                    const colors = ["bg-violet-500", "bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
                    const colorIdx = tech.name.charCodeAt(0) % colors.length;
                    return (
                      <button
                        key={tech.id}
                        onClick={() => setTechnicianId(tech.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                          technicianId === tech.id
                            ? "border-brand-300 dark:border-brand-500/50 bg-brand-50 dark:bg-brand-500/10"
                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                        }`}
                      >
                        <span className={`h-9 w-9 ${colors[colorIdx]} rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0`}>
                          {tech.avatar}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">{tech.name}</p>
                          <p className="text-xs text-gray-400">{tech.specialty}</p>
                        </div>
                        {technicianId === tech.id && (
                          <svg className="h-5 w-5 text-brand-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schedule */}
              {technicianId && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Schedule Date & Time</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Date</label>
                      <input
                        id="wo-sched-date"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Time</label>
                      <input
                        id="wo-sched-time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Technician Notes
                </label>
                <textarea
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="Access notes, safety notes, customer preferences, or office instructions..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Photos ───────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Upload Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Upload Site Photos</label>
                <label
                  htmlFor="wo-photo-upload"
                  className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-brand-300 dark:hover:border-brand-500/50 hover:bg-brand-50/30 dark:hover:bg-brand-500/5 transition-colors"
                >
                  <svg className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Click to upload photos</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG up to 10MB each</span>
                  <input
                    id="wo-photo-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>

              {/* Existing Photos */}
              {existingPhotos.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Existing Photos ({existingPhotos.length})</p>
                  <div className="grid grid-cols-2 gap-3">
                    {existingPhotos.map((photo) => (
                      <div key={photo.id} className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                          <svg className="h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{photo.caption || "No caption"}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">By {photo.uploaded_by}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Photos to Upload */}
              {photoFiles.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Photos ({photoFiles.length})</p>
                  <div className="space-y-2">
                    {photoFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                        <div className="h-12 w-12 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                          <svg className="h-6 w-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
                          <input
                            type="text"
                            placeholder="Add a caption..."
                            value={photoCaptions[i] ?? ""}
                            onChange={(e) => {
                              const updated = [...photoCaptions];
                              updated[i] = e.target.value;
                              setPhotoCaptions(updated);
                            }}
                            className="mt-1 w-full h-7 px-2 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                        </div>
                        <button
                          onClick={() => {
                            setPhotoFiles((prev) => prev.filter((_, idx) => idx !== i));
                            setPhotoCaptions((prev) => prev.filter((_, idx) => idx !== i));
                          }}
                          className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {existingPhotos.length === 0 && photoFiles.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No photos yet. Upload photos to document the job site.</p>
              )}
            </div>
          )}

          {/* ── Step 3: Service Report ───────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-4 py-3">
                <svg className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Complete the service report after work is done. Submitting a report will automatically mark the order as Completed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Work Performed</label>
                <textarea
                  id="wo-report-work"
                  value={reportWorkPerformed}
                  onChange={(e) => setReportWorkPerformed(e.target.value)}
                  placeholder="Describe all work that was performed..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Parts & Materials Used</label>
                <textarea
                  id="wo-report-parts"
                  value={reportPartsUsed}
                  onChange={(e) => setReportPartsUsed(e.target.value)}
                  placeholder="List any parts or materials used..."
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Findings</label>
                <textarea
                  id="wo-report-findings"
                  value={reportFindings}
                  onChange={(e) => setReportFindings(e.target.value)}
                  placeholder="Document any findings or issues discovered..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Recommendations</label>
                <textarea
                  id="wo-report-recommendations"
                  value={reportRecommendations}
                  onChange={(e) => setReportRecommendations(e.target.value)}
                  placeholder="Any follow-up actions or recommendations..."
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Technician Notes</label>
                <textarea
                  id="wo-report-notes"
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Internal notes for the team..."
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Customer Signature</label>
                <input
                  id="wo-customer-signature"
                  type="text"
                  value={customerSignature}
                  onChange={(e) => setCustomerSignature(e.target.value)}
                  placeholder="Typed signature for mock completion report"
                  className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="h-10 px-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Step indicators */}
            <div className="flex items-center gap-1.5 mr-4">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-6 bg-brand-500" : "w-1.5 bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              className="h-10 px-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="h-10 px-5 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                id="wo-submit-btn"
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 h-10 px-5 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>{isEdit ? "Save Changes" : "Create Work Order"}</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
