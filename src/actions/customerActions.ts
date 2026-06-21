"use server";

import { getCurrentMembership } from "@/lib/supabaseServer";
import type { Customer, CustomerPortalStatus, SystemType } from "@/services/customersService";

export interface CreateCustomerInput {
  customerName: string;
  customerType?: SystemType;
  companyName?: string;
  primaryContactName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
}

function compactAddress(input: CreateCustomerInput) {
  return [
    input.addressLine1,
    input.addressLine2,
    input.city,
    input.region,
    input.postalCode,
    input.country,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

function splitCustomerName(name: string) {
  const parts = name.trim().split(/\s+/);
  const firstName = parts.shift() || name.trim();
  return {
    first_name: firstName,
    last_name: parts.join(" "),
  };
}

function buildNotes(input: CreateCustomerInput) {
  return [
    input.companyName?.trim() ? `Company: ${input.companyName.trim()}` : "",
    input.primaryContactName?.trim() ? `Primary contact: ${input.primaryContactName.trim()}` : "",
    input.notes?.trim() ? input.notes.trim() : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function createCustomerAction(accessToken: string, input: CreateCustomerInput): Promise<Customer> {
  const { supabase, user, organizationId } = await getCurrentMembership(accessToken);
  const customerName = input.customerName.trim();

  if (!customerName) {
    throw new Error("Customer name is required.");
  }

  const address = compactAddress(input);
  const notes = buildNotes(input);
  const customerType = input.customerType || "residential";
  const portalStatus: CustomerPortalStatus = "not_invited";

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      organization_id: organizationId,
      name: customerName,
      customer_type: customerType,
      primary_email: input.email?.trim() || null,
      primary_phone: input.phone?.trim() || null,
      billing_address: address || null,
      notes: notes || null,
      portal_status: portalStatus,
      created_by: user.id,
    })
    .select("id, organization_id, customer_code, name, customer_type, primary_email, primary_phone, billing_address, notes, portal_status, created_at, updated_at")
    .single();

  if (customerError) throw customerError;

  const contactName = input.primaryContactName?.trim();
  if (contactName) {
    const { error: contactError } = await supabase.from("customer_contacts").insert({
      organization_id: organizationId,
      customer_id: customer.id,
      full_name: contactName,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      role: input.companyName?.trim() ? "Primary Contact" : null,
      is_primary: true,
      portal_status: portalStatus,
    });

    if (contactError) throw contactError;
  }

  const names = splitCustomerName(customer.name);

  return {
    id: customer.id,
    organization_id: customer.organization_id,
    account_number: customer.customer_code || customer.id.slice(0, 8).toUpperCase(),
    first_name: names.first_name,
    last_name: names.last_name,
    contact_person: contactName || customer.name,
    email: customer.primary_email || "",
    phone: customer.primary_phone || "",
    address: customer.billing_address || "",
    city: input.city?.trim() || "",
    state: input.region?.trim() || "",
    zip: input.postalCode?.trim() || "",
    status: "active",
    portal_status: portalStatus,
    system_type: customerType,
    region: input.region?.trim() || input.city?.trim() || "",
    site_count: 0,
    installations_count: 0,
    open_tickets: 0,
    active_warranties: 0,
    warranty_status: "none",
    upcoming_maintenance_date: "",
    last_service_date: "",
    created_at: customer.created_at.slice(0, 10),
    updated_at: customer.updated_at,
    notes_count: customer.notes ? 1 : 0,
  };
}

export async function appendCustomerNoteAction(accessToken: string, customerId: string, content: string) {
  const { supabase, profile, user } = await getCurrentMembership(accessToken);
  const { data: customer, error: readError } = await supabase
    .from("customers")
    .select("notes")
    .eq("id", customerId)
    .maybeSingle();

  if (readError) throw readError;
  if (!customer) throw new Error("Customer not found.");

  const note = [
    new Date().toISOString(),
    profile?.full_name || user.email || "SolarOS User",
    content.trim(),
  ].join(" | ");

  const { error: updateError } = await supabase
    .from("customers")
    .update({
      notes: customer.notes ? `${note}\n${customer.notes}` : note,
    })
    .eq("id", customerId);

  if (updateError) throw updateError;

  return {
    id: `note-${Date.now()}`,
    customer_id: customerId,
    author_name: profile?.full_name || user.email || "SolarOS User",
    author_role: "Staff",
    content,
    created_at: new Date().toISOString(),
    is_pinned: false,
  };
}
