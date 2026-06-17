import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import WorkOrderDetail from "@/components/work-orders/WorkOrderDetail";

export const metadata: Metadata = {
  title: "Work Order Detail | SolarOps",
  description: "View and manage a single work order, including technician assignment, photos, and service report.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <>
      <PageBreadcrumb pageTitle="Work Order Detail" />
      <div className="mt-4 md:mt-6">
        <WorkOrderDetail id={id} />
      </div>
    </>
  );
}
