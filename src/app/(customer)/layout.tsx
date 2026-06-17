"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getAllCustomers, type Customer } from "@/services/customerPortalService";
import CustomerSidebar from "@/components/customer-portal/CustomerSidebar";
import CustomerBottomNav from "@/components/customer-portal/CustomerBottomNav";
import CustomerHeader from "@/components/customer-portal/CustomerHeader";

/* ── Customer Portal Context ─────────────────────────────────────────────────── */

interface CustomerContextValue {
  customer: Customer | null;
  setCustomer: (c: Customer) => void;
  allCustomers: Customer[];
  loading: boolean;
}

export const CustomerContext = createContext<CustomerContextValue>({
  customer: null,
  setCustomer: () => {},
  allCustomers: [],
  loading: true,
});

export function useCustomerPortal() {
  return useContext(CustomerContext);
}

/* ── Layout ──────────────────────────────────────────────────────────────────── */

export default function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [customer, setCustomerState] = useState<Customer | null>(null);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllCustomers().then((customers) => {
      setAllCustomers(customers);

      // Restore from localStorage, default to first active customer
      const savedId = localStorage.getItem("portalCustomerId");
      const active = customers.find((c) => c.status === "active");
      const found = savedId ? customers.find((c) => c.id === savedId) : null;
      setCustomerState(found ?? active ?? customers[0] ?? null);
      setLoading(false);
    });
  }, []);

  function setCustomer(c: Customer) {
    setCustomerState(c);
    localStorage.setItem("portalCustomerId", c.id);
  }

  return (
    <CustomerContext.Provider value={{ customer, setCustomer, allCustomers, loading }}>
      <div className="min-h-screen bg-gray-50 font-outfit">
        {/* Sidebar — hidden on mobile */}
        <CustomerSidebar />

        {/* Main content area — offset by sidebar on desktop */}
        <div className="lg:pl-64">
          {/* Top header */}
          <CustomerHeader />

          {/* Page content */}
          <main className="px-4 py-6 pb-28 md:px-6 lg:pb-8">
            <div className="mx-auto max-w-4xl">
              {children}
            </div>
          </main>
        </div>

        {/* Bottom nav — visible on mobile only */}
        <CustomerBottomNav />
      </div>
    </CustomerContext.Provider>
  );
}
