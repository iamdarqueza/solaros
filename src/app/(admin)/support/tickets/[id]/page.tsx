import React from "react";
import { Metadata } from "next";
import SupportTicketDetail from "@/components/support/SupportTicketDetail";

export const metadata: Metadata = {
  title: "Ticket Detail | SolarOS Support",
  description: "View and manage individual support ticket details, conversation history, and internal notes.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SupportTicketDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="mt-4 md:mt-6">
      <SupportTicketDetail ticketId={id} />
    </div>
  );
}
