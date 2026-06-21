"use client";
import React, { useEffect, useState } from "react";
import { customersService, Customer, CustomerDocument } from "@/services/customersService";
import { formatDate, TabSkeleton, EmptyState, SectionCard } from "../CustomerUIHelpers";

interface DocumentsTabProps {
  customer: Customer;
}

const DOC_TYPE_META: Record<
  CustomerDocument["type"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  contract: {
    label: "Contract",
    color: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  permit: {
    label: "Permit",
    color: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  inspection: {
    label: "Inspection",
    color: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  warranty_doc: {
    label: "Warranty",
    color: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  invoice: {
    label: "Invoice",
    color: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  proposal: {
    label: "Proposal",
    color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  manual: {
    label: "Manual",
    color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  installation_certificate: {
    label: "Certificate",
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  service_report: {
    label: "Service Report",
    color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17 17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17 5.877 20.713A2.121 2.121 0 113.01 17.846l5.587-5.587m0 0A3 3 0 1112.83 8.03" />
      </svg>
    ),
  },
  maintenance_report: {
    label: "Maintenance Report",
    color: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3.75 18.75V7.5A2.25 2.25 0 016 5.25h12a2.25 2.25 0 012.25 2.25v11.25M3.75 18.75A2.25 2.25 0 006 21h12a2.25 2.25 0 002.25-2.25M8.25 11.25h7.5" />
      </svg>
    ),
  },
  other: {
    label: "Other",
    color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
};

const LINK_KIND_LABELS = {
  customer: "Customer",
  site: "Site",
  solar_system: "System",
  equipment: "Equipment",
  warranty: "Warranty",
  support_ticket: "Ticket",
  work_order: "Work order",
} satisfies Record<NonNullable<CustomerDocument["linked_records"]>[number]["kind"], string>;

function formatSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

export default function DocumentsTab({ customer }: DocumentsTabProps) {
  const [docs, setDocs] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<CustomerDocument["type"] | "all">("all");

  useEffect(() => {
    customersService.getDocuments(customer.id).then((data) => {
      const sorted = [...data].sort(
        (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      );
      setDocs(sorted);
      setLoading(false);
    });
  }, [customer.id]);

  if (loading) return <TabSkeleton />;

  const uniqueTypes = [...new Set(docs.map((d) => d.type))];
  const filtered = filterType === "all" ? docs : docs.filter((d) => d.type === filterType);

  if (docs.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        }
        title="No documents"
        message="No documents have been uploaded for this customer yet."
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilterType("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            filterType === "all"
              ? "bg-brand-500 text-white"
              : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
          }`}
        >
          All ({docs.length})
        </button>
        {uniqueTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterType === type
                ? "bg-brand-500 text-white"
                : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
            }`}
          >
            {DOC_TYPE_META[type].label}
          </button>
        ))}
      </div>

      {/* Documents grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((doc) => {
          const meta = DOC_TYPE_META[doc.type];
          return (
            <SectionCard key={doc.id} className="group p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90 leading-snug line-clamp-2">
                    {doc.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatSize(doc.size_kb)}</span>
                    <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(doc.uploaded_at)}</span>
                  </div>
                  <span className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.color}`}>
                    {meta.label}
                  </span>
                  {doc.linked_records && doc.linked_records.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {doc.linked_records.slice(0, 3).map((link) => (
                        <span
                          key={`${doc.id}-${link.kind}-${link.label}`}
                          className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
                        >
                          {LINK_KIND_LABELS[link.kind]}: {link.label}
                        </span>
                      ))}
                      {doc.linked_records.length > 3 && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          +{doc.linked_records.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={doc.url}
                  className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-1.5 text-center text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  View
                </a>
                <a
                  href={doc.url}
                  download
                  className="flex-1 rounded-lg bg-brand-50 dark:bg-brand-500/10 py-1.5 text-center text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors"
                >
                  Download
                </a>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
