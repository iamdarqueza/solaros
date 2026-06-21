// supportService.ts
// Customer Support data layer. Uses Supabase first and falls back to local mock data.

import {
  addSupportTicketMessageAction,
  createSupportTicketAction,
  updateSupportTicketStatusAction,
} from "@/actions/supportActions";
import { getSupportStatsFromTickets, getSupportTicketsData } from "@/data/solarosData";
import { supabase } from "@/lib/supabase";

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_customer'
  | 'waiting_technician'
  | 'resolved'
  | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketIssueType =
  | 'low_production'
  | 'inverter_error'
  | 'battery_issue'
  | 'panel_damage'
  | 'cleaning_request'
  | 'warranty_request'
  | 'billing_question'
  | 'document_request'
  | 'maintenance_request'
  | 'other';

export const ISSUE_TYPE_OPTIONS: { value: TicketIssueType; label: string }[] = [
  { value: 'low_production', label: 'Low Production' },
  { value: 'inverter_error', label: 'Inverter Error' },
  { value: 'battery_issue', label: 'Battery Issue' },
  { value: 'panel_damage', label: 'Panel Damage' },
  { value: 'cleaning_request', label: 'Cleaning Request' },
  { value: 'warranty_request', label: 'Warranty Request' },
  { value: 'billing_question', label: 'Billing Question' },
  { value: 'document_request', label: 'Document Request' },
  { value: 'maintenance_request', label: 'Maintenance Request' },
  { value: 'other', label: 'Other' },
];

export interface TicketAttachment {
  id: string;
  file_name: string;
  file_size: number; // bytes
  file_type: string;
  url: string;
  uploaded_at: string;
  uploaded_by: string;
}

export interface TicketNote {
  id: string;
  content: string;
  is_internal: boolean; // internal note vs customer-visible reply
  author_name: string;
  author_role: 'agent' | 'customer' | 'technician';
  created_at: string;
  attachments: TicketAttachment[];
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  issue_type: TicketIssueType;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  site_id: string | null;
  site_name: string;
  site_address: string;
  solar_system_id: string | null;
  solar_system_name: string;
  system_name: string;
  assigned_agent_id: string | null;
  assigned_agent_name: string | null;
  notes: TicketNote[];
  attachments: TicketAttachment[];
  related_work_order_id: string | null;
  related_warranty_id: string | null;
  related_maintenance_visit_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  first_response_at: string | null;
  tags: string[];
}

export interface SupportStats {
  total: number;
  open: number;
  in_progress: number;
  waiting_customer: number;
  waiting_technician: number;
  resolved: number;
  closed: number;
  avg_resolution_hours: number;
  overdue: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const now = new Date();

function hoursAgo(h: number): string {
  return new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
}

let ticketCounter = 3050;
function nextTicketNumber(): string {
  return `TKT-${String(ticketCounter++).padStart(4, '0')}`;
}

// ── Shared Agents ─────────────────────────────────────────────────────────────

export const SUPPORT_AGENTS = [
  { id: 'agent-001', name: 'Lena Park', avatar: 'LP', specialty: 'Technical & Inverter Issues' },
  { id: 'agent-002', name: 'Omar Khalil', avatar: 'OK', specialty: 'Billing & Contracts' },
  { id: 'agent-003', name: 'Sofia Ruiz', avatar: 'SR', specialty: 'Warranty Claims' },
  { id: 'agent-004', name: 'James Wei', avatar: 'JW', specialty: 'Installation Support' },
];

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_TICKETS: SupportTicket[] = [
  // ── OPEN ─────────────────────────────────────────────────────────────────
  {
    id: 'tkt-001',
    ticket_number: 'TKT-3001',
    subject: 'Inverter offline — no output since yesterday',
    description: 'Hi, my inverter has been showing a red fault light since yesterday afternoon. The app shows "Grid Fault" error. I have not had any power from the panels for over 18 hours. This is urgent as my battery is also draining.',
    status: 'open',
    priority: 'urgent',
    issue_type: 'inverter_error',
    customer_id: 'cust-001',
    customer_name: 'Marcus Delgado',
    customer_email: 'marcus.delgado@email.com',
    customer_phone: '+1 (619) 555-0142',
    site_id: 'site-001',
    site_name: 'Delgado Residence',
    site_address: '4821 Sunset Ridge Dr, San Diego, CA 92103',
    solar_system_id: 'sys-001',
    solar_system_name: 'Sunset Ridge 9.6 kW PV',
    system_name: 'Sunset Ridge 9.6 kW PV',
    assigned_agent_id: null,
    assigned_agent_name: null,
    notes: [
      {
        id: 'note-001',
        content: 'Customer called in at 8:42 AM. Reported inverter shows red fault light. App displays "Grid Fault" code E-47. Advised customer to check main breaker and report back.',
        is_internal: true,
        author_name: 'Lena Park',
        author_role: 'agent',
        created_at: hoursAgo(2),
        attachments: [],
      },
    ],
    attachments: [
      {
        id: 'att-001',
        file_name: 'inverter_error_screen.jpg',
        file_size: 1245000,
        file_type: 'image/jpeg',
        url: '/images/support/placeholder.jpg',
        uploaded_at: hoursAgo(3),
        uploaded_by: 'Marcus Delgado',
      },
    ],
    related_work_order_id: 'wo-001',
    related_warranty_id: null,
    related_maintenance_visit_id: null,
    created_at: hoursAgo(4),
    updated_at: hoursAgo(2),
    resolved_at: null,
    first_response_at: hoursAgo(2),
    tags: ['inverter', 'urgent', 'grid-fault'],
  },
  {
    id: 'tkt-002',
    ticket_number: 'TKT-3002',
    subject: 'Bill discrepancy — overcharged for maintenance visit',
    description: 'I received my invoice for the maintenance visit last month but was charged for 3 hours of labor when the technician was only here for 1.5 hours. Please review and issue a corrected invoice.',
    status: 'open',
    priority: 'medium',
    issue_type: 'billing_question',
    customer_id: 'cust-003',
    customer_name: 'James Thornton',
    customer_email: 'jthornton@corporate.net',
    customer_phone: '+1 (480) 555-0561',
    site_id: 'site-003',
    site_name: 'Thornton Residence',
    site_address: '8114 Desert Bloom Ln, Scottsdale, AZ',
    solar_system_id: 'sys-003',
    solar_system_name: 'Canadian Solar 15kW Residential Array',
    system_name: 'Canadian Solar 15kW Residential Array',
    assigned_agent_id: 'agent-002',
    assigned_agent_name: 'Omar Khalil',
    notes: [
      {
        id: 'note-002',
        content: 'Pulled work order WO-1010. Technician logged 1.5 hours on-site. Invoice was auto-generated with incorrect estimate. Escalating to billing team for credit issuance.',
        is_internal: true,
        author_name: 'Omar Khalil',
        author_role: 'agent',
        created_at: hoursAgo(5),
        attachments: [],
      },
    ],
    attachments: [
      {
        id: 'att-002',
        file_name: 'invoice_MAY2025.pdf',
        file_size: 280000,
        file_type: 'application/pdf',
        url: '/files/support/invoice_may2025.pdf',
        uploaded_at: daysAgo(1),
        uploaded_by: 'James Thornton',
      },
    ],
    related_work_order_id: 'wo-010',
    related_warranty_id: null,
    related_maintenance_visit_id: 'mnt-010',
    created_at: daysAgo(1),
    updated_at: hoursAgo(5),
    resolved_at: null,
    first_response_at: hoursAgo(5),
    tags: ['billing', 'invoice', 'dispute'],
  },
  {
    id: 'tkt-003',
    ticket_number: 'TKT-3003',
    subject: 'Panels generating less power than expected',
    description: 'My system is showing about 30% less output than the same period last year. I have not changed anything on my end. The monitoring app shows all panels are "online" but the numbers don\'t add up. Could there be shading or degradation?',
    status: 'open',
    priority: 'low',
    issue_type: 'low_production',
    customer_id: 'cust-009',
    customer_name: 'Kenji Watanabe',
    customer_email: 'kenji.w@personal.com',
    customer_phone: '+1 (408) 555-0772',
    site_id: 'site-009',
    site_name: 'Watanabe Residence',
    site_address: '62 Willow Creek Ct, San Jose, CA',
    solar_system_id: 'sys-009',
    solar_system_name: 'LG NeON 15kW New Installation',
    system_name: 'LG NeON 15kW New Installation',
    assigned_agent_id: 'agent-001',
    assigned_agent_name: 'Lena Park',
    notes: [],
    attachments: [],
    related_work_order_id: 'wo-006',
    related_warranty_id: null,
    related_maintenance_visit_id: null,
    created_at: hoursAgo(1),
    updated_at: hoursAgo(1),
    resolved_at: null,
    first_response_at: null,
    tags: ['performance', 'output', 'monitoring'],
  },

  // ── IN PROGRESS ───────────────────────────────────────────────────────────
  {
    id: 'tkt-004',
    ticket_number: 'TKT-2998',
    subject: 'Warranty claim — cracked panel after hailstorm',
    description: 'We had a severe hailstorm last week and panel #4 and #11 both have visible cracks. I took photos and need to file a warranty claim. The panels are less than 2 years old.',
    status: 'in_progress',
    priority: 'high',
    issue_type: 'panel_damage',
    customer_id: 'cust-005',
    customer_name: 'Elena Vasquez',
    customer_email: 'evasquez@homemail.com',
    customer_phone: '+1 (503) 555-0447',
    site_id: 'site-005',
    site_name: 'Vasquez Residence',
    site_address: '3901 Maple Terrace, Portland, OR',
    solar_system_id: 'sys-005',
    solar_system_name: 'LG NeON 12kW Residential Array',
    system_name: 'LG NeON 12kW Residential Array',
    assigned_agent_id: 'agent-003',
    assigned_agent_name: 'Sofia Ruiz',
    notes: [
      {
        id: 'note-003',
        content: 'Reviewed customer photos. Confirmed physical damage consistent with hail impact. LG NeON panels are covered under 25-year product warranty but physical damage requires manufacturer review.',
        is_internal: true,
        author_name: 'Sofia Ruiz',
        author_role: 'agent',
        created_at: daysAgo(3),
        attachments: [],
      },
      {
        id: 'note-004',
        content: 'Hi Elena, thank you for reaching out. I have reviewed the photos you sent and can confirm the damage is consistent with hail impact. I have initiated the warranty claim with LG and assigned a technician (Jasmine Lee) to conduct an on-site inspection on Thursday. You will receive a confirmation email shortly.',
        is_internal: false,
        author_name: 'Sofia Ruiz',
        author_role: 'agent',
        created_at: daysAgo(2),
        attachments: [],
      },
      {
        id: 'note-005',
        content: 'Thank you Sofia! I received the confirmation. Jasmine came by and confirmed both panels are cracked through. She said replacements are in stock. When will they be installed?',
        is_internal: false,
        author_name: 'Elena Vasquez',
        author_role: 'customer',
        created_at: daysAgo(1),
        attachments: [],
      },
    ],
    attachments: [
      {
        id: 'att-003',
        file_name: 'panel_4_damage.jpg',
        file_size: 2100000,
        file_type: 'image/jpeg',
        url: '/images/support/placeholder.jpg',
        uploaded_at: daysAgo(4),
        uploaded_by: 'Elena Vasquez',
      },
      {
        id: 'att-004',
        file_name: 'panel_11_damage.jpg',
        file_size: 1850000,
        file_type: 'image/jpeg',
        url: '/images/support/placeholder.jpg',
        uploaded_at: daysAgo(4),
        uploaded_by: 'Elena Vasquez',
      },
      {
        id: 'att-005',
        file_name: 'warranty_certificate.pdf',
        file_size: 420000,
        file_type: 'application/pdf',
        url: '/files/support/warranty.pdf',
        uploaded_at: daysAgo(3),
        uploaded_by: 'Sofia Ruiz',
      },
    ],
    related_work_order_id: 'wo-005',
    related_warranty_id: 'war-1042',
    related_maintenance_visit_id: null,
    created_at: daysAgo(5),
    updated_at: daysAgo(1),
    resolved_at: null,
    first_response_at: daysAgo(3),
    tags: ['warranty', 'hail-damage', 'panel-replacement'],
  },
  {
    id: 'tkt-005',
    ticket_number: 'TKT-2999',
    subject: 'Monitoring app not syncing — data gap for 3 days',
    description: 'The SolarOS mobile app hasn\'t updated my production data in 3 days. It still shows data from June 10th. My neighbor has the same system and his app works fine. Is this a server issue or my hardware?',
    status: 'in_progress',
    priority: 'medium',
    issue_type: 'inverter_error',
    customer_id: 'cust-002',
    customer_name: 'Priya Nair',
    customer_email: 'priya.nair@techco.com',
    customer_phone: '+1 (408) 555-0219',
    site_id: 'site-002',
    site_name: 'Nair Commercial Roof',
    site_address: '455 Innovation Pkwy, Santa Clara, CA',
    solar_system_id: 'sys-002',
    solar_system_name: 'First Solar 80kW Commercial Array',
    system_name: 'First Solar 80kW Commercial Array',
    assigned_agent_id: 'agent-001',
    assigned_agent_name: 'Lena Park',
    notes: [
      {
        id: 'note-006',
        content: 'Checked monitoring API logs. The gateway device (ID: GW-4421) stopped sending heartbeats on June 10th at 11:47 PM. Likely a local network or gateway firmware issue, not server-side.',
        is_internal: true,
        author_name: 'Lena Park',
        author_role: 'agent',
        created_at: hoursAgo(20),
        attachments: [],
      },
      {
        id: 'note-007',
        content: 'Hi Priya! I\'ve identified the issue — your monitoring gateway (GW-4421) stopped communicating on June 10th. This is a local connectivity issue, not a server problem. Can you please check if the gateway device (small white box near your inverter) has solid green lights? If not, try power cycling it.',
        is_internal: false,
        author_name: 'Lena Park',
        author_role: 'agent',
        created_at: hoursAgo(19),
        attachments: [],
      },
    ],
    attachments: [],
    related_work_order_id: null,
    related_warranty_id: null,
    related_maintenance_visit_id: null,
    created_at: daysAgo(2),
    updated_at: hoursAgo(19),
    resolved_at: null,
    first_response_at: hoursAgo(20),
    tags: ['monitoring', 'connectivity', 'gateway'],
  },

  // ── WAITING CUSTOMER ──────────────────────────────────────────────────────
  {
    id: 'tkt-006',
    ticket_number: 'TKT-2996',
    subject: 'Request to upgrade system from 10kW to 20kW',
    description: 'We recently purchased an EV and our power bills have increased significantly. We would like to explore upgrading our solar system. Please send us a quote for doubling our capacity and adding battery storage.',
    status: 'waiting_customer',
    priority: 'low',
    issue_type: 'other',
    customer_id: 'cust-006',
    customer_name: 'Richard Chen',
    customer_email: 'rchen@techventures.io',
    customer_phone: '+1 (510) 555-0623',
    site_id: 'site-006',
    site_name: 'Chen Ventures HQ',
    site_address: '1776 Harbor Bay Pkwy, Alameda, CA',
    solar_system_id: 'sys-006',
    solar_system_name: 'SolarEdge 45kW Commercial Array',
    system_name: 'SolarEdge 45kW Commercial Array',
    assigned_agent_id: 'agent-004',
    assigned_agent_name: 'James Wei',
    notes: [
      {
        id: 'note-008',
        content: 'Sent quote #Q-2025-441 to customer. Upgrade to 20kW + Powerwall 3 (2 units). Total: $28,500 with financing options. Awaiting customer approval.',
        is_internal: true,
        author_name: 'James Wei',
        author_role: 'agent',
        created_at: daysAgo(4),
        attachments: [],
      },
      {
        id: 'note-009',
        content: 'Hi Richard! I have attached a detailed quote for upgrading your system to 20kW with two Powerwall 3 units for battery storage. The upgrade would provide approximately 190% more solar production and cover your increased EV charging needs. Please review and let me know if you have any questions or would like to schedule a consultation call.',
        is_internal: false,
        author_name: 'James Wei',
        author_role: 'agent',
        created_at: daysAgo(4),
        attachments: [
          {
            id: 'att-006',
            file_name: 'upgrade_quote_Q2025-441.pdf',
            file_size: 560000,
            file_type: 'application/pdf',
            url: '/files/support/quote.pdf',
            uploaded_at: daysAgo(4),
            uploaded_by: 'James Wei',
          },
        ],
      },
    ],
    attachments: [
      {
        id: 'att-007',
        file_name: 'upgrade_quote_Q2025-441.pdf',
        file_size: 560000,
        file_type: 'application/pdf',
        url: '/files/support/quote.pdf',
        uploaded_at: daysAgo(4),
        uploaded_by: 'James Wei',
      },
    ],
    related_work_order_id: null,
    related_warranty_id: null,
    related_maintenance_visit_id: null,
    created_at: daysAgo(7),
    updated_at: daysAgo(4),
    resolved_at: null,
    first_response_at: daysAgo(6),
    tags: ['upgrade', 'ev-charging', 'battery', 'quote'],
  },
  {
    id: 'tkt-007',
    ticket_number: 'TKT-2997',
    subject: 'Roof replacement — need panels removed and reinstalled',
    description: 'My roofer says I need to replace the roof before winter and the solar panels need to be removed first. Can you provide a quote for panel removal and reinstallation after the roof work is done?',
    status: 'waiting_technician',
    priority: 'medium',
    issue_type: 'maintenance_request',
    customer_id: 'cust-007',
    customer_name: 'Fatima Al-Hassan',
    customer_email: 'fatima.alhassan@gmail.com',
    customer_phone: '+1 (305) 555-0882',
    site_id: 'site-007',
    site_name: 'Al-Hassan Residence',
    site_address: '204 Ocean Grove Ave, Miami, FL',
    solar_system_id: 'sys-007',
    solar_system_name: 'Panasonic EverVolt 18kW Array',
    system_name: 'Panasonic EverVolt 18kW Array',
    assigned_agent_id: 'agent-004',
    assigned_agent_name: 'James Wei',
    notes: [
      {
        id: 'note-010',
        content: 'Standard panel detach/reattach job. 36 panels. Sent quote for $1,800 (removal) + $2,200 (reinstall + recertification). Waiting for customer to confirm roof contractor timeline.',
        is_internal: true,
        author_name: 'James Wei',
        author_role: 'agent',
        created_at: daysAgo(6),
        attachments: [],
      },
      {
        id: 'note-011',
        content: 'Hi Fatima! Thank you for the heads up. I have sent you a quote for the panel removal and reinstallation service. Please confirm your roofing contractor\'s schedule so we can coordinate the timing. We recommend scheduling us for the day before your roofer starts and the day after they finish.',
        is_internal: false,
        author_name: 'James Wei',
        author_role: 'agent',
        created_at: daysAgo(6),
        attachments: [],
      },
    ],
    attachments: [],
    related_work_order_id: null,
    related_warranty_id: null,
    related_maintenance_visit_id: 'mnt-022',
    created_at: daysAgo(8),
    updated_at: daysAgo(6),
    resolved_at: null,
    first_response_at: daysAgo(7),
    tags: ['removal', 'roof-replacement', 'reinstall'],
  },

  // ── RESOLVED ─────────────────────────────────────────────────────────────
  {
    id: 'tkt-008',
    ticket_number: 'TKT-2990',
    subject: 'Monitoring portal login issue — password reset not working',
    description: 'I have tried to reset my password three times but I never receive the email. I need to access my monitoring data for my HOA report.',
    status: 'resolved',
    priority: 'low',
    issue_type: 'document_request',
    customer_id: 'cust-004',
    customer_name: 'Amara Osei',
    customer_email: 'amara.osei@business.com',
    customer_phone: '+1 (702) 555-0341',
    site_id: 'site-004',
    site_name: 'Osei Business Campus',
    site_address: '9005 Summerlin Center Dr, Las Vegas, NV',
    solar_system_id: 'sys-004',
    solar_system_name: 'Trina Solar 60kW + Powerwall Array',
    system_name: 'Trina Solar 60kW + Powerwall Array',
    assigned_agent_id: 'agent-002',
    assigned_agent_name: 'Omar Khalil',
    notes: [
      {
        id: 'note-012',
        content: 'Password reset emails were going to spam folder. Manually triggered reset and walked customer through process. Issue resolved.',
        is_internal: true,
        author_name: 'Omar Khalil',
        author_role: 'agent',
        created_at: daysAgo(10),
        attachments: [],
      },
      {
        id: 'note-013',
        content: 'Hi Amara! I triggered a manual password reset for your account. Please check your spam/junk folder for an email from noreply@solarops.com. If you still don\'t see it, reply here and I will whitelist your address in our system.',
        is_internal: false,
        author_name: 'Omar Khalil',
        author_role: 'agent',
        created_at: daysAgo(10),
        attachments: [],
      },
      {
        id: 'note-014',
        content: 'Found it in spam! Got logged in. Thank you so much for the quick help.',
        is_internal: false,
        author_name: 'Amara Osei',
        author_role: 'customer',
        created_at: daysAgo(10),
        attachments: [],
      },
    ],
    attachments: [],
    related_work_order_id: null,
    related_warranty_id: null,
    related_maintenance_visit_id: null,
    created_at: daysAgo(12),
    updated_at: daysAgo(10),
    resolved_at: daysAgo(10),
    first_response_at: daysAgo(11),
    tags: ['login', 'password-reset', 'portal'],
  },
  {
    id: 'tkt-009',
    ticket_number: 'TKT-2991',
    subject: 'Annual maintenance confirmation request',
    description: 'I would like to schedule my annual maintenance service. My last visit was in June 2024. Can you confirm the scope of work and availability for late June 2025?',
    status: 'resolved',
    priority: 'low',
    issue_type: 'maintenance_request',
    customer_id: 'cust-008',
    customer_name: 'Roberto Morales',
    customer_email: 'roberto.morales@farmco.com',
    customer_phone: '+1 (559) 555-0314',
    site_id: 'site-008',
    site_name: 'Morales Farm Shop',
    site_address: '1182 County Road 14, Fresno, CA',
    solar_system_id: 'sys-008',
    solar_system_name: 'Jinko Solar Tiger 30kW Array',
    system_name: 'Jinko Solar Tiger 30kW Array',
    assigned_agent_id: 'agent-003',
    assigned_agent_name: 'Sofia Ruiz',
    notes: [
      {
        id: 'note-015',
        content: 'Booked annual maintenance for June 20th. Work order WO-1008 created. Customer confirmed. Closing ticket.',
        is_internal: false,
        author_name: 'Sofia Ruiz',
        author_role: 'agent',
        created_at: daysAgo(14),
        attachments: [],
      },
    ],
    attachments: [],
    related_work_order_id: 'wo-008',
    related_warranty_id: null,
    related_maintenance_visit_id: 'mnt-008',
    created_at: daysAgo(16),
    updated_at: daysAgo(14),
    resolved_at: daysAgo(14),
    first_response_at: daysAgo(15),
    tags: ['maintenance', 'annual', 'scheduling'],
  },
];

// ── Service ───────────────────────────────────────────────────────────────────

export const supportService = {
  async getAllTickets(): Promise<SupportTicket[]> {
    try {
      const tickets = await getSupportTicketsData();
      if (tickets.length > 0) return tickets;
    } catch (error) {
      console.warn('Falling back to mock support tickets:', error);
    }
    return [...MOCK_TICKETS].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async getTicket(id: string): Promise<SupportTicket | null> {
    try {
      const tickets = await getSupportTicketsData();
      const ticket = tickets.find((t) => t.id === id);
      if (ticket) return ticket;
    } catch (error) {
      console.warn('Falling back to mock support ticket:', error);
    }
    return MOCK_TICKETS.find((t) => t.id === id) ?? null;
  },

  async getByStatus(status: TicketStatus): Promise<SupportTicket[]> {
    try {
      const tickets = await getSupportTicketsData();
      if (tickets.length > 0) {
        return tickets.filter((t) => t.status === status);
      }
    } catch (error) {
      console.warn('Falling back to mock support status filter:', error);
    }
    return MOCK_TICKETS.filter((t) => t.status === status).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async getStats(): Promise<SupportStats> {
    try {
      const tickets = await getSupportTicketsData();
      if (tickets.length > 0) return getSupportStatsFromTickets(tickets);
    } catch (error) {
      console.warn('Falling back to mock support stats:', error);
    }
    const tickets = MOCK_TICKETS;
    const resolved = tickets.filter((t) => t.status === 'resolved' && t.resolved_at && t.created_at);
    const avgHours =
      resolved.length > 0
        ? resolved.reduce((sum, t) => {
            const diff =
              new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime();
            return sum + diff / (1000 * 60 * 60);
          }, 0) / resolved.length
        : 0;

    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      in_progress: tickets.filter((t) => t.status === 'in_progress').length,
      waiting_customer: tickets.filter((t) => t.status === 'waiting_customer').length,
      waiting_technician: tickets.filter((t) => t.status === 'waiting_technician').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
      closed: tickets.filter((t) => t.status === 'closed').length,
      avg_resolution_hours: Math.round(avgHours * 10) / 10,
      overdue: tickets.filter(
        (t) =>
          t.status === 'open' &&
          !t.first_response_at &&
          new Date(t.created_at).getTime() < now.getTime() - 4 * 60 * 60 * 1000
      ).length,
    };
  },

  async createTicket(
    data: Omit<SupportTicket, 'id' | 'ticket_number' | 'created_at' | 'updated_at' | 'notes' | 'attachments'>
  ): Promise<SupportTicket> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (accessToken) {
        return await createSupportTicketAction({
          accessToken,
          subject: data.subject,
          description: data.description,
          customer_name: data.customer_name,
          customer_email: data.customer_email,
          customer_phone: data.customer_phone,
          site_name: data.site_name,
          site_address: data.site_address,
          solar_system_name: data.solar_system_name,
          issue_type: data.issue_type,
          priority: data.priority,
          assigned_agent_id: data.assigned_agent_id,
        });
      }
    } catch (error) {
      console.warn('Falling back to local support ticket create:', error);
    }

    const ticket: SupportTicket = {
      ...data,
      id: `tkt-${Date.now()}`,
      ticket_number: nextTicketNumber(),
      notes: [],
      attachments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    MOCK_TICKETS.unshift(ticket);
    return ticket;
  },

  async updateTicket(id: string, data: Partial<SupportTicket>): Promise<SupportTicket> {
    await new Promise((r) => setTimeout(r, 350));
    const idx = MOCK_TICKETS.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Ticket not found');
    MOCK_TICKETS[idx] = {
      ...MOCK_TICKETS[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return MOCK_TICKETS[idx];
  },

  async updateStatus(id: string, status: TicketStatus): Promise<SupportTicket> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (accessToken) {
        await updateSupportTicketStatusAction(accessToken, id, status);
        const ticket = await this.getTicket(id);
        if (ticket) return ticket;
      }
    } catch (error) {
      console.warn('Falling back to local support status update:', error);
    }

    const idx = MOCK_TICKETS.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Ticket not found');
    const updates: Partial<SupportTicket> = { status, updated_at: new Date().toISOString() };
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    } else if (status === 'open' || status === 'in_progress') {
      updates.resolved_at = null;
    }
    MOCK_TICKETS[idx] = { ...MOCK_TICKETS[idx], ...updates };
    return MOCK_TICKETS[idx];
  },

  async assignAgent(id: string, agentId: string): Promise<SupportTicket> {
    await new Promise((r) => setTimeout(r, 300));
    const idx = MOCK_TICKETS.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Ticket not found');
    const agent = SUPPORT_AGENTS.find((a) => a.id === agentId);
    MOCK_TICKETS[idx] = {
      ...MOCK_TICKETS[idx],
      assigned_agent_id: agentId,
      assigned_agent_name: agent?.name ?? null,
      updated_at: new Date().toISOString(),
    };
    return MOCK_TICKETS[idx];
  },

  async addNote(
    id: string,
    note: Omit<TicketNote, 'id'>
  ): Promise<SupportTicket> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (accessToken) {
        await addSupportTicketMessageAction(accessToken, id, note.content, note.is_internal);
        const ticket = await this.getTicket(id);
        if (ticket) return ticket;
      }
    } catch (error) {
      console.warn('Falling back to local support note:', error);
    }

    const idx = MOCK_TICKETS.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Ticket not found');
    const newNote: TicketNote = { ...note, id: `note-${Date.now()}` };
    MOCK_TICKETS[idx] = {
      ...MOCK_TICKETS[idx],
      notes: [...MOCK_TICKETS[idx].notes, newNote],
      first_response_at: MOCK_TICKETS[idx].first_response_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return MOCK_TICKETS[idx];
  },

  async addAttachment(id: string, attachment: Omit<TicketAttachment, 'id'>): Promise<SupportTicket> {
    await new Promise((r) => setTimeout(r, 300));
    const idx = MOCK_TICKETS.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Ticket not found');
    const newAtt: TicketAttachment = { ...attachment, id: `att-${Date.now()}` };
    MOCK_TICKETS[idx] = {
      ...MOCK_TICKETS[idx],
      attachments: [...MOCK_TICKETS[idx].attachments, newAtt],
      updated_at: new Date().toISOString(),
    };
    return MOCK_TICKETS[idx];
  },
};
