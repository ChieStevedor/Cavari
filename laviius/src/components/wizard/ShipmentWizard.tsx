"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { FreightSuggestion, ShipmentFormValues, ShipmentTemplate, WizardStepId } from "@/types/shipment";
import { WIZARD_STEPS, emptyShipmentFormValues } from "@/lib/shipment/constants";
import { shipmentSchema, STEP_FIELD_NAMES } from "@/lib/shipment/schema";
import { generateSuggestions } from "@/lib/shipment/intelligence";
import { loadDraft, saveDraft, clearDraft } from "@/lib/shipment/storage";
import { listTemplates, saveTemplate, deleteTemplate, touchTemplateUsed } from "@/lib/shipment/templates";
import { Button } from "@/components/ui/Button";
import { ShipmentStepper } from "./ShipmentStepper";
import { LiveSummaryPanel } from "./LiveSummaryPanel";
import { MobileSummaryChip } from "./MobileSummaryChip";
import { IntelligenceSuggestionBanner } from "./IntelligenceSuggestionBanner";
import { TemplateSelector } from "./TemplateSelector";
import { SaveAsTemplateModal } from "./SaveAsTemplateModal";
import { SuccessScreen } from "./SuccessScreen";
import { StepPickup } from "./steps/StepPickup";
import { StepDelivery } from "./steps/StepDelivery";
import { StepShipmentDetails } from "./steps/StepShipmentDetails";
import { StepRequiredService } from "./steps/StepRequiredService";
import { StepReview } from "./steps/StepReview";

function generateReferenceNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `LV-${suffix}`;
}

type Phase = "loading" | "template-select" | "wizard" | "success";

export function ShipmentWizard() {
  // Draft/template lookups touch localStorage, which doesn't exist during
  // SSR — they're deferred to a post-mount effect below and the wizard
  // shows a skeleton until then, so the server and first client paint
  // always agree (no hydration mismatch).
  const [phase, setPhase] = useState<Phase>("loading");
  const [templateList, setTemplateList] = useState<ShipmentTemplate[]>([]);
  const [currentStepId, setCurrentStepId] = useState<WizardStepId>("pickup");
  const [furthestStepIndex, setFurthestStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [submittedValues, setSubmittedValues] = useState<ShipmentFormValues | null>(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: emptyShipmentFormValues(),
    mode: "onBlur",
  });

  useEffect(() => {
    // One-time sync from localStorage (an external system SSR can't see) —
    // the calls below are batched into a single re-render, not a cascade.
    /* eslint-disable react-hooks/set-state-in-effect */
    const draft = loadDraft();
    if (draft) {
      form.reset(draft.values);
      setCurrentStepId(draft.step);
      setFurthestStepIndex(Math.max(0, WIZARD_STEPS.findIndex((s) => s.id === draft.step)));
      setPhase("wizard");
      return;
    }
    const templates = listTemplates();
    if (templates.length > 0) {
      setTemplateList(templates);
      setPhase("template-select");
    } else {
      setPhase("wizard");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const values = useWatch({ control: form.control }) as ShipmentFormValues;

  // Autosave (also covers "if internet disconnects, save locally" — this
  // never touches the network, so it works offline by construction).
  useEffect(() => {
    if (phase !== "wizard") return;
    const handle = window.setTimeout(() => saveDraft(currentStepId, values), 400);
    return () => window.clearTimeout(handle);
  }, [values, currentStepId, phase]);

  // Adaptive Workflow: ASAP requests the earliest pickup instead of a scheduled one.
  useEffect(() => {
    if (values?.service?.priority === "asap") {
      if (form.getValues("pickup.date")) form.setValue("pickup.date", "");
      if (form.getValues("pickup.time")) form.setValue("pickup.time", "");
      if (form.getValues("delivery.date")) form.setValue("delivery.date", "");
      if (form.getValues("delivery.time")) form.setValue("delivery.time", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values?.service?.priority]);

  const suggestions: FreightSuggestion[] = useMemo(
    () => (values ? generateSuggestions(values) : []),
    [values],
  );

  const applySuggestion = useCallback(
    (suggestion: FreightSuggestion) => {
      if (!suggestion.action) return;
      const patch = suggestion.action.apply(form.getValues());
      form.reset({ ...form.getValues(), ...patch });
    },
    [form],
  );

  const dismissSuggestion = useCallback(
    (id: string) => {
      form.setValue("dismissedSuggestions", [...form.getValues("dismissedSuggestions"), id]);
    },
    [form],
  );

  const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStepId);

  const goNext = useCallback(async () => {
    const fields = STEP_FIELD_NAMES[currentStepId];
    const valid = fields.length === 0 ? true : await form.trigger(fields as never);
    if (!valid) return;
    const next = WIZARD_STEPS[currentIndex + 1];
    if (next) {
      setCurrentStepId(next.id);
      setFurthestStepIndex((f) => Math.max(f, currentIndex + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStepId, currentIndex, form]);

  const goBack = useCallback(() => {
    const prev = WIZARD_STEPS[currentIndex - 1];
    if (prev) {
      setCurrentStepId(prev.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentIndex]);

  const goToStep = useCallback(
    (id: WizardStepId) => {
      const idx = WIZARD_STEPS.findIndex((s) => s.id === id);
      if (idx <= furthestStepIndex) {
        setCurrentStepId(id);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [furthestStepIndex],
  );

  const handleUseTemplate = useCallback(
    (template: ShipmentTemplate) => {
      form.reset(template.values);
      touchTemplateUsed(template.id);
      setFurthestStepIndex(WIZARD_STEPS.length - 1);
      setCurrentStepId("review");
      setPhase("wizard");
    },
    [form],
  );

  const handleDeleteTemplate = useCallback((id: string) => {
    deleteTemplate(id);
    setTemplateList((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    const currentValues = form.getValues();
    // Simulated network round-trip to the booking API.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSubmittedValues(currentValues);
    setReferenceNumber(generateReferenceNumber());
    clearDraft();
    setIsSubmitting(false);
    setPhase("success");
    window.setTimeout(() => setShowSaveTemplate(true), 500);
  }, [form]);

  const handleSaveTemplate = useCallback(
    (name: string) => {
      if (submittedValues) saveTemplate(name, submittedValues);
      setShowSaveTemplate(false);
    },
    [submittedValues],
  );

  const stepContent = {
    pickup: <StepPickup />,
    delivery: <StepDelivery />,
    shipment: <StepShipmentDetails />,
    service: <StepRequiredService />,
    review: values && (
      <StepReview values={values} onEditStep={goToStep} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    ),
  }[currentStepId];

  if (phase === "loading") {
    return <WizardSkeleton />;
  }

  if (phase === "success" && referenceNumber) {
    return (
      <>
        <SuccessScreen referenceNumber={referenceNumber} />
        <SaveAsTemplateModal
          open={showSaveTemplate}
          defaultName={
            submittedValues
              ? `${submittedValues.pickup.address.city || "Pickup"} → ${submittedValues.delivery.address.city || "Delivery"}`
              : "My Shipment Template"
          }
          onSave={handleSaveTemplate}
          onSkip={() => setShowSaveTemplate(false)}
        />
      </>
    );
  }

  if (phase === "template-select") {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-16 sm:px-6 lg:px-8">
        <TemplateSelector
          templates={templateList}
          onUseTemplate={handleUseTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onStartNew={() => setPhase("wizard")}
        />
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <ShipmentStepper
        steps={WIZARD_STEPS}
        currentStepId={currentStepId}
        furthestStepIndex={furthestStepIndex}
        onBack={goBack}
        onStepSelect={goToStep}
        canGoBack={currentIndex > 0}
      />

      <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 pb-32 pt-8 sm:px-6 lg:px-8 lg:pb-16">
        <div className="w-full flex-1 lg:max-w-2xl">
          {values && suggestions.length > 0 && (
            <div className="mb-5">
              <IntelligenceSuggestionBanner
                suggestions={suggestions}
                onApply={applySuggestion}
                onDismiss={dismissSuggestion}
              />
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepId}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {stepContent}
            </motion.div>
          </AnimatePresence>

          {currentStepId !== "review" && (
            <div className="mt-6 flex items-center justify-between gap-3">
              {currentIndex > 0 ? (
                <Button variant="ghost" size="lg" onClick={goBack} type="button">
                  Back
                </Button>
              ) : (
                <span />
              )}
              <Button variant="primary" size="lg" onClick={goNext} type="button">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {values && <LiveSummaryPanel values={values} />}
      </div>

      {values && <MobileSummaryChip values={values} />}
    </FormProvider>
  );
}

function WizardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="border-b border-slate-200 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <div className="h-9 w-9 rounded-lg bg-slate-100" />
          <div className="flex flex-1 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 flex-1 rounded-full bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl gap-8 px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex-1 space-y-4">
          <div className="h-7 w-56 rounded-lg bg-slate-100" />
          <div className="h-40 rounded-2xl bg-slate-100" />
          <div className="h-52 rounded-2xl bg-slate-100" />
        </div>
        <div className="hidden h-72 w-[320px] shrink-0 rounded-2xl bg-slate-100 lg:block" />
      </div>
    </div>
  );
}
