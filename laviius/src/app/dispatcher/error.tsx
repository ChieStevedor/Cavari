"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function DispatcherError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-100">
        <AlertTriangle className="h-5 w-5 text-red-500" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-semibold text-navy">Something went wrong loading the console</p>
      <p className="max-w-sm text-sm text-slate-500">
        This didn&apos;t affect any shipments or dispatch actions. Try again — if it keeps happening, refresh the page.
      </p>
      <button
        onClick={reset}
        className="mt-1 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
      >
        Try again
      </button>
    </div>
  );
}
