"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { customersService, Customer } from "@/services/customersService";
import { getCustomerStatusBadge, formatDate } from "./CustomerUIHelpers";
import OverviewTab from "./tabs/OverviewTab";
import InstallationsTab from "./tabs/InstallationsTab";
import WarrantiesTab from "./tabs/WarrantiesTab";
import MaintenanceHistoryTab from "./tabs/MaintenanceHistoryTab";
import SupportTicketsTab from "./tabs/SupportTicketsTab";
import DocumentsTab from "./tabs/DocumentsTab";
import NotesTab from "./tabs/NotesTab";

interface CustomerProfileProps {
  customerId: string;
}

type TabId =
  | "overview"
  | "installations"
  | "warranties"
  | "maintenance"
  | "tickets"
  | "documents"
  | "notes";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

function getSystemTypeBadge(type: Customer["system_type"]) {
  const map = {
    residential: "Residential",
    commercial: "Commercial",
    industrial: "Industrial",
  };
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
      {map[type]}
    </span>
  );
}

export default function CustomerProfile({ customerId }: CustomerProfileProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    customersService.getCustomer(customerId).then((data) => {
      if (data) {
        setCustomer(data);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [customerId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (notFound || !customer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/10 mb-4">
          <svg className="w-8 h-8 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Customer not found</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The customer with ID &ldquo;{customerId}&rdquo; does not exist.
        </p>
        <Link
          href="/customers"
          className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          Back to Customers
        </Link>
      </div>
    );
  }

  const tabs: Tab[] = [
    {
      id: "overview",
      label: "Overview",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: "installations",
      label: "Installations",
      count: customer.installations_count,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: "warranties",
      label: "Warranties",
      count: customer.active_warranties,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      id: "maintenance",
      label: "Maintenance History",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "tickets",
      label: "Support Tickets",
      count: customer.open_tickets || undefined,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: "documents",
      label: "Documents",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "notes",
      label: "Notes",
      count: customer.notes_count || undefined,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab customer={customer} />;
      case "installations": return <InstallationsTab customer={customer} />;
      case "warranties": return <WarrantiesTab customer={customer} />;
      case "maintenance": return <MaintenanceHistoryTab customer={customer} />;
      case "tickets": return <SupportTicketsTab customer={customer} />;
      case "documents": return <DocumentsTab customer={customer} />;
      case "notes": return <NotesTab customer={customer} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/customers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white/90 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Customers
      </Link>

      {/* Profile Header Card */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark overflow-hidden">
        {/* Top banner gradient */}
        <div className="h-24 bg-gradient-to-r from-brand-500 via-brand-600 to-purple-600 relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar + main info row */}
          <div className="flex items-end gap-5 -mt-12 mb-4">
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl border-4 border-white dark:border-gray-dark bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-bold text-white shadow-lg">
              {getInitials(customer.first_name, customer.last_name)}
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {customer.first_name} {customer.last_name}
                </h1>
                {getCustomerStatusBadge(customer.status)}
                {getSystemTypeBadge(customer.system_type)}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                {customer.account_number}
              </p>
            </div>
          </div>

          {/* Contact + stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Contact Info */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Contact
              </h3>
              <div className="space-y-1.5">
                <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
                  <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {customer.email}
                </a>
                <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
                  <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {customer.phone}
                </a>
                <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <svg className="w-4 h-4 flex-shrink-0 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>
                    {customer.address}<br />
                    {customer.city}, {customer.state} {customer.zip}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="sm:col-span-1 lg:col-span-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: "Installations",
                    value: customer.installations_count,
                    icon: "⚡",
                    color: "text-brand-600 dark:text-brand-400",
                    bg: "bg-brand-50 dark:bg-brand-500/10",
                  },
                  {
                    label: "Open Tickets",
                    value: customer.open_tickets,
                    icon: "🎫",
                    color: customer.open_tickets > 0 ? "text-warning-600 dark:text-warning-400" : "text-success-600 dark:text-success-400",
                    bg: customer.open_tickets > 0 ? "bg-warning-50 dark:bg-warning-500/10" : "bg-success-50 dark:bg-success-500/10",
                  },
                  {
                    label: "Warranties",
                    value: customer.active_warranties,
                    icon: "🛡️",
                    color: "text-purple-600 dark:text-purple-400",
                    bg: "bg-purple-50 dark:bg-purple-500/10",
                  },
                  {
                    label: "Last Service",
                    value: customer.last_service_date ? formatDate(customer.last_service_date) : "None",
                    icon: "🔧",
                    color: "text-gray-600 dark:text-gray-400",
                    bg: "bg-gray-100 dark:bg-gray-800",
                  },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-xl ${stat.bg} p-3`}>
                    <div className="text-xl mb-1">{stat.icon}</div>
                    <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
        {/* Tabs */}
        <div className="border-b border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar">
          <div className="flex min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-brand-500 text-brand-600 dark:text-brand-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <span className={isActive ? "text-brand-500 dark:text-brand-400" : "text-gray-400 dark:text-gray-500"}>
                    {tab.icon}
                  </span>
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                        isActive
                          ? "bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">{renderTab()}</div>
      </div>
    </div>
  );
}
