import React from "react";
import { Metadata } from "next";
import VehiclesTable from "@/components/vehicles/VehiclesTable";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";

export const metadata: Metadata = {
  title: "Fleet Vehicles | Fleet Management Platform",
  description: "Manage your fleet vehicles",
};

export default function VehiclesPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Fleet Vehicles" />
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12">
          <VehiclesTable />
        </div>
      </div>
    </>
  );
} 