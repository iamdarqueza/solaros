"use client";
import React, { useEffect, useState } from "react";
import { useCustomerPortal } from "@/app/(customer)/layout";
import { customerPortalService, type CustomerDocument } from "@/services/customerPortalService";

type DocType = CustomerDocument["type"] | "all";

const TYPE_LABELS: Record<CustomerDocument["type"], string> = {
  contract: "Contract",
  permit: "Permit",
  inspection: "Inspection Report",
  warranty_doc: "Warranty",
  invoice: "Invoice",
  proposal: "Proposal",
  manual: "Manual",
  installation_certificate: "Installation Certificate",
  service_report: "Service Report",
  maintenance_report: "Maintenance Report",
  other: "Other",
};

const TYPE_ICONS: Record<CustomerDocument["type"], string> = {
  contract: "📄",
  permit: "🏛️",
  inspection: "🔍",
  warranty_doc: "🛡️",
  invoice: "🧾",
  proposal: "📋",
  manual: "📘",
  installation_certificate: "✅",
  service_report: "🔧",
  maintenance_report: "🗓️",
  other: "📁",
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

function formatFileSize(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

const FILTER_TABS: { key: DocType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "contract", label: "Contracts" },
  { key: "permit", label: "Permits" },
  { key: "warranty_doc", label: "Warranties" },
  { key: "manual", label: "Manuals" },
  { key: "installation_certificate", label: "Certificates" },
  { key: "service_report", label: "Service Reports" },
  { key: "maintenance_report", label: "Maintenance Reports" },
];

export default function MyDocumentsPage() {
  const { customer } = useCustomerPortal();
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<DocType>("all");

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    customerPortalService.getMyDocuments(customer.id).then((data) => {
      setDocuments(data);
      setLoading(false);
    });
  }, [customer]);

  const filtered = activeFilter === "all"
    ? documents
    : documents.filter((d) => d.type === activeFilter);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 rounded-xl bg-gray-200" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-200" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
        <p className="text-sm text-gray-500 mt-1">Download documents linked to your sites, systems, equipment, warranties, tickets, and service visits.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTER_TABS.filter((t) => t.key === "all" || documents.some((d) => d.type === t.key)).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === tab.key
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Document list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📂</div>
          <p className="text-base font-semibold text-gray-700">No documents here</p>
          <p className="text-sm text-gray-400 mt-1">No documents in this category yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 shadow-sm overflow-hidden">
          {filtered.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              {/* Icon */}
              <div className="text-2xl flex-shrink-0">{TYPE_ICONS[doc.type]}</div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-400">
                    {TYPE_LABELS[doc.type]}
                  </span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400">
                    {new Date(doc.uploaded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400">{formatFileSize(doc.size_kb)}</span>
                </div>
                {doc.linked_records && doc.linked_records.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {doc.linked_records.slice(0, 3).map((link) => (
                      <span
                        key={`${doc.id}-${link.kind}-${link.label}`}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500"
                      >
                        {LINK_KIND_LABELS[link.kind]}: {link.label}
                      </span>
                    ))}
                    {doc.linked_records.length > 3 && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                        +{doc.linked_records.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Download button */}
              <a
                href={doc.url}
                download
                className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-brand-50 border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Info note */}
      {documents.length > 0 && (
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
          <p className="text-xs text-gray-500">
            <span className="font-semibold">Need a document that isn&apos;t listed?</span>{" "}
            Contact our support team and we&apos;ll make sure you have everything you need.
          </p>
        </div>
      )}
    </div>
  );
}
