"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useDispatcher } from "@/lib/dispatcher/store";
import { cn } from "@/lib/cn";

const ICONS = { success: CheckCircle2, info: Info, error: XCircle } as const;
const TONE_CLASS = {
  success: "text-emerald-600",
  info: "text-blue-600",
  error: "text-red-600",
} as const;

export function ToastStack() {
  const { toasts, dismissToast } = useDispatcher();

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              role="status"
              className="pointer-events-auto flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-lg shadow-slate-900/10 backdrop-blur"
            >
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", TONE_CLASS[toast.tone])} strokeWidth={2} />
              <p className="flex-1 text-sm text-navy">{toast.message}</p>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-xs text-slate-400 hover:text-navy"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
