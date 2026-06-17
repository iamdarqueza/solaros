"use client";
import React, { useEffect, useState } from "react";
import { customersService, Customer, Warranty } from "@/services/customersService";
import {
  getWarrantyStatusBadge,
  formatDate,
  TabSkeleton,
  EmptyState,
  SectionCard,
} from "../CustomerUIHelpers";

interface WarrantiesTabProps {
  customer: Customer;
}

function getDaysUntilExpiry(expiryDate: string): number {
  const now = new Date();
  const exp = new Date(expiryDate);
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function WarrantiesTab({ customer }: WarrantiesTabProps) {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customersService.getWarranties(customer.id).then((data) => {
      setWarranties(data);
      setLoading(false);
    });
  }, [customer.id]);

  if (loading) return <TabSkeleton />;

  const active = warranties.filter((w) => w.status === "active");
  const expiringSoon = warranties.filter((w) => w.status === "expiring_soon");
  const expired = warranties.filter((w) => w.status === "expired");

  const grouped = [
    { label: "Expiring Soon", items: expiringSoon, urgent: true },
    { label: "Active", items: active, urgent: false },
    { label: "Expired", items: expired, urgent: false },
  ].filter((g) => g.items.length > 0);

  if (warranties.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        }
        title="No warranties found"
        message="No warranty records are on file for this customer."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", count: active.length, color: "text-success-600 dark:text-success-400", bg: "bg-success-50 dark:bg-success-500/10" },
          { label: "Expiring Soon", count: expiringSoon.length, color: "text-warning-600 dark:text-warning-400", bg: "bg-warning-50 dark:bg-warning-500/10" },
          { label: "Expired", count: expired.length, color: "text-error-600 dark:text-error-400", bg: "bg-error-50 dark:bg-error-500/10" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl ${s.bg} p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grouped warranty rows */}
      {grouped.map((group) => (
        <div key={group.label}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {group.label}
            </h3>
            {group.urgent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Action Needed
              </span>
            )}
          </div>

          <SectionCard>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["Component", "Manufacturer", "Coverage", "Start Date", "Expiry", "Days Left", "Claims", "Status"].map(
                      (col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {group.items.map((w) => {
                    const days = getDaysUntilExpiry(w.expiry_date);
                    return (
                      <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                          {w.component}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {w.manufacturer}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {w.coverage_type}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(w.start_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(w.expiry_date)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm font-medium ${
                              days < 0
                                ? "text-error-600 dark:text-error-400"
                                : days < 365
                                ? "text-warning-600 dark:text-warning-400"
                                : "text-success-600 dark:text-success-400"
                            }`}
                          >
                            {days < 0
                              ? `Expired`
                              : days < 365
                              ? `${days}d`
                              : `${Math.floor(days / 365)}y`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {w.claim_count}
                        </td>
                        <td className="px-4 py-3">{getWarrantyStatusBadge(w.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      ))}
    </div>
  );
}
