"use server";

import { getCurrentMembership, isUuid } from "@/lib/supabaseServer";
import type {
  ServiceReport,
  WorkOrder,
  WorkOrderPriority,
  WorkOrderSource,
  WorkOrderStatus,
  WorkOrderType,
} from "@/services/workOrderService";

type WorkOrderInput = Partial<WorkOrder> & {
  title: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  source?: WorkOrderSource;
  customer_name?: string;
  customer_phone?: string;
  site_address?: string;
  system_name?: string;
  service_report?: ServiceReport | null;
};

function sourceToDb(source: WorkOrderSource) {
  if (source === "maintenance_schedule") return "maintenance_visit";
  if (source === "manual_job") return "manual";
  return source;
}

function scheduledDateTime(date?: string | null, time?: string | null) {
  if (!date) return null;
  return new Date(`${date}T${time || "09:00"}:00`).toISOString();
}

async function nextWorkOrderNumber(
  supabase: ReturnType<typeof import("@/lib/supabaseServer").createServerActionClient>,
  organizationId: string,
) {
  const { count, error } = await supabase
    .from("work_orders")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) throw error;
  return `WO-${String((count ?? 0) + 1001).padStart(4, "0")}`;
}

async function ensureCustomerSiteSystem(
  accessToken: string,
  data: WorkOrderInput,
) {
  const context = await getCurrentMembership(accessToken);
  const { supabase, user, organizationId } = context;

  let customerId = isUuid(data.customer_id) ? data.customer_id! : null;
  if (!customerId) {
    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        organization_id: organizationId,
        name: data.customer_name || "Unknown Customer",
        primary_phone: data.customer_phone || null,
        customer_type: "residential",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) throw error;
    customerId = customer.id;
  }

  let siteId = isUuid(data.site_id) ? data.site_id! : null;
  if (!siteId && data.site_address?.trim()) {
    const { data: site, error } = await supabase
      .from("sites")
      .insert({
        organization_id: organizationId,
        customer_id: customerId,
        site_name: "Service Site",
        address: data.site_address,
      })
      .select("id")
      .single();

    if (error) throw error;
    siteId = site.id;
  }

  let systemId = isUuid(data.system_id) ? data.system_id! : null;
  if (!systemId && siteId && data.system_name?.trim()) {
    const { data: system, error } = await supabase
      .from("solar_systems")
      .insert({
        organization_id: organizationId,
        customer_id: customerId,
        site_id: siteId,
        system_name: data.system_name,
      })
      .select("id")
      .single();

    if (error) throw error;
    systemId = system.id;
  }

  return { ...context, customerId, siteId, systemId };
}

export async function createWorkOrderAction(accessToken: string, data: WorkOrderInput) {
  const { supabase, user, organizationId, customerId, siteId, systemId } = await ensureCustomerSiteSystem(accessToken, data);
  const scheduledStart = scheduledDateTime(data.scheduled_date, data.scheduled_time);
  const scheduledEnd = scheduledStart
    ? new Date(new Date(scheduledStart).getTime() + (data.estimated_duration || 2) * 3600000).toISOString()
    : null;

  const { error } = await supabase.from("work_orders").insert({
    organization_id: organizationId,
    work_order_number: await nextWorkOrderNumber(supabase, organizationId),
    source_type: sourceToDb(data.source ?? "manual_job"),
    customer_id: customerId,
    site_id: siteId,
    solar_system_id: systemId,
    related_ticket_id: isUuid(data.related_ticket_id) ? data.related_ticket_id : null,
    related_warranty_claim_id: isUuid(data.related_warranty_claim_id) ? data.related_warranty_claim_id : null,
    related_maintenance_visit_id: isUuid(data.related_maintenance_visit_id) ? data.related_maintenance_visit_id : null,
    work_order_type: data.type,
    priority: data.priority,
    status: data.status,
    title: data.title,
    description: data.description || null,
    assigned_technician_id: isUuid(data.technician_id) ? data.technician_id : null,
    scheduled_start: scheduledStart,
    scheduled_end: scheduledEnd,
    started_at: data.started_at || null,
    completed_at: data.completed_at || null,
    checklist: data.checklist || [],
    parts_needed: data.parts_needed || [],
    technician_notes: data.technician_notes || null,
    customer_signature_name: data.customer_signature || null,
    completion_report: data.service_report?.work_performed || null,
    requires_follow_up: data.status === "requires_follow_up",
    created_by: user.id,
  });

  if (error) throw error;
}

export async function updateWorkOrderAction(accessToken: string, id: string, data: Partial<WorkOrderInput>) {
  const { supabase } = await getCurrentMembership(accessToken);
  const scheduledStart = scheduledDateTime(data.scheduled_date, data.scheduled_time);
  const scheduledEnd = scheduledStart
    ? new Date(new Date(scheduledStart).getTime() + (data.estimated_duration || 2) * 3600000).toISOString()
    : undefined;

  const { error } = await supabase
    .from("work_orders")
    .update({
      source_type: data.source ? sourceToDb(data.source) : undefined,
      related_ticket_id: isUuid(data.related_ticket_id) ? data.related_ticket_id : null,
      related_warranty_claim_id: isUuid(data.related_warranty_claim_id) ? data.related_warranty_claim_id : null,
      related_maintenance_visit_id: isUuid(data.related_maintenance_visit_id) ? data.related_maintenance_visit_id : null,
      work_order_type: data.type,
      priority: data.priority,
      status: data.status,
      title: data.title,
      description: data.description,
      assigned_technician_id: isUuid(data.technician_id) ? data.technician_id : null,
      scheduled_start: scheduledStart ?? undefined,
      scheduled_end: scheduledEnd,
      checklist: data.checklist,
      parts_needed: data.parts_needed,
      technician_notes: data.technician_notes,
      customer_signature_name: data.customer_signature,
      completion_report: data.service_report?.work_performed,
      requires_follow_up: data.status === "requires_follow_up",
    })
    .eq("id", id);

  if (error) throw error;
}

export async function updateWorkOrderStatusAction(accessToken: string, id: string, status: WorkOrderStatus) {
  const { supabase } = await getCurrentMembership(accessToken);
  const updates: Record<string, unknown> = {
    status,
    requires_follow_up: status === "requires_follow_up",
  };

  if (status === "in_progress") updates.started_at = new Date().toISOString();
  if (status === "completed") updates.completed_at = new Date().toISOString();

  const { error } = await supabase.from("work_orders").update(updates).eq("id", id);
  if (error) throw error;
}

export async function submitServiceReportAction(accessToken: string, id: string, report: ServiceReport) {
  const { supabase } = await getCurrentMembership(accessToken);
  const { error } = await supabase
    .from("work_orders")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      completion_report: report.work_performed,
      parts_used: report.parts_used ? report.parts_used.split(",").map((part) => part.trim()).filter(Boolean) : [],
      technician_notes: report.technician_notes,
      customer_signature_name: report.customer_signature || null,
      customer_signature_at: report.customer_signature ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) throw error;
}
