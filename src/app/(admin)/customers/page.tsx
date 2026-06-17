import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import CustomersTable from "@/components/customers/CustomersTable";

export const metadata: Metadata = {
  title: "Customers | SolarOps",
  description: "Manage your solar customers, view installation history, warranties, and service records.",
};

export default function CustomersPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Customers" />
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6">
        <div className="col-span-12">
          <CustomersTable />
        </div>
      </div>
    </>
  );
}
