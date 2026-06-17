import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import MaintenanceSchedule from "@/components/maintenance/MaintenanceSchedule";

export const metadata: Metadata = {
  title: "Maintenance Schedule | SolarOps",
  description: "View and manage solar maintenance visits in calendar or list view. Track overdue visits, assign technicians, and reduce missed maintenance.",
};

export default function MaintenanceSchedulePage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Maintenance Schedule" />
      <div className="mt-4 md:mt-6">
        <MaintenanceSchedule />
      </div>
    </>
  );
}
