import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import TechniciansPage from "@/components/technicians/TechniciansPage";

export const metadata: Metadata = {
  title: "Technician Assignments | SolarOS",
  description: "Review technician workload, assigned field jobs, and linked work orders.",
};

export default function TechnicianAssignmentsPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Technician Assignments" />
      <div className="mt-4 md:mt-6">
        <TechniciansPage focus="assignments" />
      </div>
    </>
  );
}
