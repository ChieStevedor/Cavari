import { MapPin, TrendingUp, Clock3, Package } from "lucide-react";

const DELIVERIES = [
  { id: "LV-4821", carrier: "Fraser Cartage Co.", status: "In Transit", tone: "electric" as const },
  { id: "LV-4819", carrier: "Harbourline Freight", status: "Picked Up", tone: "amber" as const },
  { id: "LV-4814", carrier: "Northside Express", status: "Delivered", tone: "emerald" as const },
];

const toneClasses: Record<string, string> = {
  electric: "bg-electric/10 text-electric",
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald/10 text-emerald",
};

export function DashboardMockup() {
  return (
    <div
      aria-hidden
      className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10"
    >
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="ml-3 text-xs font-medium text-slate-400">
          Dispatcher Dashboard
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 p-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Package className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Active</span>
          </div>
          <p className="mt-1 text-xl font-bold text-navy">24</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">On-Time</span>
          </div>
          <p className="mt-1 text-xl font-bold text-emerald">98.6%</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock3 className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Avg Pickup</span>
          </div>
          <p className="mt-1 text-xl font-bold text-navy">18 min</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 px-4 pb-4">
        <div className="relative col-span-3 overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100">
          <svg
            viewBox="0 0 300 200"
            className="h-full min-h-[180px] w-full"
            fill="none"
          >
            <path
              d="M20 170 Q90 40 160 100 T280 30"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />
            <circle cx="20" cy="170" r="6" fill="#0F172A" />
            <circle cx="160" cy="100" r="6" fill="#2563EB" />
            <circle cx="280" cy="30" r="6" fill="#10B981" />
          </svg>
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-navy shadow-sm">
            <MapPin className="h-3 w-3 text-electric" />
            Live Route
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-2">
          {DELIVERIES.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-2.5 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-navy">
                  {d.id}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {d.carrier}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${toneClasses[d.tone]}`}
              >
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
