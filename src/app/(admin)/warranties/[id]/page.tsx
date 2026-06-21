import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import WarrantyDetail from "@/components/warranties/WarrantyDetail";

export const metadata: Metadata = {
  title: "Warranty Detail | SolarOS",
  description: "View complete details, coverage information, and claims history for a warranty.",
};

export default function WarrantyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <>
      <PageBreadCrumb pageTitle="Warranty Detail" />
      <div className="mt-4 md:mt-6">
        <WarrantyDetail warrantyId={params.id} />
      </div>
    </>
  );
}
