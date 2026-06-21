"use client";
import React, { useEffect, useState } from "react";
import { useCustomerPortal } from "@/app/(customer)/layout";
import {
  customerPortalService,
  type SupportTicket,
  type SupportRequestForm,
} from "@/services/customerPortalService";

const TICKET_STATUS_MAP: Record<SupportTicket["status"], { label: string; color: string; bg: string }> = {
  open:        { label: "Open",             color: "text-amber-700",   bg: "bg-amber-50 border-amber-200"   },
  in_progress: { label: "Being Reviewed",   color: "text-blue-700",    bg: "bg-blue-50 border-blue-200"     },
  resolved:    { label: "Resolved",         color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200"},
  closed:      { label: "Closed",           color: "text-gray-600",    bg: "bg-gray-50 border-gray-200"     },
};

const PRIORITY_LABELS: Record<SupportRequestForm["priority"], string> = {
  low: "Low — Not urgent",
  medium: "Medium — Within a few days",
  high: "High — As soon as possible",
};

const ISSUE_TYPES: { value: SupportRequestForm["issueType"]; label: string }[] = [
  { value: "general", label: "General Question" },
  { value: "performance", label: "System Performance Issue" },
  { value: "outage", label: "System Not Working" },
  { value: "billing", label: "Billing / Invoice Question" },
  { value: "warranty", label: "Warranty Claim" },
  { value: "other", label: "Something Else" },
];

type Tab = "tickets" | "request";

export default function MySupportPage() {
  const { customer } = useCustomerPortal();
  const [tab, setTab] = useState<Tab>("tickets");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photoName, setPhotoName] = useState("");
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [mockReplies, setMockReplies] = useState<Record<string, string[]>>({});

  const [form, setForm] = useState<SupportRequestForm>({
    subject: "",
    issueType: "general",
    description: "",
    priority: "medium",
  });

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    customerPortalService.getMyTickets(customer.id).then((data) => {
      setTickets(data);
      setLoading(false);
    });
  }, [customer]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
    setSubmitting(true);
    const newTicket = await customerPortalService.submitSupportRequest(
      customer.id,
      form,
      `${customer.first_name} ${customer.last_name}`
    );
    setTickets((prev) => [newTicket, ...prev]);
    setSuccess(true);
    setSubmitting(false);
    setForm({ subject: "", issueType: "general", description: "", priority: "medium" });
    setPhotoName("");
    setTimeout(() => {
      setSuccess(false);
      setTab("tickets");
    }, 3000);
  }

  function addMockReply(ticketId: string) {
    const reply = replyDrafts[ticketId]?.trim();
    if (!reply) return;
    setMockReplies((prev) => ({
      ...prev,
      [ticketId]: [...(prev[ticketId] ?? []), reply],
    }));
    setReplyDrafts((prev) => ({ ...prev, [ticketId]: "" }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support</h1>
        <p className="text-sm text-gray-500 mt-1">Get help or track your existing requests.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
        {[
          { key: "tickets" as Tab, label: `My Requests (${tickets.length})` },
          { key: "request" as Tab, label: "Submit a Request" },
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

      {/* Tickets list */}
      {tab === "tickets" && (
        <div>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-200" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-base font-semibold text-gray-700">No open requests</p>
              <p className="text-sm text-gray-400 mt-1">You&apos;re all good! Submit a request if you need help.</p>
              <button
                onClick={() => setTab("request")}
                className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
              >
                Submit a Request
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const s = TICKET_STATUS_MAP[ticket.status] ?? TICKET_STATUS_MAP.open;
                return (
                  <div key={ticket.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{ticket.subject}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{ticket.ticket_number}</p>
                      </div>
                      <span className={`flex-shrink-0 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.color}`}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span>Opened {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      {ticket.assigned_to && <span>· Assigned to {ticket.assigned_to}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                      className="mt-4 text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      {expandedTicketId === ticket.id ? "Hide conversation" : "View conversation and reply"}
                    </button>

                    {expandedTicketId === ticket.id && (
                      <div className="mt-4 space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-xs font-semibold text-gray-500">You</p>
                          <p className="mt-1 text-sm text-gray-700">{ticket.description}</p>
                        </div>
                        <div className="rounded-xl bg-brand-50 p-3">
                          <p className="text-xs font-semibold text-brand-700">{ticket.assigned_to ?? "SolarOS Support"}</p>
                          <p className="mt-1 text-sm text-gray-700">
                            We received your request and will keep updates here.
                          </p>
                        </div>
                        {(mockReplies[ticket.id] ?? []).map((reply, index) => (
                          <div key={`${ticket.id}-reply-${index}`} className="rounded-xl bg-white p-3">
                            <p className="text-xs font-semibold text-gray-500">You</p>
                            <p className="mt-1 text-sm text-gray-700">{reply}</p>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input
                            value={replyDrafts[ticket.id] ?? ""}
                            onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                            placeholder="Write a reply..."
                            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          />
                          <button
                            type="button"
                            onClick={() => addMockReply(ticket.id)}
                            className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Request form */}
      {tab === "request" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {success ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-lg font-bold text-gray-900">Request Submitted!</p>
              <p className="text-sm text-gray-500 mt-1">
                Our team will review your request and get back to you shortly.
              </p>
              <p className="text-sm font-medium text-brand-600 mt-3">Redirecting to your tickets...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="issue-type">
                  What can we help you with?
                </label>
                <select
                  id="issue-type"
                  value={form.issueType}
                  onChange={(e) => setForm({ ...form, issueType: e.target.value as SupportRequestForm["issueType"] })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  {ISSUE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="subject">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="description">
                  Details
                </label>
                <textarea
                  id="description"
                  required
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Please describe the issue in as much detail as possible..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                <div className="space-y-2">
                  {(["low", "medium", "high"] as const).map((p) => (
                    <label key={p} className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                      form.priority === p ? "border-brand-500 bg-brand-50" : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                    }`}>
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={form.priority === p}
                        onChange={() => setForm({ ...form, priority: p })}
                        className="text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-sm text-gray-800">{PRIORITY_LABELS[p]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="photo-name">
                  Add photos (optional)
                </label>
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Mock upload only. Add a photo filename to show how customers can attach images of the issue.
                  </p>
                  <input
                    id="photo-name"
                    type="text"
                    value={photoName}
                    onChange={(e) => setPhotoName(e.target.value)}
                    placeholder="Example: inverter-error-screen.jpg"
                    className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  {photoName && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                      <span>📎</span>
                      {photoName}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
