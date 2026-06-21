import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import AssetFoundationPage from "@/components/assets/AssetFoundationPage";

export const metadata: Metadata = {
  title: "Sites | SolarOS",
  description: "Review customer properties, service access notes, and site records used across SolarOS.",
};

export default function SitesPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Sites" />
      <div className="mt-4 md:mt-6">
        <AssetFoundationPage initialTab="sites" />
      </div>
    </>
  );
}
