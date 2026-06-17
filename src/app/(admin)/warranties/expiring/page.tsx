import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import WarrantyTable from "@/components/warranties/WarrantyTable";
import ExpiringWarrantyAlerts from "@/components/warranties/ExpiringWarrantyAlerts";

export const metadata: Metadata = {
  title: "Expiring Warranties | SolarOps",
  description: "Monitor solar warranties expiring soon and take proactive action before they lapse.",
};

export default function ExpiringWarrantiesPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Expiring Soon" />
      <div className="mt-4 space-y-6 md:mt-6">
        {/* Alert summary */}
        <ExpiringWarrantyAlerts />

        {/* Expiring + expired table */}
        <WarrantyTable mode="expiring" />
      </div>
    </>
  );
}
