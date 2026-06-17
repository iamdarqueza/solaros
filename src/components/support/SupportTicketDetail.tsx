"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  supportService,
  SupportTicket,
  TicketStatus,
  SUPPORT_AGENTS,
} from "@/services/supportService";
import {
  StatusBadge,
  PriorityBadge,
  AgentAvatar,
  getCategoryIcon,
  getStatusConfig,
} from "./SupportTicketList";

interface SupportTicketDetailProps {
  ticketId: string;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string): string {
  if (fileType.startsWith("image/")) return "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z";
  if (fileType === "application/pdf") return "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z";
  return "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";
}

export default function SupportTicketDetail({ ticketId }: SupportTicketDetailProps) {
  const router = useRouter();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"conversation" | "internal" | "attachments">("conversation");
  const [replyContent, setReplyContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [postingNote, setPostingNote] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [changingAgent, setChangingAgent] = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const t = await supportService.getTicket(ticketId);
    setTicket(t);
    setLoading(false);
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket) return;
    setChangingStatus(true);
    setShowStatusPicker(false);
    try {
      const updated = await supportService.updateStatus(ticket.id, status);
      setTicket(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAgentAssign = async (agentId: string) => {
    if (!ticket) return;
    setChangingAgent(true);
    setShowAgentPicker(false);
    try {
      const updated = await supportService.assignAgent(ticket.id, agentId);
      setTicket(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setChangingAgent(false);
    }
  };

  const handlePostNote = async () => {
    if (!ticket || !replyContent.trim()) return;
    setPostingNote(true);
    try {
      const updated = await supportService.addNote(ticket.id, {
        content: replyContent.trim(),
        is_internal: isInternalNote,
        author_name: "Support Agent",
        author_role: "agent",
        created_at: new Date().toISOString(),
        attachments: [],
      });
      setTicket(updated);
      setReplyContent("");
    } catch (err) {
      console.error(err);
    } finally {
      setPostingNote(false);
    }
  };

  const STATUSES: TicketStatus[] = ["open", "in_progress", "waiting_customer", "resolved"];

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 rounded-lg bg-gray-100 dark:bg-gray-800" />
        <div className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Ticket not found</p>
        <button
          onClick={() => router.push("/support/tickets")}
          className="mt-4 text-sm text-brand-500 hover:text-brand-600 font-medium"
        >
          ← Back to tickets
        </button>
      </div>
    );
  }

  const allNotes = ticket.notes;
  const publicNotes = allNotes.filter((n) => !n.is_internal);
  const internalNotes = allNotes.filter((n) => n.is_internal);

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Back */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <button
          onClick={() => router.push("/support/tickets")}
          className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Tickets
        </button>
        <span>/</span>
        <span className="font-mono text-gray-400">{ticket.ticket_number}</span>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* ── Left: Ticket Content ────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Ticket Header Card */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5">
                  {ticket.ticket_number}
                </span>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {getCategoryIcon(ticket.category)}
                  <span className="capitalize">{ticket.category}</span>
                </div>
              </div>
            </div>

            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4 leading-snug">
              {ticket.subject}
            </h1>

            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-brand-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {ticket.customer_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{ticket.customer_name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{formatTime(ticket.created_at)}</p>
                </div>
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded px-2 py-0.5">
                  Original Message
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark overflow-hidden">
            <div className="flex border-b border-gray-100 dark:border-gray-800">
              {[
                { key: "conversation", label: "Conversation", count: publicNotes.length },
                { key: "internal", label: "Internal Notes", count: internalNotes.length },
                { key: "attachments", label: "Attachments", count: ticket.attachments.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? "border-brand-500 text-brand-600 dark:text-brand-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                      activeTab === tab.key
                        ? "bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {/* Conversation Tab */}
              {activeTab === "conversation" && (
                <>
                  {publicNotes.length === 0 ? (
                    <div className="py-10 flex flex-col items-center text-center">
                      <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400">No replies yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {publicNotes.map((note) => {
                        const isCustomer = note.author_role === "customer";
                        return (
                          <div key={note.id} className={`flex gap-3 ${isCustomer ? "" : "flex-row-reverse"}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${isCustomer ? "bg-gradient-to-br from-violet-400 to-brand-500" : "bg-gradient-to-br from-emerald-400 to-teal-500"}`}>
                              {note.author_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div className={`flex flex-col gap-1 max-w-[80%] ${isCustomer ? "items-start" : "items-end"}`}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{note.author_name}</span>
                                <span className={`text-[10px] rounded px-1.5 py-0.5 font-medium ${
                                  isCustomer
                                    ? "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                    : "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                }`}>
                                  {isCustomer ? "Customer" : "Agent"}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatTime(note.created_at)}</span>
                              </div>
                              <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                                isCustomer
                                  ? "bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                                  : "bg-brand-500 text-white"
                              }`}>
                                {note.content}
                              </div>
                              {note.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {note.attachments.map((att) => (
                                    <div key={att.id} className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400">
                                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={getFileIcon(att.file_type)} />
                                      </svg>
                                      {att.file_name}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Internal Notes Tab */}
              {activeTab === "internal" && (
                <>
                  {internalNotes.length === 0 ? (
                    <div className="py-10 flex flex-col items-center text-center">
                      <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400">No internal notes yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Internal notes are only visible to agents</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {internalNotes.map((note) => (
                        <div key={note.id} className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="h-6 w-6 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-bold text-white">
                              {note.author_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </span>
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{note.author_name}</span>
                            <span className="ml-auto text-[10px] text-amber-600 dark:text-amber-500">{formatTime(note.created_at)}</span>
                            <span className="text-[10px] rounded px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Internal
                            </span>
                          </div>
                          <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Attachments Tab */}
              {activeTab === "attachments" && (
                <>
                  {ticket.attachments.length === 0 ? (
                    <div className="py-10 flex flex-col items-center text-center">
                      <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400">No attachments</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ticket.attachments.map((att) => {
                        const isImage = att.file_type.startsWith("image/");
                        return (
                          <div key={att.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3.5 flex items-center gap-3 hover:border-brand-300 dark:hover:border-brand-500/40 transition-colors group cursor-pointer">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isImage ? "bg-brand-100 dark:bg-brand-500/10 text-brand-500" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={getFileIcon(att.file_type)} />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                {att.file_name}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {formatFileSize(att.file_size)} · {att.uploaded_by}
                              </p>
                            </div>
                            <svg className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-brand-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Reply Box — shown on conversation and internal tabs */}
              {(activeTab === "conversation" || activeTab === "internal") && ticket.status !== "resolved" && (
                <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      <button
                        onClick={() => setIsInternalNote(false)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          !isInternalNote
                            ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        Reply to Customer
                      </button>
                      <button
                        onClick={() => setIsInternalNote(true)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          isInternalNote
                            ? "bg-amber-500 text-white shadow-sm"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        🔒 Internal Note
                      </button>
                    </div>
                  </div>
                  <textarea
                    id="support-reply-box"
                    rows={4}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={isInternalNote ? "Add an internal note visible only to agents..." : "Write a reply to the customer..."}
                    className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition resize-none ${
                      isInternalNote
                        ? "border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    }`}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {isInternalNote ? "🔒 Only visible to your team" : "Will be sent to customer"}
                    </p>
                    <button
                      id="support-post-btn"
                      onClick={handlePostNote}
                      disabled={!replyContent.trim() || postingNote}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isInternalNote
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : "bg-brand-500 hover:bg-brand-600 text-white"
                      }`}
                    >
                      {postingNote ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                      {postingNote ? "Posting..." : isInternalNote ? "Add Note" : "Send Reply"}
                    </button>
                  </div>
                </div>
              )}

              {ticket.status === "resolved" && (
                <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 p-4 flex items-center gap-3">
                    <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                      This ticket is resolved. Reopen it to add more replies.
                    </p>
                    <button
                      onClick={() => handleStatusChange("open")}
                      className="ml-auto text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-2 whitespace-nowrap"
                    >
                      Reopen Ticket
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Sidebar Info ──────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Status + Actions */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Ticket Status</h3>

            {/* Status Picker */}
            <div className="relative mb-3">
              <button
                onClick={() => setShowStatusPicker(!showStatusPicker)}
                disabled={changingStatus}
                className="w-full flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60"
              >
                <StatusBadge status={ticket.status} />
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showStatusPicker && (
                <div className="absolute left-0 top-12 z-20 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-dark shadow-xl overflow-hidden">
                  {STATUSES.map((s) => {
                    const cfg = getStatusConfig(s);
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${s === ticket.status ? "bg-gray-50 dark:bg-white/5" : ""}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                        <span className={cfg.color}>{cfg.label}</span>
                        {s === ticket.status && (
                          <svg className="ml-auto h-4 w-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              {ticket.status !== "resolved" && (
                <button
                  onClick={() => handleStatusChange("resolved")}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Resolve
                </button>
              )}
              {ticket.status !== "in_progress" && ticket.status !== "resolved" && (
                <button
                  onClick={() => handleStatusChange("in_progress")}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start Work
                </button>
              )}
              {ticket.status !== "waiting_customer" && ticket.status !== "resolved" && (
                <button
                  onClick={() => handleStatusChange("waiting_customer")}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-violet-300 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Wait Customer
                </button>
              )}
            </div>
          </div>

          {/* Assignment */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Assignment</h3>
            {ticket.assigned_agent_name ? (
              <div className="flex items-center gap-3 mb-3">
                <AgentAvatar name={ticket.assigned_agent_name} size="md" />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{ticket.assigned_agent_name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {SUPPORT_AGENTS.find((a) => a.name === ticket.assigned_agent_name)?.specialty}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-3 text-orange-500 dark:text-orange-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-medium">Unassigned</span>
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setShowAgentPicker(!showAgentPicker)}
                disabled={changingAgent}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3.5 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
                {ticket.assigned_agent_id ? "Reassign Agent" : "Assign Agent"}
              </button>
              {showAgentPicker && (
                <div className="absolute left-0 top-10 z-20 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-dark shadow-xl overflow-hidden">
                  {SUPPORT_AGENTS.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleAgentAssign(agent.id)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                        ticket.assigned_agent_id === agent.id ? "bg-gray-50 dark:bg-white/5" : ""
                      }`}
                    >
                      <AgentAvatar name={agent.name} />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{agent.name}</p>
                        <p className="text-[10px] text-gray-400">{agent.specialty}</p>
                      </div>
                      {ticket.assigned_agent_id === agent.id && (
                        <svg className="ml-auto h-4 w-4 text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Customer</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 to-brand-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {ticket.customer_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{ticket.customer_name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{ticket.system_name}</p>
                </div>
              </div>
              <div className="space-y-1.5 pt-1">
                <a href={`mailto:${ticket.customer_email}`} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors group">
                  <svg className="h-3.5 w-3.5 flex-shrink-0 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {ticket.customer_email}
                </a>
                {ticket.customer_phone && (
                  <a href={`tel:${ticket.customer_phone}`} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors group">
                    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {ticket.customer_phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Details</h3>
            <dl className="space-y-2.5">
              <div className="flex justify-between gap-2">
                <dt className="text-xs text-gray-500 dark:text-gray-400">Created</dt>
                <dd className="text-xs font-medium text-gray-700 dark:text-gray-300 text-right">{formatTime(ticket.created_at)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-xs text-gray-500 dark:text-gray-400">Updated</dt>
                <dd className="text-xs font-medium text-gray-700 dark:text-gray-300 text-right">{formatTime(ticket.updated_at)}</dd>
              </div>
              {ticket.first_response_at && (
                <div className="flex justify-between gap-2">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">First Response</dt>
                  <dd className="text-xs font-medium text-gray-700 dark:text-gray-300 text-right">{formatTime(ticket.first_response_at)}</dd>
                </div>
              )}
              {ticket.resolved_at && (
                <div className="flex justify-between gap-2">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Resolved</dt>
                  <dd className="text-xs font-medium text-emerald-600 dark:text-emerald-400 text-right">{formatTime(ticket.resolved_at)}</dd>
                </div>
              )}
              {ticket.related_work_order_id && (
                <div className="flex justify-between gap-2">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Work Order</dt>
                  <dd>
                    <button
                      onClick={() => router.push(`/work-orders/${ticket.related_work_order_id}`)}
                      className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1"
                    >
                      View Order
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </dd>
                </div>
              )}
            </dl>

            {/* Tags */}
            {ticket.tags.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {ticket.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
