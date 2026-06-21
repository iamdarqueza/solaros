// customerPortalService.ts
// Thin wrapper over customersService and workOrderService that scopes all
// data to a single customer (the logged-in homeowner). All data is sourced
// from the existing mock layers.

import {
  customersService,
  type Customer,
  type Installation,
  type Warranty,
  type MaintenanceRecord,
  type SupportTicket,
  type CustomerDocument,
} from './customersService';

import { workOrderService, type WorkOrder } from './workOrderService';

export type {
  Customer,
  Installation,
  Warranty,
  MaintenanceRecord,
  SupportTicket,
  CustomerDocument,
  WorkOrder,
};

// ── Types specific to the Customer Portal ──────────────────────────────────────

export interface PortalOverview {
  customer: Customer;
  installations: Installation[];
  openTickets: number;
  activeWarranties: number;
  nextServiceDate: string | null;
  nextServiceTitle: string | null;
  recentActivity: PortalServiceHistoryItem[];
}

export interface PortalServiceHistoryItem {
  id: string;
  date: string;
  type: 'support' | 'work_order' | 'maintenance' | 'warranty';
  title: string;
  description: string;
  statusLabel: string;
  href?: string;
}

export interface SupportRequestForm {
  subject: string;
  issueType: 'general' | 'performance' | 'billing' | 'outage' | 'warranty' | 'other';
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface MaintenanceRequestForm {
  description: string;
  preferredDate: string;
  urgency: 'routine' | 'soon' | 'urgent';
  contactPhone: string;
}

// ── Demo customer list ─────────────────────────────────────────────────────────

// Pull all customers for the demo switcher
export async function getAllCustomers(): Promise<Customer[]> {
  return customersService.getCustomers();
}

function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildServiceHistory(
  tickets: SupportTicket[],
  maintenance: MaintenanceRecord[],
  warranties: Warranty[],
  workOrders: WorkOrder[]
): PortalServiceHistoryItem[] {
  const supportItems: PortalServiceHistoryItem[] = tickets.map((ticket) => ({
    id: `support-${ticket.id}`,
    date: ticket.resolved_at ?? ticket.updated_at ?? ticket.created_at,
    type: 'support',
    title: ticket.subject,
    description: ticket.status === 'resolved'
      ? 'Support request resolved.'
      : 'Support request updated.',
    statusLabel: formatStatusLabel(ticket.status),
    href: '/portal/support',
  }));

  const maintenanceItems: PortalServiceHistoryItem[] = maintenance.map((record) => ({
    id: `maintenance-${record.id}`,
    date: record.date,
    type: 'maintenance',
    title: record.work_type,
    description: record.outcome || record.description,
    statusLabel: record.cost_usd === 0 ? 'No charge' : 'Completed',
    href: '/portal/maintenance',
  }));

  const workOrderItems: PortalServiceHistoryItem[] = workOrders.map((order) => ({
    id: `work-order-${order.id}`,
    date: order.completed_at ?? order.scheduled_date ?? order.updated_at,
    type: 'work_order',
    title: order.title,
    description: order.service_report?.work_performed || order.description || 'Field service visit updated.',
    statusLabel: formatStatusLabel(order.status),
    href: '/portal/work-orders',
  }));

  const warrantyItems: PortalServiceHistoryItem[] = warranties
    .filter((warranty) => warranty.status !== 'active' || warranty.claim_count > 0)
    .map((warranty) => ({
      id: `warranty-${warranty.id}`,
      date: warranty.expiry_date,
      type: 'warranty',
      title: `${warranty.component} warranty`,
      description: warranty.claim_count > 0
        ? `${warranty.claim_count} claim${warranty.claim_count !== 1 ? 's' : ''} on file.`
        : `Coverage ${warranty.status === 'expired' ? 'expired' : 'is expiring soon'}.`,
      statusLabel: formatStatusLabel(warranty.status),
      href: '/portal/warranties',
    }));

  return [...supportItems, ...maintenanceItems, ...workOrderItems, ...warrantyItems]
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ── Core portal queries ────────────────────────────────────────────────────────

export const customerPortalService = {

  /** Full overview for the portal dashboard */
  async getOverview(customerId: string): Promise<PortalOverview | null> {
    const [customer, installations, tickets, warranties, maintenance, workOrders] = await Promise.all([
      customersService.getCustomer(customerId),
      customersService.getInstallations(customerId),
      customersService.getSupportTickets(customerId),
      customersService.getWarranties(customerId),
      customersService.getMaintenanceHistory(customerId),
      workOrderService.getAllOrders(),
    ]);

    if (!customer) return null;

    const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
    const activeWarranties = warranties.filter((w) => w.status === 'active' || w.status === 'expiring_soon').length;

    // Find next active work order for this customer
    const customerOrders = workOrders
      .filter((o) =>
        o.customer_id === customerId &&
        (o.status === 'assigned' || o.status === 'scheduled' || o.status === 'in_progress' || o.status === 'requires_follow_up')
      )
      .sort((a, b) => {
        const da = a.scheduled_date ? new Date(a.scheduled_date).getTime() : Infinity;
        const db = b.scheduled_date ? new Date(b.scheduled_date).getTime() : Infinity;
        return da - db;
      });

    const nextOrder = customerOrders[0] ?? null;
    const allCustomerOrders = workOrders.filter((o) => o.customer_id === customerId);

    return {
      customer,
      installations,
      openTickets,
      activeWarranties,
      nextServiceDate: nextOrder?.scheduled_date ?? null,
      nextServiceTitle: nextOrder?.title ?? null,
      recentActivity: buildServiceHistory(tickets, maintenance, warranties, allCustomerOrders).slice(0, 4),
    };
  },

  /** Installations for "My System" page */
  async getMySystem(customerId: string): Promise<Installation[]> {
    return customersService.getInstallations(customerId);
  },

  /** Warranties for "My Warranties" page */
  async getMyWarranties(customerId: string): Promise<Warranty[]> {
    return customersService.getWarranties(customerId);
  },

  /** Documents for the Downloads page */
  async getMyDocuments(customerId: string): Promise<CustomerDocument[]> {
    return customersService.getDocuments(customerId);
  },

  /** Support tickets for the Support page */
  async getMyTickets(customerId: string): Promise<SupportTicket[]> {
    return customersService.getSupportTickets(customerId);
  },

  /** Maintenance history for the Maintenance page */
  async getMyMaintenanceHistory(customerId: string): Promise<MaintenanceRecord[]> {
    return customersService.getMaintenanceHistory(customerId);
  },

  /** Work orders scoped to this customer */
  async getMyWorkOrders(customerId: string): Promise<WorkOrder[]> {
    const all = await workOrderService.getAllOrders();
    return all.filter((o) => o.customer_id === customerId);
  },

  /** Customer-facing timeline across support, field visits, maintenance, and warranties */
  async getMyServiceHistory(customerId: string): Promise<PortalServiceHistoryItem[]> {
    const [tickets, maintenance, warranties, allWorkOrders] = await Promise.all([
      customersService.getSupportTickets(customerId),
      customersService.getMaintenanceHistory(customerId),
      customersService.getWarranties(customerId),
      workOrderService.getAllOrders(),
    ]);

    const workOrders = allWorkOrders.filter((o) => o.customer_id === customerId);
    return buildServiceHistory(tickets, maintenance, warranties, workOrders);
  },

  // ── Actions ──────────────────────────────────────────────────────────────────

  /** Submit a support request (creates a new mock ticket) */
  async submitSupportRequest(
    customerId: string,
    form: SupportRequestForm,
    customerName: string
  ): Promise<SupportTicket> {
    await new Promise((r) => setTimeout(r, 600));
    void customerName;

    // Generate a ticket number
    const ticketNum = `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket: SupportTicket = {
      id: `tkt-${Date.now()}`,
      customer_id: customerId,
      ticket_number: ticketNum,
      subject: form.subject,
      description: form.description,
      priority: form.priority,
      status: 'open',
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
      assigned_to: 'Support Team',
    };

    return newTicket;
  },

  /** Submit a maintenance request (simulated) */
  async submitMaintenanceRequest(
    customerId: string,
    form: MaintenanceRequestForm
  ): Promise<{ success: boolean; referenceId: string }> {
    await new Promise((r) => setTimeout(r, 700));
    void customerId;
    void form;
    return {
      success: true,
      referenceId: `MR-${Date.now().toString().slice(-6)}`,
    };
  },
};
