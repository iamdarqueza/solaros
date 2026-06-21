"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

type SolarDocumentType =
  | "warranty_document"
  | "installation_certificate"
  | "invoice"
  | "quotation"
  | "manual"
  | "product_datasheet"
  | "service_report"
  | "maintenance_report"
  | "inspection_report"
  | "before_after_photos"
  | "customer_sign_off"
  | "permit"
  | "contract"
  | "supplier_document";

type DocumentVisibility = "internal_only" | "customer_visible";
type DocumentTypeFilter = "all" | SolarDocumentType;
type VisibilityFilter = "all" | DocumentVisibility;
type LinkedRecordKind = "Customer" | "Site" | "Solar System" | "Equipment" | "Warranty" | "Support Ticket" | "Work Order";

interface LinkedRecord {
  kind: LinkedRecordKind;
  label: string;
}

const CUSTOMER_LINKS: Record<string, string> = {
  "Marcus Delgado": "/customers/cust-001",
  "Priya Nair": "/customers/cust-002",
  "James Thornton": "/customers/cust-003",
  "Amara Osei": "/customers/cust-004",
  "Elena Vasquez": "/customers/cust-005",
  "Richard Chen": "/customers/cust-006",
  "Fatima Al-Hassan": "/customers/cust-007",
  "Roberto Morales": "/customers/cust-008",
};

function getLinkedRecordHref(record: LinkedRecord) {
  if (record.kind === "Customer") return CUSTOMER_LINKS[record.label] ?? "/customers";
  if (record.kind === "Site") return "/sites";
  if (record.kind === "Solar System") return "/solar-systems";
  if (record.kind === "Equipment") return "/equipment";
  if (record.kind === "Warranty") return "/warranties";
  if (record.kind === "Support Ticket") return "/support/tickets";
  if (record.kind === "Work Order") return "/work-orders";
  return undefined;
}

interface SolarDocument {
  id: string;
  name: string;
  type: SolarDocumentType;
  customer: string;
  site?: string;
  solarSystem?: string;
  equipment?: string;
  warranty?: string;
  uploadedBy: string;
  uploadDate: string;
  expiryDate?: string;
  visibility: DocumentVisibility;
  linkedRecords: LinkedRecord[];
}

const DOCUMENT_TYPE_OPTIONS: { value: SolarDocumentType; label: string }[] = [
  { value: "warranty_document", label: "Warranty Document" },
  { value: "installation_certificate", label: "Installation Certificate" },
  { value: "invoice", label: "Invoice" },
  { value: "quotation", label: "Quotation" },
  { value: "manual", label: "Manual" },
  { value: "product_datasheet", label: "Product Datasheet" },
  { value: "service_report", label: "Service Report" },
  { value: "maintenance_report", label: "Maintenance Report" },
  { value: "inspection_report", label: "Inspection Report" },
  { value: "before_after_photos", label: "Before/After Photos" },
  { value: "customer_sign_off", label: "Customer Sign-off" },
  { value: "permit", label: "Permit" },
  { value: "contract", label: "Contract" },
  { value: "supplier_document", label: "Supplier Document" },
];

const DOCUMENT_TYPE_LABELS = DOCUMENT_TYPE_OPTIONS.reduce(
  (acc, option) => ({ ...acc, [option.value]: option.label }),
  {} as Record<SolarDocumentType, string>
);

const MOCK_DOCUMENTS: SolarDocument[] = [
  {
    id: "doc-1001",
    name: "SunPower Panel Warranty Certificate",
    type: "warranty_document",
    customer: "Marcus Delgado",
    site: "4821 Sunset Ridge Dr",
    solarSystem: "Sunset Ridge 9.6 kW System",
    equipment: "SunPower SPR-M400 Panels",
    warranty: "WAR-2022-1184",
    uploadedBy: "Jordan Lee",
    uploadDate: "2022-04-10",
    expiryDate: "2047-04-10",
    visibility: "customer_visible",
    linkedRecords: [
      { kind: "Customer", label: "Marcus Delgado" },
      { kind: "Solar System", label: "Sunset Ridge 9.6 kW" },
      { kind: "Warranty", label: "WAR-2022-1184" },
    ],
  },
  {
    id: "doc-1002",
    name: "San Diego Installation Certificate",
    type: "installation_certificate",
    customer: "Marcus Delgado",
    site: "4821 Sunset Ridge Dr",
    solarSystem: "Sunset Ridge 9.6 kW System",
    uploadedBy: "Maya Patel",
    uploadDate: "2022-04-12",
    visibility: "customer_visible",
    linkedRecords: [
      { kind: "Customer", label: "Marcus Delgado" },
      { kind: "Site", label: "4821 Sunset Ridge Dr" },
      { kind: "Solar System", label: "Sunset Ridge 9.6 kW" },
    ],
  },
  {
    id: "doc-1003",
    name: "Invoice INV-2025-8821 Annual Inspection",
    type: "invoice",
    customer: "Marcus Delgado",
    site: "4821 Sunset Ridge Dr",
    solarSystem: "Sunset Ridge 9.6 kW System",
    uploadedBy: "Avery Chen",
    uploadDate: "2025-11-15",
    visibility: "customer_visible",
    linkedRecords: [
      { kind: "Customer", label: "Marcus Delgado" },
      { kind: "Work Order", label: "WO-2025-0918" },
    ],
  },
  {
    id: "doc-1004",
    name: "Battery Storage Upgrade Quotation",
    type: "quotation",
    customer: "Priya Nair",
    site: "1100 Innovation Way",
    solarSystem: "TechCorp Roof Array",
    uploadedBy: "Jordan Lee",
    uploadDate: "2025-12-03",
    visibility: "customer_visible",
    linkedRecords: [
      { kind: "Customer", label: "Priya Nair" },
      { kind: "Support Ticket", label: "TKT-2025-4418" },
    ],
  },
  {
    id: "doc-1005",
    name: "SolarEdge Inverter Installation Manual",
    type: "manual",
    customer: "James Thornton",
    site: "7832 Desert Palm Ave",
    solarSystem: "Desert Palm 12.8 kW System",
    equipment: "SolarEdge SE10000H Inverter",
    uploadedBy: "Carlos Rivera",
    uploadDate: "2024-08-21",
    visibility: "internal_only",
    linkedRecords: [
      { kind: "Equipment", label: "SolarEdge SE10000H" },
      { kind: "Solar System", label: "Desert Palm 12.8 kW" },
    ],
  },
  {
    id: "doc-1006",
    name: "Enphase IQ8 Product Datasheet",
    type: "product_datasheet",
    customer: "Marcus Delgado",
    site: "200 Harbor View Ct",
    solarSystem: "Coronado 6.4 kW System",
    equipment: "Enphase IQ8 Microinverters",
    uploadedBy: "Sarah Johnson",
    uploadDate: "2023-09-20",
    visibility: "internal_only",
    linkedRecords: [
      { kind: "Equipment", label: "Enphase IQ8 Microinverters" },
      { kind: "Solar System", label: "Coronado 6.4 kW" },
    ],
  },
  {
    id: "doc-1007",
    name: "WO-2025-0918 Service Report",
    type: "service_report",
    customer: "Marcus Delgado",
    site: "4821 Sunset Ridge Dr",
    solarSystem: "Sunset Ridge 9.6 kW System",
    uploadedBy: "Carlos Rivera",
    uploadDate: "2025-11-14",
    visibility: "customer_visible",
    linkedRecords: [
      { kind: "Customer", label: "Marcus Delgado" },
      { kind: "Work Order", label: "WO-2025-0918" },
      { kind: "Solar System", label: "Sunset Ridge 9.6 kW" },
    ],
  },
  {
    id: "doc-1008",
    name: "Q4 Commercial Maintenance Report",
    type: "maintenance_report",
    customer: "Priya Nair",
    site: "1100 Innovation Way",
    solarSystem: "TechCorp Roof Array",
    uploadedBy: "Jasmine Lee",
    uploadDate: "2025-12-02",
    visibility: "customer_visible",
    linkedRecords: [
      { kind: "Customer", label: "Priya Nair" },
      { kind: "Work Order", label: "WO-2025-1011" },
      { kind: "Solar System", label: "TechCorp Roof Array" },
    ],
  },
  {
    id: "doc-1009",
    name: "Panel String Inspection Notes",
    type: "inspection_report",
    customer: "Roberto Morales",
    site: "14200 Valley Ranch Rd",
    solarSystem: "North Field 58 kW System",
    uploadedBy: "David Park",
    uploadDate: "2025-12-01",
    visibility: "internal_only",
    linkedRecords: [
      { kind: "Customer", label: "Roberto Morales" },
      { kind: "Work Order", label: "WO-2025-1032" },
      { kind: "Support Ticket", label: "TKT-2025-4490" },
    ],
  },
  {
    id: "doc-1010",
    name: "Inverter Replacement Before and After Photos",
    type: "before_after_photos",
    customer: "James Thornton",
    site: "7832 Desert Palm Ave",
    solarSystem: "Desert Palm 12.8 kW System",
    equipment: "SolarEdge SE10000H Inverter",
    uploadedBy: "Carlos Rivera",
    uploadDate: "2025-10-08",
    visibility: "internal_only",
    linkedRecords: [
      { kind: "Customer", label: "James Thornton" },
      { kind: "Equipment", label: "SolarEdge SE10000H" },
      { kind: "Work Order", label: "WO-2025-0772" },
    ],
  },
  {
    id: "doc-1011",
    name: "Customer Sign-off for Annual Service",
    type: "customer_sign_off",
    customer: "Fatima Al-Hassan",
    site: "88 Ocean Drive",
    solarSystem: "Ocean Drive 7.2 kW System",
    uploadedBy: "Sarah Johnson",
    uploadDate: "2025-11-22",
    visibility: "customer_visible",
    linkedRecords: [
      { kind: "Customer", label: "Fatima Al-Hassan" },
      { kind: "Work Order", label: "WO-2025-0954" },
    ],
  },
  {
    id: "doc-1012",
    name: "Miami-Dade Electrical Permit",
    type: "permit",
    customer: "Fatima Al-Hassan",
    site: "88 Ocean Drive",
    solarSystem: "Ocean Drive 7.2 kW System",
    uploadedBy: "Maya Patel",
    uploadDate: "2023-05-21",
    expiryDate: "2026-05-21",
    visibility: "customer_visible",
    linkedRecords: [
      { kind: "Customer", label: "Fatima Al-Hassan" },
      { kind: "Site", label: "88 Ocean Drive" },
      { kind: "Solar System", label: "Ocean Drive 7.2 kW" },
    ],
  },
  {
    id: "doc-1013",
    name: "Osei Properties Master Service Contract",
    type: "contract",
    customer: "Amara Osei",
    site: "2200 Commerce Blvd",
    uploadedBy: "Jordan Lee",
    uploadDate: "2020-11-05",
    expiryDate: "2026-11-05",
    visibility: "internal_only",
    linkedRecords: [
      { kind: "Customer", label: "Amara Osei" },
      { kind: "Site", label: "2200 Commerce Blvd" },
    ],
  },
  {
    id: "doc-1014",
    name: "SMA Distributor Replacement Authorization",
    type: "supplier_document",
    customer: "Priya Nair",
    site: "1100 Innovation Way",
    solarSystem: "TechCorp Roof Array",
    equipment: "SMA Sunny Tripower Inverter",
    warranty: "WAR-2023-2209",
    uploadedBy: "David Park",
    uploadDate: "2025-12-06",
    visibility: "internal_only",
    linkedRecords: [
      { kind: "Equipment", label: "SMA Sunny Tripower" },
      { kind: "Warranty", label: "WAR-2023-2209" },
      { kind: "Work Order", label: "WO-2025-1027" },
    ],
  },
];

function formatDate(date: string | undefined) {
  if (!date) return "Not applicable";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function VisibilityBadge({ visibility }: { visibility: DocumentVisibility }) {
  const isCustomerVisible = visibility === "customer_visible";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        isCustomerVisible
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      }`}
    >
      {isCustomerVisible ? "Customer Visible" : "Internal Only"}
    </span>
  );
}

function LinkedRecordChips({ records }: { records: LinkedRecord[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {records.map((record) => {
        const href = getLinkedRecordHref(record);
        const className =
          "inline-flex max-w-full items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300";
        const content = (
          <>
            <span className="text-gray-400 dark:text-gray-500">{record.kind}:</span>
            <span className="truncate">{record.label}</span>
          </>
        );

        return href ? (
          <Link key={`${record.kind}-${record.label}`} href={href} className={`${className} hover:border-brand-200 hover:text-brand-600 dark:hover:border-brand-500/40 dark:hover:text-brand-300`}>
            {content}
          </Link>
        ) : (
          <span key={`${record.kind}-${record.label}`} className={className}>
            {content}
          </span>
        );
      })}
    </div>
  );
}

function DocumentIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
        d="M7 21h10a2 2 0 002-2V8.5L13.5 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M13 3v6h6M8 13h8M8 17h5" />
    </svg>
  );
}

function EmptyState({
  title,
  description,
  onReset,
}: {
  title: string;
  description: string;
  onReset?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        <DocumentIcon />
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">{description}</p>
      {onReset ? (
        <button
          onClick={onReset}
          className="mt-5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

export default function DocumentLibraryPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentTypeFilter>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return MOCK_DOCUMENTS.filter((document) => {
      const matchesSearch =
        !query ||
        [
          document.name,
          DOCUMENT_TYPE_LABELS[document.type],
          document.customer,
          document.site,
          document.solarSystem,
          document.equipment,
          document.warranty,
          document.uploadedBy,
          ...document.linkedRecords.map((record) => `${record.kind} ${record.label}`),
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));

      const matchesType = typeFilter === "all" || document.type === typeFilter;
      const matchesVisibility = visibilityFilter === "all" || document.visibility === visibilityFilter;

      return matchesSearch && matchesType && matchesVisibility;
    });
  }, [search, typeFilter, visibilityFilter]);

  const stats = useMemo(
    () => [
      {
        label: "Total documents",
        value: MOCK_DOCUMENTS.length,
        detail: "Across customers, sites, systems, equipment, and jobs",
      },
      {
        label: "Customer visible",
        value: MOCK_DOCUMENTS.filter((document) => document.visibility === "customer_visible").length,
        detail: "Available in customer-facing records",
      },
      {
        label: "Internal only",
        value: MOCK_DOCUMENTS.filter((document) => document.visibility === "internal_only").length,
        detail: "Staff-only operational documents",
      },
      {
        label: "Expiring",
        value: MOCK_DOCUMENTS.filter((document) => document.expiryDate).length,
        detail: "Permits, warranties, and contracts with expiry dates",
      },
    ],
    []
  );

  const hasActiveFilters = Boolean(search.trim()) || typeFilter !== "all" || visibilityFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setVisibilityFilter("all");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <DocumentIcon />
              Central file library
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
              Browse customer-visible and internal files linked to customers, sites, solar systems, equipment,
              warranties, support tickets, and work orders.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-400 dark:bg-gray-800 dark:text-gray-500"
            title="File upload will connect to document storage in a later backend phase."
          >
            Upload coming soon
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stat.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_240px_220px_auto]">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by document, customer, linked record, or uploader..."
              className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as DocumentTypeFilter)}
            className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
          >
            <option value="all">All document types</option>
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={visibilityFilter}
            onChange={(event) => setVisibilityFilter(event.target.value as VisibilityFilter)}
            className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
          >
            <option value="all">All visibility</option>
            <option value="customer_visible">Customer Visible</option>
            <option value="internal_only">Internal Only</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="h-11 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Reset
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>
            Showing {filteredDocuments.length} of {MOCK_DOCUMENTS.length} documents
          </span>
          {typeFilter !== "all" ? <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">{DOCUMENT_TYPE_LABELS[typeFilter]}</span> : null}
          {visibilityFilter !== "all" ? (
            <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">
              {visibilityFilter === "customer_visible" ? "Customer Visible" : "Internal Only"}
            </span>
          ) : null}
        </div>
      </div>

      {MOCK_DOCUMENTS.length === 0 ? (
        <EmptyState
          title="No documents uploaded yet"
          description="Once files are added, this library will connect them to customers, sites, systems, equipment, warranties, tickets, and work orders."
        />
      ) : filteredDocuments.length === 0 ? (
        <EmptyState
          title="No documents match these filters"
          description="Try another document type, visibility setting, or search term to find linked records in the library."
          onReset={resetFilters}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 xl:block">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Document</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Linked Records</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Upload</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Expiry</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Visibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredDocuments.map((document) => (
                  <tr key={document.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                          <DocumentIcon />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white">{document.name}</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{DOCUMENT_TYPE_LABELS[document.type]}</p>
                          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{document.customer}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-sm px-5 py-4 align-top">
                      <LinkedRecordChips records={document.linkedRecords} />
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{formatDate(document.uploadDate)}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">by {document.uploadedBy}</p>
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-gray-600 dark:text-gray-300">{formatDate(document.expiryDate)}</td>
                    <td className="px-5 py-4 align-top">
                      <VisibilityBadge visibility={document.visibility} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:hidden">
            {filteredDocuments.map((document) => (
              <article key={document.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                      <DocumentIcon />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{document.name}</h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{DOCUMENT_TYPE_LABELS[document.type]}</p>
                    </div>
                  </div>
                  <VisibilityBadge visibility={document.visibility} />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Customer</p>
                    <p className="mt-1 text-gray-700 dark:text-gray-200">{document.customer}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Upload</p>
                    <p className="mt-1 text-gray-700 dark:text-gray-200">
                      {formatDate(document.uploadDate)} by {document.uploadedBy}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Expiry</p>
                    <p className="mt-1 text-gray-700 dark:text-gray-200">{formatDate(document.expiryDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Site/System</p>
                    <p className="mt-1 text-gray-700 dark:text-gray-200">{document.site ?? document.solarSystem ?? "Not linked"}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Linked Records</p>
                  <LinkedRecordChips records={document.linkedRecords} />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
