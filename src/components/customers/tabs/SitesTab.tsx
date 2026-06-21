"use client";
import React, { useEffect, useState } from "react";
import { customersService, Customer, Installation } from "@/services/customersService";
import { EmptyState, SectionCard, TabSkeleton, formatDate } from "../CustomerUIHelpers";

interface SitesTabProps {
  customer: Customer;
}

function siteNameFromAddress(address: string) {
  return address.split(",")[0] || address;
}

export default function SitesTab({ customer }: SitesTabProps) {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customersService.getInstallations(customer.id).then((data) => {
      setInstallations(data);
      setLoading(false);
    });
  }, [customer.id]);

  if (loading) return <TabSkeleton />;

  if (installations.length === 0 && !customer.address) {
    return (
      <EmptyState
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3" />
          </svg>
        }
        title="No sites yet"
        message="Add a site or property before attaching solar systems, warranties, maintenance plans, tickets, or work orders."
      />
    );
  }

  const sites =
    installations.length > 0
      ? installations.map((installation) => ({
          id: installation.id,
          address: installation.site_address,
          systemCount: 1,
          capacityKw: installation.system_size_kw,
          lastInspection: installation.last_inspection,
          status: installation.status,
        }))
      : [
          {
            id: customer.id,
            address: `${customer.address}, ${customer.city}, ${customer.state} ${customer.zip}`,
            systemCount: 0,
            capacityKw: 0,
            lastInspection: "",
            status: "pending",
          },
        ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
        Sites are the customer properties where solar systems, documents, warranties, maintenance plans, support tickets, and work orders connect.
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sites.map((site) => (
          <SectionCard key={site.id} className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {siteNameFromAddress(site.address)}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{site.address}</p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
                    <p className="text-base font-bold text-gray-800 dark:text-white/90">{site.systemCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Systems</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
                    <p className="text-base font-bold text-gray-800 dark:text-white/90">{site.capacityKw}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">kW</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
                    <p className="text-base font-bold text-gray-800 dark:text-white/90">
                      {site.lastInspection ? formatDate(site.lastInspection) : "Pending"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Last Visit</p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
