import type { ShipmentFormValues, ShipmentTemplate } from "@/types/shipment";
import { generateId } from "./id";

const TEMPLATES_KEY = "laviius:shipment-templates:v1";

function readAll(): ShipmentTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ShipmentTemplate[];
  } catch {
    return [];
  }
}

function writeAll(templates: ShipmentTemplate[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch {
    // Best-effort persistence; a failed write just means the template
    // won't be there next visit, which is recoverable.
  }
}

export function listTemplates(): ShipmentTemplate[] {
  return readAll().sort((a, b) => {
    const aTime = a.lastUsedAt ?? a.createdAt;
    const bTime = b.lastUsedAt ?? b.createdAt;
    return bTime.localeCompare(aTime);
  });
}

export function saveTemplate(name: string, values: ShipmentFormValues): ShipmentTemplate {
  const template: ShipmentTemplate = {
    id: generateId("tpl"),
    name,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    values,
  };
  writeAll([...readAll(), template]);
  return template;
}

export function deleteTemplate(id: string) {
  writeAll(readAll().filter((t) => t.id !== id));
}

export function touchTemplateUsed(id: string) {
  writeAll(
    readAll().map((t) => (t.id === id ? { ...t, lastUsedAt: new Date().toISOString() } : t)),
  );
}
