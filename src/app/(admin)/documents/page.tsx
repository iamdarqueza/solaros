import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import DocumentLibraryPage from "@/components/documents/DocumentLibraryPage";

export const metadata: Metadata = {
  title: "Documents | SolarOS",
  description: "Browse central solar customer, site, system, equipment, warranty, ticket, and work order documents.",
};

export default function DocumentsPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Documents" />
      <div className="mt-4 md:mt-6">
        <DocumentLibraryPage />
      </div>
    </>
  );
}
