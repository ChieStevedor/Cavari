"use client";

import { Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import type { WizardStep, WizardStepId } from "@/types/shipment";
import { ProgressBar } from "./ProgressBar";

interface ShipmentStepperProps {
  steps: WizardStep[];
  currentStepId: WizardStepId;
  furthestStepIndex: number;
  onBack: () => void;
  onStepSelect: (id: WizardStepId) => void;
  canGoBack: boolean;
}

export function ShipmentStepper({
  steps,
  currentStepId,
  furthestStepIndex,
  onBack,
  onStepSelect,
  canGoBack,
}: ShipmentStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);
  const percent = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-navy transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Desktop: full step indicator */}
        <ol className="hidden flex-1 items-center gap-2 md:flex">
          {steps.map((step, i) => {
            const isDone = i < currentIndex;
            const isCurrent = step.id === currentStepId;
            const isReachable = i <= furthestStepIndex;
            return (
              <li key={step.id} className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  disabled={!isReachable}
                  onClick={() => onStepSelect(step.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium transition-colors",
                    isReachable ? "cursor-pointer" : "cursor-default",
                    isCurrent ? "text-electric" : isDone ? "text-navy" : "text-slate-400",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                      isCurrent
                        ? "bg-electric text-white"
                        : isDone
                          ? "bg-navy text-white"
                          : "bg-slate-100 text-slate-400",
                    )}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="hidden lg:inline">{step.label}</span>
                </button>
                {i < steps.length - 1 && (
                  <span
                    className={cn("h-px flex-1", isDone ? "bg-navy/30" : "bg-slate-200")}
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>

        {/* Mobile: compact label */}
        <div className="flex flex-1 items-center justify-between md:hidden">
          <span className="text-sm font-semibold text-navy">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className="text-sm text-slate-500">{steps[currentIndex]?.label}</span>
        </div>
      </div>
      <ProgressBar percent={percent} />
    </div>
  );
}
