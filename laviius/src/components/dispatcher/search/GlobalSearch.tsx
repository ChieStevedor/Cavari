"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Package, Search, Truck, User } from "lucide-react";
import { useDispatcher } from "@/lib/dispatcher/store";
import { StatusBadge } from "@/components/dispatcher/shared/StatusBadge";

type ResultKind = "shipment" | "carrier" | "customer";

interface SearchResult {
  kind: ResultKind;
  id: string;
  title: string;
  subtitle: string;
  onSelect: () => void;
}

export function GlobalSearch() {
  const { searchOpen, closeSearch, shipments, carriers, customers, openShipment, pushToast } = useDispatcher();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset to a clean slate each time the palette opens. Comparing against
  // the previous open state during render (rather than reacting to it in an
  // effect) avoids the extra cascading render effects would cause here.
  const [wasOpen, setWasOpen] = useState(searchOpen);
  if (searchOpen !== wasOpen) {
    setWasOpen(searchOpen);
    if (searchOpen) {
      setQuery("");
      setActiveIndex(0);
    }
  }

  useEffect(() => {
    if (!searchOpen) return;
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [searchOpen]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: SearchResult[] = [];

    for (const s of shipments) {
      const haystack = [
        String(s.number),
        s.referenceNumber,
        s.customer.companyName,
        s.customer.name,
        s.pickup.address.city,
        s.delivery.address.city,
        s.assignedCarrier?.name ?? "",
        s.assignedDriver?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (haystack.includes(q)) {
        out.push({
          kind: "shipment",
          id: s.id,
          title: `Shipment #${s.number}`,
          subtitle: `${s.customer.companyName} · ${s.pickup.address.city} → ${s.delivery.address.city}`,
          onSelect: () => {
            openShipment(s.id);
            closeSearch();
          },
        });
      }
      if (out.length >= 30) break;
    }

    for (const c of carriers) {
      if (c.name.toLowerCase().includes(q)) {
        out.push({
          kind: "carrier",
          id: c.id,
          title: c.name,
          subtitle: `${c.onTimePercent}% on-time · ${c.distanceKm} km away`,
          onSelect: () => {
            pushToast(`${c.name} — carrier profile view coming soon.`, "info");
            closeSearch();
          },
        });
      }
    }

    for (const cu of customers) {
      const haystack = `${cu.companyName} ${cu.name} ${cu.phone}`.toLowerCase();
      if (haystack.includes(q)) {
        out.push({
          kind: "customer",
          id: cu.id,
          title: cu.companyName,
          subtitle: `${cu.name} · ${cu.phone}`,
          onSelect: () => {
            pushToast(`${cu.companyName} — customer profile view coming soon.`, "info");
            closeSearch();
          },
        });
      }
    }

    return out.slice(0, 20);
  }, [query, shipments, carriers, customers, openShipment, closeSearch, pushToast]);

  return (
    <AnimatePresence>
      {searchOpen && (
      <motion.div
        key="search-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-navy/40 backdrop-blur-sm"
        onClick={closeSearch}
      >
        <motion.div
          key="search-panel"
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Universal search"
          className="mx-auto mt-[12vh] w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-navy/20"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.min(i + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && results[activeIndex]) {
                  results[activeIndex].onSelect();
                }
              }}
              placeholder="Search shipments, customers, carriers, drivers, phone, address..."
              className="w-full bg-transparent text-sm text-navy placeholder:text-slate-400 focus:outline-none"
            />
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">ESC</kbd>
          </div>

          <div className="max-h-96 overflow-y-auto py-2">
            {query.trim() === "" && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                Start typing to search across shipments, customers, and carriers.
              </p>
            )}
            {query.trim() !== "" && results.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No matches for &ldquo;{query}&rdquo;.</p>
            )}
            {results.map((r, i) => {
              const Icon = r.kind === "shipment" ? Package : r.kind === "carrier" ? Truck : User;
              const shipment = r.kind === "shipment" ? shipments.find((s) => s.id === r.id) : undefined;
              return (
                <button
                  key={`${r.kind}-${r.id}`}
                  onClick={r.onSelect}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === activeIndex ? "bg-electric/5" : ""
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Icon className="h-4 w-4 text-slate-500" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-navy">{r.title}</span>
                    <span className="block truncate text-xs text-slate-500">{r.subtitle}</span>
                  </span>
                  {shipment && <StatusBadge status={shipment.status} />}
                </button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
