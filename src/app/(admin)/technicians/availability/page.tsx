import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import TechniciansPage from "@/components/technicians/TechniciansPage";

export const metadata: Metadata = {
  title: "Technician Availability | SolarOS",
  description: "Review technician availability, capacity, teams, and service coverage.",
};

export default function TechnicianAvailabilityPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Technician Availability" />
      <div className="mt-4 md:mt-6">
        <TechniciansPage focus="availability" />
      </div>
    </>
  );
}
