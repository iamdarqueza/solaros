"use client";
import React, { useState } from "react";
import { useCustomerPortal } from "@/app/(customer)/layout";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

export default function CustomerHeader() {
  const { customer, setCustomer, allCustomers } = useCustomerPortal();
  const [showSwitcher, setShowSwitcher] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        {/* Left: Logo on mobile + greeting */}
        <div className="flex items-center gap-3">
          {/* Logo — mobile only */}
          <div className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            {customer ? (
              <>
                <p className="text-sm font-semibold text-gray-900">
                  {getGreeting()}, {customer.first_name}!
                </p>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Account #{customer.account_number}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-gray-900">Customer Portal</p>
            )}
          </div>
        </div>

        {/* Right: demo switcher + avatar */}
        <div className="flex items-center gap-3">
          {/* Demo: Switch customer */}
          <div className="relative">
            <button
              id="customer-switcher-btn"
              onClick={() => setShowSwitcher(!showSwitcher)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
              <span className="hidden sm:inline">Demo: Switch Account</span>
              <span className="sm:hidden">Switch</span>
            </button>

            {showSwitcher && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-white border border-gray-200 shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Demo Account</p>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {allCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCustomer(c);
                        setShowSwitcher(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                        customer?.id === c.id ? "bg-brand-50" : ""
                      }`}
                    >
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                        customer?.id === c.id ? "bg-brand-500" : "bg-gray-400"
                      }`}>
                        {getInitials(c.first_name, c.last_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {c.first_name} {c.last_name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{c.account_number} · {c.system_type}</p>
                      </div>
                      {customer?.id === c.id && (
                        <svg className="w-4 h-4 text-brand-500 flex-shrink-0 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          {customer && (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
              {getInitials(customer.first_name, customer.last_name)}
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close switcher */}
      {showSwitcher && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSwitcher(false)}
        />
      )}
    </header>
  );
}
