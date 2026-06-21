import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import AssetFoundationPage from "@/components/assets/AssetFoundationPage";

export const metadata: Metadata = {
  title: "Equipment | SolarOS",
  description: "Review panels, inverters, batteries, and equipment records linked to warranties and service work.",
};

export default function EquipmentPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Equipment" />
      <div className="mt-4 md:mt-6">
        <AssetFoundationPage initialTab="equipment" />
      </div>
    </>
  );
}
