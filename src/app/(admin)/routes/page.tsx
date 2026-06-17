"use client";
import React from 'react';
import RoutesTable from '@/components/routes/RoutesTable';
import PageBreadCrumb from "@/components/common/PageBreadCrumb";

export default function RoutesPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Routes" />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Routes Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage route plans for your fleet operations including deliveries, pickups, inspections, and more.
          </p>
        </div>
        
        <RoutesTable />
      </div>
    </>
  );
} 