import type { ActionSeverity, BillingStatus, ShipmentPriority, ShipmentStatus } from "@/types/dispatcher";

interface StatusMeta {
  label: string;
  dot: string;
  badgeClass: string;
}

export const STATUS_META: Record<ShipmentStatus, StatusMeta> = {
  waiting_assignment: {
    label: "Waiting Assignment",
    dot: "bg-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  assigned: {
    label: "Assigned",
    dot: "bg-purple-500",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  driver_en_route: {
    label: "Driver En Route",
    dot: "bg-orange-500",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
  },
  picked_up: {
    label: "Picked Up",
    dot: "bg-indigo-500",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  delivered: {
    label: "Delivered",
    dot: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  delayed: {
    label: "Delayed",
    dot: "bg-red-500",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-slate-400",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export const PRIORITY_META: Record<ShipmentPriority, { label: string; badgeClass: string }> = {
  standard: { label: "Standard", badgeClass: "bg-slate-100 text-slate-600" },
  same_day: { label: "Same Day", badgeClass: "bg-amber-100 text-amber-700" },
  asap: { label: "ASAP", badgeClass: "bg-red-100 text-red-700" },
};

export const BILLING_META: Record<BillingStatus, { label: string; badgeClass: string }> = {
  not_ready: { label: "Not Ready", badgeClass: "bg-slate-100 text-slate-600" },
  ready_to_invoice: { label: "Ready to Invoice", badgeClass: "bg-emerald-50 text-emerald-700" },
  invoiced: { label: "Invoiced", badgeClass: "bg-blue-50 text-blue-700" },
  paid: { label: "Paid", badgeClass: "bg-slate-100 text-slate-600" },
};

export const SEVERITY_META: Record<ActionSeverity, { dot: string; ring: string }> = {
  critical: { dot: "bg-red-500", ring: "ring-red-500/20" },
  warning: { dot: "bg-orange-500", ring: "ring-orange-500/20" },
  attention: { dot: "bg-amber-400", ring: "ring-amber-400/20" },
  info: { dot: "bg-blue-500", ring: "ring-blue-500/20" },
  approval: { dot: "bg-purple-500", ring: "ring-purple-500/20" },
  success: { dot: "bg-emerald-500", ring: "ring-emerald-500/20" },
};

const SEVERITY_RANK: Record<ActionSeverity, number> = {
  critical: 0,
  warning: 1,
  attention: 2,
  approval: 3,
  info: 4,
  success: 5,
};

export function severityRank(severity: ActionSeverity): number {
  return SEVERITY_RANK[severity];
}
