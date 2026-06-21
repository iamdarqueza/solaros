import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import AssetFoundationPage from "@/components/assets/AssetFoundationPage";

export const metadata: Metadata = {
  title: "Installations | SolarOS",
  description: "Manage frontend-only mock views for sites, solar systems, equipment, and installation handover records.",
};

export default function InstallationsPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Installations" />
      <div className="mt-4 md:mt-6">
        <AssetFoundationPage initialTab="installations" />
      </div>
    </>
  );
}
