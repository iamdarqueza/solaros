"use client";
import React, { useState } from "react";
import { supportService, SupportTicket, SUPPORT_AGENTS, TicketCategory, TicketPriority } from "@/services/supportService";

interface SupportTicketModalProps {
  onClose: () => void;
  onCreated: (ticket: SupportTicket) => void;
}

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "technical", label: "Technical Issue" },
  { value: "billing", label: "Billing & Invoice" },
  { value: "warranty", label: "Warranty Claim" },
  { value: "installation", label: "Installation / Upgrade" },
  { value: "general", label: "General Inquiry" },
  { value: "emergency", label: "Emergency" },
];

const PRIORITIES: { value: TicketPriority; label: string; description: string }[] = [
  { value: "low", label: "Low", description: "No impact on system operation" },
  { value: "medium", label: "Medium", description: "Minor impact, can wait" },
  { value: "high", label: "High", description: "Significant impact on customer" },
  { value: "urgent", label: "Urgent", description: "System down / emergency" },
];

export default function SupportTicketModal({ onClose, onCreated }: SupportTicketModalProps) {
  const [form, setForm] = useState({
    subject: "",
    description: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    system_name: "",
    category: "general" as TicketCategory,
    priority: "medium" as TicketPriority,
    assigned_agent_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.subject.trim()) errs.subject = "Subject is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.customer_name.trim()) errs.customer_name = "Customer name is required";
    if (!form.customer_email.trim()) errs.customer_email = "Customer email is required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      const agent = SUPPORT_AGENTS.find((a) => a.id === form.assigned_agent_id);
      const ticket = await supportService.createTicket({
        subject: form.subject,
        description: form.description,
        status: "open",
        priority: form.priority,
        category: form.category,
        customer_id: `cust-${Date.now()}`,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        system_name: form.system_name || "Unknown System",
        assigned_agent_id: form.assigned_agent_id || null,
        assigned_agent_name: agent?.name ?? null,
        related_work_order_id: null,
        resolved_at: null,
        first_response_at: null,
        tags: [],
      });
      onCreated(ticket);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => { const copy = { ...e }; delete copy[k]; return copy; });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-dark shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-dark border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Create Support Ticket</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Log a new customer support request</p>
          </div>
          <button
            id="support-modal-close"
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              id="tkt-subject"
              type="text"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="Brief description of the issue"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition ${errors.subject ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
            />
            {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
              <select
                id="tkt-category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set("priority", p.value)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium text-left transition-all border ${
                      form.priority === p.value
                        ? p.value === "urgent"
                          ? "bg-red-500 text-white border-red-500"
                          : p.value === "high"
                          ? "bg-orange-500 text-white border-orange-500"
                          : p.value === "medium"
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-gray-500 text-white border-gray-500"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="tkt-description"
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the issue in detail..."
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition resize-none ${errors.description ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Customer Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="tkt-customer-name"
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => set("customer_name", e.target.value)}
                  placeholder="Jane Smith"
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition ${errors.customer_name ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
                />
                {errors.customer_name && <p className="mt-1 text-xs text-red-500">{errors.customer_name}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="tkt-customer-email"
                  type="email"
                  value={form.customer_email}
                  onChange={(e) => set("customer_email", e.target.value)}
                  placeholder="jane@example.com"
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition ${errors.customer_email ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
                />
                {errors.customer_email && <p className="mt-1 text-xs text-red-500">{errors.customer_email}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Phone</label>
                <input
                  id="tkt-customer-phone"
                  type="tel"
                  value={form.customer_phone}
                  onChange={(e) => set("customer_phone", e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">System / Installation</label>
                <input
                  id="tkt-system-name"
                  type="text"
                  value={form.system_name}
                  onChange={(e) => set("system_name", e.target.value)}
                  placeholder="e.g. SunPower 22kW Array"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Assignment */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Assignment</h3>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Assign to Agent</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => set("assigned_agent_id", "")}
                  className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm transition-all ${
                    form.assigned_agent_id === ""
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">—</span>
                  <span className="font-medium">Unassigned</span>
                </button>
                {SUPPORT_AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => set("assigned_agent_id", agent.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm transition-all ${
                      form.assigned_agent_id === agent.id
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="h-6 w-6 rounded-full bg-violet-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                      {agent.avatar}
                    </span>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-semibold truncate">{agent.name.split(" ")[0]}</p>
                      <p className="text-[10px] text-gray-400 truncate">{agent.specialty.split(" ")[0]}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="tkt-save-btn"
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
