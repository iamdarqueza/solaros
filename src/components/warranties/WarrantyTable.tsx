"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { warrantyService, Warranty } from "@/services/warrantyService";
import {
  getWarrantyStatusBadge,
  getWarrantyTypeBadge,
  ExpirationCountdown,
  formatDate,
} from "./WarrantyUIHelpers";

type FilterStatus = "all" | Warranty["status"];
type FilterType = "all" | Warranty["warranty_type"];

export default function WarrantyTable({
  mode = "all",
}: {
  mode?: "all" | "active" | "expiring";
}) {
  const router = useRouter();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [filtered, setFiltered] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      let data: Warranty[];
      if (mode === "active") data = await warrantyService.getActiveWarranties();
      else if (mode === "expiring") data = await warrantyService.getExpiringSoonWarranties();
      else data = await warrantyService.getAllWarranties();
      setWarranties(data);
      setFiltered(data);
      setLoading(false);
    };
    load();
  }, [mode]);

  useEffect(() => {
    let result = warranties;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.product.toLowerCase().includes(q) ||
          w.manufacturer.toLowerCase().includes(q) ||
          w.serial_number.toLowerCase().includes(q) ||
          w.customer_name.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") result = result.filter((w) => w.status === statusFilter);
    if (typeFilter !== "all") result = result.filter((w) => w.warranty_type === typeFilter);
    setFiltered(result);
  }, [warranties, search, statusFilter, typeFilter]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeFilterCount = [
    statusFilter !== "all",
    typeFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setSearch("");
  };

  const title =
    mode === "active"
      ? "Active Warranties"
      : mode === "expiring"
      ? "Expiring Soon"
      : "All Warranties";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
      {/* Header */}
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {loading ? "Loading..." : `${filtered.length} of ${warranties.length} warranties`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="warranty-search"
              placeholder="Search product, manufacturer, serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-64 pl-9 pr-4 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter button */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 h-10 rounded-lg border px-3 text-sm font-medium transition-colors ${
                activeFilterCount > 0
                  ? "border-brand-300 dark:border-brand-600 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {showFilterPanel && (
              <div className="absolute right-0 top-12 z-20 w-72 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-dark shadow-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Filters</h3>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-xs text-brand-500 hover:text-brand-600 font-medium">
                      Clear all
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(["all", "active", "expiring_soon", "expired"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          statusFilter === s
                            ? "bg-brand-500 text-white"
                            : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                      >
                        {s === "all" ? "All" : s === "expiring_soon" ? "Expiring Soon" : s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(["all", "equipment", "labor", "performance", "comprehensive"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          typeFilter === t
                            ? "bg-brand-500 text-white"
                            : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add Warranty */}
          <button
            id="add-warranty-btn"
            className="flex items-center gap-2 h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Warranty
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white dark:bg-gray-dark z-10">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {["Product", "Manufacturer / Serial", "Type", "Warranty Period", "Status", "Time Left", "Claims", ""].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 first:pl-5 last:pr-5"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-4 first:pl-5 last:pr-5">
                      <div className="h-4 rounded bg-gray-100 dark:bg-gray-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No warranties found</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
                    {(search || activeFilterCount > 0) && (
                      <button onClick={clearFilters} className="mt-3 text-sm text-brand-500 hover:text-brand-600 font-medium">
                        Clear all filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((warranty) => (
                <tr
                  key={warranty.id}
                  onClick={() => router.push(`/warranties/${warranty.id}`)}
                  className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                >
                  {/* Product */}
                  <td className="px-4 py-3.5 pl-5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                        warranty.warranty_type === "equipment"
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : warranty.warranty_type === "labor"
                          ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          : warranty.warranty_type === "performance"
                          ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                          : "bg-success-50 dark:bg-success-500/10 text-success-600 dark:text-success-400"
                      }`}>
                        {warranty.warranty_type === "equipment" ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                          </svg>
                        ) : warranty.warranty_type === "labor" ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ) : warranty.warranty_type === "performance" ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
                          {warranty.product}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                          {warranty.customer_name}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Manufacturer / Serial */}
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{warranty.manufacturer}</p>
                    <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-0.5">{warranty.serial_number}</p>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3.5">{getWarrantyTypeBadge(warranty.warranty_type)}</td>

                  {/* Period */}
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(warranty.warranty_start)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">→ {formatDate(warranty.warranty_end)}</p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">{getWarrantyStatusBadge(warranty.status)}</td>

                  {/* Time Left */}
                  <td className="px-4 py-3.5">
                    <ExpirationCountdown daysRemaining={warranty.days_remaining} />
                  </td>

                  {/* Claims */}
                  <td className="px-4 py-3.5">
                    {warranty.claim_count > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        {warranty.claim_count} claim{warranty.claim_count !== 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>

                  {/* Arrow */}
                  <td className="px-4 py-3.5 pr-5">
                    <svg
                      className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-brand-400 dark:group-hover:text-brand-500 transition-colors"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Showing {filtered.length} of {warranties.length} warranties
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Click any row to view details</p>
        </div>
      )}
    </div>
  );
}
