import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import OperationalReportsPage from "@/components/reports/OperationalReportsPage";

export const metadata: Metadata = {
  title: "Reports | SolarOS",
  description: "Review operational reports for warranties, maintenance, work orders, support, customers, and technicians.",
};

export default function ReportsRoutePage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Reports" />
      <div className="mt-4 md:mt-6">
        <OperationalReportsPage />
      </div>
    </>
  );
}
