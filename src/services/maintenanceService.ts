// maintenanceService.ts
// Mock data layer for Maintenance Scheduling module.
// Replace mock functions with real Supabase queries when schema is ready.

export type MaintenanceStatus = 'scheduled' | 'due_soon' | 'overdue' | 'in_progress' | 'completed' | 'cancelled';
export type RecurrenceFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
export type MaintenanceServiceType = 'panel_cleaning' | 'inverter_inspection' | 'system_inspection' | 'performance_diagnostic';
export type MaintenancePlanStatus = 'active' | 'paused';

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface MaintenanceVisit {
  id: string;
  customer_id: string;
  customer_name: string;
  site_address: string;
  system_name: string;
  system_id: string;
  service_type: MaintenanceServiceType;
  scheduled_date: string; // ISO date string
  scheduled_time: string;
  technician_id: string;
  technician_name: string;
  technician_avatar?: string;
  assigned_team: string;
  status: MaintenanceStatus;
  checklist: ChecklistItem[];
  photos: string[];
  notes?: string;
  completion_notes?: string;
  completion_report?: string;
  completed_at?: string;
  recurrence_plan_id?: string;
  work_order_id?: string;
  created_at: string;
}

export type MaintenanceRecord = MaintenanceVisit;

export interface MaintenancePlan {
  id: string;
  customer_id: string;
  customer_name: string;
  site_address: string;
  system_name: string;
  system_id: string;
  service_type: MaintenanceServiceType;
  frequency: RecurrenceFrequency;
  start_date: string;
  last_completed?: string;
  next_due: string;
  technician_id: string;
  technician_name: string;
  assigned_team: string;
  checklist_template: Omit<ChecklistItem, 'done'>[];
  status: MaintenancePlanStatus;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export type RecurringPlan = MaintenancePlan;

export interface MaintenanceStats {
  total: number;
  scheduled: number;
  in_progress: number;
  completed: number;
  overdue: number;
  cancelled: number;
  due_this_week: number;
  due_this_month: number;
  completion_rate: number; // 0-100
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const today = new Date();

function dateOffset(days: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function monthOffset(months: number): string {
  const d = new Date(today);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function isOverdue(record: { scheduled_date: string; completed_at?: string }): boolean {
  if (record.completed_at) return false;
  return new Date(record.scheduled_date) < today;
}

function isDueSoon(record: { scheduled_date: string; completed_at?: string }): boolean {
  if (record.completed_at) return false;
  const scheduled = new Date(record.scheduled_date);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + 7);
  return scheduled >= today && scheduled <= cutoff;
}

export const MAINTENANCE_SERVICE_TYPE_LABELS: Record<MaintenanceServiceType, string> = {
  panel_cleaning: 'Panel Cleaning',
  inverter_inspection: 'Inverter Inspection',
  system_inspection: 'System Inspection',
  performance_diagnostic: 'Performance Diagnostic',
};

// ── Technicians (shared reference) ───────────────────────────────────────────

export const TECHNICIANS = [
  { id: 'tech-001', name: 'Carlos Rivera', avatar: 'CR' },
  { id: 'tech-002', name: 'Sarah Johnson', avatar: 'SJ' },
  { id: 'tech-003', name: 'Mike Torres', avatar: 'MT' },
  { id: 'tech-004', name: 'Jasmine Lee', avatar: 'JL' },
  { id: 'tech-005', name: 'David Park', avatar: 'DP' },
];

// ── Default Checklist Template ────────────────────────────────────────────────

export const DEFAULT_CHECKLIST_TEMPLATE: Omit<ChecklistItem, 'done'>[] = [
  { id: 'chk-1', label: 'Inspect panel surfaces for dirt, debris, or damage' },
  { id: 'chk-2', label: 'Clean solar panels with approved cleaning solution' },
  { id: 'chk-3', label: 'Check all electrical connections and wiring' },
  { id: 'chk-4', label: 'Inspect inverter display and error codes' },
  { id: 'chk-5', label: 'Verify system output against expected performance' },
  { id: 'chk-6', label: 'Inspect mounting hardware for corrosion or loosening' },
  { id: 'chk-7', label: 'Check roof penetrations and seals for leaks' },
  { id: 'chk-8', label: 'Review monitoring system alerts and alerts history' },
  { id: 'chk-9', label: 'Test disconnect switches and safety equipment' },
  { id: 'chk-10', label: 'Document system performance readings' },
];

function makeChecklist(doneCount = 0): ChecklistItem[] {
  return DEFAULT_CHECKLIST_TEMPLATE.map((item, i) => ({
    ...item,
    done: i < doneCount,
  }));
}

// ── Mock Records ──────────────────────────────────────────────────────────────

const RAW_RECORDS: Omit<MaintenanceRecord, 'status'>[] = [
  // ── OVERDUE ────────────────────────────────────────────────────────────────
  {
    id: 'maint-001',
    customer_id: 'cust-001',
    customer_name: 'Marcus Delgado',
    site_address: '4821 Sunset Ridge Dr, San Diego, CA 92103',
    system_name: 'Sunset Ridge 9.6 kW PV',
    system_id: 'sys-001',
    service_type: 'panel_cleaning',
    scheduled_date: dateOffset(-14),
    scheduled_time: '09:00',
    technician_id: 'tech-001',
    technician_name: 'Carlos Rivera',
    assigned_team: 'Residential Service Team',
    checklist: makeChecklist(0),
    photos: [],
    notes: 'Semi-annual panel cleaning from recurring plan.',
    completion_notes: undefined,
    completion_report: undefined,
    completed_at: undefined,
    recurrence_plan_id: 'plan-001',
    work_order_id: undefined,
    created_at: dateOffset(-30),
  },
  {
    id: 'maint-002',
    customer_id: 'cust-002',
    customer_name: 'Priya Nair',
    site_address: '1100 Innovation Way, San Jose, CA 95110',
    system_name: 'First Solar 80kW Commercial Array',
    system_id: 'sys-002',
    service_type: 'system_inspection',
    scheduled_date: dateOffset(-7),
    scheduled_time: '13:00',
    technician_id: 'tech-002',
    technician_name: 'Sarah Johnson',
    assigned_team: 'Commercial O&M Team',
    checklist: makeChecklist(0),
    photos: [],
    notes: 'Annual commercial system inspection.',
    completion_notes: undefined,
    completion_report: undefined,
    completed_at: undefined,
    recurrence_plan_id: 'plan-002',
    work_order_id: undefined,
    created_at: dateOffset(-21),
  },
  {
    id: 'maint-003',
    customer_id: 'cust-003',
    customer_name: 'James Thornton',
    site_address: '7832 Desert Palm Ave, Scottsdale, AZ 85251',
    system_name: 'Canadian Solar 15kW Residential Array',
    system_id: 'sys-003',
    service_type: 'panel_cleaning',
    scheduled_date: dateOffset(-3),
    scheduled_time: '10:30',
    technician_id: 'tech-003',
    technician_name: 'Mike Torres',
    assigned_team: 'Desert Region Service Team',
    checklist: makeChecklist(4),
    photos: [],
    notes: 'Quarterly cleaning due to dust exposure.',
    completion_notes: undefined,
    completion_report: undefined,
    completed_at: undefined,
    recurrence_plan_id: 'plan-003',
    work_order_id: undefined,
    created_at: dateOffset(-14),
  },

  // ── UPCOMING THIS WEEK ─────────────────────────────────────────────────────
  {
    id: 'maint-004',
    customer_id: 'cust-004',
    customer_name: 'Amara Osei',
    site_address: '2200 Commerce Blvd, Las Vegas, NV 89101',
    system_name: 'Trina Solar 60kW + Powerwall Array',
    system_id: 'sys-004',
    service_type: 'performance_diagnostic',
    scheduled_date: dateOffset(1),
    scheduled_time: '08:30',
    technician_id: 'tech-001',
    technician_name: 'Carlos Rivera',
    assigned_team: 'Storage Service Team',
    checklist: makeChecklist(0),
    photos: [],
    notes: 'Check array and battery performance.',
    completion_notes: undefined,
    completion_report: undefined,
    completed_at: undefined,
    recurrence_plan_id: 'plan-004',
    work_order_id: 'wo-1004',
    created_at: dateOffset(-14),
  },
  {
    id: 'maint-005',
    customer_id: 'cust-005',
    customer_name: 'Elena Vasquez',
    site_address: '3311 Hillcrest Blvd, Portland, OR 97201',
    system_name: 'LG NeON 12kW Residential Array',
    system_id: 'sys-005',
    service_type: 'inverter_inspection',
    scheduled_date: dateOffset(3),
    scheduled_time: '11:00',
    technician_id: 'tech-004',
    technician_name: 'Jasmine Lee',
    assigned_team: 'Residential Service Team',
    checklist: makeChecklist(0),
    photos: [],
    notes: 'Inspect inverter after warranty panel issue.',
    completion_notes: undefined,
    completion_report: undefined,
    completed_at: undefined,
    work_order_id: undefined,
    created_at: dateOffset(-7),
  },
  {
    id: 'maint-006',
    customer_id: 'cust-006',
    customer_name: 'Richard Chen',
    site_address: '905 Bay Area Tech Park, Fremont, CA 94538',
    system_name: 'SolarEdge 45kW Commercial Array',
    system_id: 'sys-006',
    service_type: 'system_inspection',
    scheduled_date: dateOffset(5),
    scheduled_time: '14:00',
    technician_id: 'tech-002',
    technician_name: 'Sarah Johnson',
    assigned_team: 'Commercial O&M Team',
    checklist: makeChecklist(0),
    photos: [],
    notes: 'Two-person commercial inspection visit.',
    completion_notes: undefined,
    completion_report: undefined,
    completed_at: undefined,
    recurrence_plan_id: 'plan-005',
    work_order_id: undefined,
    created_at: dateOffset(-10),
  },

  // ── UPCOMING THIS MONTH ────────────────────────────────────────────────────
  {
    id: 'maint-007',
    customer_id: 'cust-007',
    customer_name: 'Fatima Al-Hassan',
    site_address: '88 Ocean Drive, Miami, FL 33139',
    system_name: 'Panasonic EverVolt 18kW Array',
    system_id: 'sys-007',
    service_type: 'panel_cleaning',
    scheduled_date: dateOffset(12),
    scheduled_time: '09:30',
    technician_id: 'tech-005',
    technician_name: 'David Park',
    assigned_team: 'Coastal Service Team',
    checklist: makeChecklist(0),
    photos: [],
    notes: 'Semi-annual coastal salt buildup cleaning.',
    completion_notes: undefined,
    completion_report: undefined,
    completed_at: undefined,
    recurrence_plan_id: 'plan-001',
    work_order_id: undefined,
    created_at: dateOffset(-5),
  },
  {
    id: 'maint-008',
    customer_id: 'cust-008',
    customer_name: 'Roberto Morales',
    site_address: '14200 Valley Ranch Rd, Fresno, CA 93706',
    system_name: 'Jinko Solar Tiger 30kW Array',
    system_id: 'sys-008',
    service_type: 'system_inspection',
    scheduled_date: dateOffset(18),
    scheduled_time: '10:00',
    technician_id: 'tech-003',
    technician_name: 'Mike Torres',
    assigned_team: 'Agricultural Service Team',
    checklist: makeChecklist(0),
    photos: [],
    notes: 'Annual inspection with bird nesting review.',
    completion_notes: undefined,
    completion_report: undefined,
    completed_at: undefined,
    recurrence_plan_id: 'plan-006',
    work_order_id: 'wo-1008',
    created_at: dateOffset(-3),
  },
  {
    id: 'maint-009',
    customer_id: 'cust-001',
    customer_name: 'Marcus Delgado',
    site_address: '200 Harbor View Ct, Coronado, CA 92118',
    system_name: 'LG NeON 8kW Secondary Array',
    system_id: 'sys-009',
    service_type: 'panel_cleaning',
    scheduled_date: dateOffset(22),
    scheduled_time: '15:00',
    technician_id: 'tech-001',
    technician_name: 'Carlos Rivera',
    assigned_team: 'Residential Service Team',
    checklist: makeChecklist(0),
    photos: [],
    notes: 'One-off cleaning requested by customer.',
    completion_notes: undefined,
    completion_report: undefined,
    completed_at: undefined,
    work_order_id: undefined,
    created_at: dateOffset(-2),
  },

  // ── IN PROGRESS ────────────────────────────────────────────────────────────
  {
    id: 'maint-010',
    customer_id: 'cust-003',
    customer_name: 'James Thornton',
    site_address: '7832 Desert Palm Ave, Scottsdale, AZ 85251',
    system_name: 'Canadian Solar 15kW Residential Array',
    system_id: 'sys-003',
    service_type: 'panel_cleaning',
    scheduled_date: dateOffset(0),
    scheduled_time: '12:30',
    technician_id: 'tech-003',
    technician_name: 'Mike Torres',
    assigned_team: 'Desert Region Service Team',
    checklist: makeChecklist(6),
    photos: [],
    notes: 'Technician currently completing checklist.',
    completion_notes: undefined,
    completion_report: undefined,
    completed_at: undefined,
    work_order_id: undefined,
    created_at: dateOffset(-7),
  },

  // ── COMPLETED ──────────────────────────────────────────────────────────────
  {
    id: 'maint-011',
    customer_id: 'cust-004',
    customer_name: 'Amara Osei',
    site_address: '2200 Commerce Blvd, Las Vegas, NV 89101',
    system_name: 'Trina Solar 60kW + Powerwall Array',
    system_id: 'sys-004',
    service_type: 'performance_diagnostic',
    scheduled_date: monthOffset(-3),
    scheduled_time: '08:30',
    technician_id: 'tech-001',
    technician_name: 'Carlos Rivera',
    assigned_team: 'Storage Service Team',
    checklist: makeChecklist(10),
    photos: [],
    notes: 'Quarterly performance check and Powerwall review.',
    completion_notes: 'All panels cleaned. Inverter firmware updated. Output at 99.2% of expected. Roof seals inspected — no issues found.',
    completion_report: 'Visit completed successfully. Battery health normal and production within expected range.',
    completed_at: monthOffset(-3),
    recurrence_plan_id: 'plan-004',
    work_order_id: 'wo-1004',
    created_at: monthOffset(-4),
  },
  {
    id: 'maint-012',
    customer_id: 'cust-002',
    customer_name: 'Priya Nair',
    site_address: '1100 Innovation Way, San Jose, CA 95110',
    system_name: 'First Solar 80kW Commercial Array',
    system_id: 'sys-002',
    service_type: 'system_inspection',
    scheduled_date: monthOffset(-6),
    scheduled_time: '13:00',
    technician_id: 'tech-002',
    technician_name: 'Sarah Johnson',
    assigned_team: 'Commercial O&M Team',
    checklist: makeChecklist(10),
    photos: [],
    notes: 'Annual commercial system inspection.',
    completion_notes: 'Annual inspection complete. Two mounting bolts re-torqued. Electrical connections cleaned and re-terminated. System performing at 97.8%.',
    completion_report: 'Inspection closed with minor mounting remediation and no open follow-up.',
    completed_at: monthOffset(-6),
    recurrence_plan_id: 'plan-002',
    work_order_id: undefined,
    created_at: monthOffset(-7),
  },
  {
    id: 'maint-013',
    customer_id: 'cust-005',
    customer_name: 'Elena Vasquez',
    site_address: '3311 Hillcrest Blvd, Portland, OR 97201',
    system_name: 'LG NeON 12kW Residential Array',
    system_id: 'sys-005',
    service_type: 'inverter_inspection',
    scheduled_date: monthOffset(-3),
    scheduled_time: '11:00',
    technician_id: 'tech-004',
    technician_name: 'Jasmine Lee',
    assigned_team: 'Residential Service Team',
    checklist: makeChecklist(10),
    photos: [],
    notes: 'Warranty-adjacent follow-up inspection.',
    completion_notes: 'Panel surfaces cleaned. Found one micro-crack on panel #7 — customer notified, warranty claim initiated. All other panels healthy.',
    completion_report: 'Issue documented for warranty claim; no immediate safety concerns.',
    completed_at: monthOffset(-3),
    work_order_id: undefined,
    created_at: monthOffset(-4),
  },
  {
    id: 'maint-014',
    customer_id: 'cust-007',
    customer_name: 'Fatima Al-Hassan',
    site_address: '88 Ocean Drive, Miami, FL 33139',
    system_name: 'Panasonic EverVolt 18kW Array',
    system_id: 'sys-007',
    service_type: 'panel_cleaning',
    scheduled_date: monthOffset(-6),
    scheduled_time: '09:30',
    technician_id: 'tech-005',
    technician_name: 'David Park',
    assigned_team: 'Coastal Service Team',
    checklist: makeChecklist(10),
    photos: [],
    notes: 'Coastal salt buildup cleaning and mounting inspection.',
    completion_notes: 'Semi-annual inspection. Salt spray buildup cleaned. Panel output restored to 101% after cleaning. No structural issues.',
    completion_report: 'Cleaning restored output and no corrosion follow-up is required.',
    completed_at: monthOffset(-6),
    recurrence_plan_id: 'plan-001',
    work_order_id: 'wo-1014',
    created_at: monthOffset(-7),
  },
  {
    id: 'maint-015',
    customer_id: 'cust-008',
    customer_name: 'Roberto Morales',
    site_address: '14200 Valley Ranch Rd, Fresno, CA 93706',
    system_name: 'Jinko Solar Tiger 30kW Array',
    system_id: 'sys-008',
    service_type: 'system_inspection',
    scheduled_date: monthOffset(-6),
    scheduled_time: '10:00',
    technician_id: 'tech-003',
    technician_name: 'Mike Torres',
    assigned_team: 'Agricultural Service Team',
    checklist: makeChecklist(10),
    photos: [],
    notes: 'Annual agricultural site inspection.',
    completion_notes: 'Annual full system check. All components within spec. Inverter logs reviewed — one grid fault event in August, self-resolved. Monitoring active.',
    completion_report: 'Annual visit completed with monitoring verified and no open defects.',
    completed_at: monthOffset(-6),
    recurrence_plan_id: 'plan-006',
    work_order_id: undefined,
    created_at: monthOffset(-7),
  },
];

// Hydrate status
const MOCK_RECORDS: MaintenanceRecord[] = RAW_RECORDS.map((r) => {
  let status: MaintenanceStatus;
  if (r.completed_at) {
    status = 'completed';
  } else if (r.id === 'maint-010') {
    status = 'in_progress';
  } else if (isOverdue(r)) {
    status = 'overdue';
  } else if (isDueSoon(r)) {
    status = 'due_soon';
  } else {
    status = 'scheduled';
  }
  return { ...r, status };
});

// ── Mock Recurring Plans ──────────────────────────────────────────────────────

const MOCK_PLANS: RecurringPlan[] = [
  {
    id: 'plan-001',
    customer_id: 'cust-001',
    customer_name: 'Marcus Delgado',
    site_address: '4821 Sunset Ridge Dr, San Diego, CA 92103',
    system_name: 'Sunset Ridge 9.6 kW PV',
    system_id: 'sys-001',
    service_type: 'panel_cleaning',
    frequency: 'semi_annual',
    start_date: monthOffset(-24),
    last_completed: monthOffset(-6),
    next_due: dateOffset(-14),
    technician_id: 'tech-001',
    technician_name: 'Carlos Rivera',
    assigned_team: 'Residential Service Team',
    checklist_template: DEFAULT_CHECKLIST_TEMPLATE,
    status: 'active',
    is_active: true,
    notes: 'Customer prefers morning visits before 10am.',
    created_at: monthOffset(-24),
  },
  {
    id: 'plan-002',
    customer_id: 'cust-002',
    customer_name: 'Priya Nair',
    site_address: '1100 Innovation Way, San Jose, CA 95110',
    system_name: 'First Solar 80kW Commercial Array',
    system_id: 'sys-002',
    service_type: 'system_inspection',
    frequency: 'annual',
    start_date: monthOffset(-18),
    last_completed: monthOffset(-6),
    next_due: monthOffset(6),
    technician_id: 'tech-002',
    technician_name: 'Sarah Johnson',
    assigned_team: 'Commercial O&M Team',
    checklist_template: DEFAULT_CHECKLIST_TEMPLATE,
    status: 'active',
    is_active: true,
    notes: 'Requires site access badge — contact facility manager 48 hours in advance.',
    created_at: monthOffset(-18),
  },
  {
    id: 'plan-003',
    customer_id: 'cust-003',
    customer_name: 'James Thornton',
    site_address: '7832 Desert Palm Ave, Scottsdale, AZ 85251',
    system_name: 'Canadian Solar 15kW Residential Array',
    system_id: 'sys-003',
    service_type: 'panel_cleaning',
    frequency: 'quarterly',
    start_date: monthOffset(-12),
    last_completed: monthOffset(-3),
    next_due: dateOffset(-3),
    technician_id: 'tech-003',
    technician_name: 'Mike Torres',
    assigned_team: 'Desert Region Service Team',
    checklist_template: DEFAULT_CHECKLIST_TEMPLATE,
    status: 'active',
    is_active: true,
    notes: 'High dust area — quarterly cleaning recommended.',
    created_at: monthOffset(-12),
  },
  {
    id: 'plan-004',
    customer_id: 'cust-004',
    customer_name: 'Amara Osei',
    site_address: '2200 Commerce Blvd, Las Vegas, NV 89101',
    system_name: 'Trina Solar 60kW + Powerwall Array',
    system_id: 'sys-004',
    service_type: 'performance_diagnostic',
    frequency: 'quarterly',
    start_date: monthOffset(-15),
    last_completed: monthOffset(-3),
    next_due: dateOffset(1),
    technician_id: 'tech-001',
    technician_name: 'Carlos Rivera',
    assigned_team: 'Storage Service Team',
    checklist_template: DEFAULT_CHECKLIST_TEMPLATE,
    status: 'active',
    is_active: true,
    notes: 'Battery storage — also check Powerwall health and charge cycles.',
    created_at: monthOffset(-15),
  },
  {
    id: 'plan-005',
    customer_id: 'cust-006',
    customer_name: 'Richard Chen',
    site_address: '905 Bay Area Tech Park, Fremont, CA 94538',
    system_name: 'SolarEdge 45kW Commercial Array',
    system_id: 'sys-006',
    service_type: 'system_inspection',
    frequency: 'semi_annual',
    start_date: monthOffset(-20),
    last_completed: monthOffset(-6),
    next_due: dateOffset(5),
    technician_id: 'tech-002',
    technician_name: 'Sarah Johnson',
    assigned_team: 'Commercial O&M Team',
    checklist_template: DEFAULT_CHECKLIST_TEMPLATE,
    status: 'active',
    is_active: true,
    notes: 'Commercial park — multi-building array. Requires 2-person crew.',
    created_at: monthOffset(-20),
  },
  {
    id: 'plan-006',
    customer_id: 'cust-008',
    customer_name: 'Roberto Morales',
    site_address: '14200 Valley Ranch Rd, Fresno, CA 93706',
    system_name: 'Jinko Solar Tiger 30kW Array',
    system_id: 'sys-008',
    service_type: 'system_inspection',
    frequency: 'annual',
    start_date: monthOffset(-18),
    last_completed: monthOffset(-6),
    next_due: monthOffset(6),
    technician_id: 'tech-003',
    technician_name: 'Mike Torres',
    assigned_team: 'Agricultural Service Team',
    checklist_template: DEFAULT_CHECKLIST_TEMPLATE,
    status: 'active',
    is_active: true,
    notes: 'Agricultural area — inspect for bird nesting under panels.',
    created_at: monthOffset(-18),
  },
  {
    id: 'plan-007',
    customer_id: 'cust-005',
    customer_name: 'Elena Vasquez',
    site_address: '3311 Hillcrest Blvd, Portland, OR 97201',
    system_name: 'LG NeON 12kW Residential Array',
    system_id: 'sys-005',
    service_type: 'inverter_inspection',
    frequency: 'annual',
    start_date: monthOffset(-15),
    last_completed: monthOffset(-3),
    next_due: monthOffset(9),
    technician_id: 'tech-004',
    technician_name: 'Jasmine Lee',
    assigned_team: 'Residential Service Team',
    checklist_template: DEFAULT_CHECKLIST_TEMPLATE,
    status: 'paused',
    is_active: false,
    notes: 'Paused pending warranty claim resolution on panel #7.',
    created_at: monthOffset(-15),
  },
];

// ── Service ───────────────────────────────────────────────────────────────────

export const maintenanceService = {
  async getAllRecords(): Promise<MaintenanceRecord[]> {
    await new Promise((r) => setTimeout(r, 400));
    return [...MOCK_RECORDS].sort(
      (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    );
  },

  async getRecord(id: string): Promise<MaintenanceRecord | null> {
    await new Promise((r) => setTimeout(r, 250));
    return MOCK_RECORDS.find((r) => r.id === id) ?? null;
  },

  async getUpcoming(days = 30): Promise<MaintenanceRecord[]> {
    await new Promise((r) => setTimeout(r, 350));
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + days);
    return MOCK_RECORDS.filter(
      (r) =>
        (r.status === 'scheduled' || r.status === 'due_soon') &&
        new Date(r.scheduled_date) >= today &&
        new Date(r.scheduled_date) <= cutoff
    ).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
  },

  async getOverdue(): Promise<MaintenanceRecord[]> {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_RECORDS.filter((r) => r.status === 'overdue').sort(
      (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    );
  },

  async getByTechnician(technicianId: string): Promise<MaintenanceRecord[]> {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_RECORDS.filter((r) => r.technician_id === technicianId);
  },

  async getAllPlans(): Promise<RecurringPlan[]> {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_PLANS;
  },

  async getPlan(id: string): Promise<RecurringPlan | null> {
    await new Promise((r) => setTimeout(r, 250));
    return MOCK_PLANS.find((p) => p.id === id) ?? null;
  },

  async getStats(): Promise<MaintenanceStats> {
    await new Promise((r) => setTimeout(r, 300));
    const records = MOCK_RECORDS;
    const thisMonthEnd = new Date(today);
    thisMonthEnd.setDate(thisMonthEnd.getDate() + 30);

    const completed = records.filter((r) => r.status === 'completed').length;
    const total = records.length;

    return {
      total,
      scheduled: records.filter((r) => r.status === 'scheduled').length,
      due_this_week: records.filter((r) => r.status === 'due_soon').length,
      in_progress: records.filter((r) => r.status === 'in_progress').length,
      completed,
      overdue: records.filter((r) => r.status === 'overdue').length,
      cancelled: records.filter((r) => r.status === 'cancelled').length,
      due_this_month: records.filter(
        (r) =>
          (r.status === 'scheduled' || r.status === 'due_soon') &&
          new Date(r.scheduled_date) >= today &&
          new Date(r.scheduled_date) <= thisMonthEnd
      ).length,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },

  async completeRecord(
    id: string,
    data: { checklist: ChecklistItem[]; completion_notes: string; photos: string[] }
  ): Promise<MaintenanceRecord> {
    await new Promise((r) => setTimeout(r, 500));
    const idx = MOCK_RECORDS.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Record not found');
    MOCK_RECORDS[idx] = {
      ...MOCK_RECORDS[idx],
      ...data,
      status: 'completed',
      completed_at: new Date().toISOString().split('T')[0],
    };
    return MOCK_RECORDS[idx];
  },

  async createRecord(
    data: Omit<MaintenanceRecord, 'id' | 'status' | 'created_at'>
  ): Promise<MaintenanceRecord> {
    await new Promise((r) => setTimeout(r, 500));
    const newRecord: MaintenanceRecord = {
      ...data,
      id: `maint-${Date.now()}`,
      status: new Date(data.scheduled_date) < today ? 'overdue' : isDueSoon(data) ? 'due_soon' : 'scheduled',
      created_at: new Date().toISOString().split('T')[0],
    };
    MOCK_RECORDS.push(newRecord);
    return newRecord;
  },

  async createPlan(data: Omit<RecurringPlan, 'id' | 'created_at'>): Promise<RecurringPlan> {
    await new Promise((r) => setTimeout(r, 500));
    const newPlan: RecurringPlan = {
      ...data,
      id: `plan-${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0],
    };
    MOCK_PLANS.push(newPlan);
    return newPlan;
  },

  async createWorkOrderForVisit(id: string): Promise<MaintenanceRecord> {
    await new Promise((r) => setTimeout(r, 450));
    const idx = MOCK_RECORDS.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Maintenance visit not found');
    const current = MOCK_RECORDS[idx];
    if (current.work_order_id) return current;

    MOCK_RECORDS[idx] = {
      ...current,
      work_order_id: `wo-${Date.now()}`,
    };
    return MOCK_RECORDS[idx];
  },
};
