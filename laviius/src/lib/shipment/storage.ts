import type { ShipmentFormValues, WizardStepId } from "@/types/shipment";

const DRAFT_KEY = "laviius:shipment-draft:v1";

interface DraftPayload {
  step: WizardStepId;
  values: ShipmentFormValues;
  savedAt: string;
}

export function saveDraft(step: WizardStepId, values: ShipmentFormValues) {
  if (typeof window === "undefined") return;
  const payload: DraftPayload = { step, values, savedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // Storage can be full or unavailable (private browsing) — autosave is
    // best-effort and must never interrupt the booking flow.
  }
}

export function loadDraft(): DraftPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftPayload;
  } catch {
    return null;
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Ignore — nothing left to clear if storage is unavailable.
  }
}
