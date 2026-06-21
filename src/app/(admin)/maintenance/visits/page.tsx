import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import MaintenanceSchedule from "@/components/maintenance/MaintenanceSchedule";

export const metadata: Metadata = {
  title: "Maintenance Visits | SolarOS",
  description: "Review planned and recurring solar maintenance visits before they become technician work orders.",
};

export default function MaintenanceVisitsPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Maintenance Visits" />
      <div className="mt-4 md:mt-6">
        <MaintenanceSchedule initialView="list" />
      </div>
    </>
  );
}
