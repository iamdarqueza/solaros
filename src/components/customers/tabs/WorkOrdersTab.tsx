"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  WORK_ORDER_TYPE_LABELS,
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
  workOrderService,
} from "@/services/workOrderService";
import { Customer } from "@/services/customersService";
import { EmptyState, SectionCard, TabSkeleton, formatDate } from "../CustomerUIHelpers";

interface WorkOrdersTabProps {
  customer: Customer;
}

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  new: "New",
  scheduled: "Scheduled",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  requires_follow_up: "Follow-up",
};

const STATUS_STYLES: Record<WorkOrderStatus, string> = {
  new: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  scheduled: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  assigned: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400",
  in_progress: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
  completed: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  requires_follow_up: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
};

const PRIORITY_STYLES: Record<WorkOrderPriority, string> = {
  low: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  medium: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  high: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
  urgent: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",
};

function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PRIORITY_STYLES[priority]}`}>
      {priority}
    </span>
  );
}

export default function WorkOrdersTab({ customer }: WorkOrdersTabProps) {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workOrderService.getAllOrders().then((data) => {
      setOrders(data.filter((order) => order.customer_id === customer.id));
      setLoading(false);
    });
  }, [customer.id]);

  if (loading) return <TabSkeleton />;

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
          </svg>
        }
        title="No work orders"
        message="Field jobs from tickets, maintenance visits, warranty claims, or manual dispatches will appear here."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
        Work orders are technician field jobs. They may originate from a support ticket, maintenance schedule, warranty claim, customer request, or manual dispatch.
      </div>

      <SectionCard>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {orders.map((order) => (
            <div key={order.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-gray-400 dark:text-gray-500">{order.order_number}</span>
                    <StatusBadge status={order.status} />
                    <PriorityBadge priority={order.priority} />
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      {order.source_label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-white/90">{order.title}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{order.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{WORK_ORDER_TYPE_LABELS[order.type]}</span>
                    <span>{order.site_address}</span>
                    <span>{order.system_name}</span>
                    {order.related_ticket_id && (
                      <Link
                        href={`/support/tickets/${order.related_ticket_id}`}
                        className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                      >
                        Ticket {order.related_ticket_id}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-sm lg:text-right">
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {order.technician_name ?? "Unassigned"}
                  </p>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">
                    {order.scheduled_date ? formatDate(order.scheduled_date) : "Not scheduled"}
                    {order.scheduled_time ? ` at ${order.scheduled_time}` : ""}
                  </p>
                  <Link
                    href={`/work-orders/${order.id}`}
                    className="mt-3 inline-flex rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    View Work Order
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
