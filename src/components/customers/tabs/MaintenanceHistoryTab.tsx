"use client";
import React, { useEffect, useState } from "react";
import { customersService, Customer, MaintenanceRecord } from "@/services/customersService";
import {
  formatDate,
  TabSkeleton,
  EmptyState,
  SectionCard,
  getMaintenanceIcon,
} from "../CustomerUIHelpers";

interface MaintenanceHistoryTabProps {
  customer: Customer;
}

export default function MaintenanceHistoryTab({ customer }: MaintenanceHistoryTabProps) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>("all");

  useEffect(() => {
    customersService.getMaintenanceHistory(customer.id).then((data) => {
      const sorted = [...data].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setRecords(sorted);
      setLoading(false);
    });
  }, [customer.id]);

  if (loading) return <TabSkeleton />;

  const years = [...new Set(records.map((r) => new Date(r.date).getFullYear().toString()))].sort(
    (a, b) => Number(b) - Number(a)
  );

  const filtered =
    filterYear === "all"
      ? records
      : records.filter((r) => new Date(r.date).getFullYear().toString() === filterYear);

  const totalCost = filtered.reduce((sum, r) => sum + r.cost_usd, 0);

  if (records.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        title="No maintenance history"
        message="No maintenance visits have been recorded for this customer yet."
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Filter row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Filter by year:</span>
          <div className="flex gap-1.5">
            {["all", ...years].map((y) => (
              <button
                key={y}
                onClick={() => setFilterYear(y)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterYear === y
                    ? "bg-brand-500 text-white"
                    : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                {y === "all" ? "All" : y}
              </button>
            ))}
          </div>
        </div>
        {totalCost > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Total billed: <span className="font-semibold text-gray-700 dark:text-gray-300">${totalCost.toLocaleString()}</span>
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-800 hidden sm:block" />

        <div className="space-y-4">
          {filtered.map((record) => (
            <SectionCard key={record.id} className="sm:ml-12">
              <div className="p-5">
                {/* Timeline dot */}
                <div className="sm:absolute sm:-left-[1.35rem] sm:mt-0.5 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-gray-dark border-2 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  {getMaintenanceIcon(record.work_type)}
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                        {record.work_type}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(record.date)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {record.description}
                    </p>

                    {/* Outcome */}
                    <div className="mt-3 rounded-lg bg-success-50 dark:bg-success-500/10 border border-success-100 dark:border-success-500/20 p-3">
                      <p className="text-xs font-medium text-success-700 dark:text-success-400 mb-0.5">
                        Outcome
                      </p>
                      <p className="text-sm text-success-800 dark:text-success-300">{record.outcome}</p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {record.cost_usd === 0 ? (
                        <span className="text-success-600 dark:text-success-400">Warranty</span>
                      ) : (
                        `$${record.cost_usd}`
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {record.duration_hours}h
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{record.technician_name}</span>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      </div>
    </div>
  );
}
