import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import AssetFoundationPage from "@/components/assets/AssetFoundationPage";

export const metadata: Metadata = {
  title: "Solar Systems | SolarOS",
  description: "Review installed solar systems, production context, and system-level service records.",
};

export default function SolarSystemsPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Solar Systems" />
      <div className="mt-4 md:mt-6">
        <AssetFoundationPage initialTab="systems" />
      </div>
    </>
  );
}
