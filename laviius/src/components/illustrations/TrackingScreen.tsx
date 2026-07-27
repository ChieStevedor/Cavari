import { Navigation, CheckCircle2 } from "lucide-react";

export function TrackingScreen() {
  return (
    <>
      <div className="px-3 pb-3 pt-2">
        <p className="text-[10px] font-medium text-slate-400">
          Tracking · #LV-4821
        </p>
        <p className="text-sm font-bold text-navy">Live Delivery</p>
      </div>

      <div className="relative mx-3 h-28 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
        <svg viewBox="0 0 160 110" className="h-full w-full" fill="none">
          <path
            d="M10 95 Q60 20 90 60 T150 15"
            stroke="#2563EB"
            strokeWidth="2"
            strokeDasharray="4 5"
            strokeLinecap="round"
          />
          <circle cx="150" cy="15" r="5" fill="#10B981" />
        </svg>
        <div className="absolute right-2 top-2 rounded-full bg-electric p-1.5 text-white shadow-md">
          <Navigation className="h-3 w-3" />
        </div>
      </div>

      <div className="mx-3 mt-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-navy">
            Arriving in 12 min
          </span>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald" />
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-3/4 rounded-full bg-emerald" />
        </div>
      </div>

      <div className="mx-3 my-3 flex items-center gap-2 rounded-xl border border-slate-100 p-2">
        <div className="h-7 w-7 shrink-0 rounded-full bg-navy/10" />
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold text-navy">
            Marcus D. &middot; Fraser Cartage
          </p>
          <p className="text-[9px] text-slate-400">
            Ford Transit &middot; BC 4XR2
          </p>
        </div>
      </div>
    </>
  );
}
