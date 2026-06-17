"use client";
import React, { useEffect, useState } from "react";
import { customersService, Customer, SupportTicket } from "@/services/customersService";
import {
  getTicketPriorityBadge,
  getTicketStatusBadge,
  formatDate,
  TabSkeleton,
  EmptyState,
  SectionCard,
} from "../CustomerUIHelpers";

interface SupportTicketsTabProps {
  customer: Customer;
}

type FilterStatus = "all" | SupportTicket["status"];

export default function SupportTicketsTab({ customer }: SupportTicketsTabProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    customersService.getSupportTickets(customer.id).then((data) => {
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTickets(sorted);
      setLoading(false);
    });
  }, [customer.id]);

  if (loading) return <TabSkeleton />;

  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  };

  const filtered =
    filterStatus === "all" ? tickets : tickets.filter((t) => t.status === filterStatus);

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
        title="No support tickets"
        message="This customer has no support tickets on record."
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {(["all", "open", "in_progress", "resolved", "closed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterStatus === s
                ? "bg-brand-500 text-white"
                : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
            }`}
          >
            {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                filterStatus === s
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Tickets list */}
      <SectionCard>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No tickets match this filter.
            </div>
          ) : (
            filtered.map((ticket) => {
              const isOpen = expanded === ticket.id;
              return (
                <div key={ticket.id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : ticket.id)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    {/* Priority indicator */}
                    <div
                      className={`flex-shrink-0 h-2.5 w-2.5 rounded-full ${
                        ticket.priority === "critical"
                          ? "bg-error-500"
                          : ticket.priority === "high"
                          ? "bg-orange-500"
                          : ticket.priority === "medium"
                          ? "bg-warning-500"
                          : "bg-success-500"
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                          {ticket.ticket_number}
                        </span>
                        {getTicketPriorityBadge(ticket.priority)}
                        {getTicketStatusBadge(ticket.status)}
                      </div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1 truncate">
                        {ticket.subject}
                      </p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(ticket.created_at)}
                      </p>
                      {ticket.assigned_to && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          → {ticket.assigned_to}
                        </p>
                      )}
                    </div>

                    <svg
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50/50 dark:bg-white/[0.02]">
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {ticket.description}
                      </p>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Created</p>
                          <p className="font-medium text-gray-700 dark:text-gray-300">{formatDate(ticket.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Last Updated</p>
                          <p className="font-medium text-gray-700 dark:text-gray-300">{formatDate(ticket.updated_at)}</p>
                        </div>
                        {ticket.resolved_at && (
                          <div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Resolved</p>
                            <p className="font-medium text-gray-700 dark:text-gray-300">{formatDate(ticket.resolved_at)}</p>
                          </div>
                        )}
                        {ticket.assigned_to && (
                          <div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Assigned To</p>
                            <p className="font-medium text-gray-700 dark:text-gray-300">{ticket.assigned_to}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SectionCard>
    </div>
  );
}
