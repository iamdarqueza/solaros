import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import WorkOrderList from "@/components/work-orders/WorkOrderList";

export const metadata: Metadata = {
  title: "Active Work Orders | SolarOps",
  description: "View and manage active work orders including new, scheduled, and in-progress field service jobs.",
};

export default function ActiveWorkOrdersPage() {
  return (
    <>
      <PageBreadcrumb pageTitle="Work Orders — Active" />
      <div className="mt-4 md:mt-6">
        <WorkOrderList initialFilter="active" />
      </div>
    </>
  );
}
