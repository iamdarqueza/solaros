import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SupportTicketList from "@/components/support/SupportTicketList";

export const metadata: Metadata = {
  title: "Support Tickets | SolarOS",
  description: "Manage customer support tickets, track issues, and communicate with customers from a central support hub.",
};

export default function SupportTicketsPage() {
  return (
    <>
      <PageBreadcrumb pageTitle="Customer Support — Tickets" />
      <div className="mt-4 md:mt-6">
        <SupportTicketList />
      </div>
    </>
  );
}
