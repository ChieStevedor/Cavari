"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, Download, Pin, PinOff, Truck, X } from "lucide-react";
import { useDispatcher } from "@/lib/dispatcher/store";
import type { Shipment } from "@/types/dispatcher";
import { BUILT_IN_VIEWS, loadQueuePrefs, saveQueuePrefs, type SavedView } from "@/lib/dispatcher/queuePreferences";
import { EmptyState } from "@/components/dispatcher/shared/EmptyState";
import { QUEUE_COLUMNS } from "./columns";
import { getSortValue } from "./sort";
import { QueueToolbar } from "./QueueToolbar";
import { ShipmentRow } from "./ShipmentRow";

const ROW_HEIGHT = 48;

function matchesSearch(s: Shipment, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return [
    String(s.number),
    s.referenceNumber,
    s.customer.companyName,
    s.pickup.address.city,
    s.delivery.address.city,
    s.assignedCarrier?.name ?? "",
    s.assignedDriver?.name ?? "",
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function matchesView(s: Shipment, view: SavedView): boolean {
  if (view.statuses !== "all" && !view.statuses.includes(s.status)) return false;
  if (view.priority !== "all" && s.priority !== view.priority) return false;
  return true;
}

function exportToCsv(shipments: Shipment[]) {
  const header = ["Shipment", "Status", "Priority", "Customer", "Pickup", "Delivery", "Carrier", "Driver"];
  const rows = shipments.map((s) => [
    `#${s.number}`,
    s.status,
    s.priority,
    s.customer.companyName,
    s.pickup.address.city,
    s.delivery.address.city,
    s.assignedCarrier?.name ?? "",
    s.assignedDriver?.name ?? "",
  ]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `laviius-shipments-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ShipmentQueue() {
  const { shipments, pinnedIds, togglePin, openShipment, pushToast } = useDispatcher();
  const prefs = useMemo(() => loadQueuePrefs(), []);

  const [searchText, setSearchText] = useState("");
  const [activeViewId, setActiveViewId] = useState(prefs.lastViewId);
  const [visibleOptionalColumns, setVisibleOptionalColumns] = useState<string[]>(prefs.visibleOptionalColumns);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ columnId: string; dir: "asc" | "desc" }>({ columnId: "number", dir: "asc" });
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    saveQueuePrefs({ visibleOptionalColumns, lastViewId: activeViewId });
  }, [visibleOptionalColumns, activeViewId]);

  const activeView = BUILT_IN_VIEWS.find((v) => v.id === activeViewId) ?? BUILT_IN_VIEWS[0];
  const columns = QUEUE_COLUMNS.filter((c) => !c.optional || visibleOptionalColumns.includes(c.id));
  const gridTemplateColumns = `72px ${columns.map((c) => `${c.width}px`).join(" ")} 56px`;

  const sortFn = (a: Shipment, b: Shipment) => {
    const va = getSortValue(a, sort.columnId);
    const vb = getSortValue(b, sort.columnId);
    const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
    return sort.dir === "asc" ? cmp : -cmp;
  };

  const pinnedSet = new Set(pinnedIds);
  const pinnedRows = shipments.filter((s) => pinnedSet.has(s.id) && matchesSearch(s, searchText)).sort(sortFn);
  const restRows = shipments.filter((s) => !pinnedSet.has(s.id) && matchesView(s, activeView) && matchesSearch(s, searchText)).sort(sortFn);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: restRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  useEffect(() => {
    setFocusedIndex(0);
  }, [activeViewId, searchText, sort]);

  function toggleSort(columnId: string) {
    setSort((prev) => (prev.columnId === columnId ? { columnId, dir: prev.dir === "asc" ? "desc" : "asc" } : { columnId, dir: "asc" }));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleQuickAction(shipment: Shipment) {
    if (shipment.status === "waiting_assignment") openShipment(shipment.id, "carrier");
    else openShipment(shipment.id, "communication");
  }

  function onGridKeyDown(e: React.KeyboardEvent) {
    if (restRows.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(focusedIndex + 1, restRows.length - 1);
      setFocusedIndex(next);
      rowVirtualizer.scrollToIndex(next, { align: "auto" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.max(focusedIndex - 1, 0);
      setFocusedIndex(next);
      rowVirtualizer.scrollToIndex(next, { align: "auto" });
    }
  }

  const selectedCount = selectedIds.size;

  return (
    <section aria-label="Shipment queue" className="flex min-h-[420px] flex-col rounded-2xl border border-slate-200 bg-white">
      <QueueToolbar
        searchText={searchText}
        onSearchTextChange={setSearchText}
        activeViewId={activeViewId}
        onViewChange={(v) => setActiveViewId(v.id)}
        visibleOptionalColumns={visibleOptionalColumns}
        onToggleColumn={(id) => setVisibleOptionalColumns((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))}
      />

      {selectedCount > 0 && (
        <div className="flex items-center gap-3 border-b border-slate-100 bg-electric/5 px-3 py-2">
          <span className="text-xs font-semibold text-navy">{selectedCount} selected</span>
          <button
            onClick={() => {
              selectedIds.forEach((id) => {
                if (!pinnedSet.has(id)) togglePin(id);
              });
              pushToast("Pinned selected shipments.", "success");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-navy hover:bg-slate-50"
          >
            <Pin className="h-3.5 w-3.5" /> Pin
          </button>
          <button
            onClick={() => {
              const rows = [...pinnedRows, ...restRows].filter((s) => selectedIds.has(s.id));
              exportToCsv(rows);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-navy hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-navy"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      )}

      <div role="row" style={{ gridTemplateColumns }} className="grid items-center gap-3 border-b border-slate-200 bg-slate-50/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <span />
        {columns.map((col) => (
          <button key={col.id} onClick={() => toggleSort(col.id)} className="flex items-center gap-1 truncate text-left hover:text-navy">
            {col.label}
            {sort.columnId === col.id && (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
          </button>
        ))}
        <span>Actions</span>
      </div>

      {pinnedRows.length > 0 && (
        <div className="border-b border-slate-100">
          <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pinned</p>
          {pinnedRows.map((s) => (
            <ShipmentRow
              key={s.id}
              shipment={s}
              columns={columns}
              gridTemplateColumns={gridTemplateColumns}
              selected={selectedIds.has(s.id)}
              focused={false}
              pinned
              onToggleSelect={() => toggleSelect(s.id)}
              onOpen={() => openShipment(s.id)}
              onTogglePin={() => togglePin(s.id)}
              onQuickAction={() => handleQuickAction(s)}
            />
          ))}
        </div>
      )}

      {restRows.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No shipments match this view"
          description="Try a different saved view, or clear the search filter to see more shipments."
          className="m-4 border-none"
        />
      ) : (
        <div
          ref={parentRef}
          role="grid"
          aria-label="Shipments"
          tabIndex={0}
          onKeyDown={onGridKeyDown}
          className="min-h-0 flex-1 overflow-y-auto focus:outline-none"
        >
          <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const shipment = restRows[virtualRow.index];
              return (
                <ShipmentRow
                  key={shipment.id}
                  shipment={shipment}
                  columns={columns}
                  gridTemplateColumns={gridTemplateColumns}
                  selected={selectedIds.has(shipment.id)}
                  focused={virtualRow.index === focusedIndex}
                  pinned={false}
                  onToggleSelect={() => toggleSelect(shipment.id)}
                  onOpen={() => openShipment(shipment.id)}
                  onTogglePin={() => togglePin(shipment.id)}
                  onQuickAction={() => handleQuickAction(shipment)}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, transform: `translateY(${virtualRow.start}px)` }}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400">
        <span>
          {restRows.length + pinnedRows.length} shipment{restRows.length + pinnedRows.length === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-1">
          <PinOff className="h-3 w-3" /> Press Enter to open · Arrow keys to navigate
        </span>
      </div>
    </section>
  );
}
