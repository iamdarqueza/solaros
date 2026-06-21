"use client";
import React, { useEffect, useState } from "react";
import { warrantyService, Warranty, WarrantyClaim } from "@/services/warrantyService";
import {
  getWarrantyStatusBadge,
  getWarrantyTypeBadge,
  getClaimStatusBadge,
  getClaimPriorityBadge,
  WarrantyProgressBar,
  ExpirationCountdown,
  formatDate,
  formatDateLong,
} from "./WarrantyUIHelpers";
import { useRouter } from "next/navigation";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <span className="w-36 flex-shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{value}</span>
    </div>
  );
}

export default function WarrantyDetail({ warrantyId }: { warrantyId: string }) {
  const router = useRouter();
  const [warranty, setWarranty] = useState<Warranty | null>(null);
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [createdWorkOrders, setCreatedWorkOrders] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      warrantyService.getWarranty(warrantyId),
      warrantyService.getClaimsForWarranty(warrantyId),
    ]).then(([w, c]) => {
      setWarranty(w);
      setClaims(c);
      setLoading(false);
    });
  }, [warrantyId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 rounded-lg bg-gray-100 dark:bg-gray-800" />
        <div className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-48 rounded-2xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (!warranty) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-12 text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Warranty not found</p>
        <button onClick={() => router.back()} className="mt-3 text-sm text-brand-500 hover:text-brand-600 font-medium">
          ← Go back
        </button>
      </div>
    );
  }

  const handleCreateWorkOrder = (claim: WarrantyClaim) => {
    const mockWorkOrderId = claim.linked_work_order_id ?? `WO-MOCK-${claim.claim_number.replace(/\D/g, "").slice(-4)}`;
    setCreatedWorkOrders((prev) => ({ ...prev, [claim.id]: mockWorkOrderId }));
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Warranties
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark overflow-hidden">
        {/* Color band */}
        <div className={`h-1.5 w-full ${
          warranty.status === "active"
            ? "bg-gradient-to-r from-success-400 to-success-600"
            : warranty.status === "expiring_soon"
            ? "bg-gradient-to-r from-warning-400 to-warning-600"
            : "bg-gradient-to-r from-error-400 to-error-600"
        }`} />

        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${
                warranty.warranty_type === "panel" || warranty.warranty_type === "manufacturer"
                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : warranty.warranty_type === "inverter"
                  ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  : warranty.warranty_type === "labor"
                  ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  : warranty.warranty_type === "performance"
                  ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                  : warranty.warranty_type === "installation"
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  : "bg-success-50 dark:bg-success-500/10 text-success-600 dark:text-success-400"
              }`}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">{warranty.product}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{warranty.manufacturer}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {getWarrantyStatusBadge(warranty.status)}
                  {getWarrantyTypeBadge(warranty.warranty_type)}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                id="file-claim-btn"
                onClick={() => setShowClaimModal(true)}
                className="flex items-center gap-2 h-9 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                File Claim
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Warranty Period</p>
              <ExpirationCountdown daysRemaining={warranty.days_remaining} />
            </div>
            <WarrantyProgressBar
              start={warranty.warranty_start}
              end={warranty.warranty_end}
              status={warranty.status}
            />
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Details */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-6">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
            Product Details
          </h2>
          <div>
            <InfoRow label="Product" value={warranty.product} />
            <InfoRow label="Manufacturer" value={warranty.manufacturer} />
            <InfoRow label="Supplier" value={warranty.supplier} />
            <InfoRow label="Model Number" value={<span className="font-mono">{warranty.model_number}</span>} />
            <InfoRow label="Serial Number" value={<span className="font-mono">{warranty.serial_number}</span>} />
            <InfoRow label="Equipment" value={<span className="font-mono">{warranty.equipment_id}</span>} />
            <InfoRow label="Warranty Type" value={getWarrantyTypeBadge(warranty.warranty_type)} />
            <InfoRow label="Coverage" value={<span className="text-xs leading-relaxed">{warranty.coverage_details}</span>} />
          </div>
        </div>

        {/* Warranty Dates */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-6">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Warranty Dates & Installation
          </h2>
          <div>
            <InfoRow label="Start Date" value={formatDateLong(warranty.warranty_start)} />
            <InfoRow label="End Date" value={formatDateLong(warranty.warranty_end)} />
            <InfoRow label="Status" value={getWarrantyStatusBadge(warranty.status)} />
            <InfoRow label="Time Remaining" value={<ExpirationCountdown daysRemaining={warranty.days_remaining} />} />
            <InfoRow label="Customer" value={warranty.customer_name} />
            <InfoRow label="Installation" value={`${warranty.installation_name} (${warranty.installation_id})`} />
            <InfoRow label="Solar System" value={`${warranty.solar_system_name} (${warranty.solar_system_id})`} />
            <InfoRow label="Site" value={`${warranty.site_name} (${warranty.site_id})`} />
            <InfoRow label="Site Address" value={<span className="text-xs leading-relaxed">{warranty.site_address}</span>} />
          </div>
        </div>
      </div>

      {/* Coverage, contacts, and documents */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-6">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">Coverage Notes & Exclusions</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{warranty.coverage_notes}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {warranty.exclusions.map((exclusion) => (
              <span key={exclusion} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {exclusion}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-6">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">Warranty Contacts</h2>
          <div>
            <InfoRow label="Manufacturer" value={`${warranty.manufacturer_contact.company} · ${warranty.manufacturer_contact.name}`} />
            <InfoRow label="Email" value={warranty.manufacturer_contact.email} />
            <InfoRow label="Phone" value={warranty.manufacturer_contact.phone} />
            <InfoRow label="Supplier" value={`${warranty.supplier_contact.company} · ${warranty.supplier_contact.name}`} />
            <InfoRow label="Supplier Email" value={warranty.supplier_contact.email} />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-6">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">Warranty Documents</h2>
          <div className="space-y-2">
            {warranty.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-brand-200 hover:bg-brand-50 dark:border-gray-800 dark:text-gray-300 dark:hover:border-brand-800 dark:hover:bg-brand-500/10"
              >
                <span className="line-clamp-1">{doc.name}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(doc.uploaded_at)}</span>
              </a>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Proof of purchase: {warranty.proof_of_purchase.name}</span>
            <span>Installation certificate: {warranty.installation_certificate.name}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {warranty.notes && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-6">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Notes
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{warranty.notes}</p>
        </div>
      )}

      {/* Claims history */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            Claims History
            {claims.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400">
                {claims.length}
              </span>
            )}
          </h2>
          <button
            onClick={() => setShowClaimModal(true)}
            className="text-xs text-brand-500 hover:text-brand-600 font-medium"
          >
            + File new claim
          </button>
        </div>

        {claims.length === 0 ? (
          <div className="flex flex-col items-center py-8">
            <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">No claims filed yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => (
              <div key={claim.id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-mono text-gray-400 dark:text-gray-500">{claim.claim_number}</p>
                      {getClaimStatusBadge(claim.status)}
                      {getClaimPriorityBadge(claim.priority)}
                    </div>
                    <p className="mt-1.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{claim.issue_description}</p>
                    {claim.resolution_notes && (
                      <div className="mt-2 rounded-lg bg-success-50 dark:bg-success-500/10 border border-success-100 dark:border-success-800/30 px-3 py-2">
                        <p className="text-xs text-success-700 dark:text-success-400 leading-relaxed">
                          <span className="font-semibold">Resolution: </span>
                          {claim.resolution_notes}
                        </p>
                      </div>
                    )}
                    {claim.next_action && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Next action: </span>
                        {claim.next_action}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500">Filed {formatDate(claim.submitted_date)}</p>
                    {claim.assigned_to && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{claim.assigned_to}</p>
                    )}
                    {claim.actual_cost !== undefined && claim.actual_cost === 0 && (
                      <p className="text-xs font-medium text-success-600 dark:text-success-400 mt-1">No cost to customer</p>
                    )}
                    {claim.status !== "completed" && claim.status !== "rejected" && (
                      <button
                        onClick={() => handleCreateWorkOrder(claim)}
                        className="mt-2 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600"
                      >
                        {createdWorkOrders[claim.id] ? `Work Order ${createdWorkOrders[claim.id]}` : "Create Work Order"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Claim modal */}
      {showClaimModal && (
        <NewClaimModal
          warranty={warranty}
          onClose={() => setShowClaimModal(false)}
          onSubmit={(newClaim) => {
            setClaims((prev) => [newClaim, ...prev]);
            setShowClaimModal(false);
          }}
        />
      )}
    </div>
  );
}

// ── New Claim Modal ──────────────────────────────────────────────────────────────

function NewClaimModal({
  warranty,
  onClose,
  onSubmit,
}: {
  warranty: Warranty;
  onClose: () => void;
  onSubmit: (claim: WarrantyClaim) => void;
}) {
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<WarrantyClaim["priority"]>("medium");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const newClaim = await warrantyService.createClaim({
        warranty_id: warranty.id,
        customer_id: warranty.customer_id,
        customer_name: warranty.customer_name,
        product: warranty.product,
        manufacturer: warranty.manufacturer,
        issue_description: description,
        status: "submitted",
        priority,
        resolved_date: undefined,
        resolution_notes: undefined,
        assigned_to: undefined,
        estimated_cost: undefined,
        actual_cost: undefined,
        linked_work_order_id: undefined,
        next_action: "Create a field work order if the claim requires an on-site technician visit.",
      });
      setSubmitted(true);
      setTimeout(() => onSubmit(newClaim), 1500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="claim-modal-overlay">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-dark shadow-2xl">
        {submitted ? (
          <div className="flex flex-col items-center py-12 px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20 mb-4">
              <svg className="w-8 h-8 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Claim Filed</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">Your warranty claim has been submitted successfully.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">File Warranty Claim</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-xs">{warranty.product} · {warranty.manufacturer}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Warranty info */}
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Warranty</span>
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{warranty.id}</span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{warranty.product}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Serial: {warranty.serial_number}</p>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Priority
                </label>
                <div className="mt-2 flex gap-2">
                  {(["low", "medium", "high", "critical"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                        priority === p
                          ? p === "critical"
                            ? "bg-error-500 text-white"
                            : p === "high"
                            ? "bg-orange-500 text-white"
                            : p === "medium"
                            ? "bg-warning-500 text-white"
                            : "bg-gray-500 text-white"
                          : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="claim-description" className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Issue Description <span className="text-error-500">*</span>
                </label>
                <textarea
                  id="claim-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe the issue in detail — what happened, when it started, any symptoms or error codes..."
                  className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none transition"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="submit-claim-btn"
                  type="submit"
                  disabled={!description.trim() || submitting}
                  className="flex-1 h-10 rounded-xl bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    "Submit Claim"
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
