import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import TechniciansPage from "@/components/technicians/TechniciansPage";

export const metadata: Metadata = {
  title: "Technicians | SolarOS",
  description: "Manage technician availability, teams, assignments, credentials, and linked field service work orders.",
};

export default function TechniciansRoutePage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Technicians" />
      <div className="mt-4 md:mt-6">
        <TechniciansPage />
      </div>
    </>
  );
}
