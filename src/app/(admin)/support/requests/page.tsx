import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SupportTicketList from "@/components/support/SupportTicketList";

export const metadata: Metadata = {
  title: "Customer Requests | SolarOS",
  description: "Review customer questions, issues, and support requests that may create or link to work orders.",
};

export default function CustomerRequestsPage() {
  return (
    <>
      <PageBreadcrumb pageTitle="Support - Customer Requests" />
      <div className="mt-4 md:mt-6">
        <SupportTicketList initialStatusFilter="open" />
      </div>
    </>
  );
}
