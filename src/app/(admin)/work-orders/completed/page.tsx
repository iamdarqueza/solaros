import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import WorkOrderList from "@/components/work-orders/WorkOrderList";

export const metadata: Metadata = {
  title: "Completed Work Orders | SolarOps",
  description: "Review completed and cancelled work orders. Access service reports and job history.",
};

export default function CompletedWorkOrdersPage() {
  return (
    <>
      <PageBreadcrumb pageTitle="Work Orders — Completed" />
      <div className="mt-4 md:mt-6">
        <WorkOrderList initialFilter="completed" />
      </div>
    </>
  );
}
