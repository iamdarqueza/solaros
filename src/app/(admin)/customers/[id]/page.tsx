import React from "react";
import { Metadata } from "next";
import CustomerProfile from "@/components/customers/CustomerProfile";

export const metadata: Metadata = {
  title: "Customer Profile | SolarOps",
  description: "View customer details, solar installations, warranties, maintenance history, and support tickets.",
};

interface CustomerProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerProfilePage({ params }: CustomerProfilePageProps) {
  const { id } = await params;
  return (
    <div className="mt-4 md:mt-6">
      <CustomerProfile customerId={id} />
    </div>
  );
}
