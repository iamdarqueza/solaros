import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import AttachmentsTable from '@/components/attachments/AttachmentsTable';

export const metadata: Metadata = {
  title: "Attachments & Equipment | Fleet Management Platform",
  description: "Manage your fleet attachments and equipment",
};

export default function AttachmentsPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Attachments & Equipment" />
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12">
          <AttachmentsTable />
        </div>
      </div>
    </>
  );
} 