import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import WarrantyDashboard from "@/components/warranties/WarrantyDashboard";
import WarrantyTable from "@/components/warranties/WarrantyTable";
import ExpiringWarrantyAlerts from "@/components/warranties/ExpiringWarrantyAlerts";

export const metadata: Metadata = {
  title: "Active Warranties | SolarOps",
  description: "View and manage all active solar equipment and labor warranties across your customer base.",
};

export default function ActiveWarrantiesPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Warranty Management" />
      <div className="mt-4 space-y-6 md:mt-6">
        {/* Stats dashboard */}
        <WarrantyDashboard />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main table */}
          <div className="xl:col-span-2">
            <WarrantyTable mode="active" />
          </div>

          {/* Alert panel */}
          <div className="xl:col-span-1">
            <ExpiringWarrantyAlerts />
          </div>
        </div>
      </div>
    </>
  );
}
