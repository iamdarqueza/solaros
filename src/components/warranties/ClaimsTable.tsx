"use client";
import React, { useEffect, useState } from "react";
import { warrantyService, WarrantyClaim } from "@/services/warrantyService";
import { getClaimStatusBadge, getClaimPriorityBadge, formatDate } from "./WarrantyUIHelpers";

type StatusFilter = "all" | WarrantyClaim["status"];

export default function ClaimsTable() {
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [filtered, setFiltered] = useState<WarrantyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    warrantyService.getAllClaims().then((data) => {
      setClaims(data);
      setFiltered(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = claims;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.claim_number.toLowerCase().includes(q) ||
          c.customer_name.toLowerCase().includes(q) ||
          c.product.toLowerCase().includes(q) ||
          c.manufacturer.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") result = result.filter((c) => c.status === statusFilter);
    setFiltered(result);
  }, [claims, search, statusFilter]);

  const activeFilters = [statusFilter !== "all"].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setSearch("");
  };

  const pendingCount = claims.filter((c) => c.status === "pending" || c.status === "in_progress").length;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
      {/* Header */}
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Warranty Claims</h2>
            {pendingCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-warning-500 px-1.5 text-[10px] font-semibold text-white">
                {pendingCount} open
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {loading ? "Loading..." : `${filtered.length} of ${claims.length} claims`}
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
              id="claims-search"
              placeholder="Search claim, customer, product..."
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

          {/* Status filter pills */}
          <div className="flex gap-1.5">
            {(["all", "pending", "in_progress", "approved", "resolved", "denied"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`h-10 rounded-lg px-3 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-brand-500 text-white"
                    : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="h-10 text-xs text-brand-500 hover:text-brand-600 font-medium px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white dark:bg-gray-dark z-10">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {["Claim #", "Customer / Product", "Priority", "Issue", "Assigned To", "Filed", "Status"].map((col) => (
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
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-4 first:pl-5 last:pr-5">
                      <div className="h-4 rounded bg-gray-100 dark:bg-gray-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No claims found</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filter</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((claim) => (
                <tr
                  key={claim.id}
                  className={`group transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] ${
                    claim.status === "pending" ? "bg-warning-50/30 dark:bg-warning-500/[0.04]" : ""
                  }`}
                >
                  {/* Claim # */}
                  <td className="px-4 py-3.5 pl-5">
                    <span className="text-xs font-mono font-medium text-gray-600 dark:text-gray-400">
                      {claim.claim_number}
                    </span>
                  </td>

                  {/* Customer / Product */}
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{claim.customer_name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{claim.product}</p>
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3.5">{getClaimPriorityBadge(claim.priority)}</td>

                  {/* Issue */}
                  <td className="px-4 py-3.5 max-w-xs">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{claim.issue_description}</p>
                  </td>

                  {/* Assigned */}
                  <td className="px-4 py-3.5">
                    {claim.assigned_to ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                          {claim.assigned_to.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{claim.assigned_to}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">Unassigned</span>
                    )}
                  </td>

                  {/* Filed */}
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(claim.submitted_date)}</span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 pr-5">{getClaimStatusBadge(claim.status)}</td>
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
            Showing {filtered.length} of {claims.length} claims
          </p>
        </div>
      )}
    </div>
  );
}
