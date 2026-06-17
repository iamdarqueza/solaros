import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import RecurringPlans from "@/components/maintenance/RecurringPlans";

export const metadata: Metadata = {
  title: "Recurring Maintenance Plans | SolarOps",
  description: "Manage recurring maintenance schedules for solar installations. Generate visits from templates and monitor plan compliance.",
};

export default function RecurringPlansPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Recurring Plans" />
      <div className="mt-4 md:mt-6">
        <RecurringPlans />
      </div>
    </>
  );
}
