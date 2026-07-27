"use client";

import { useMemo, useState } from "react";
import { CircleDot, MapPinned, Truck } from "lucide-react";
import { useDispatcher } from "@/lib/dispatcher/store";
import { STATUS_META } from "@/lib/dispatcher/status";
import { EmptyState } from "@/components/dispatcher/shared/EmptyState";
import { cn } from "@/lib/cn";
import { bucketKey, projectLatLng } from "./projectLatLng";

type LayerId = "drivers" | "pickups" | "deliveries";

interface MapMarker {
  id: string;
  layer: LayerId;
  shipmentId: string;
  label: string;
  sublabel: string;
  dotClass: string;
  xPct: number;
  yPct: number;
}

const LAYER_META: Record<LayerId, { label: string; icon: typeof Truck }> = {
  drivers: { label: "Drivers", icon: Truck },
  pickups: { label: "Pickups", icon: CircleDot },
  deliveries: { label: "Deliveries", icon: MapPinned },
};

export function LiveMap() {
  const { shipments, openShipment } = useDispatcher();
  const [layers, setLayers] = useState<Record<LayerId, boolean>>({ drivers: true, pickups: true, deliveries: true });
  const [openCluster, setOpenCluster] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const active = shipments.filter((s) => !["delivered", "cancelled"].includes(s.status));

  const markers = useMemo<MapMarker[]>(() => {
    const out: MapMarker[] = [];
    for (const s of active) {
      const meta = STATUS_META[s.status];
      const pickup = projectLatLng(s.pickup.address.lat, s.pickup.address.lng);
      out.push({
        id: `pickup-${s.id}`,
        layer: "pickups",
        shipmentId: s.id,
        label: `Shipment #${s.number} — Pickup`,
        sublabel: s.pickup.address.city,
        dotClass: meta.dot,
        ...pickup,
      });
      const delivery = projectLatLng(s.delivery.address.lat, s.delivery.address.lng);
      out.push({
        id: `delivery-${s.id}`,
        layer: "deliveries",
        shipmentId: s.id,
        label: `Shipment #${s.number} — Delivery`,
        sublabel: s.delivery.address.city,
        dotClass: meta.dot,
        ...delivery,
      });
      if (s.assignedDriver) {
        const loc = projectLatLng(s.assignedDriver.currentLocation.lat, s.assignedDriver.currentLocation.lng);
        out.push({
          id: `driver-${s.id}`,
          layer: "drivers",
          shipmentId: s.id,
          label: s.assignedDriver.name,
          sublabel: `Shipment #${s.number} · ${s.assignedDriver.vehicle.label}`,
          dotClass: meta.dot,
          ...loc,
        });
      }
    }
    return out;
  }, [active]);

  const visibleMarkers = markers.filter((m) => layers[m.layer]);

  const clusters = useMemo(() => {
    const map = new Map<string, MapMarker[]>();
    for (const m of visibleMarkers) {
      const key = bucketKey(m.xPct, m.yPct);
      const list = map.get(key) ?? [];
      list.push(m);
      map.set(key, list);
    }
    return map;
  }, [visibleMarkers]);

  if (active.length === 0) {
    return <EmptyState icon={MapPinned} title="Nothing in transit" description="Active pickups, deliveries, and drivers will appear on the map here." />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(LAYER_META) as LayerId[]).map((id) => {
          const Icon = LAYER_META[id].icon;
          const on = layers[id];
          return (
            <button
              key={id}
              onClick={() => setLayers((prev) => ({ ...prev, [id]: !prev[id] }))}
              aria-pressed={on}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                on ? "border-electric/30 bg-electric/10 text-electric" : "border-slate-200 text-slate-400 hover:text-navy",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {LAYER_META[id].label}
            </button>
          );
        })}
        <div className="ml-auto flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          {Object.entries(STATUS_META).map(([status, meta]) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
              {meta.label}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-grid relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        {[...clusters.entries()].map(([key, group]) => {
          const first = group[0];
          const isCluster = group.length > 1;
          return (
            <div key={key} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${first.xPct}%`, top: `${first.yPct}%` }}>
              <button
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered((h) => (h === key ? null : h))}
                onClick={() => (isCluster ? setOpenCluster((k) => (k === key ? null : key)) : openShipment(first.shipmentId))}
                className={cn(
                  "flex items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md ring-2 ring-white transition-transform hover:scale-110",
                  isCluster ? "h-6 w-6 bg-navy" : "h-3.5 w-3.5",
                  !isCluster && first.dotClass,
                )}
                aria-label={isCluster ? `${group.length} shipments in this area` : first.label}
              >
                {isCluster ? group.length : null}
              </button>

              {hovered === key && !isCluster && (
                <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-44 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-2 text-xs shadow-lg">
                  <p className="font-semibold text-navy">{first.label}</p>
                  <p className="text-slate-500">{first.sublabel}</p>
                </div>
              )}

              {openCluster === key && isCluster && (
                <div className="absolute left-1/2 top-full z-20 mt-2 w-52 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
                  {group.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        openShipment(m.shipmentId);
                        setOpenCluster(null);
                      }}
                      className="flex w-full flex-col rounded-md px-2 py-1.5 text-left text-xs hover:bg-slate-50"
                    >
                      <span className="font-medium text-navy">{m.label}</span>
                      <span className="text-slate-500">{m.sublabel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-400">
        Schematic operations view. Swap in a Mapbox/Google Maps layer against the same lat/lng fields for live traffic and routing.
      </p>
    </div>
  );
}
