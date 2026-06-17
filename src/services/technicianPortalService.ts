// technicianPortalService.ts
// Thin wrapper over workOrderService + maintenanceService that scopes data
// to a specific technician. All data comes from existing mock layers.

import { workOrderService, WO_TECHNICIANS, type WorkOrder } from './workOrderService';
import { maintenanceService, TECHNICIANS, type MaintenanceRecord, type ChecklistItem } from './maintenanceService';

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

export const technicianPortalService = {
  /** Get all work orders assigned to a technician */
  async getMyJobs(techId: string): Promise<WorkOrder[]> {
    const all = await workOrderService.getAllOrders();
    return all.filter((o) => o.technician_id === techId);
  },

  /** Get today's jobs for a technician */
  async getTodaysJobs(techId: string): Promise<WorkOrder[]> {
    const all = await workOrderService.getAllOrders();
    return all.filter(
      (o) => o.technician_id === techId && isToday(o.scheduled_date)
    );
  },

  /** Get upcoming (today + future) active jobs for a technician */
  async getUpcomingJobs(techId: string): Promise<WorkOrder[]> {
    const all = await workOrderService.getAllOrders();
    return all
      .filter(
        (o) =>
          o.technician_id === techId &&
          isUpcoming(o.scheduled_date) &&
          (o.status === 'scheduled' || o.status === 'in_progress')
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
    const all = await workOrderService.getAllOrders();
    return all.find((o) => o.technician_id === techId && o.status === 'in_progress') ?? null;
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
    const all = await workOrderService.getAllOrders();
    return all.filter(
      (o) => o.technician_id === techId && o.status === 'completed' && o.service_report !== null
    );
  },

  /** Get summary stats for a technician's dashboard */
  async getDashboardStats(techId: string): Promise<{
    todayJobs: number;
    activeJob: boolean;
    pendingTasks: number;
    overdueTasks: number;
    completedThisWeek: number;
  }> {
    const [todayJobs, activeJob, pendingTasks, allJobs] = await Promise.all([
      this.getTodaysJobs(techId),
      this.getActiveJob(techId),
      this.getPendingTasks(techId),
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
      pendingTasks: pendingTasks.length,
      overdueTasks: pendingTasks.filter((t) => t.status === 'overdue').length,
      completedThisWeek,
    };
  },

  /** Look up a technician profile by ID */
  getProfile(techId: string): TechnicianProfile {
    return (
      TECHNICIAN_PROFILES.find((t) => t.id === techId) ?? TECHNICIAN_PROFILES[0]
    );
  },
};
