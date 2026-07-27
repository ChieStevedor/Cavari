"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { FreightSuggestion, SuggestionTone } from "@/types/shipment";

const TONE_STYLES: Record<SuggestionTone, string> = {
  info: "border-electric/20 bg-electric/5",
  success: "border-emerald/25 bg-emerald/5",
  warning: "border-amber-300 bg-amber-50",
};

const TONE_ICON_STYLES: Record<SuggestionTone, string> = {
  info: "text-electric",
  success: "text-emerald",
  warning: "text-amber-600",
};

function ToneIcon({ tone }: { tone: SuggestionTone }) {
  if (tone === "warning") return <AlertTriangle className="h-4 w-4" />;
  return <Sparkles className="h-4 w-4" />;
}

interface IntelligenceSuggestionBannerProps {
  suggestions: FreightSuggestion[];
  onApply: (suggestion: FreightSuggestion) => void;
  onDismiss: (id: string) => void;
}

export function IntelligenceSuggestionBanner({
  suggestions,
  onApply,
  onDismiss,
}: IntelligenceSuggestionBannerProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {suggestions.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("overflow-hidden rounded-xl border px-4 py-3", TONE_STYLES[s.tone])}
          >
            <div className="flex items-start gap-3">
              <span className={cn("mt-0.5 shrink-0", TONE_ICON_STYLES[s.tone])}>
                <ToneIcon tone={s.tone} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy">{s.title}</p>
                <p className="mt-0.5 text-sm text-slate-600">{s.body}</p>
                {s.action && (
                  <button
                    type="button"
                    onClick={() => onApply(s)}
                    className="mt-2 text-sm font-semibold text-electric hover:text-electric-light"
                  >
                    {s.action.label} →
                  </button>
                )}
              </div>
              <button
                type="button"
                aria-label="Dismiss suggestion"
                onClick={() => onDismiss(s.id)}
                className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
