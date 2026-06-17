import React from "react";
import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";

export const metadata: Metadata = {
  title: "Investigations | Fleet Management Platform",
  description: "Manage incident investigations and analysis",
};

export default function InvestigationsPage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Investigations" />
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Investigation Management
              </h3>
              <button className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Start Investigation
              </button>
            </div>
            
            <div className="text-center py-12">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10">
                <svg className="h-10 w-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                No Active Investigations
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Conduct thorough investigations to improve fleet safety and operations.
              </p>
              <div className="mt-6">
                <button className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Start Your First Investigation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 