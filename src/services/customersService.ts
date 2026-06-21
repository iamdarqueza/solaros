// customersService.ts
// Customer Management data layer. Uses Supabase first and falls back to local mock data.

import { appendCustomerNoteAction, createCustomerAction, CreateCustomerInput } from "@/actions/customerActions";
import {
  getCustomerData,
  getCustomerSupportTicketsData,
  getCustomersData,
  getDocumentsData,
  getInstallationsData,
  getMaintenanceHistoryData,
  getWarrantiesData,
} from "@/data/solarosData";
import { supabase } from "@/lib/supabase";

export type CustomerStatus = 'active' | 'inactive' | 'prospect' | 'suspended';
export type SystemType = 'residential' | 'commercial' | 'industrial' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type WarrantyStatus = 'active' | 'expiring_soon' | 'expired';
export type InstallationStatus = 'operational' | 'degraded' | 'offline' | 'maintenance';
export type CustomerPortalStatus = 'not_invited' | 'invite_sent' | 'active' | 'expired' | 'revoked' | 'invited';
export type CustomerWarrantyHealth = 'active' | 'expiring_soon' | 'expired' | 'none';

export interface Customer {
  id: string;
  organization_id?: string;
  account_number: string;
  first_name: string;
  last_name: string;
  contact_person?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  status: CustomerStatus;
  portal_status?: CustomerPortalStatus;
  system_type: SystemType;
  region: string;
  site_count?: number;
  installations_count: number;
  open_tickets: number;
  active_warranties: number;
  warranty_status?: CustomerWarrantyHealth;
  upcoming_maintenance_date?: string;
  last_service_date: string;
  created_at: string;
  updated_at?: string;
  notes_count: number;
}

export type { CreateCustomerInput };

export interface Installation {
  id: string;
  customer_id: string;
  site_address: string;
  install_date: string;
  panel_count: number;
  panel_brand: string;
  inverter_brand: string;
  system_size_kw: number;
  annual_production_kwh: number;
  monthly_savings_usd: number;
  status: InstallationStatus;
  last_inspection: string;
  monitoring_url?: string;
}

export interface Warranty {
  id: string;
  customer_id: string;
  component: string;
  manufacturer: string;
  coverage_type: string;
  start_date: string;
  expiry_date: string;
  status: WarrantyStatus;
  claim_count: number;
  installation_id: string;
}

export interface MaintenanceRecord {
  id: string;
  customer_id: string;
  date: string;
  technician_name: string;
  work_type: string;
  description: string;
  outcome: string;
  cost_usd: number;
  duration_hours: number;
  installation_id: string;
}

export interface SupportTicket {
  id: string;
  customer_id: string;
  ticket_number: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  assigned_to?: string;
  related_work_order_id?: string;
}

export interface CustomerDocument {
  id: string;
  customer_id: string;
  name: string;
  type: 'contract' | 'permit' | 'inspection' | 'warranty_doc' | 'invoice' | 'proposal' | 'manual' | 'installation_certificate' | 'service_report' | 'maintenance_report' | 'other';
  size_kb: number;
  uploaded_at: string;
  url: string;
  linked_records?: CustomerDocumentLink[];
}

export type CustomerDocumentLinkKind =
  | 'customer'
  | 'site'
  | 'solar_system'
  | 'equipment'
  | 'warranty'
  | 'support_ticket'
  | 'work_order';

export interface CustomerDocumentLink {
  kind: CustomerDocumentLinkKind;
  label: string;
}

export interface CustomerNote {
  id: string;
  customer_id: string;
  author_name: string;
  author_role: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    account_number: 'SOL-2024-0001',
    first_name: 'Marcus',
    last_name: 'Delgado',
    contact_person: 'Marcus Delgado',
    email: 'marcus.delgado@email.com',
    phone: '(619) 555-0142',
    address: '4821 Sunset Ridge Dr',
    city: 'San Diego',
    state: 'CA',
    zip: '92103',
    status: 'active',
    portal_status: 'active',
    system_type: 'residential',
    region: 'Southern California',
    site_count: 2,
    installations_count: 2,
    open_tickets: 1,
    active_warranties: 4,
    warranty_status: 'expiring_soon',
    upcoming_maintenance_date: '2026-01-16',
    last_service_date: '2025-11-14',
    created_at: '2022-03-15',
    notes_count: 3,
  },
  {
    id: 'cust-002',
    account_number: 'SOL-2024-0002',
    first_name: 'Priya',
    last_name: 'Nair',
    contact_person: 'Priya Nair, Facilities Director',
    email: 'priya.nair@techcorp.io',
    phone: '(408) 555-0289',
    address: '1100 Innovation Way',
    city: 'San Jose',
    state: 'CA',
    zip: '95110',
    status: 'active',
    portal_status: 'active',
    system_type: 'commercial',
    region: 'Bay Area',
    site_count: 1,
    installations_count: 1,
    open_tickets: 0,
    active_warranties: 6,
    warranty_status: 'active',
    upcoming_maintenance_date: '2026-02-03',
    last_service_date: '2025-12-02',
    created_at: '2023-01-10',
    notes_count: 5,
  },
  {
    id: 'cust-003',
    account_number: 'SOL-2024-0003',
    first_name: 'James',
    last_name: 'Thornton',
    contact_person: 'James Thornton',
    email: 'james.thornton@gmail.com',
    phone: '(480) 555-0317',
    address: '7832 Desert Palm Ave',
    city: 'Scottsdale',
    state: 'AZ',
    zip: '85251',
    status: 'active',
    portal_status: 'invited',
    system_type: 'residential',
    region: 'Southwest',
    site_count: 1,
    installations_count: 1,
    open_tickets: 2,
    active_warranties: 3,
    warranty_status: 'active',
    upcoming_maintenance_date: '2026-01-09',
    last_service_date: '2025-10-08',
    created_at: '2021-07-22',
    notes_count: 8,
  },
  {
    id: 'cust-004',
    account_number: 'SOL-2024-0004',
    first_name: 'Amara',
    last_name: 'Osei',
    contact_person: 'Amara Osei, Property Manager',
    email: 'amara.osei@osei-properties.com',
    phone: '(702) 555-0451',
    address: '2200 Commerce Blvd, Suite 300',
    city: 'Las Vegas',
    state: 'NV',
    zip: '89101',
    status: 'active',
    portal_status: 'active',
    system_type: 'commercial',
    region: 'Southwest',
    site_count: 3,
    installations_count: 3,
    open_tickets: 0,
    active_warranties: 9,
    warranty_status: 'active',
    upcoming_maintenance_date: '2026-01-22',
    last_service_date: '2025-12-10',
    created_at: '2020-11-05',
    notes_count: 12,
  },
  {
    id: 'cust-005',
    account_number: 'SOL-2024-0005',
    first_name: 'Elena',
    last_name: 'Vasquez',
    contact_person: 'Elena Vasquez',
    email: 'elena.v@outlook.com',
    phone: '(512) 555-0562',
    address: '309 Bluebonnet Trail',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    status: 'inactive',
    portal_status: 'revoked',
    system_type: 'residential',
    region: 'Texas',
    site_count: 1,
    installations_count: 1,
    open_tickets: 0,
    active_warranties: 1,
    warranty_status: 'expired',
    upcoming_maintenance_date: '',
    last_service_date: '2024-06-30',
    created_at: '2022-09-14',
    notes_count: 2,
  },
  {
    id: 'cust-006',
    account_number: 'SOL-2024-0006',
    first_name: 'David',
    last_name: 'Kim',
    contact_person: 'David Kim, Operations Lead',
    email: 'dkim@buildpros.net',
    phone: '(503) 555-0673',
    address: '5400 Industrial Pkwy',
    city: 'Portland',
    state: 'OR',
    zip: '97201',
    status: 'prospect',
    portal_status: 'not_invited',
    system_type: 'industrial',
    region: 'Pacific Northwest',
    site_count: 0,
    installations_count: 0,
    open_tickets: 0,
    active_warranties: 0,
    warranty_status: 'none',
    upcoming_maintenance_date: '',
    last_service_date: '',
    created_at: '2025-09-01',
    notes_count: 1,
  },
  {
    id: 'cust-007',
    account_number: 'SOL-2024-0007',
    first_name: 'Fatima',
    last_name: 'Al-Hassan',
    contact_person: 'Fatima Al-Hassan',
    email: 'fatima.alhassan@sunnyside.org',
    phone: '(305) 555-0784',
    address: '88 Ocean Drive',
    city: 'Miami',
    state: 'FL',
    zip: '33139',
    status: 'active',
    portal_status: 'active',
    system_type: 'residential',
    region: 'Southeast',
    site_count: 1,
    installations_count: 1,
    open_tickets: 1,
    active_warranties: 2,
    warranty_status: 'active',
    upcoming_maintenance_date: '2026-01-08',
    last_service_date: '2025-11-22',
    created_at: '2023-05-18',
    notes_count: 4,
  },
  {
    id: 'cust-008',
    account_number: 'SOL-2024-0008',
    first_name: 'Roberto',
    last_name: 'Morales',
    contact_person: 'Roberto Morales',
    email: 'r.morales@moralesranch.com',
    phone: '(559) 555-0891',
    address: '14200 Valley Ranch Rd',
    city: 'Fresno',
    state: 'CA',
    zip: '93706',
    status: 'active',
    portal_status: 'invited',
    system_type: 'commercial',
    region: 'Central California',
    site_count: 4,
    installations_count: 4,
    open_tickets: 3,
    active_warranties: 14,
    warranty_status: 'expiring_soon',
    upcoming_maintenance_date: '2026-01-12',
    last_service_date: '2025-12-01',
    created_at: '2019-04-03',
    notes_count: 18,
  },
];

const MOCK_INSTALLATIONS: Record<string, Installation[]> = {
  'cust-001': [
    {
      id: 'inst-001a',
      customer_id: 'cust-001',
      site_address: '4821 Sunset Ridge Dr, San Diego, CA 92103',
      install_date: '2022-04-10',
      panel_count: 24,
      panel_brand: 'SunPower',
      inverter_brand: 'Enphase',
      system_size_kw: 9.6,
      annual_production_kwh: 14200,
      monthly_savings_usd: 187,
      status: 'operational',
      last_inspection: '2025-11-14',
    },
    {
      id: 'inst-001b',
      customer_id: 'cust-001',
      site_address: '200 Harbor View Ct, Coronado, CA 92118',
      install_date: '2023-09-22',
      panel_count: 16,
      panel_brand: 'LG Solar',
      inverter_brand: 'SolarEdge',
      system_size_kw: 6.4,
      annual_production_kwh: 9800,
      monthly_savings_usd: 124,
      status: 'degraded',
      last_inspection: '2025-08-05',
    },
  ],
  'cust-002': [
    {
      id: 'inst-002a',
      customer_id: 'cust-002',
      site_address: '1100 Innovation Way, San Jose, CA 95110',
      install_date: '2023-02-15',
      panel_count: 120,
      panel_brand: 'First Solar',
      inverter_brand: 'SMA',
      system_size_kw: 48,
      annual_production_kwh: 68000,
      monthly_savings_usd: 1840,
      status: 'operational',
      last_inspection: '2025-12-02',
    },
  ],
  'cust-003': [
    {
      id: 'inst-003a',
      customer_id: 'cust-003',
      site_address: '7832 Desert Palm Ave, Scottsdale, AZ 85251',
      install_date: '2021-08-18',
      panel_count: 32,
      panel_brand: 'Canadian Solar',
      inverter_brand: 'Enphase',
      system_size_kw: 12.8,
      annual_production_kwh: 22400,
      monthly_savings_usd: 265,
      status: 'operational',
      last_inspection: '2025-10-08',
    },
  ],
};

const MOCK_WARRANTIES: Record<string, Warranty[]> = {
  'cust-001': [
    { id: 'war-001a', customer_id: 'cust-001', component: 'Solar Panels', manufacturer: 'SunPower', coverage_type: 'Product & Performance', start_date: '2022-04-10', expiry_date: '2047-04-10', status: 'active', claim_count: 0, installation_id: 'inst-001a' },
    { id: 'war-001b', customer_id: 'cust-001', component: 'Microinverters', manufacturer: 'Enphase', coverage_type: 'Product', start_date: '2022-04-10', expiry_date: '2032-04-10', status: 'active', claim_count: 0, installation_id: 'inst-001a' },
    { id: 'war-001c', customer_id: 'cust-001', component: 'LG Solar Panels', manufacturer: 'LG', coverage_type: 'Product', start_date: '2023-09-22', expiry_date: '2026-09-22', status: 'expiring_soon', claim_count: 1, installation_id: 'inst-001b' },
    { id: 'war-001d', customer_id: 'cust-001', component: 'SolarEdge Inverter', manufacturer: 'SolarEdge', coverage_type: 'Product', start_date: '2023-09-22', expiry_date: '2036-09-22', status: 'active', claim_count: 0, installation_id: 'inst-001b' },
  ],
};

const MOCK_MAINTENANCE: Record<string, MaintenanceRecord[]> = {
  'cust-001': [
    { id: 'mnt-001a', customer_id: 'cust-001', date: '2025-11-14', technician_name: 'Carlos Rivera', work_type: 'Annual Inspection', description: 'Full system inspection, panel cleaning, inverter check.', outcome: 'All systems nominal. Minor bird debris cleared from panels.', cost_usd: 149, duration_hours: 2.5, installation_id: 'inst-001a' },
    { id: 'mnt-001b', customer_id: 'cust-001', date: '2025-08-05', technician_name: 'Sarah Johnson', work_type: 'Performance Diagnostic', description: 'Output degradation reported. Investigated microinverter output logs.', outcome: '3 microinverters replaced under warranty. Production restored to 98%.', cost_usd: 0, duration_hours: 3.0, installation_id: 'inst-001b' },
    { id: 'mnt-001c', customer_id: 'cust-001', date: '2024-04-22', technician_name: 'Carlos Rivera', work_type: 'Annual Inspection', description: 'Annual system health check and cleaning.', outcome: 'Passed all checks. Inverter firmware updated.', cost_usd: 149, duration_hours: 2.0, installation_id: 'inst-001a' },
  ],
};

const MOCK_TICKETS: Record<string, SupportTicket[]> = {
  'cust-001': [
    { id: 'tkt-001', customer_id: 'cust-001', ticket_number: 'TKT-3001', subject: 'Inverter offline — no output since yesterday', description: 'The inverter is showing a red fault light and the monitoring app reports a grid fault. A field visit has been scheduled to replace the failed unit.', priority: 'critical', status: 'in_progress', created_at: '2025-12-08', updated_at: '2025-12-10', assigned_to: 'Tech Support', related_work_order_id: 'wo-001' },
    { id: 'tkt-001b', customer_id: 'cust-001', ticket_number: 'TKT-2024-2891', subject: 'Strange noise from inverter', description: 'Occasional buzzing sound from garage-mounted inverter.', priority: 'low', status: 'resolved', created_at: '2024-10-15', updated_at: '2024-10-18', resolved_at: '2024-10-18', assigned_to: 'Field Team' },
  ],
};

const MOCK_DOCUMENTS: Record<string, CustomerDocument[]> = {
  'cust-001': [
    { id: 'doc-001a', customer_id: 'cust-001', name: 'Installation Contract - Primary Residence', type: 'contract', size_kb: 284, uploaded_at: '2022-04-01', url: '#', linked_records: [{ kind: 'customer', label: 'Marcus Delgado' }, { kind: 'site', label: 'Sunset Ridge Residence' }, { kind: 'solar_system', label: 'Sunset Ridge 9.6 kW PV' }] },
    { id: 'doc-001b', customer_id: 'cust-001', name: 'City of San Diego Permit', type: 'permit', size_kb: 156, uploaded_at: '2022-03-28', url: '#', linked_records: [{ kind: 'site', label: 'Sunset Ridge Residence' }, { kind: 'solar_system', label: 'Sunset Ridge 9.6 kW PV' }] },
    { id: 'doc-001c', customer_id: 'cust-001', name: 'Annual Inspection Report 2025', type: 'inspection', size_kb: 420, uploaded_at: '2025-11-14', url: '#', linked_records: [{ kind: 'site', label: 'Sunset Ridge Residence' }, { kind: 'work_order', label: 'WO-2025-0918' }] },
    { id: 'doc-001d', customer_id: 'cust-001', name: 'SunPower Warranty Certificate', type: 'warranty_doc', size_kb: 98, uploaded_at: '2022-04-10', url: '#', linked_records: [{ kind: 'equipment', label: 'SunPower panels' }, { kind: 'warranty', label: 'Panel warranty' }, { kind: 'solar_system', label: 'Sunset Ridge 9.6 kW PV' }] },
    { id: 'doc-001e', customer_id: 'cust-001', name: 'Coronado Installation Contract', type: 'contract', size_kb: 271, uploaded_at: '2023-09-20', url: '#', linked_records: [{ kind: 'site', label: 'Harbor View Vacation Home' }, { kind: 'solar_system', label: 'Harbor View 6.4 kW PV' }] },
    { id: 'doc-001f', customer_id: 'cust-001', name: 'Invoice #INV-2025-8821', type: 'invoice', size_kb: 45, uploaded_at: '2025-11-15', url: '#', linked_records: [{ kind: 'customer', label: 'Marcus Delgado' }, { kind: 'work_order', label: 'WO-2025-0918' }] },
    { id: 'doc-001g', customer_id: 'cust-001', name: 'Homeowner System Manual', type: 'manual', size_kb: 312, uploaded_at: '2022-04-10', url: '#', linked_records: [{ kind: 'equipment', label: 'Enphase IQ8' }, { kind: 'solar_system', label: 'Sunset Ridge 9.6 kW PV' }] },
    { id: 'doc-001h', customer_id: 'cust-001', name: 'Installation Completion Certificate', type: 'installation_certificate', size_kb: 144, uploaded_at: '2022-04-12', url: '#', linked_records: [{ kind: 'site', label: 'Sunset Ridge Residence' }, { kind: 'solar_system', label: 'Sunset Ridge 9.6 kW PV' }] },
    { id: 'doc-001i', customer_id: 'cust-001', name: 'Service Report - Microinverter Replacement', type: 'service_report', size_kb: 238, uploaded_at: '2025-08-05', url: '#', linked_records: [{ kind: 'support_ticket', label: 'TKT-2024-2891' }, { kind: 'work_order', label: 'WO-1001' }, { kind: 'equipment', label: 'Microinverters' }] },
    { id: 'doc-001j', customer_id: 'cust-001', name: 'Maintenance Report - Annual Inspection 2025', type: 'maintenance_report', size_kb: 211, uploaded_at: '2025-11-14', url: '#', linked_records: [{ kind: 'site', label: 'Sunset Ridge Residence' }, { kind: 'work_order', label: 'WO-2025-0918' }] },
  ],
};

const MOCK_NOTES: Record<string, CustomerNote[]> = {
  'cust-001': [
    { id: 'note-001a', customer_id: 'cust-001', author_name: 'Jordan Lee', author_role: 'Account Manager', content: 'Customer called to inquire about adding battery storage to the Coronado property. Interested in the Tesla Powerwall package. Sent over a quote via email.', created_at: '2025-12-05T14:22:00Z', is_pinned: true },
    { id: 'note-001b', customer_id: 'cust-001', author_name: 'Carlos Rivera', author_role: 'Technician', content: 'Completed annual inspection. Customer was present. Very satisfied. Mentioned they have a neighbor interested in solar — flagged for referral program.', created_at: '2025-11-14T16:45:00Z', is_pinned: false },
    { id: 'note-001c', customer_id: 'cust-001', author_name: 'Jordan Lee', author_role: 'Account Manager', content: 'Left voicemail regarding Ticket TKT-3001. Will follow up if no response by EOD tomorrow.', created_at: '2025-12-09T09:10:00Z', is_pinned: false },
  ],
};

function splitLocalName(name: string) {
  const parts = name.trim().split(/\s+/);
  const firstName = parts.shift() || name.trim();
  return {
    first_name: firstName,
    last_name: parts.join(' '),
  };
}

function compactLocalAddress(input: CreateCustomerInput) {
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
    .join(', ');
}

// ── Service Functions ──────────────────────────────────────────────────────────

export const customersService = {
  async getCustomers(): Promise<Customer[]> {
    try {
      const customers = await getCustomersData();
      return customers;
    } catch (error) {
      console.warn('Falling back to mock customers:', error);
    }
    return MOCK_CUSTOMERS;
  },

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (accessToken) {
        return await createCustomerAction(accessToken, input);
      }
    } catch (error) {
      console.warn('Falling back to local customer creation:', error);
    }

    const now = new Date();
    const names = splitLocalName(input.customerName);
    const customerType = input.customerType || 'residential';
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      account_number: `SOL-${now.getFullYear()}-${String(MOCK_CUSTOMERS.length + 1).padStart(4, '0')}`,
      first_name: names.first_name,
      last_name: names.last_name,
      contact_person: input.primaryContactName?.trim() || input.customerName.trim(),
      email: input.email?.trim() || '',
      phone: input.phone?.trim() || '',
      address: compactLocalAddress(input),
      city: input.city?.trim() || '',
      state: input.region?.trim() || '',
      zip: input.postalCode?.trim() || '',
      status: 'active',
      portal_status: 'not_invited',
      system_type: customerType,
      region: input.region?.trim() || input.city?.trim() || '',
      site_count: 0,
      installations_count: 0,
      open_tickets: 0,
      active_warranties: 0,
      warranty_status: 'none',
      upcoming_maintenance_date: '',
      last_service_date: '',
      created_at: now.toISOString().slice(0, 10),
      updated_at: now.toISOString(),
      notes_count: input.notes?.trim() || input.companyName?.trim() || input.primaryContactName?.trim() ? 1 : 0,
    };

    MOCK_CUSTOMERS.unshift(newCustomer);
    return newCustomer;
  },

  async getCustomer(id: string): Promise<Customer | null> {
    try {
      const customer = await getCustomerData(id);
      if (customer) return customer;
    } catch (error) {
      console.warn('Falling back to mock customer:', error);
    }
    return MOCK_CUSTOMERS.find((c) => c.id === id) ?? null;
  },

  async getInstallations(customerId: string): Promise<Installation[]> {
    try {
      const installations = await getInstallationsData(customerId);
      if (installations.length > 0) return installations;
    } catch (error) {
      console.warn('Falling back to mock installations:', error);
    }
    return MOCK_INSTALLATIONS[customerId] ?? [];
  },

  async getWarranties(customerId: string): Promise<Warranty[]> {
    try {
      const warranties = await getWarrantiesData(customerId);
      if (warranties.length > 0) return warranties;
    } catch (error) {
      console.warn('Falling back to mock warranties:', error);
    }
    return MOCK_WARRANTIES[customerId] ?? [];
  },

  async getMaintenanceHistory(customerId: string): Promise<MaintenanceRecord[]> {
    try {
      const visits = await getMaintenanceHistoryData(customerId);
      if (visits.length > 0) return visits;
    } catch (error) {
      console.warn('Falling back to mock maintenance history:', error);
    }
    return MOCK_MAINTENANCE[customerId] ?? [];
  },

  async getSupportTickets(customerId: string): Promise<SupportTicket[]> {
    try {
      const tickets = await getCustomerSupportTicketsData(customerId);
      if (tickets.length > 0) return tickets;
    } catch (error) {
      console.warn('Falling back to mock customer tickets:', error);
    }
    return MOCK_TICKETS[customerId] ?? [];
  },

  async getDocuments(customerId: string): Promise<CustomerDocument[]> {
    try {
      const documents = await getDocumentsData(customerId);
      if (documents.length > 0) return documents;
    } catch (error) {
      console.warn('Falling back to mock documents:', error);
    }
    return MOCK_DOCUMENTS[customerId] ?? [];
  },

  async getNotes(customerId: string): Promise<CustomerNote[]> {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_NOTES[customerId] ?? [];
  },

  async addNote(customerId: string, content: string, authorName: string, authorRole: string): Promise<CustomerNote> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (accessToken) {
        return await appendCustomerNoteAction(accessToken, customerId, content);
      }
    } catch (error) {
      console.warn('Falling back to local customer note:', error);
    }

    const newNote: CustomerNote = {
      id: `note-${Date.now()}`,
      customer_id: customerId,
      author_name: authorName,
      author_role: authorRole,
      content,
      created_at: new Date().toISOString(),
      is_pinned: false,
    };
    if (!MOCK_NOTES[customerId]) MOCK_NOTES[customerId] = [];
    MOCK_NOTES[customerId].unshift(newNote);
    return newNote;
  },
};
