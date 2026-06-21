import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ClaimsTable from "@/components/warranties/ClaimsTable";

export const metadata: Metadata = {
  title: "Warranty Claims | SolarOS",
  description: "Track and manage all warranty claims filed for solar equipment and labor warranties.",
};

export default function WarrantyClaimsPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Warranty Claims" />
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6">
        <div className="col-span-12">
          <ClaimsTable />
        </div>
      </div>
    </>
  );
}
