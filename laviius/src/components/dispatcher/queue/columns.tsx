import type { Shipment } from "@/types/dispatcher";
import { StatusBadge } from "@/components/dispatcher/shared/StatusBadge";
import { PriorityBadge } from "@/components/dispatcher/shared/PriorityBadge";
import { Avatar } from "@/components/dispatcher/shared/Avatar";
import { VEHICLE_TYPE_LABELS } from "@/lib/dispatcher/labels";
import { formatClockTime } from "@/lib/dispatcher/time";

export interface QueueColumn {
  id: string;
  label: string;
  width: number;
  optional?: boolean;
  defaultVisible?: boolean;
  render: (shipment: Shipment) => React.ReactNode;
}

export const QUEUE_COLUMNS: QueueColumn[] = [
  {
    id: "number",
    label: "Shipment",
    width: 130,
    render: (s) => (
      <div>
        <p className="font-semibold text-navy">#{s.number}</p>
        <p className="text-[11px] text-slate-400">{s.referenceNumber}</p>
      </div>
    ),
  },
  {
    id: "priority",
    label: "Priority",
    width: 100,
    render: (s) => (s.priority === "standard" ? <span className="text-slate-300">—</span> : <PriorityBadge priority={s.priority} />),
  },
  {
    id: "status",
    label: "Status",
    width: 160,
    render: (s) => <StatusBadge status={s.status} />,
  },
  {
    id: "pickup",
    label: "Pickup",
    width: 160,
    render: (s) => (
      <div className="truncate">
        <p className="truncate text-navy">{s.pickup.address.city}</p>
        <p className="truncate text-[11px] text-slate-400">{s.pickup.contact.companyName}</p>
      </div>
    ),
  },
  {
    id: "delivery",
    label: "Delivery",
    width: 160,
    render: (s) => (
      <div className="truncate">
        <p className="truncate text-navy">{s.delivery.address.city}</p>
        <p className="truncate text-[11px] text-slate-400">{s.delivery.contact.companyName}</p>
      </div>
    ),
  },
  {
    id: "customer",
    label: "Customer",
    width: 170,
    render: (s) => <p className="truncate text-navy">{s.customer.companyName}</p>,
  },
  {
    id: "carrier",
    label: "Assigned Carrier",
    width: 160,
    render: (s) =>
      s.assignedCarrier ? <p className="truncate text-navy">{s.assignedCarrier.name}</p> : <span className="text-slate-300">Unassigned</span>,
  },
  {
    id: "driver",
    label: "Assigned Driver",
    width: 150,
    optional: true,
    defaultVisible: true,
    render: (s) =>
      s.assignedDriver ? (
        <div className="flex items-center gap-1.5">
          <Avatar name={s.assignedDriver.name} size="sm" />
          <span className="truncate text-navy">{s.assignedDriver.name}</span>
        </div>
      ) : (
        <span className="text-slate-300">—</span>
      ),
  },
  {
    id: "vehicle",
    label: "Vehicle",
    width: 130,
    optional: true,
    defaultVisible: false,
    render: (s) => <span className="text-navy">{VEHICLE_TYPE_LABELS[s.requestedVehicle]}</span>,
  },
  {
    id: "pickupTime",
    label: "Pickup Time",
    width: 110,
    render: (s) => <span className="text-navy">{formatClockTime(s.pickup.scheduledFor)}</span>,
  },
  {
    id: "eta",
    label: "ETA",
    width: 90,
    optional: true,
    defaultVisible: true,
    render: (s) => (typeof s.etaMinutes === "number" ? <span className="text-navy">{s.etaMinutes} min</span> : <span className="text-slate-300">—</span>),
  },
  {
    id: "dispatcher",
    label: "Dispatcher",
    width: 130,
    optional: true,
    defaultVisible: false,
    render: (s) => <span className="text-navy">{s.dispatcherName ?? "—"}</span>,
  },
];
