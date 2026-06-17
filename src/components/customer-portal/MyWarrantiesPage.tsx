"use client";
import React, { useEffect, useState } from "react";
import { useCustomerPortal } from "@/app/(customer)/layout";
import { customerPortalService, type Warranty } from "@/services/customerPortalService";

function getDaysLeft(expiryDate: string): number {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function WarrantyCard({ w }: { w: Warranty }) {
  const days = getDaysLeft(w.expiry_date);
  const isExpired = days < 0;
  const isExpiringSoon = days >= 0 && days < 365;

  const borderColor = isExpired
    ? "border-red-200"
    : isExpiringSoon
    ? "border-amber-200"
    : "border-gray-200";

  const headerBg = isExpired
    ? "bg-red-50"
    : isExpiringSoon
    ? "bg-amber-50"
    : "bg-emerald-50";

  const daysLabel = isExpired
    ? "Expired"
    : days < 365
    ? `${days} days left`
    : `${Math.floor(days / 365)} years left`;

  const daysColor = isExpired
    ? "text-red-600"
    : isExpiringSoon
    ? "text-amber-700"
    : "text-emerald-700";

  return (
    <div className={`rounded-2xl border ${borderColor} bg-white overflow-hidden shadow-sm`}>
      <div className={`${headerBg} px-5 py-4 flex items-center justify-between`}>
        <div>
          <p className="text-base font-semibold text-gray-900">{w.component}</p>
          <p className="text-xs text-gray-500 mt-0.5">{w.manufacturer} · {w.coverage_type}</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${daysColor}`}>{daysLabel}</p>
          {!isExpired && (
            <p className="text-xs text-gray-400 mt-0.5">
              Expires {new Date(w.expiry_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
      </div>

      <div className="px-5 py-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400 font-medium">Coverage Starts</p>
          <p className="text-gray-800 font-medium">
            {new Date(w.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 font-medium">Coverage Ends</p>
          <p className={`font-medium ${isExpired ? "text-red-600" : "text-gray-800"}`}>
            {new Date(w.expiry_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        {w.claim_count > 0 && (
          <div className="col-span-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
            {w.claim_count} claim{w.claim_count !== 1 ? "s" : ""} filed under this warranty
          </div>
        )}
      </div>

      {isExpiringSoon && !isExpired && (
        <div className="mx-5 mb-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <span className="text-base flex-shrink-0">⚠️</span>
          <p className="text-xs text-amber-700">
            <span className="font-semibold">Expiring soon.</span> Contact us if you have questions about renewing or extending this warranty.
          </p>
        </div>
      )}
    </div>
  );
}

export default function MyWarrantiesPage() {
  const { customer } = useCustomerPortal();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    customerPortalService.getMyWarranties(customer.id).then((data) => {
      setWarranties(data);
      setLoading(false);
    });
  }, [customer?.id]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-gray-200" />)}
      </div>
    );
  }

  const active = warranties.filter((w) => w.status === "active");
  const expiringSoon = warranties.filter((w) => w.status === "expiring_soon");
  const expired = warranties.filter((w) => w.status === "expired");

  const grouped: { title: string; items: Warranty[] }[] = [
    { title: "⚠️ Expiring Soon", items: expiringSoon },
    { title: "✅ Active Warranties", items: active },
    { title: "📅 Expired", items: expired },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Warranties</h1>
        <p className="text-sm text-gray-500 mt-1">Coverage details for your solar equipment.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", count: active.length, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Expiring Soon", count: expiringSoon.length, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { label: "Expired", count: expired.length, color: "text-red-600", bg: "bg-red-50 border-red-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border ${s.bg} p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Explainer */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">What do these warranties cover?</p>
        <p className="text-xs text-blue-700">
          Your warranties protect your solar panels, inverters, and mounting hardware against defects and performance degradation. Contact us if you need to make a claim.
        </p>
      </div>

      {warranties.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🛡️</div>
          <p className="text-base font-semibold text-gray-700">No warranties on file</p>
          <p className="text-sm text-gray-400 mt-1">Warranty information will appear here after your installation.</p>
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.title} className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">{group.title}</h2>
            {group.items.map((w) => <WarrantyCard key={w.id} w={w} />)}
          </div>
        ))
      )}
    </div>
  );
}
