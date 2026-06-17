"use client";
import React, { useEffect, useState } from "react";
import { customersService, Customer, Installation } from "@/services/customersService";
import {
  getInstallationStatusBadge,
  formatDate,
  TabSkeleton,
  EmptyState,
  SectionCard,
} from "../CustomerUIHelpers";

interface InstallationsTabProps {
  customer: Customer;
}

export default function InstallationsTab({ customer }: InstallationsTabProps) {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    customersService.getInstallations(customer.id).then((data) => {
      setInstallations(data);
      if (data.length > 0) setExpanded(data[0].id);
      setLoading(false);
    });
  }, [customer.id]);

  if (loading) return <TabSkeleton />;

  if (installations.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
        title="No installations"
        message="This customer has no solar installations on record yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      {installations.map((inst) => {
        const isOpen = expanded === inst.id;
        return (
          <SectionCard key={inst.id}>
            {/* Header row */}
            <button
              onClick={() => setExpanded(isOpen ? null : inst.id)}
              className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
                  <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {inst.site_address}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {inst.system_size_kw} kW · {inst.panel_count} panels · Installed {formatDate(inst.install_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                {getInstallationStatusBadge(inst.status)}
                <svg
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded details */}
            {isOpen && (
              <div className="border-t border-gray-100 dark:border-gray-800 px-5 pb-5 pt-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
                  {[
                    { label: "System Size", value: `${inst.system_size_kw} kW` },
                    { label: "Panel Count", value: `${inst.panel_count} panels` },
                    { label: "Panel Brand", value: inst.panel_brand },
                    { label: "Inverter", value: inst.inverter_brand },
                    { label: "Annual Output", value: `${inst.annual_production_kwh.toLocaleString()} kWh` },
                    { label: "Monthly Savings", value: `$${inst.monthly_savings_usd}/mo` },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col items-center rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-center"
                    >
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90 mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Install Info */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                      Installation Details
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: "Installation Date", value: formatDate(inst.install_date) },
                        { label: "Last Inspection", value: formatDate(inst.last_inspection) },
                        { label: "Site Address", value: inst.site_address },
                      ].map((row) => (
                        <div key={row.label} className="flex items-start justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                          <span className="font-medium text-gray-800 dark:text-white/90 text-right max-w-[55%]">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                      Performance
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: "Annual Production", value: `${inst.annual_production_kwh.toLocaleString()} kWh` },
                        { label: "Monthly Savings", value: `$${inst.monthly_savings_usd}` },
                        { label: "System Status", value: inst.status.charAt(0).toUpperCase() + inst.status.slice(1) },
                      ].map((row) => (
                        <div key={row.label} className="flex items-start justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                          <span className="font-medium text-gray-800 dark:text-white/90">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    View Documents
                  </button>
                  <button className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    Schedule Maintenance
                  </button>
                  {inst.monitoring_url && (
                    <a
                      href={inst.monitoring_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-brand-50 dark:bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors"
                    >
                      Open Monitoring →
                    </a>
                  )}
                </div>
              </div>
            )}
          </SectionCard>
        );
      })}
    </div>
  );
}
