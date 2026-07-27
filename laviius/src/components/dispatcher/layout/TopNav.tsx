"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useDispatcher } from "@/lib/dispatcher/store";
import { AlertCenter } from "@/components/dispatcher/alerts/AlertCenter";
import { Avatar } from "@/components/dispatcher/shared/Avatar";

export function TopNav() {
  const { openSearch } = useDispatcher();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4">
      <Link href="/dispatcher" className="flex shrink-0 items-center gap-2 pr-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy text-sm font-bold text-white">L</span>
        <span className="text-sm font-semibold tracking-tight text-navy">Laviius</span>
      </Link>

      <button
        onClick={openSearch}
        className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 transition-colors hover:border-slate-300 hover:bg-white"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search shipments, customers, carriers…</span>
        <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">/</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/book"
          className="hidden items-center gap-1.5 rounded-lg bg-electric px-3 h-9 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-electric-light sm:flex"
        >
          <Plus className="h-4 w-4" />
          New Shipment
        </Link>
        <AlertCenter />
        <div className="mx-1 h-6 w-px bg-slate-200" />
        <button className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-100">
          <Avatar name="You" size="sm" />
          <span className="hidden text-sm font-medium text-navy md:inline">Dispatcher</span>
        </button>
      </div>
    </header>
  );
}
