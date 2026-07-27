import { Camera, MapPin, Navigation2 } from "lucide-react";

export function DriverAppScreen() {
  return (
    <>
      <div className="px-3 pb-2 pt-2">
        <p className="text-[10px] font-medium text-slate-400">Next stop</p>
        <p className="text-sm font-bold text-navy">Job #LV-4821</p>
      </div>

      <div className="mx-3 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-navy" />
          <p className="text-[10px] leading-tight text-slate-600">
            1420 Clark Dr, Vancouver
          </p>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-[-1px] h-3 w-3 shrink-0 text-electric" />
          <p className="text-[10px] leading-tight text-slate-600">
            88 W 3rd Ave, Vancouver
          </p>
        </div>
      </div>

      <div className="mx-3 mt-2.5 flex items-center justify-between rounded-xl border border-slate-100 p-2">
        <div>
          <p className="text-[9px] text-slate-400">Freight</p>
          <p className="text-[10px] font-semibold text-navy">
            2 pallets &middot; 640 lb
          </p>
        </div>
        <span className="rounded-full bg-electric/10 px-2 py-0.5 text-[9px] font-semibold text-electric">
          White Glove
        </span>
      </div>

      <div className="mx-3 mt-3 mb-3 flex gap-2">
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-navy py-2 text-[10px] font-semibold text-white">
          <Navigation2 className="h-3 w-3" />
          Navigate
        </button>
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald py-2 text-[10px] font-semibold text-white">
          <Camera className="h-3 w-3" />
          Capture POD
        </button>
      </div>
    </>
  );
}
