// technicianPortalService.ts
// Thin wrapper over workOrderService + maintenanceService that scopes data
// to a specific technician. All data comes from existing mock layers.

import {
  workOrderService,
  WO_TECHNICIANS,
  WORK_ORDER_SOURCE_LABELS,
  type WorkOrder,
  type WorkOrderPriority,
  type WorkOrderStatus,
  type WorkOrderType,
} from './workOrderService';
import {
  maintenanceService,
  MAINTENANCE_SERVICE_TYPE_LABELS,
  type MaintenanceRecord,
  type ChecklistItem,
  type MaintenanceServiceType,
  type MaintenanceStatus,
} from './maintenanceService';

export type { WorkOrder, MaintenanceRecord, ChecklistItem };

export interface TechnicianProfile {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  initials: string;
}

export const TECHNICIAN_PROFILES: TechnicianProfile[] = WO_TECHNICIANS.map((t) => ({
  id: t.id,
  name: t.name,
  avatar: t.avatar,
  specialty: t.specialty,
  initials: t.avatar,
}));

const today = new Date();
today.setHours(0, 0, 0, 0);

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.getTime() === today.getTime();
}

function isUpcoming(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.getTime() >= today.getTime();
}

const activeJobStatuses: WorkOrder['status'][] = [
  'new',
  'assigned',
  'scheduled',
  'in_progress',
  'requires_follow_up',
];

const maintenanceTypeToJobType: Record<MaintenanceServiceType, WorkOrderType> = {
  panel_cleaning: 'cleaning',
  inverter_inspection: 'inspection',
  system_inspection: 'inspection',
  performance_diagnostic: 'maintenance',
};

function maintenanceStatusToJobStatus(status: MaintenanceStatus): WorkOrderStatus {
  const map: Record<MaintenanceStatus, WorkOrderStatus> = {
    overdue: 'scheduled',
    due_soon: 'scheduled',
    scheduled: 'scheduled',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled',
  };

  return map[status];
}

function maintenanceStatusToPriority(status: MaintenanceStatus): WorkOrderPriority {
  if (status === 'overdue') return 'urgent';
  if (status === 'due_soon') return 'high';
  return 'medium';
}

function maintenanceVisitToJob(visit: MaintenanceRecord): WorkOrder {
  const completedReport = visit.completion_report
    ? {
        work_performed: visit.completion_report,
        parts_used: '',
        findings: visit.completion_notes ?? '',
        recommendations: '',
        technician_notes: visit.completion_notes ?? '',
        items: [],
      }
    : null;

  return {
    id: visit.id,
    order_number: visit.work_order_id?.toUpperCase() ?? `JOB-${visit.id.replace('maint-', '')}`,
    title: `${MAINTENANCE_SERVICE_TYPE_LABELS[visit.service_type]} job`,
    description: visit.notes ?? 'Maintenance visit prepared as a technician job.',
    type: maintenanceTypeToJobType[visit.service_type],
    priority: maintenanceStatusToPriority(visit.status),
    status: maintenanceStatusToJobStatus(visit.status),
    source: 'maintenance_schedule',
    source_label: `${WORK_ORDER_SOURCE_LABELS.maintenance_schedule}: ${MAINTENANCE_SERVICE_TYPE_LABELS[visit.service_type]}`,
    customer_id: visit.customer_id,
    customer_name: visit.customer_name,
    customer_phone: '',
    site_id: visit.system_id.replace('sys', 'site'),
    site_address: visit.site_address,
    system_name: visit.system_name,
    system_id: visit.system_id,
    related_ticket_id: null,
    related_warranty_claim_id: null,
    related_maintenance_visit_id: visit.id,
    technician_id: visit.technician_id,
    technician_name: visit.technician_name,
    scheduled_date: visit.scheduled_date,
    scheduled_time: visit.scheduled_time,
    started_at: visit.status === 'in_progress' ? visit.created_at : null,
    completed_at: visit.completed_at ?? null,
    estimated_duration: 2,
    actual_duration: null,
    checklist: visit.checklist,
    parts_needed: [],
    photos: [],
    photos_before: [],
    photos_after: [],
    technician_notes: visit.completion_notes ?? '',
    customer_signature: null,
    service_report: completedReport,
    completion_report: completedReport,
    maintenance_record_id: visit.id,
    warranty_claim_id: null,
    created_at: visit.created_at,
    updated_at: visit.completed_at ?? visit.created_at,
    tags: ['maintenance', visit.service_type.replaceAll('_', '-')],
  };
}

function isMaintenanceJob(job: Pick<WorkOrder, 'id'>): boolean {
  return job.id.startsWith('maint-');
}

export const technicianPortalService = {
  /** Get all field jobs assigned to a technician, regardless of source */
  async getMyJobs(techId: string): Promise<WorkOrder[]> {
    const [orders, maintenanceVisits] = await Promise.all([
      workOrderService.getAllOrders(),
      maintenanceService.getByTechnician(techId),
    ]);
    const assignedOrders = orders.filter((o) => o.technician_id === techId);
    const linkedMaintenanceIds = new Set(assignedOrders.map((order) => order.related_maintenance_visit_id ?? order.maintenance_record_id));
    const maintenanceJobs = maintenanceVisits
      .filter((visit) => !linkedMaintenanceIds.has(visit.id))
      .map(maintenanceVisitToJob);

    return [...assignedOrders, ...maintenanceJobs].sort((a, b) => {
      const byDate = (a.scheduled_date ?? '9999-12-31').localeCompare(b.scheduled_date ?? '9999-12-31');
      if (byDate !== 0) return byDate;
      return (a.scheduled_time ?? '23:59').localeCompare(b.scheduled_time ?? '23:59');
    });
  },

  /** Get a technician-facing job by work order ID or maintenance visit ID */
  async getJob(jobId: string): Promise<WorkOrder | null> {
    if (jobId.startsWith('maint-')) {
      const visit = await maintenanceService.getRecord(jobId);
      return visit ? maintenanceVisitToJob(visit) : null;
    }

    return workOrderService.getOrder(jobId);
  },

  /** Get today's jobs for a technician */
  async getTodaysJobs(techId: string): Promise<WorkOrder[]> {
    const all = await this.getMyJobs(techId);
    return all
      .filter(
        (o) =>
          isToday(o.scheduled_date) &&
          o.status !== 'completed' &&
          o.status !== 'cancelled'
      )
      .sort((a, b) => (a.scheduled_time ?? '23:59').localeCompare(b.scheduled_time ?? '23:59'));
  },

  /** Get high-priority active jobs for a technician, regardless of source */
  async getPriorityJobs(techId: string): Promise<WorkOrder[]> {
    const all = await this.getMyJobs(techId);
    return all
      .filter(
        (o) =>
          activeJobStatuses.includes(o.status) &&
          (o.priority === 'urgent' || o.priority === 'high')
      )
      .sort((a, b) => {
        const rank = { urgent: 0, high: 1, medium: 2, low: 3 };
        const byPriority = rank[a.priority] - rank[b.priority];
        if (byPriority !== 0) return byPriority;
        return (a.scheduled_date ?? '9999-12-31').localeCompare(b.scheduled_date ?? '9999-12-31');
      });
  },

  /** Get upcoming (today + future) active jobs for a technician */
  async getUpcomingJobs(techId: string): Promise<WorkOrder[]> {
    const all = await this.getMyJobs(techId);
    return all
      .filter(
        (o) =>
          isUpcoming(o.scheduled_date) &&
          activeJobStatuses.includes(o.status)
      )
      .sort((a, b) => {
        const da = new Date(a.scheduled_date!).getTime();
        const db = new Date(b.scheduled_date!).getTime();
        if (da !== db) return da - db;
        // sort by time within the same day
        const ta = a.scheduled_time ?? '23:59';
        const tb = b.scheduled_time ?? '23:59';
        return ta.localeCompare(tb);
      });
  },

  /** Get the currently in-progress job for a technician */
  async getActiveJob(techId: string): Promise<WorkOrder | null> {
    const all = await this.getMyJobs(techId);
    return all.find((o) => o.status === 'in_progress') ?? null;
  },

  /** Get completed jobs for the technician's field history */
  async getCompletedJobs(techId: string): Promise<WorkOrder[]> {
    const all = await this.getMyJobs(techId);
    return all
      .filter((o) => o.status === 'completed')
      .sort((a, b) => new Date(b.completed_at ?? b.updated_at).getTime() - new Date(a.completed_at ?? a.updated_at).getTime());
  },

  /** Get all maintenance tasks assigned to a technician */
  async getMyTasks(techId: string): Promise<MaintenanceRecord[]> {
    return maintenanceService.getByTechnician(techId);
  },

  /** Get pending/overdue maintenance tasks for a technician */
  async getPendingTasks(techId: string): Promise<MaintenanceRecord[]> {
    const tasks = await maintenanceService.getByTechnician(techId);
    return tasks
      .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
  },

  /** Get completed reports for a technician */
  async getCompletedReports(techId: string): Promise<WorkOrder[]> {
    const all = await this.getMyJobs(techId);
    return all.filter((o) => o.status === 'completed' && o.service_report !== null);
  },

  /** Get summary stats for a technician's dashboard */
  async getDashboardStats(techId: string): Promise<{
    todayJobs: number;
    activeJob: boolean;
    priorityJobs: number;
    openJobs: number;
    completedThisWeek: number;
  }> {
    const [todayJobs, activeJob, priorityJobs, allJobs] = await Promise.all([
      this.getTodaysJobs(techId),
      this.getActiveJob(techId),
      this.getPriorityJobs(techId),
      this.getMyJobs(techId),
    ]);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const completedThisWeek = allJobs.filter(
      (o) =>
        o.status === 'completed' &&
        o.completed_at &&
        new Date(o.completed_at) >= weekAgo
    ).length;

    return {
      todayJobs: todayJobs.length,
      activeJob: !!activeJob,
      priorityJobs: priorityJobs.length,
      openJobs: allJobs.filter((o) => activeJobStatuses.includes(o.status)).length,
      completedThisWeek,
    };
  },

  /** Look up a technician profile by ID */
  getProfile(techId: string): TechnicianProfile {
    return (
      TECHNICIAN_PROFILES.find((t) => t.id === techId) ?? TECHNICIAN_PROFILES[0]
    );
  },

  isMaintenanceJob,
};
