"use client";
import React, { useEffect, useState } from "react";
import { useCustomerPortal } from "@/app/(customer)/layout";
import { customerPortalService, type Installation } from "@/services/customerPortalService";

function StatusBadge({ status }: { status: Installation["status"] }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    operational: { label: "Operating Normally", color: "text-emerald-700", bg: "bg-emerald-50 border border-emerald-200" },
    degraded:    { label: "Reduced Output",     color: "text-amber-700",   bg: "bg-amber-50 border border-amber-200"   },
    offline:     { label: "System Offline",     color: "text-red-700",     bg: "bg-red-50 border border-red-200"       },
    maintenance: { label: "In Maintenance",     color: "text-blue-700",    bg: "bg-blue-50 border border-blue-200"     },
  };
  const s = map[status] ?? map.operational;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.color}`}>
      {s.label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default function MySystemPage() {
  const { customer } = useCustomerPortal();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    customerPortalService.getMySystem(customer.id).then((data) => {
      setInstallations(data);
      setLoading(false);
    });
  }, [customer?.id]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-64 rounded-2xl bg-gray-200" />
        ))}
      </div>
    );
  }

  if (installations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">☀️</div>
        <h2 className="text-lg font-semibold text-gray-800">No installations found</h2>
        <p className="text-sm text-gray-500 mt-1">Your solar system information will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Solar System</h1>
        <p className="text-sm text-gray-500 mt-1">Details about your installed solar equipment.</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Capacity", value: `${installations.reduce((s, i) => s + i.system_size_kw, 0).toFixed(1)} kW` },
          { label: "Monthly Savings", value: `$${installations.reduce((s, i) => s + i.monthly_savings_usd, 0).toLocaleString()}` },
          { label: "Installations", value: installations.length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-brand-50 border border-brand-100 p-3 text-center">
            <p className="text-lg font-bold text-brand-600">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Each installation */}
      {installations.map((inst, idx) => (
        <div key={inst.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          {/* Card header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Installation {idx + 1}</p>
              <p className="text-sm font-semibold text-white mt-0.5">{inst.site_address}</p>
            </div>
            <StatusBadge status={inst.status} />
          </div>

          <div className="p-5">
            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-4 mb-5 sm:grid-cols-4">
              {[
                { icon: "🔆", label: "System Size", value: `${inst.system_size_kw} kW` },
                { icon: "⚡", label: "Annual Output", value: `${inst.annual_production_kwh.toLocaleString()} kWh` },
                { icon: "💰", label: "Monthly Savings", value: `$${inst.monthly_savings_usd}` },
                { icon: "🪟", label: "Panels", value: `${inst.panel_count} panels` },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-gray-50 p-3 text-center">
                  <div className="text-xl mb-1">{m.icon}</div>
                  <p className="text-sm font-bold text-gray-900">{m.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Details list */}
            <div className="rounded-xl border border-gray-100 divide-y divide-gray-100">
              <InfoRow label="Solar Panels" value={inst.panel_brand} />
              <InfoRow label="Inverter" value={inst.inverter_brand} />
              <InfoRow label="Install Date" value={new Date(inst.install_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
              <InfoRow label="Last Inspection" value={new Date(inst.last_inspection).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
            </div>

            {/* Alert for degraded/offline */}
            {(inst.status === "degraded" || inst.status === "offline") && (
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    {inst.status === "degraded" ? "Reduced Output Detected" : "System Offline"}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Our team has been notified. You can also{" "}
                    <a href="/portal/support" className="underline font-medium">contact support</a> for an update.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
