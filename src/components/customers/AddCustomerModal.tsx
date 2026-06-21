"use client";

import React, { useState } from "react";
import {
  customersService,
  CreateCustomerInput,
  Customer,
  SystemType,
} from "@/services/customersService";
import { getPortalStatusBadge } from "./CustomerUIHelpers";

interface AddCustomerModalProps {
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}

type FormState = Required<Omit<CreateCustomerInput, "customerType">> & {
  customerType: SystemType;
};

const CUSTOMER_TYPE_OPTIONS: { value: SystemType; label: string }[] = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "other", label: "Other" },
];

const INITIAL_FORM: FormState = {
  customerName: "",
  customerType: "residential",
  companyName: "",
  primaryContactName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
  notes: "",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  const digitCount = value.replace(/\D/g, "").length;
  return digitCount >= 7 && /^[\d\s()+.-]+$/.test(value);
}

export default function AddCustomerModal({ onClose, onCreated }: AddCustomerModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const saveDisabled = saving || !form.customerName.trim();

  const set = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.submit;
      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.customerName.trim()) {
      nextErrors.customerName = "Customer name is required.";
    }

    if (form.email.trim() && !isValidEmail(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.phone.trim() && !isValidPhone(form.phone.trim())) {
      nextErrors.phone = "Enter a valid phone number.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const customer = await customersService.createCustomer({
        customerName: form.customerName.trim(),
        customerType: form.customerType,
        companyName: form.companyName.trim() || undefined,
        primaryContactName: form.primaryContactName.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        addressLine1: form.addressLine1.trim() || undefined,
        addressLine2: form.addressLine2.trim() || undefined,
        city: form.city.trim() || undefined,
        region: form.region.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
        country: form.country.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      onCreated(customer);
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : "Customer could not be added. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={saving ? undefined : onClose} />
      <div className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-dark sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Add Customer</h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Create a customer record now. Portal access can be invited later.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Close add customer form"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-6">
            <section>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Basic Customer Information</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Only the customer name is required.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Customer name <span className="text-error-500">*</span>
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={form.customerName}
                    onChange={(event) => set("customerName", event.target.value)}
                    placeholder="Jane Smith or Sunrise Foods"
                    className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white ${
                      errors.customerName ? "border-error-400" : "border-gray-200 dark:border-gray-700"
                    }`}
                  />
                  {errors.customerName && <p className="mt-1 text-xs text-error-500">{errors.customerName}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Customer type
                  </label>
                  <select
                    value={form.customerType}
                    onChange={(event) => set("customerType", event.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {CUSTOMER_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company name
                  </label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(event) => set("companyName", event.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Primary contact person
                  </label>
                  <input
                    type="text"
                    value={form.primaryContactName}
                    onChange={(event) => set("primaryContactName", event.target.value)}
                    placeholder="Optional contact name"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </section>

            <section>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Contact Information</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Email or phone is helpful, but neither is required to create a customer record.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => set("email", event.target.value)}
                    placeholder="customer@example.com"
                    className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white ${
                      errors.email ? "border-error-400" : "border-gray-200 dark:border-gray-700"
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-error-500">{errors.email}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => set("phone", event.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white ${
                      errors.phone ? "border-error-400" : "border-gray-200 dark:border-gray-700"
                    }`}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-error-500">{errors.phone}</p>}
                </div>
              </div>
            </section>

            <details className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <summary className="cursor-pointer text-sm font-semibold text-gray-800 dark:text-white/90">
                Optional site address
              </summary>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This can be used as a starter address later. It will not create a site or solar system now.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address line 1
                  </label>
                  <input
                    type="text"
                    value={form.addressLine1}
                    onChange={(event) => set("addressLine1", event.target.value)}
                    placeholder="Street address"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address line 2
                  </label>
                  <input
                    type="text"
                    value={form.addressLine2}
                    onChange={(event) => set("addressLine2", event.target.value)}
                    placeholder="Apartment, suite, unit"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(event) => set("city", event.target.value)}
                    placeholder="City"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    State / Province / Region
                  </label>
                  <input
                    type="text"
                    value={form.region}
                    onChange={(event) => set("region", event.target.value)}
                    placeholder="Region"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Postal code</label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(event) => set("postalCode", event.target.value)}
                    placeholder="Postal code"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(event) => set("country", event.target.value)}
                    placeholder="Country"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </details>

            <section>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) => set("notes", event.target.value)}
                placeholder="Anything useful for the team to know later"
                className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </section>

            <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Portal Access</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    You can invite this customer after adding their site, installation, warranties, or documents.
                  </p>
                </div>
                <div>{getPortalStatusBadge("not_invited")}</div>
              </div>
            </section>

            {errors.submit && (
              <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
                {errors.submit}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 -mx-5 mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-dark sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveDisabled}
              className="h-10 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
