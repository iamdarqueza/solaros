"use server";

import { getCurrentMembership, isUuid } from "@/lib/supabaseServer";
import type {
  SupportTicket,
  TicketIssueType,
  TicketPriority,
  TicketStatus,
} from "@/services/supportService";

interface CreateTicketInput {
  accessToken: string;
  subject: string;
  description: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  site_name?: string;
  site_address?: string;
  solar_system_name?: string;
  issue_type: TicketIssueType;
  priority: TicketPriority;
  assigned_agent_id?: string | null;
}

async function nextTicketNumber(supabase: ReturnType<typeof import("@/lib/supabaseServer").createServerActionClient>, organizationId: string) {
  const { count, error } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) throw error;
  return `TKT-${String((count ?? 0) + 3001).padStart(4, "0")}`;
}

export async function createSupportTicketAction(input: CreateTicketInput): Promise<SupportTicket> {
  const { supabase, user, organizationId } = await getCurrentMembership(input.accessToken);

  const { data: existingCustomer, error: customerLookupError } = await supabase
    .from("customers")
    .select("id, name, primary_email, primary_phone")
    .eq("organization_id", organizationId)
    .eq("primary_email", input.customer_email)
    .maybeSingle();

  if (customerLookupError) throw customerLookupError;

  let customer = existingCustomer;
  if (!customer) {
    const { data: createdCustomer, error: createCustomerError } = await supabase
      .from("customers")
      .insert({
        organization_id: organizationId,
        name: input.customer_name,
        primary_email: input.customer_email,
        primary_phone: input.customer_phone || null,
        customer_type: "residential",
        created_by: user.id,
      })
      .select("id, name, primary_email, primary_phone")
      .single();

    if (createCustomerError) throw createCustomerError;
    customer = createdCustomer;
  }

  if (!customer) throw new Error("Unable to create customer for support ticket.");

  let siteId: string | null = null;
  if (input.site_address?.trim()) {
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .insert({
        organization_id: organizationId,
        customer_id: customer.id,
        site_name: input.site_name || "Primary Site",
        address: input.site_address,
      })
      .select("id")
      .single();

    if (siteError) throw siteError;
    siteId = site.id;
  }

  let solarSystemId: string | null = null;
  if (siteId && input.solar_system_name?.trim()) {
    const { data: system, error: systemError } = await supabase
      .from("solar_systems")
      .insert({
        organization_id: organizationId,
        customer_id: customer.id,
        site_id: siteId,
        system_name: input.solar_system_name,
      })
      .select("id")
      .single();

    if (systemError) throw systemError;
    solarSystemId = system.id;
  }

  const ticketNumber = await nextTicketNumber(supabase, organizationId);
  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .insert({
      organization_id: organizationId,
      ticket_number: ticketNumber,
      customer_id: customer.id,
      site_id: siteId,
      solar_system_id: solarSystemId,
      issue_type: input.issue_type,
      priority: input.priority,
      status: "open",
      subject: input.subject,
      description: input.description,
      assigned_to: isUuid(input.assigned_agent_id) ? input.assigned_agent_id : null,
      created_by: user.id,
      customer_visible: true,
    })
    .select("id, ticket_number, subject, description, status, priority, issue_type, customer_id, site_id, solar_system_id, assigned_to, related_work_order_id, related_warranty_id, related_maintenance_visit_id, created_at, updated_at, resolved_at")
    .single();

  if (ticketError) throw ticketError;

  return {
    id: ticket.id,
    ticket_number: ticket.ticket_number,
    subject: ticket.subject,
    description: ticket.description || "",
    status: ticket.status,
    priority: ticket.priority,
    issue_type: ticket.issue_type,
    customer_id: ticket.customer_id,
    customer_name: customer.name,
    customer_email: customer.primary_email || "",
    customer_phone: customer.primary_phone || "",
    site_id: ticket.site_id,
    site_name: input.site_name || "",
    site_address: input.site_address || "",
    solar_system_id: ticket.solar_system_id,
    solar_system_name: input.solar_system_name || "",
    system_name: input.solar_system_name || "",
    assigned_agent_id: ticket.assigned_to,
    assigned_agent_name: null,
    notes: [],
    attachments: [],
    related_work_order_id: ticket.related_work_order_id,
    related_warranty_id: ticket.related_warranty_id,
    related_maintenance_visit_id: ticket.related_maintenance_visit_id,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    resolved_at: ticket.resolved_at,
    first_response_at: null,
    tags: [],
  };
}

export async function updateSupportTicketStatusAction(accessToken: string, id: string, status: TicketStatus) {
  const { supabase } = await getCurrentMembership(accessToken);
  const { error } = await supabase
    .from("support_tickets")
    .update({
      status,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function addSupportTicketMessageAction(
  accessToken: string,
  ticketId: string,
  message: string,
  isInternal: boolean,
) {
  const { supabase, user, profile, organizationId } = await getCurrentMembership(accessToken);
  const { error } = await supabase.from("support_ticket_messages").insert({
    organization_id: organizationId,
    ticket_id: ticketId,
    sender_user_id: user.id,
    sender_name: profile?.full_name || user.email || "SolarOS User",
    sender_type: "staff",
    message,
    is_internal: isInternal,
  });

  if (error) throw error;
}
