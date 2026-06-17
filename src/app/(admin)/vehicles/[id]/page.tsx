import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import VehicleDetailWrapper from "@/components/vehicles/VehicleDetailWrapper";

export const metadata: Metadata = {
  title: "Vehicle Details | Fleet Management Platform",
  description: "Detailed view of vehicle information and tracking",
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  return (
    <>
      <PageBreadCrumb pageTitle="Vehicle Details" />
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12">
          <VehicleDetailWrapper vehicleId={resolvedParams.id} />
        </div>
      </div>
    </>
  );
} 