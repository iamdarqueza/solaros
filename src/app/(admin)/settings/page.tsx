import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import SettingsPage from "@/components/settings/SettingsPage";

export const metadata: Metadata = {
  title: "Settings | SolarOS",
  description:
    "Configure frontend-only company, user role, service, work order, maintenance, warranty, notification, customer portal, and billing settings.",
};

export default function SettingsRoutePage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Settings" />
      <div className="mt-4 md:mt-6">
        <SettingsPage />
      </div>
    </>
  );
}
