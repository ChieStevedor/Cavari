"use client";

import { useEffect, useRef, useState } from "react";
import { Columns3, Search } from "lucide-react";
import { BUILT_IN_VIEWS, type SavedView } from "@/lib/dispatcher/queuePreferences";
import { QUEUE_COLUMNS } from "./columns";
import { cn } from "@/lib/cn";

export function QueueToolbar({
  searchText,
  onSearchTextChange,
  activeViewId,
  onViewChange,
  visibleOptionalColumns,
  onToggleColumn,
}: {
  searchText: string;
  onSearchTextChange: (value: string) => void;
  activeViewId: string;
  onViewChange: (view: SavedView) => void;
  visibleOptionalColumns: string[];
  onToggleColumn: (columnId: string) => void;
}) {
  const [columnsOpen, setColumnsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setColumnsOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const optionalColumns = QUEUE_COLUMNS.filter((c) => c.optional);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {BUILT_IN_VIEWS.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              activeViewId === view.id ? "bg-navy text-white" : "text-slate-500 hover:bg-slate-100 hover:text-navy",
            )}
          >
            {view.name}
          </button>
        ))}
      </div>

      <div className="flex h-8 min-w-40 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5">
        <Search className="h-3.5 w-3.5 text-slate-400" />
        <input
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
          placeholder="Filter by shipment #, customer, carrier, city…"
          className="w-full bg-transparent text-xs text-navy placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setColumnsOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Columns3 className="h-3.5 w-3.5" />
          Columns
        </button>
        {columnsOpen && (
          <div className="absolute right-0 z-20 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Optional Columns</p>
            {optionalColumns.map((col) => (
              <label key={col.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-navy hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={visibleOptionalColumns.includes(col.id)}
                  onChange={() => onToggleColumn(col.id)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-electric focus:ring-electric"
                />
                {col.label}
              </label>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
