"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { customersService, Customer } from "@/services/customersService";
import { getCustomerStatusBadge, formatDate } from "./CustomerUIHelpers";

type StatusFilter = "all" | Customer["status"];
type SystemFilter = "all" | Customer["system_type"];

const REGIONS = ["All Regions", "Southern California", "Bay Area", "Southwest", "Texas", "Pacific Northwest", "Southeast", "Central California"];

function CustomerAvatar({ first, last }: { first: string; last: string }) {
  const initials = `${first[0]}${last[0]}`.toUpperCase();
  const colors = [
    "from-brand-400 to-brand-600",
    "from-success-400 to-success-600",
    "from-warning-400 to-warning-600",
    "from-purple-400 to-purple-600",
    "from-orange-400 to-orange-600",
  ];
  let hash = 0;
  for (const c of `${first}${last}`) hash = c.charCodeAt(0) + hash * 31;
  const color = colors[Math.abs(hash) % colors.length];
  return (
    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} text-xs font-semibold text-white`}>
      {initials}
    </div>
  );
}

export default function CustomersTable() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [systemFilter, setSystemFilter] = useState<SystemFilter>("all");
  const [regionFilter, setRegionFilter] = useState("All Regions");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    customersService.getCustomers().then((data) => {
      setCustomers(data);
      setFiltered(data);
      setLoading(false);
    });
  }, []);

  // Filter & search
  useEffect(() => {
    let result = customers;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.account_number.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (systemFilter !== "all") {
      result = result.filter((c) => c.system_type === systemFilter);
    }
    if (regionFilter !== "All Regions") {
      result = result.filter((c) => c.region === regionFilter);
    }
    setFiltered(result);
  }, [customers, search, statusFilter, systemFilter, regionFilter]);

  // Close filter panel on outside click
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
    systemFilter !== "all",
    regionFilter !== "All Regions",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setSystemFilter("all");
    setRegionFilter("All Regions");
    setSearch("");
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
      {/* Header */}
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Customers</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {loading ? "Loading..." : `${filtered.length} of ${customers.length} customers`}
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
              id="customer-search"
              placeholder="Search name, email, account..."
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

            {/* Filter panel */}
            {showFilterPanel && (
              <div className="absolute right-0 top-12 z-20 w-72 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-dark shadow-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Filters</h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Status
                  </label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(["all", "active", "inactive", "prospect", "suspended"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          statusFilter === s
                            ? "bg-brand-500 text-white"
                            : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* System type */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    System Type
                  </label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(["all", "residential", "commercial", "industrial"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSystemFilter(s)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          systemFilter === s
                            ? "bg-brand-500 text-white"
                            : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Region */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Region
                  </label>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Add Customer */}
          <button
            id="add-customer-btn"
            className="flex items-center gap-2 h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Customer
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white dark:bg-gray-dark z-10">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {["Customer", "Contact", "System", "Installations", "Last Service", "Open Tickets", "Status", ""].map((col) => (
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No customers found</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Try adjusting your search or filters
                    </p>
                    {(search || activeFilterCount > 0) && (
                      <button
                        onClick={clearFilters}
                        className="mt-3 text-sm text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 font-medium"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => router.push(`/customers/${customer.id}`)}
                  className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                >
                  {/* Customer */}
                  <td className="px-4 py-3.5 pl-5">
                    <div className="flex items-center gap-3">
                      <CustomerAvatar first={customer.first_name} last={customer.last_name} />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {customer.first_name} {customer.last_name}
                        </p>
                        <p className="text-xs font-mono text-gray-400 dark:text-gray-500">
                          {customer.account_number}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{customer.email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{customer.phone}</p>
                  </td>

                  {/* System type */}
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {customer.system_type}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{customer.region}</p>
                    </div>
                  </td>

                  {/* Installations */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                        {customer.installations_count}
                      </span>
                    </div>
                  </td>

                  {/* Last service */}
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {customer.last_service_date ? formatDate(customer.last_service_date) : "Never"}
                    </span>
                  </td>

                  {/* Open tickets */}
                  <td className="px-4 py-3.5">
                    {customer.open_tickets > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-warning-50 dark:bg-warning-500/10 px-2.5 py-0.5 text-xs font-medium text-warning-700 dark:text-warning-400">
                        {customer.open_tickets} open
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">{getCustomerStatusBadge(customer.status)}</td>

                  {/* Action arrow */}
                  <td className="px-4 py-3.5 pr-5">
                    <svg
                      className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-brand-400 dark:group-hover:text-brand-500 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
            Showing {filtered.length} of {customers.length} customers
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Click any row to view profile
          </p>
        </div>
      )}
    </div>
  );
}
