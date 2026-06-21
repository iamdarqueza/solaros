import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import MaintenanceDetail from "@/components/maintenance/MaintenanceDetail";

export const metadata: Metadata = {
  title: "Maintenance Detail | SolarOS",
  description: "View maintenance visit details, complete the checklist, upload site photos, and add completion notes.",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MaintenanceDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <PageBreadCrumb pageTitle="Maintenance Detail" />
      <div className="mt-4 md:mt-6">
        <MaintenanceDetail id={id} />
      </div>
    </>
  );
}
