// workOrderService.ts
// Mock data layer for Work Order Management module.
// Replace mock functions with real Supabase queries when schema is ready.

export type WorkOrderStatus = 'new' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type WorkOrderType = 'installation' | 'repair' | 'inspection' | 'cleaning' | 'warranty' | 'emergency';

export interface WorkOrderPhoto {
  id: string;
  url: string;
  caption: string;
  uploaded_at: string;
  uploaded_by: string;
}

export interface ServiceReportItem {
  id: string;
  label: string;
  value: string;
}

export interface ServiceReport {
  work_performed: string;
  parts_used: string;
  findings: string;
  recommendations: string;
  customer_signature?: string;
  technician_notes: string;
  items: ServiceReportItem[];
}

export interface WorkOrder {
  id: string;
  order_number: string;
  title: string;
  description: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  site_address: string;
  system_name: string;
  system_id: string;
  technician_id: string | null;
  technician_name: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  started_at: string | null;
  completed_at: string | null;
  estimated_duration: number; // hours
  actual_duration: number | null; // hours
  photos: WorkOrderPhoto[];
  service_report: ServiceReport | null;
  maintenance_record_id: string | null;
  warranty_claim_id: string | null;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface WorkOrderStats {
  total: number;
  new: number;
  scheduled: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  high_priority: number;
  overdue: number;
  avg_completion_hours: number;
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

let orderCounter = 1024;
function nextOrderNumber(): string {
  return `WO-${String(orderCounter++).padStart(4, '0')}`;
}

// ── Shared Technicians ────────────────────────────────────────────────────────

export const WO_TECHNICIANS = [
  { id: 'tech-001', name: 'Carlos Rivera', avatar: 'CR', specialty: 'Inverters & Electrical' },
  { id: 'tech-002', name: 'Sarah Johnson', avatar: 'SJ', specialty: 'Panel Installation' },
  { id: 'tech-003', name: 'Mike Torres', avatar: 'MT', specialty: 'Structural & Mounting' },
  { id: 'tech-004', name: 'Jasmine Lee', avatar: 'JL', specialty: 'Diagnostics & Testing' },
  { id: 'tech-005', name: 'David Park', avatar: 'DP', specialty: 'Battery & Storage' },
];

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_WORK_ORDERS: WorkOrder[] = [
  // ── NEW ───────────────────────────────────────────────────────────────────
  {
    id: 'wo-001',
    order_number: 'WO-1001',
    title: 'Inverter replacement — fault code E47',
    description: 'Customer reports inverter showing persistent fault code E47 (grid voltage out of range). Inverter has been offline for 2 days. Requires diagnostic and likely full replacement.',
    type: 'repair',
    priority: 'urgent',
    status: 'new',
    customer_id: 'cust-001',
    customer_name: 'Marcus Delgado',
    customer_phone: '+1 (619) 555-0182',
    site_address: '4821 Sunset Ridge Dr, San Diego, CA 92103',
    system_name: 'SunPower 22kW Residential Array',
    system_id: 'sys-001',
    technician_id: null,
    technician_name: null,
    scheduled_date: null,
    scheduled_time: null,
    started_at: null,
    completed_at: null,
    estimated_duration: 4,
    actual_duration: null,
    photos: [],
    service_report: null,
    maintenance_record_id: null,
    warranty_claim_id: null,
    created_at: dateOffset(-1),
    updated_at: dateOffset(-1),
    tags: ['inverter', 'urgent', 'offline'],
  },
  {
    id: 'wo-002',
    order_number: 'WO-1002',
    title: 'Panel cleaning — heavy soiling after dust storm',
    description: 'Post dust-storm cleaning required. Output is down ~35% from baseline. Customer has requested immediate service.',
    type: 'cleaning',
    priority: 'high',
    status: 'new',
    customer_id: 'cust-004',
    customer_name: 'Amara Osei',
    customer_phone: '+1 (702) 555-0341',
    site_address: '2200 Commerce Blvd, Las Vegas, NV 89101',
    system_name: 'Trina Solar 60kW + Powerwall Array',
    system_id: 'sys-004',
    technician_id: null,
    technician_name: null,
    scheduled_date: null,
    scheduled_time: null,
    started_at: null,
    completed_at: null,
    estimated_duration: 3,
    actual_duration: null,
    photos: [],
    service_report: null,
    maintenance_record_id: null,
    warranty_claim_id: null,
    created_at: dateOffset(-2),
    updated_at: dateOffset(-2),
    tags: ['cleaning', 'dust-storm'],
  },
  {
    id: 'wo-003',
    order_number: 'WO-1003',
    title: 'New 15kW system installation',
    description: 'Full residential installation of LG NeON 15kW system with battery backup. 42 panels, 2 inverters, and Powerwall 2. Roof survey completed. HOA approval received.',
    type: 'installation',
    priority: 'medium',
    status: 'new',
    customer_id: 'cust-009',
    customer_name: 'Kenji Watanabe',
    customer_phone: '+1 (408) 555-0772',
    site_address: '451 Cherry Blossom Lane, Cupertino, CA 95014',
    system_name: 'LG NeON 15kW New Installation',
    system_id: 'sys-new-001',
    technician_id: null,
    technician_name: null,
    scheduled_date: null,
    scheduled_time: null,
    started_at: null,
    completed_at: null,
    estimated_duration: 8,
    actual_duration: null,
    photos: [],
    service_report: null,
    maintenance_record_id: null,
    warranty_claim_id: null,
    created_at: dateOffset(-3),
    updated_at: dateOffset(-3),
    tags: ['installation', 'new-customer', 'battery'],
  },

  // ── SCHEDULED ─────────────────────────────────────────────────────────────
  {
    id: 'wo-004',
    order_number: 'WO-1004',
    title: 'Quarterly inspection — commercial array',
    description: 'Scheduled quarterly inspection for large commercial array. Include thermal imaging scan, string testing, and inverter log review.',
    type: 'inspection',
    priority: 'medium',
    status: 'scheduled',
    customer_id: 'cust-002',
    customer_name: 'Priya Nair',
    customer_phone: '+1 (408) 555-0219',
    site_address: '1100 Innovation Way, San Jose, CA 95110',
    system_name: 'First Solar 80kW Commercial Array',
    system_id: 'sys-002',
    technician_id: 'tech-002',
    technician_name: 'Sarah Johnson',
    scheduled_date: dateOffset(2),
    scheduled_time: '09:00',
    started_at: null,
    completed_at: null,
    estimated_duration: 6,
    actual_duration: null,
    photos: [],
    service_report: null,
    maintenance_record_id: 'maint-004',
    warranty_claim_id: null,
    created_at: dateOffset(-7),
    updated_at: dateOffset(-1),
    tags: ['inspection', 'commercial', 'quarterly'],
  },
  {
    id: 'wo-005',
    order_number: 'WO-1005',
    title: 'Micro-crack panel replacement (Panel #7)',
    description: 'Warranty-covered panel replacement following confirmed micro-crack diagnosis. Replacement unit is in stock. Customer notified.',
    type: 'warranty',
    priority: 'high',
    status: 'scheduled',
    customer_id: 'cust-005',
    customer_name: 'Elena Vasquez',
    customer_phone: '+1 (503) 555-0447',
    site_address: '3311 Hillcrest Blvd, Portland, OR 97201',
    system_name: 'LG NeON 12kW Residential Array',
    system_id: 'sys-005',
    technician_id: 'tech-004',
    technician_name: 'Jasmine Lee',
    scheduled_date: dateOffset(4),
    scheduled_time: '10:30',
    started_at: null,
    completed_at: null,
    estimated_duration: 3,
    actual_duration: null,
    photos: [],
    service_report: null,
    maintenance_record_id: null,
    warranty_claim_id: 'claim-007',
    created_at: dateOffset(-5),
    updated_at: dateOffset(-2),
    tags: ['warranty', 'panel-replacement'],
  },
  {
    id: 'wo-006',
    order_number: 'WO-1006',
    title: 'Emergency repair — roof leak at panel mount',
    description: 'Customer reports water intrusion through compromised roof penetration at panel mount. Must be addressed before next rain event.',
    type: 'emergency',
    priority: 'urgent',
    status: 'scheduled',
    customer_id: 'cust-007',
    customer_name: 'Fatima Al-Hassan',
    customer_phone: '+1 (305) 555-0882',
    site_address: '88 Ocean Drive, Miami, FL 33139',
    system_name: 'Panasonic EverVolt 18kW Array',
    system_id: 'sys-007',
    technician_id: 'tech-001',
    technician_name: 'Carlos Rivera',
    scheduled_date: dateOffset(1),
    scheduled_time: '07:00',
    started_at: null,
    completed_at: null,
    estimated_duration: 2,
    actual_duration: null,
    photos: [],
    service_report: null,
    maintenance_record_id: null,
    warranty_claim_id: null,
    created_at: dateOffset(-1),
    updated_at: dateOffset(0),
    tags: ['emergency', 'roof-leak', 'urgent'],
  },

  // ── IN PROGRESS ───────────────────────────────────────────────────────────
  {
    id: 'wo-007',
    order_number: 'WO-1007',
    title: 'Battery storage system commissioning',
    description: 'Commission newly delivered Powerwall 3 units. Configure with existing SolarEdge inverter. Set time-of-use charging schedule per customer preference.',
    type: 'installation',
    priority: 'medium',
    status: 'in_progress',
    customer_id: 'cust-006',
    customer_name: 'Richard Chen',
    customer_phone: '+1 (510) 555-0623',
    site_address: '905 Bay Area Tech Park, Fremont, CA 94538',
    system_name: 'SolarEdge 45kW Commercial Array',
    system_id: 'sys-006',
    technician_id: 'tech-005',
    technician_name: 'David Park',
    scheduled_date: dateOffset(0),
    scheduled_time: '08:00',
    started_at: new Date().toISOString(),
    completed_at: null,
    estimated_duration: 5,
    actual_duration: null,
    photos: [
      {
        id: 'photo-001',
        url: '/images/work-orders/placeholder.jpg',
        caption: 'Powerwall units staged for installation',
        uploaded_at: new Date().toISOString(),
        uploaded_by: 'David Park',
      },
    ],
    service_report: null,
    maintenance_record_id: null,
    warranty_claim_id: null,
    created_at: dateOffset(-4),
    updated_at: dateOffset(0),
    tags: ['battery', 'commissioning', 'powerwall'],
  },
  {
    id: 'wo-008',
    order_number: 'WO-1008',
    title: 'Annual system inspection & string testing',
    description: 'Comprehensive annual inspection including IV curve tracing, thermal scan, and full electrical checks.',
    type: 'inspection',
    priority: 'medium',
    status: 'in_progress',
    customer_id: 'cust-008',
    customer_name: 'Roberto Morales',
    customer_phone: '+1 (559) 555-0314',
    site_address: '14200 Valley Ranch Rd, Fresno, CA 93706',
    system_name: 'Jinko Solar Tiger 30kW Array',
    system_id: 'sys-008',
    technician_id: 'tech-003',
    technician_name: 'Mike Torres',
    scheduled_date: dateOffset(0),
    scheduled_time: '09:30',
    started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completed_at: null,
    estimated_duration: 4,
    actual_duration: null,
    photos: [],
    service_report: null,
    maintenance_record_id: 'maint-008',
    warranty_claim_id: null,
    created_at: dateOffset(-10),
    updated_at: dateOffset(0),
    tags: ['inspection', 'annual', 'thermal-scan'],
  },

  // ── COMPLETED ─────────────────────────────────────────────────────────────
  {
    id: 'wo-009',
    order_number: 'WO-0998',
    title: 'Semi-annual panel cleaning & inspection',
    description: 'Salt spray buildup on coastal installation. Full panel cleaning and inspection completed.',
    type: 'cleaning',
    priority: 'medium',
    status: 'completed',
    customer_id: 'cust-007',
    customer_name: 'Fatima Al-Hassan',
    customer_phone: '+1 (305) 555-0882',
    site_address: '88 Ocean Drive, Miami, FL 33139',
    system_name: 'Panasonic EverVolt 18kW Array',
    system_id: 'sys-007',
    technician_id: 'tech-005',
    technician_name: 'David Park',
    scheduled_date: monthOffset(-1),
    scheduled_time: '09:00',
    started_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: monthOffset(-1),
    estimated_duration: 3,
    actual_duration: 2.5,
    photos: [
      {
        id: 'photo-002',
        url: '/images/work-orders/placeholder.jpg',
        caption: 'Before cleaning — visible salt deposits',
        uploaded_at: monthOffset(-1),
        uploaded_by: 'David Park',
      },
      {
        id: 'photo-003',
        url: '/images/work-orders/placeholder.jpg',
        caption: 'After cleaning — panels restored to optimal condition',
        uploaded_at: monthOffset(-1),
        uploaded_by: 'David Park',
      },
    ],
    service_report: {
      work_performed: 'Full panel surface cleaning with deionized water and soft brushes. Inspected all connections, mounting hardware, and roof seals. No issues found.',
      parts_used: 'Cleaning solution (2L), deionized water (50L)',
      findings: 'Heavy salt spray buildup on front surfaces. Output increased from 94% to 101% of baseline after cleaning.',
      recommendations: 'Increase cleaning frequency to every 4 months due to coastal location.',
      technician_notes: 'Customer was present and satisfied with work.',
      items: [
        { id: 'si-1', label: 'Panel Output', value: '101% of baseline' },
        { id: 'si-2', label: 'Connections Checked', value: 'All OK' },
        { id: 'si-3', label: 'Roof Seals', value: 'Intact' },
      ],
    },
    maintenance_record_id: 'maint-014',
    warranty_claim_id: null,
    created_at: monthOffset(-2),
    updated_at: monthOffset(-1),
    tags: ['cleaning', 'coastal', 'semi-annual'],
  },
  {
    id: 'wo-010',
    order_number: 'WO-0999',
    title: 'Inverter firmware update & optimization',
    description: 'Scheduled firmware update to address reactive power compensation issues. Completed remotely with on-site verification.',
    type: 'repair',
    priority: 'low',
    status: 'completed',
    customer_id: 'cust-003',
    customer_name: 'James Thornton',
    customer_phone: '+1 (480) 555-0561',
    site_address: '7832 Desert Palm Ave, Scottsdale, AZ 85251',
    system_name: 'Canadian Solar 15kW Residential Array',
    system_id: 'sys-003',
    technician_id: 'tech-001',
    technician_name: 'Carlos Rivera',
    scheduled_date: monthOffset(-1),
    scheduled_time: '14:00',
    started_at: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: monthOffset(-1),
    estimated_duration: 2,
    actual_duration: 1.5,
    photos: [],
    service_report: {
      work_performed: 'Updated inverter firmware from v3.1.2 to v3.4.0. Reconfigured grid parameters per utility requirements.',
      parts_used: 'None',
      findings: 'Reactive power compensation was misconfigured in previous firmware version.',
      recommendations: 'Monitor system output for 2 weeks to confirm stability.',
      technician_notes: 'System output improved by ~3% after firmware update.',
      items: [
        { id: 'si-4', label: 'Firmware Version', value: 'v3.4.0 (latest)' },
        { id: 'si-5', label: 'Grid Voltage', value: '240V ±2%' },
        { id: 'si-6', label: 'Output Improvement', value: '+3%' },
      ],
    },
    maintenance_record_id: null,
    warranty_claim_id: null,
    created_at: monthOffset(-2),
    updated_at: monthOffset(-1),
    tags: ['firmware', 'inverter', 'optimization'],
  },
  {
    id: 'wo-011',
    order_number: 'WO-1000',
    title: 'Emergency shutdown — electrical fault',
    description: 'Customer reported burning smell from combiner box. Emergency dispatch completed. Faulty fuse replaced, safety restored.',
    type: 'emergency',
    priority: 'urgent',
    status: 'completed',
    customer_id: 'cust-006',
    customer_name: 'Richard Chen',
    customer_phone: '+1 (510) 555-0623',
    site_address: '905 Bay Area Tech Park, Fremont, CA 94538',
    system_name: 'SolarEdge 45kW Commercial Array',
    system_id: 'sys-006',
    technician_id: 'tech-001',
    technician_name: 'Carlos Rivera',
    scheduled_date: monthOffset(-2),
    scheduled_time: '11:00',
    started_at: new Date(Date.now() - 62 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: monthOffset(-2),
    estimated_duration: 1,
    actual_duration: 2,
    photos: [
      {
        id: 'photo-004',
        url: '/images/work-orders/placeholder.jpg',
        caption: 'Damaged fuse in combiner box',
        uploaded_at: monthOffset(-2),
        uploaded_by: 'Carlos Rivera',
      },
    ],
    service_report: {
      work_performed: 'Isolated fault to Combiner Box B, String 3. Replaced blown 30A fuse with correct 40A replacement per system spec. Tested all strings post-repair.',
      parts_used: '40A DC Fuse (1x) — $18',
      findings: 'Undersized fuse (30A) caused thermal failure under peak summer load. Previous installation error.',
      recommendations: 'Audit all combiner boxes for correct fuse ratings.',
      technician_notes: 'System restored to full operation. Customer confirmed no further smell.',
      items: [
        { id: 'si-7', label: 'Fault Location', value: 'Combiner Box B, String 3' },
        { id: 'si-8', label: 'Root Cause', value: 'Undersized fuse (installer error)' },
        { id: 'si-9', label: 'System Status', value: 'Fully operational' },
      ],
    },
    maintenance_record_id: null,
    warranty_claim_id: null,
    created_at: monthOffset(-2),
    updated_at: monthOffset(-2),
    tags: ['emergency', 'electrical-fault', 'combiner-box'],
  },

  // ── CANCELLED ─────────────────────────────────────────────────────────────
  {
    id: 'wo-012',
    order_number: 'WO-0997',
    title: 'Planned system upgrade — postponed by customer',
    description: 'Customer requested postponement of system capacity upgrade due to budget constraints. To be rescheduled in Q3.',
    type: 'installation',
    priority: 'low',
    status: 'cancelled',
    customer_id: 'cust-001',
    customer_name: 'Marcus Delgado',
    customer_phone: '+1 (619) 555-0182',
    site_address: '4821 Sunset Ridge Dr, San Diego, CA 92103',
    system_name: 'SunPower 22kW Residential Array',
    system_id: 'sys-001',
    technician_id: 'tech-002',
    technician_name: 'Sarah Johnson',
    scheduled_date: dateOffset(-10),
    scheduled_time: '08:00',
    started_at: null,
    completed_at: null,
    estimated_duration: 8,
    actual_duration: null,
    photos: [],
    service_report: null,
    maintenance_record_id: null,
    warranty_claim_id: null,
    created_at: monthOffset(-1),
    updated_at: dateOffset(-10),
    tags: ['installation', 'postponed', 'upgrade'],
  },
];

// ── Service ───────────────────────────────────────────────────────────────────

export const workOrderService = {
  async getAllOrders(): Promise<WorkOrder[]> {
    await new Promise((r) => setTimeout(r, 400));
    return [...MOCK_WORK_ORDERS].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async getOrder(id: string): Promise<WorkOrder | null> {
    await new Promise((r) => setTimeout(r, 250));
    return MOCK_WORK_ORDERS.find((o) => o.id === id) ?? null;
  },

  async getByStatus(status: WorkOrderStatus): Promise<WorkOrder[]> {
    await new Promise((r) => setTimeout(r, 350));
    return MOCK_WORK_ORDERS.filter((o) => o.status === status).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async getActiveOrders(): Promise<WorkOrder[]> {
    await new Promise((r) => setTimeout(r, 350));
    return MOCK_WORK_ORDERS.filter(
      (o) => o.status === 'new' || o.status === 'scheduled' || o.status === 'in_progress'
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getCompletedOrders(): Promise<WorkOrder[]> {
    await new Promise((r) => setTimeout(r, 350));
    return MOCK_WORK_ORDERS.filter(
      (o) => o.status === 'completed' || o.status === 'cancelled'
    ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  },

  async getStats(): Promise<WorkOrderStats> {
    await new Promise((r) => setTimeout(r, 300));
    const orders = MOCK_WORK_ORDERS;
    const completed = orders.filter((o) => o.status === 'completed');
    const avgHours = completed.length > 0
      ? completed.reduce((sum, o) => sum + (o.actual_duration ?? o.estimated_duration), 0) / completed.length
      : 0;

    return {
      total: orders.length,
      new: orders.filter((o) => o.status === 'new').length,
      scheduled: orders.filter((o) => o.status === 'scheduled').length,
      in_progress: orders.filter((o) => o.status === 'in_progress').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      high_priority: orders.filter((o) => o.priority === 'high' || o.priority === 'urgent').length,
      overdue: orders.filter((o) =>
        o.scheduled_date &&
        new Date(o.scheduled_date) < today &&
        (o.status === 'new' || o.status === 'scheduled')
      ).length,
      avg_completion_hours: Math.round(avgHours * 10) / 10,
    };
  },

  async createOrder(
    data: Omit<WorkOrder, 'id' | 'order_number' | 'created_at' | 'updated_at'>
  ): Promise<WorkOrder> {
    await new Promise((r) => setTimeout(r, 500));
    const newOrder: WorkOrder = {
      ...data,
      id: `wo-${Date.now()}`,
      order_number: nextOrderNumber(),
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
    };
    MOCK_WORK_ORDERS.push(newOrder);
    return newOrder;
  },

  async updateOrder(id: string, data: Partial<WorkOrder>): Promise<WorkOrder> {
    await new Promise((r) => setTimeout(r, 400));
    const idx = MOCK_WORK_ORDERS.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Work order not found');
    MOCK_WORK_ORDERS[idx] = {
      ...MOCK_WORK_ORDERS[idx],
      ...data,
      updated_at: new Date().toISOString().split('T')[0],
    };
    return MOCK_WORK_ORDERS[idx];
  },

  async assignTechnician(id: string, technicianId: string, scheduledDate: string, scheduledTime: string): Promise<WorkOrder> {
    await new Promise((r) => setTimeout(r, 400));
    const idx = MOCK_WORK_ORDERS.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Work order not found');
    const tech = WO_TECHNICIANS.find((t) => t.id === technicianId);
    MOCK_WORK_ORDERS[idx] = {
      ...MOCK_WORK_ORDERS[idx],
      technician_id: technicianId,
      technician_name: tech?.name ?? null,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      status: 'scheduled',
      updated_at: new Date().toISOString().split('T')[0],
    };
    return MOCK_WORK_ORDERS[idx];
  },

  async updateStatus(id: string, status: WorkOrderStatus): Promise<WorkOrder> {
    await new Promise((r) => setTimeout(r, 300));
    const idx = MOCK_WORK_ORDERS.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Work order not found');
    const updates: Partial<WorkOrder> = { status, updated_at: new Date().toISOString().split('T')[0] };
    if (status === 'in_progress' && !MOCK_WORK_ORDERS[idx].started_at) {
      updates.started_at = new Date().toISOString();
    }
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString().split('T')[0];
    }
    MOCK_WORK_ORDERS[idx] = { ...MOCK_WORK_ORDERS[idx], ...updates };
    return MOCK_WORK_ORDERS[idx];
  },

  async addPhoto(id: string, photo: Omit<WorkOrderPhoto, 'id'>): Promise<WorkOrder> {
    await new Promise((r) => setTimeout(r, 300));
    const idx = MOCK_WORK_ORDERS.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Work order not found');
    const newPhoto: WorkOrderPhoto = { ...photo, id: `photo-${Date.now()}` };
    MOCK_WORK_ORDERS[idx] = {
      ...MOCK_WORK_ORDERS[idx],
      photos: [...MOCK_WORK_ORDERS[idx].photos, newPhoto],
      updated_at: new Date().toISOString().split('T')[0],
    };
    return MOCK_WORK_ORDERS[idx];
  },

  async submitServiceReport(id: string, report: ServiceReport): Promise<WorkOrder> {
    await new Promise((r) => setTimeout(r, 500));
    const idx = MOCK_WORK_ORDERS.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Work order not found');
    MOCK_WORK_ORDERS[idx] = {
      ...MOCK_WORK_ORDERS[idx],
      service_report: report,
      status: 'completed',
      completed_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
    };
    return MOCK_WORK_ORDERS[idx];
  },
};
