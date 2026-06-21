"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCustomerPortal } from "@/app/(customer)/layout";
import {
  customerPortalService,
  type PortalServiceHistoryItem,
} from "@/services/customerPortalService";

const ACTIVITY_META: Record<PortalServiceHistoryItem["type"], { label: string; icon: string; bg: string; text: string }> = {
  support: { label: "Support", icon: "🎫", bg: "bg-blue-50", text: "text-blue-700" },
  work_order: { label: "Service Visit", icon: "🔧", bg: "bg-brand-50", text: "text-brand-700" },
  maintenance: { label: "Maintenance", icon: "🗓️", bg: "bg-emerald-50", text: "text-emerald-700" },
  warranty: { label: "Warranty", icon: "🛡️", bg: "bg-amber-50", text: "text-amber-700" },
};

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
      <div className="text-5xl mb-3">📋</div>
      <p className="text-base font-semibold text-gray-700">No service history yet</p>
      <p className="text-sm text-gray-400 mt-1">Completed visits, support updates, and warranty activity will appear here.</p>
    </div>
  );
}

export default function MyServiceHistoryPage() {
  const { customer } = useCustomerPortal();
  const [items, setItems] = useState<PortalServiceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    customerPortalService.getMyServiceHistory(customer.id).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [customer]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Service History</h1>
        <p className="text-sm text-gray-500 mt-1">
          A simple timeline of support requests, service visits, maintenance, warranty updates, and completed reports.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-gray-200" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-2 bottom-2 hidden w-0.5 bg-gray-200 sm:block" />
          <div className="space-y-4">
            {items.map((item) => {
              const meta = ACTIVITY_META[item.type];
              return (
                <div key={item.id} className="relative sm:pl-14">
                  <div className={`absolute left-1 top-4 hidden h-9 w-9 items-center justify-center rounded-full border-4 border-gray-50 sm:flex ${meta.bg}`}>
                    <span>{meta.icon}</span>
                  </div>

                  <Link
                    href={item.href ?? "#"}
                    className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xl sm:hidden">{meta.icon}</span>
                          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.bg} ${meta.text}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs font-medium text-gray-500">
                          {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <p className="mt-1 text-xs capitalize text-gray-400">{item.statusLabel}</p>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
