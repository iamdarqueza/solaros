"use client";
import React, { useEffect, useState } from "react";
import { Customer, customersService } from "@/services/customersService";
import { WorkOrder, workOrderService } from "@/services/workOrderService";
import { EmptyState, SectionCard, TabSkeleton, formatDate } from "../CustomerUIHelpers";

interface ActivityTimelineTabProps {
  customer: Customer;
}

type ActivityKind =
  | "installation"
  | "warranty"
  | "maintenance"
  | "ticket"
  | "work_order"
  | "document"
  | "note";

interface ActivityItem {
  id: string;
  kind: ActivityKind;
  date: string;
  title: string;
  description: string;
  meta: string;
}

const ACTIVITY_STYLES: Record<ActivityKind, string> = {
  installation: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
  warranty: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  maintenance: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
  ticket: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400",
  work_order: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  document: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  note: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
};

function ActivityIcon({ kind }: { kind: ActivityKind }) {
  const common = "h-4 w-4";
  if (kind === "installation") {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }
  if (kind === "warranty") {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944 11.955 11.955 0 013.382 5.984" />
      </svg>
    );
  }
  if (kind === "work_order") {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      </svg>
    );
  }
  return (
    <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function orderDate(order: WorkOrder) {
  return order.completed_at || order.scheduled_date || order.updated_at || order.created_at;
}

export default function ActivityTimelineTab({ customer }: ActivityTimelineTabProps) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      customersService.getInstallations(customer.id),
      customersService.getWarranties(customer.id),
      customersService.getMaintenanceHistory(customer.id),
      customersService.getSupportTickets(customer.id),
      workOrderService.getAllOrders(),
      customersService.getDocuments(customer.id),
      customersService.getNotes(customer.id),
    ]).then(([installations, warranties, maintenance, tickets, allOrders, documents, notes]) => {
      const customerOrders = allOrders.filter((order) => order.customer_id === customer.id);
      const nextItems: ActivityItem[] = [
        ...installations.map((installation) => ({
          id: `installation-${installation.id}`,
          kind: "installation" as const,
          date: installation.install_date,
          title: "Solar system installed",
          description: `${installation.system_size_kw} kW system at ${installation.site_address}`,
          meta: `${installation.panel_count} panels`,
        })),
        ...warranties.map((warranty) => ({
          id: `warranty-${warranty.id}`,
          kind: "warranty" as const,
          date: warranty.start_date,
          title: "Warranty uploaded",
          description: `${warranty.manufacturer} ${warranty.component}`,
          meta: warranty.coverage_type,
        })),
        ...maintenance.map((record) => ({
          id: `maintenance-${record.id}`,
          kind: "maintenance" as const,
          date: record.date,
          title: "Maintenance completed",
          description: record.description,
          meta: record.technician_name,
        })),
        ...tickets.map((ticket) => ({
          id: `ticket-${ticket.id}`,
          kind: "ticket" as const,
          date: ticket.created_at,
          title: "Support ticket created",
          description: ticket.subject,
          meta: ticket.ticket_number,
        })),
        ...customerOrders.map((order) => ({
          id: `work-order-${order.id}`,
          kind: "work_order" as const,
          date: orderDate(order),
          title: order.status === "completed" ? "Work order completed" : "Work order created",
          description: order.title,
          meta: `${order.order_number} from ${order.source_label}`,
        })),
        ...documents.map((document) => ({
          id: `document-${document.id}`,
          kind: "document" as const,
          date: document.uploaded_at,
          title: "Document uploaded",
          description: document.name,
          meta: document.type.replace("_", " "),
        })),
        ...notes.map((note) => ({
          id: `note-${note.id}`,
          kind: "note" as const,
          date: note.created_at,
          title: "Customer note added",
          description: note.content,
          meta: note.author_name,
        })),
      ];

      setItems(
        nextItems
          .filter((item) => item.date)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
      setLoading(false);
    });
  }, [customer.id]);

  if (loading) return <TabSkeleton />;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        title="No activity yet"
        message="Connected customer, site, system, service, document, and job events will appear here."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
        This timeline turns the connected record into service history: installs, warranty uploads, tickets, maintenance, technician jobs, documents, and notes.
      </div>

      <div className="relative">
        <div className="absolute bottom-2 left-[22px] top-2 hidden w-0.5 bg-gray-100 dark:bg-gray-800 sm:block" />
        <div className="space-y-4">
          {items.map((item) => (
            <SectionCard key={item.id} className="p-5 sm:ml-12">
              <div className="hidden sm:absolute sm:-left-[1.35rem] sm:flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-dark dark:text-gray-400">
                <ActivityIcon kind={item.kind} />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ACTIVITY_STYLES[item.kind]}`}>
                      {item.kind.replace("_", " ")}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(item.date)}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-white/90">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 sm:max-w-48 sm:text-right">{item.meta}</p>
              </div>
            </SectionCard>
          ))}
        </div>
      </div>
    </div>
  );
}
