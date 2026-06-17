"use client";
import React, { useEffect, useState } from "react";
import { customersService, Customer, Installation } from "@/services/customersService";
import {
  StatCard,
  getInstallationStatusBadge,
  formatDate,
  TabSkeleton,
  EmptyState,
  SectionCard,
} from "../CustomerUIHelpers";

interface OverviewTabProps {
  customer: Customer;
}

export default function OverviewTab({ customer }: OverviewTabProps) {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customersService.getInstallations(customer.id).then((data) => {
      setInstallations(data);
      setLoading(false);
    });
  }, [customer.id]);

  const totalCapacityKw = installations.reduce((sum, i) => sum + i.system_size_kw, 0);
  const totalPanels = installations.reduce((sum, i) => sum + i.panel_count, 0);
  const totalMonthlySavings = installations.reduce((sum, i) => sum + i.monthly_savings_usd, 0);
  const totalAnnualProduction = installations.reduce((sum, i) => sum + i.annual_production_kwh, 0);

  if (loading) return <TabSkeleton />;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total System Capacity"
          value={`${totalCapacityKw.toFixed(1)} kW`}
          sub={`${totalPanels} panels installed`}
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <StatCard
          label="Annual Production"
          value={`${(totalAnnualProduction / 1000).toFixed(1)} MWh`}
          sub="Estimated yearly output"
          color="green"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatCard
          label="Monthly Savings"
          value={`$${totalMonthlySavings.toLocaleString()}`}
          sub="vs. utility baseline"
          color="purple"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Last Service"
          value={formatDate(customer.last_service_date)}
          sub="Most recent visit"
          color="amber"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* System Status Cards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Installed Systems
        </h3>
        {installations.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            title="No installations yet"
            message="This customer has no solar systems on record."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {installations.map((inst) => (
              <SectionCard key={inst.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90 leading-snug">
                      {inst.site_address}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Installed {formatDate(inst.install_date)}
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0">{getInstallationStatusBadge(inst.status)}</div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center rounded-lg bg-gray-50 dark:bg-gray-800 p-2.5">
                    <p className="text-base font-bold text-gray-800 dark:text-white/90">{inst.system_size_kw}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">kW</p>
                  </div>
                  <div className="text-center rounded-lg bg-gray-50 dark:bg-gray-800 p-2.5">
                    <p className="text-base font-bold text-gray-800 dark:text-white/90">{inst.panel_count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Panels</p>
                  </div>
                  <div className="text-center rounded-lg bg-gray-50 dark:bg-gray-800 p-2.5">
                    <p className="text-base font-bold text-gray-800 dark:text-white/90">
                      ${inst.monthly_savings_usd}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">/mo saved</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>{inst.panel_brand} panels</span>
                  <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span>{inst.inverter_brand} inverter</span>
                  <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span>Inspected {formatDate(inst.last_inspection)}</span>
                </div>
              </SectionCard>
            ))}
          </div>
        )}
      </div>

      {/* Account Summary */}
      <SectionCard>
        <div className="p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Account Summary</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            {[
              { label: "Account #", value: customer.account_number },
              { label: "Customer Since", value: formatDate(customer.created_at) },
              { label: "System Type", value: customer.system_type.charAt(0).toUpperCase() + customer.system_type.slice(1) },
              { label: "Region", value: customer.region },
              { label: "Open Tickets", value: customer.open_tickets || "None" },
              { label: "Active Warranties", value: customer.active_warranties },
              { label: "Installations", value: customer.installations_count },
              { label: "Address", value: `${customer.city}, ${customer.state} ${customer.zip}` },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
