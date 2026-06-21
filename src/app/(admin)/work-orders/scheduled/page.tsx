import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import WorkOrderList from "@/components/work-orders/WorkOrderList";

export const metadata: Metadata = {
  title: "Scheduled Work Orders | SolarOS",
  description: "Review scheduled field service jobs assigned from tickets, maintenance visits, or warranty claims.",
};

export default function ScheduledWorkOrdersPage() {
  return (
    <>
      <PageBreadcrumb pageTitle="Work Orders - Scheduled" />
      <div className="mt-4 md:mt-6">
        <WorkOrderList initialFilter="scheduled" />
      </div>
    </>
  );
}
