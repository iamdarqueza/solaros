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

// ── Core portal queries ────────────────────────────────────────────────────────

export const customerPortalService = {

  /** Full overview for the portal dashboard */
  async getOverview(customerId: string): Promise<PortalOverview | null> {
    const [customer, installations, tickets, warranties, workOrders] = await Promise.all([
      customersService.getCustomer(customerId),
      customersService.getInstallations(customerId),
      customersService.getSupportTickets(customerId),
      customersService.getWarranties(customerId),
      workOrderService.getAllOrders(),
    ]);

    if (!customer) return null;

    const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
    const activeWarranties = warranties.filter((w) => w.status === 'active' || w.status === 'expiring_soon').length;

    // Find next scheduled or in-progress work order for this customer
    const customerOrders = workOrders
      .filter((o) => o.customer_id === customerId && (o.status === 'scheduled' || o.status === 'in_progress'))
      .sort((a, b) => {
        const da = a.scheduled_date ? new Date(a.scheduled_date).getTime() : Infinity;
        const db = b.scheduled_date ? new Date(b.scheduled_date).getTime() : Infinity;
        return da - db;
      });

    const nextOrder = customerOrders[0] ?? null;

    return {
      customer,
      installations,
      openTickets,
      activeWarranties,
      nextServiceDate: nextOrder?.scheduled_date ?? null,
      nextServiceTitle: nextOrder?.title ?? null,
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

  // ── Actions ──────────────────────────────────────────────────────────────────

  /** Submit a support request (creates a new mock ticket) */
  async submitSupportRequest(
    customerId: string,
    form: SupportRequestForm,
    customerName: string
  ): Promise<SupportTicket> {
    await new Promise((r) => setTimeout(r, 600));

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
    return {
      success: true,
      referenceId: `MR-${Date.now().toString().slice(-6)}`,
    };
  },
};
