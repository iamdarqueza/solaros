import { supabase } from "@/lib/supabase";
import type {
  Customer,
  CustomerDocument,
  Installation,
  MaintenanceRecord,
  SupportTicket as CustomerSupportTicket,
  Warranty,
} from "@/services/customersService";
import type {
  SupportStats,
  SupportTicket,
  TicketAttachment,
  TicketNote,
} from "@/services/supportService";
import type {
  ServiceReport,
  WorkOrder,
  WorkOrderPhoto,
  WorkOrderSource,
  WorkOrderStats,
} from "@/services/workOrderService";

// Supabase nested selects are intentionally mapped at the boundary before data reaches UI types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

const WORK_ORDER_SOURCE_LABELS: Record<WorkOrderSource, string> = {
  support_ticket: "Support Ticket",
  maintenance_schedule: "Maintenance Schedule",
  warranty_claim: "Warranty Claim",
  manual_job: "Manual Job",
  customer_request: "Customer Request",
  internal_inspection: "Internal Inspection",
};

const FALLBACK_TECHNICIANS = [
  { id: "tech-001", name: "Carlos Rivera", avatar: "CR", specialty: "Inverters & Electrical" },
  { id: "tech-002", name: "Sarah Johnson", avatar: "SJ", specialty: "Panel Installation" },
  { id: "tech-003", name: "Mike Torres", avatar: "MT", specialty: "Structural & Mounting" },
  { id: "tech-004", name: "Jasmine Lee", avatar: "JL", specialty: "Diagnostics & Testing" },
  { id: "tech-005", name: "David Park", avatar: "DP", specialty: "Battery & Storage" },
];

export async function fetchActiveMembership() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(id, name, slug)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function splitCustomerName(name: string | null | undefined) {
  const parts = (name || "Unknown Customer").trim().split(/\s+/);
  const firstName = parts.shift() || "Unknown";
  return {
    first_name: firstName,
    last_name: parts.join(" ") || "",
  };
}

function fullName(customer: AnyRecord | null | undefined) {
  return customer?.name || "Unknown Customer";
}

function dateOnly(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function inferCustomerStatus(customer: AnyRecord): Customer["status"] {
  if (customer.portal_status === "revoked") return "suspended";
  return "active";
}

function inferSystemType(customer: AnyRecord): Customer["system_type"] {
  if (customer.customer_type === "commercial") return "commercial";
  if (customer.customer_type === "industrial") return "industrial";
  if (customer.customer_type === "other") return "other";
  return "residential";
}

function inferPortalStatus(value: string | null | undefined): Customer["portal_status"] {
  if (value === "active" || value === "invite_sent" || value === "invited" || value === "expired" || value === "revoked") return value;
  return "not_invited";
}

function inferWarrantyHealth(warranties: AnyRecord[]): Customer["warranty_status"] {
  if (warranties.some((warranty) => warranty.status === "expiring_soon")) return "expiring_soon";
  if (warranties.some((warranty) => warranty.status === "expired" || warranty.status === "void")) return "expired";
  if (warranties.some((warranty) => warranty.status === "active")) return "active";
  return "none";
}

export function mapCustomer(row: AnyRecord): Customer {
  const names = splitCustomerName(row.name);
  const sites = row.sites ?? [];
  const tickets = row.support_tickets ?? [];
  const warranties = row.warranties ?? [];
  const latestService = row.service_history?.[0]?.event_date ?? "";
  const firstSite = sites[0];

  return {
    id: row.id,
    account_number: row.customer_code || row.id.slice(0, 8).toUpperCase(),
    first_name: names.first_name,
    last_name: names.last_name,
    contact_person: fullName(row),
    email: row.primary_email || "",
    phone: row.primary_phone || "",
    address: row.billing_address || firstSite?.address || "",
    city: firstSite?.city || "",
    state: firstSite?.state || "",
    zip: firstSite?.postal_code || "",
    status: inferCustomerStatus(row),
    portal_status: inferPortalStatus(row.portal_status),
    system_type: inferSystemType(row),
    region: firstSite?.state || firstSite?.city || "",
    site_count: sites.length,
    installations_count: sites.length,
    open_tickets: tickets.filter((ticket: AnyRecord) => !["resolved", "closed"].includes(ticket.status)).length,
    active_warranties: warranties.filter((warranty: AnyRecord) => warranty.status === "active").length,
    warranty_status: inferWarrantyHealth(warranties),
    upcoming_maintenance_date: "",
    last_service_date: dateOnly(latestService),
    created_at: dateOnly(row.created_at),
    notes_count: row.notes ? 1 : 0,
  };
}

export async function getCustomersData(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select(`
      id,
      customer_code,
      name,
      customer_type,
      primary_email,
      primary_phone,
      billing_address,
      notes,
      portal_status,
      created_at,
      sites(id, address, city, state, postal_code, property_type),
      support_tickets(id, status),
      warranties(id, status),
      service_history(event_date)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapCustomer);
}

export async function getCustomerData(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select(`
      id,
      customer_code,
      name,
      customer_type,
      primary_email,
      primary_phone,
      billing_address,
      notes,
      portal_status,
      created_at,
      sites(id, address, city, state, postal_code, property_type),
      support_tickets(id, status),
      warranties(id, status),
      service_history(event_date)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapCustomer(data) : null;
}

export async function getInstallationsData(customerId: string): Promise<Installation[]> {
  const { data, error } = await supabase
    .from("solar_systems")
    .select("id, customer_id, site_id, system_name, system_size_kw, panel_count, installation_date, status, monitoring_provider, sites(address, city, state, postal_code), equipment_assets(equipment_type, brand)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: AnyRecord) => {
    const site = row.sites;
    const address = [site?.address, site?.city, site?.state, site?.postal_code].filter(Boolean).join(", ");
    const panels = (row.equipment_assets ?? []).find((asset: AnyRecord) => asset.equipment_type === "solar_panel");
    const inverter = (row.equipment_assets ?? []).find((asset: AnyRecord) => asset.equipment_type === "inverter");

    return {
      id: row.id,
      customer_id: row.customer_id,
      site_address: address,
      install_date: dateOnly(row.installation_date),
      panel_count: row.panel_count ?? 0,
      panel_brand: panels?.brand ?? "",
      inverter_brand: inverter?.brand ?? "",
      system_size_kw: numberValue(row.system_size_kw),
      annual_production_kwh: 0,
      monthly_savings_usd: 0,
      status: row.status === "under_maintenance" ? "maintenance" : row.status === "inactive" ? "offline" : "operational",
      last_inspection: "",
      monitoring_url: row.monitoring_provider || undefined,
    };
  });
}

export async function getWarrantiesData(customerId: string): Promise<Warranty[]> {
  const { data, error } = await supabase
    .from("warranties")
    .select("id, customer_id, product_name, manufacturer, warranty_type, start_date, end_date, status, solar_system_id, warranty_claims(id)")
    .eq("customer_id", customerId)
    .order("end_date", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: AnyRecord) => ({
    id: row.id,
    customer_id: row.customer_id,
    component: row.product_name,
    manufacturer: row.manufacturer || "",
    coverage_type: row.warranty_type,
    start_date: dateOnly(row.start_date),
    expiry_date: dateOnly(row.end_date),
    status: row.status === "void" || row.status === "claim_open" ? "expired" : row.status,
    claim_count: row.warranty_claims?.length ?? 0,
    installation_id: row.solar_system_id || "",
  }));
}

export async function getMaintenanceHistoryData(customerId: string): Promise<MaintenanceRecord[]> {
  const { data, error } = await supabase
    .from("maintenance_visits")
    .select("id, customer_id, solar_system_id, scheduled_start, completed_at, completion_notes, checklist, technicians(full_name)")
    .eq("customer_id", customerId)
    .order("scheduled_start", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: AnyRecord) => ({
    id: row.id,
    customer_id: row.customer_id,
    date: dateOnly(row.completed_at || row.scheduled_start),
    technician_name: row.technicians?.full_name || "",
    work_type: "Maintenance Visit",
    description: row.completion_notes || "Scheduled maintenance visit",
    outcome: row.completion_notes || "",
    cost_usd: 0,
    duration_hours: 0,
    installation_id: row.solar_system_id || "",
  }));
}

export async function getCustomerSupportTicketsData(customerId: string): Promise<CustomerSupportTicket[]> {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, customer_id, ticket_number, subject, description, priority, status, assigned_to, created_at, updated_at, resolved_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: AnyRecord) => ({
    id: row.id,
    customer_id: row.customer_id,
    ticket_number: row.ticket_number,
    subject: row.subject,
    description: row.description || "",
    priority: row.priority === "urgent" ? "critical" : row.priority,
    status: row.status === "waiting_customer" || row.status === "waiting_technician" ? "in_progress" : row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    resolved_at: row.resolved_at || undefined,
    assigned_to: row.assigned_to || undefined,
  }));
}

export async function getDocumentsData(customerId: string): Promise<CustomerDocument[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("id, customer_id, document_name, document_type, file_size, created_at, file_url, storage_bucket, storage_path")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: AnyRecord) => ({
    id: row.id,
    customer_id: row.customer_id,
    name: row.document_name,
    type: row.document_type === "warranty_document" ? "warranty_doc" : row.document_type,
    size_kb: Math.round(numberValue(row.file_size) / 1024),
    uploaded_at: dateOnly(row.created_at),
    url: row.file_url || "#",
  }));
}

function mapTicketMessage(row: AnyRecord): TicketNote {
  return {
    id: row.id,
    content: row.message,
    is_internal: row.is_internal,
    author_name: row.sender_name || "SolarOS User",
    author_role: row.sender_type === "customer" ? "customer" : row.sender_type === "technician" ? "technician" : "agent",
    created_at: row.created_at,
    attachments: [],
  };
}

function mapTicket(row: AnyRecord): SupportTicket {
  const customer = row.customers;
  const site = row.sites;
  const system = row.solar_systems;
  const assigned = row.profiles;
  const messages = row.support_ticket_messages ?? [];

  return {
    id: row.id,
    ticket_number: row.ticket_number,
    subject: row.subject,
    description: row.description || "",
    status: row.status,
    priority: row.priority,
    issue_type: row.issue_type,
    customer_id: row.customer_id,
    customer_name: fullName(customer),
    customer_email: customer?.primary_email || "",
    customer_phone: customer?.primary_phone || "",
    site_id: row.site_id,
    site_name: site?.site_name || "",
    site_address: site?.address || "",
    solar_system_id: row.solar_system_id,
    solar_system_name: system?.system_name || "",
    system_name: system?.system_name || "",
    assigned_agent_id: row.assigned_to,
    assigned_agent_name: assigned?.full_name || null,
    notes: messages.map(mapTicketMessage),
    attachments: [] as TicketAttachment[],
    related_work_order_id: row.related_work_order_id,
    related_warranty_id: row.related_warranty_id,
    related_maintenance_visit_id: row.related_maintenance_visit_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    resolved_at: row.resolved_at,
    first_response_at: messages.find((message: AnyRecord) => message.sender_type === "staff")?.created_at ?? null,
    tags: [],
  };
}

export async function getSupportTicketsData(): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from("support_tickets")
    .select(`
      *,
      customers(name, primary_email, primary_phone),
      sites(site_name, address),
      solar_systems(system_name),
      profiles(full_name),
      support_ticket_messages(id, message, is_internal, sender_name, sender_type, created_at)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapTicket);
}

export function getSupportStatsFromTickets(tickets: SupportTicket[]): SupportStats {
  const resolved = tickets.filter((ticket) => ticket.status === "resolved" && ticket.resolved_at);
  const avgHours = resolved.length
    ? resolved.reduce((sum, ticket) => {
        return sum + (new Date(ticket.resolved_at!).getTime() - new Date(ticket.created_at).getTime()) / 3600000;
      }, 0) / resolved.length
    : 0;

  return {
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === "open").length,
    in_progress: tickets.filter((ticket) => ticket.status === "in_progress").length,
    waiting_customer: tickets.filter((ticket) => ticket.status === "waiting_customer").length,
    waiting_technician: tickets.filter((ticket) => ticket.status === "waiting_technician").length,
    resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
    closed: tickets.filter((ticket) => ticket.status === "closed").length,
    avg_resolution_hours: Math.round(avgHours * 10) / 10,
    overdue: tickets.filter(
      (ticket) =>
        ticket.status === "open" &&
        !ticket.first_response_at &&
        new Date(ticket.created_at).getTime() < Date.now() - 4 * 60 * 60 * 1000,
    ).length,
  };
}

function sourceFromDb(value: string): WorkOrderSource {
  if (value === "support_ticket") return "support_ticket";
  if (value === "maintenance_visit" || value === "maintenance_schedule") return "maintenance_schedule";
  if (value === "warranty_claim") return "warranty_claim";
  if (value === "customer_request") return "customer_request";
  if (value === "internal_inspection") return "internal_inspection";
  return "manual_job";
}

function mapWorkOrder(row: AnyRecord): WorkOrder {
  const customer = row.customers;
  const site = row.sites;
  const system = row.solar_systems;
  const technician = row.technicians;
  const source = sourceFromDb(row.source_type);
  const photos: WorkOrderPhoto[] = [];
  const report: ServiceReport | null = row.completion_report
    ? {
        work_performed: row.completion_report,
        parts_used: Array.isArray(row.parts_used) ? row.parts_used.join(", ") : "",
        findings: "",
        recommendations: "",
        technician_notes: row.technician_notes || "",
        customer_signature: row.customer_signature_name || undefined,
        items: [],
      }
    : null;

  return {
    id: row.id,
    order_number: row.work_order_number,
    title: row.title,
    description: row.description || "",
    type: row.work_order_type,
    priority: row.priority,
    status: row.status,
    source,
    source_label: WORK_ORDER_SOURCE_LABELS[source],
    customer_id: row.customer_id,
    customer_name: fullName(customer),
    customer_phone: customer?.primary_phone || "",
    site_id: row.site_id || "",
    site_address: site?.address || "",
    system_name: system?.system_name || "",
    system_id: row.solar_system_id || "",
    related_ticket_id: row.related_ticket_id,
    related_warranty_claim_id: row.related_warranty_claim_id,
    related_maintenance_visit_id: row.related_maintenance_visit_id,
    technician_id: row.assigned_technician_id,
    technician_name: technician?.full_name || null,
    scheduled_date: dateOnly(row.scheduled_start) || null,
    scheduled_time: row.scheduled_start ? new Date(row.scheduled_start).toISOString().slice(11, 16) : null,
    started_at: row.started_at,
    completed_at: dateOnly(row.completed_at) || null,
    estimated_duration: row.scheduled_start && row.scheduled_end
      ? Math.max(1, (new Date(row.scheduled_end).getTime() - new Date(row.scheduled_start).getTime()) / 3600000)
      : 2,
    actual_duration: null,
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    parts_needed: Array.isArray(row.parts_needed) ? row.parts_needed : [],
    photos,
    photos_before: [],
    photos_after: [],
    technician_notes: row.technician_notes || "",
    customer_signature: row.customer_signature_name || null,
    service_report: report,
    completion_report: report,
    maintenance_record_id: row.related_maintenance_visit_id,
    warranty_claim_id: row.related_warranty_claim_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags: row.requires_follow_up ? ["follow-up"] : [],
  };
}

export async function getWorkOrdersData(): Promise<WorkOrder[]> {
  const { data, error } = await supabase
    .from("work_orders")
    .select(`
      *,
      customers(name, primary_phone),
      sites(address),
      solar_systems(system_name),
      technicians(full_name)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapWorkOrder);
}

export async function getWorkOrderData(id: string): Promise<WorkOrder | null> {
  const { data, error } = await supabase
    .from("work_orders")
    .select(`
      *,
      customers(name, primary_phone),
      sites(address),
      solar_systems(system_name),
      technicians(full_name)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapWorkOrder(data) : null;
}

export function getWorkOrderStatsFromOrders(orders: WorkOrder[]): WorkOrderStats {
  const completed = orders.filter((order) => order.status === "completed");
  const avgHours = completed.length
    ? completed.reduce((sum, order) => sum + (order.actual_duration ?? order.estimated_duration), 0) / completed.length
    : 0;

  return {
    total: orders.length,
    new: orders.filter((order) => order.status === "new").length,
    scheduled: orders.filter((order) => order.status === "scheduled").length,
    assigned: orders.filter((order) => order.status === "assigned").length,
    in_progress: orders.filter((order) => order.status === "in_progress").length,
    completed: completed.length,
    cancelled: orders.filter((order) => order.status === "cancelled").length,
    requires_follow_up: orders.filter((order) => order.status === "requires_follow_up").length,
    urgent: orders.filter((order) => order.priority === "urgent").length,
    unassigned: orders.filter((order) => !order.technician_id).length,
    high_priority: orders.filter((order) => order.priority === "high" || order.priority === "urgent").length,
    overdue: orders.filter(
      (order) =>
        order.scheduled_date &&
        new Date(order.scheduled_date) < new Date() &&
        ["new", "scheduled", "assigned"].includes(order.status),
    ).length,
    avg_completion_hours: Math.round(avgHours * 10) / 10,
  };
}

export async function getTechniciansData() {
  const { data, error } = await supabase
    .from("technicians")
    .select("id, full_name, role, skills")
    .order("full_name");

  if (error) return FALLBACK_TECHNICIANS;

  return (data ?? []).map((technician: AnyRecord) => ({
    id: technician.id,
    name: technician.full_name,
    avatar: String(technician.full_name || "T")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    specialty: technician.skills?.[0] || technician.role || "Technician",
  }));
}
