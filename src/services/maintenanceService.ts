// maintenanceService.ts
// Mock data layer for Maintenance Scheduling module.
// Replace mock functions with real Supabase queries when schema is ready.

export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type RecurrenceFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface MaintenanceRecord {
  id: string;
  customer_id: string;
  customer_name: string;
  site_address: string;
  system_name: string;
  system_id: string;
  scheduled_date: string; // ISO date string
  technician_id: string;
  technician_name: string;
  technician_avatar?: string;
  status: MaintenanceStatus;
  checklist: ChecklistItem[];
  photos: string[];
  completion_notes?: string;
  completed_at?: string;
  recurrence_plan_id?: string;
  created_at: string;
}

export interface RecurringPlan {
  id: string;
  customer_id: string;
  customer_name: string;
  site_address: string;
  system_name: string;
  system_id: string;
  frequency: RecurrenceFrequency;
  last_completed?: string;
  next_due: string;
  technician_id: string;
  technician_name: string;
  checklist_template: Omit<ChecklistItem, 'done'>[];
  is_active: boolean;
  notes?: string;
  created_at: string;
}

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

function isOverdue(record: Omit<MaintenanceRecord, 'status'>): boolean {
  if (record.completed_at) return false;
  return new Date(record.scheduled_date) < today;
}

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
    system_name: 'SunPower 22kW Residential Array',
    system_id: 'sys-001',
    scheduled_date: dateOffset(-14),
    technician_id: 'tech-001',
    technician_name: 'Carlos Rivera',
    checklist: makeChecklist(0),
    photos: [],
    completion_notes: undefined,
    completed_at: undefined,
    recurrence_plan_id: 'plan-001',
    created_at: dateOffset(-30),
  },
  {
    id: 'maint-002',
    customer_id: 'cust-002',
    customer_name: 'Priya Nair',
    site_address: '1100 Innovation Way, San Jose, CA 95110',
    system_name: 'First Solar 80kW Commercial Array',
    system_id: 'sys-002',
    scheduled_date: dateOffset(-7),
    technician_id: 'tech-002',
    technician_name: 'Sarah Johnson',
    checklist: makeChecklist(0),
    photos: [],
    completion_notes: undefined,
    completed_at: undefined,
    recurrence_plan_id: 'plan-002',
    created_at: dateOffset(-21),
  },
  {
    id: 'maint-003',
    customer_id: 'cust-003',
    customer_name: 'James Thornton',
    site_address: '7832 Desert Palm Ave, Scottsdale, AZ 85251',
    system_name: 'Canadian Solar 15kW Residential Array',
    system_id: 'sys-003',
    scheduled_date: dateOffset(-3),
    technician_id: 'tech-003',
    technician_name: 'Mike Torres',
    checklist: makeChecklist(4),
    photos: [],
    completion_notes: undefined,
    completed_at: undefined,
    recurrence_plan_id: 'plan-003',
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
    scheduled_date: dateOffset(1),
    technician_id: 'tech-001',
    technician_name: 'Carlos Rivera',
    checklist: makeChecklist(0),
    photos: [],
    completion_notes: undefined,
    completed_at: undefined,
    recurrence_plan_id: 'plan-004',
    created_at: dateOffset(-14),
  },
  {
    id: 'maint-005',
    customer_id: 'cust-005',
    customer_name: 'Elena Vasquez',
    site_address: '3311 Hillcrest Blvd, Portland, OR 97201',
    system_name: 'LG NeON 12kW Residential Array',
    system_id: 'sys-005',
    scheduled_date: dateOffset(3),
    technician_id: 'tech-004',
    technician_name: 'Jasmine Lee',
    checklist: makeChecklist(0),
    photos: [],
    completion_notes: undefined,
    completed_at: undefined,
    created_at: dateOffset(-7),
  },
  {
    id: 'maint-006',
    customer_id: 'cust-006',
    customer_name: 'Richard Chen',
    site_address: '905 Bay Area Tech Park, Fremont, CA 94538',
    system_name: 'SolarEdge 45kW Commercial Array',
    system_id: 'sys-006',
    scheduled_date: dateOffset(5),
    technician_id: 'tech-002',
    technician_name: 'Sarah Johnson',
    checklist: makeChecklist(0),
    photos: [],
    completion_notes: undefined,
    completed_at: undefined,
    recurrence_plan_id: 'plan-005',
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
    scheduled_date: dateOffset(12),
    technician_id: 'tech-005',
    technician_name: 'David Park',
    checklist: makeChecklist(0),
    photos: [],
    completion_notes: undefined,
    completed_at: undefined,
    recurrence_plan_id: 'plan-001',
    created_at: dateOffset(-5),
  },
  {
    id: 'maint-008',
    customer_id: 'cust-008',
    customer_name: 'Roberto Morales',
    site_address: '14200 Valley Ranch Rd, Fresno, CA 93706',
    system_name: 'Jinko Solar Tiger 30kW Array',
    system_id: 'sys-008',
    scheduled_date: dateOffset(18),
    technician_id: 'tech-003',
    technician_name: 'Mike Torres',
    checklist: makeChecklist(0),
    photos: [],
    completion_notes: undefined,
    completed_at: undefined,
    recurrence_plan_id: 'plan-006',
    created_at: dateOffset(-3),
  },
  {
    id: 'maint-009',
    customer_id: 'cust-001',
    customer_name: 'Marcus Delgado',
    site_address: '200 Harbor View Ct, Coronado, CA 92118',
    system_name: 'LG NeON 8kW Secondary Array',
    system_id: 'sys-009',
    scheduled_date: dateOffset(22),
    technician_id: 'tech-001',
    technician_name: 'Carlos Rivera',
    checklist: makeChecklist(0),
    photos: [],
    completion_notes: undefined,
    completed_at: undefined,
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
    scheduled_date: dateOffset(0),
    technician_id: 'tech-003',
    technician_name: 'Mike Torres',
    checklist: makeChecklist(6),
    photos: [],
    completion_notes: undefined,
    completed_at: undefined,
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
    scheduled_date: monthOffset(-3),
    technician_id: 'tech-001',
    technician_name: 'Carlos Rivera',
    checklist: makeChecklist(10),
    photos: [],
    completion_notes: 'All panels cleaned. Inverter firmware updated. Output at 99.2% of expected. Roof seals inspected — no issues found.',
    completed_at: monthOffset(-3),
    recurrence_plan_id: 'plan-004',
    created_at: monthOffset(-4),
  },
  {
    id: 'maint-012',
    customer_id: 'cust-002',
    customer_name: 'Priya Nair',
    site_address: '1100 Innovation Way, San Jose, CA 95110',
    system_name: 'First Solar 80kW Commercial Array',
    system_id: 'sys-002',
    scheduled_date: monthOffset(-6),
    technician_id: 'tech-002',
    technician_name: 'Sarah Johnson',
    checklist: makeChecklist(10),
    photos: [],
    completion_notes: 'Annual inspection complete. Two mounting bolts re-torqued. Electrical connections cleaned and re-terminated. System performing at 97.8%.',
    completed_at: monthOffset(-6),
    recurrence_plan_id: 'plan-002',
    created_at: monthOffset(-7),
  },
  {
    id: 'maint-013',
    customer_id: 'cust-005',
    customer_name: 'Elena Vasquez',
    site_address: '3311 Hillcrest Blvd, Portland, OR 97201',
    system_name: 'LG NeON 12kW Residential Array',
    system_id: 'sys-005',
    scheduled_date: monthOffset(-3),
    technician_id: 'tech-004',
    technician_name: 'Jasmine Lee',
    checklist: makeChecklist(10),
    photos: [],
    completion_notes: 'Panel surfaces cleaned. Found one micro-crack on panel #7 — customer notified, warranty claim initiated. All other panels healthy.',
    completed_at: monthOffset(-3),
    created_at: monthOffset(-4),
  },
  {
    id: 'maint-014',
    customer_id: 'cust-007',
    customer_name: 'Fatima Al-Hassan',
    site_address: '88 Ocean Drive, Miami, FL 33139',
    system_name: 'Panasonic EverVolt 18kW Array',
    system_id: 'sys-007',
    scheduled_date: monthOffset(-6),
    technician_id: 'tech-005',
    technician_name: 'David Park',
    checklist: makeChecklist(10),
    photos: [],
    completion_notes: 'Semi-annual inspection. Salt spray buildup cleaned. Panel output restored to 101% after cleaning. No structural issues.',
    completed_at: monthOffset(-6),
    recurrence_plan_id: 'plan-001',
    created_at: monthOffset(-7),
  },
  {
    id: 'maint-015',
    customer_id: 'cust-008',
    customer_name: 'Roberto Morales',
    site_address: '14200 Valley Ranch Rd, Fresno, CA 93706',
    system_name: 'Jinko Solar Tiger 30kW Array',
    system_id: 'sys-008',
    scheduled_date: monthOffset(-6),
    technician_id: 'tech-003',
    technician_name: 'Mike Torres',
    checklist: makeChecklist(10),
    photos: [],
    completion_notes: 'Annual full system check. All components within spec. Inverter logs reviewed — one grid fault event in August, self-resolved. Monitoring active.',
    completed_at: monthOffset(-6),
    recurrence_plan_id: 'plan-006',
    created_at: monthOffset(-7),
  },
];

// Hydrate status
const MOCK_RECORDS: MaintenanceRecord[] = RAW_RECORDS.map((r) => {
  let status: MaintenanceStatus;
  if (r.completed_at) {
    status = 'completed';
  } else if (isOverdue(r) && r.scheduled_date === dateOffset(0)) {
    status = 'in_progress';
  } else if (r.id === 'maint-010') {
    status = 'in_progress';
  } else if (isOverdue(r)) {
    status = 'overdue';
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
    system_name: 'SunPower 22kW Residential Array',
    system_id: 'sys-001',
    frequency: 'semi_annual',
    last_completed: monthOffset(-6),
    next_due: dateOffset(-14),
    technician_id: 'tech-001',
    technician_name: 'Carlos Rivera',
    checklist_template: DEFAULT_CHECKLIST_TEMPLATE,
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
    frequency: 'annual',
    last_completed: monthOffset(-6),
    next_due: monthOffset(6),
    technician_id: 'tech-002',
    technician_name: 'Sarah Johnson',
    checklist_template: DEFAULT_CHECKLIST_TEMPLATE,
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
    frequency: 'quarterly',
    last_completed: monthOffset(-3),
    next_due: dateOffset(-3),
    technician_id: 'tech-003',
    technician_name: 'Mike Torres',
    checklist_template: DEFAULT_CHECKLIST_TEMPLATE,
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
    frequency: 'quarterly',
    last_completed: monthOffset(-3),
    next_due: dateOffset(1),
    technician_id: 'tech-001',
    technician_name: 'Carlos Rivera',
    checklist_template: DEFAULT_CHECKLIST_TEMPLATE,
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
    frequency: 'semi_annual',
    last_completed: monthOffset(-6),
    next_due: dateOffset(5),
    technician_id: 'tech-002',
    technician_name: 'Sarah Johnson',
    checklist_template: DEFAULT_CHECKLIST_TEMPLATE,
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
    frequency: 'annual',
    last_completed: monthOffset(-6),
    next_due: monthOffset(6),
    technician_id: 'tech-003',
    technician_name: 'Mike Torres',
    checklist_template: DEFAULT_CHECKLIST_TEMPLATE,
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
    frequency: 'annual',
    last_completed: monthOffset(-3),
    next_due: monthOffset(9),
    technician_id: 'tech-004',
    technician_name: 'Jasmine Lee',
    checklist_template: DEFAULT_CHECKLIST_TEMPLATE,
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
        r.status === 'scheduled' &&
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
    const thisWeekEnd = new Date(today);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
    const thisMonthEnd = new Date(today);
    thisMonthEnd.setDate(thisMonthEnd.getDate() + 30);

    const completed = records.filter((r) => r.status === 'completed').length;
    const total = records.length;

    return {
      total,
      scheduled: records.filter((r) => r.status === 'scheduled').length,
      in_progress: records.filter((r) => r.status === 'in_progress').length,
      completed,
      overdue: records.filter((r) => r.status === 'overdue').length,
      cancelled: records.filter((r) => r.status === 'cancelled').length,
      due_this_week: records.filter(
        (r) =>
          r.status === 'scheduled' &&
          new Date(r.scheduled_date) >= today &&
          new Date(r.scheduled_date) <= thisWeekEnd
      ).length,
      due_this_month: records.filter(
        (r) =>
          r.status === 'scheduled' &&
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
      status: new Date(data.scheduled_date) < today ? 'overdue' : 'scheduled',
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
};
