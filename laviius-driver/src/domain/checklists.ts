import type { ChecklistAnswer, ChecklistItemId, Shipment, WhiteGloveTask, WhiteGloveTaskType } from "@/types/shipment";

export function buildPickupChecklist(): ChecklistAnswer[] {
  const items: { id: ChecklistItemId; label: string; isWarningItem?: boolean }[] = [
    { id: "cargo_matches_order", label: "Cargo matches order" },
    { id: "packaging_acceptable", label: "Packaging acceptable" },
    { id: "visible_damage", label: "Visible damage?", isWarningItem: true },
    { id: "correct_quantity", label: "Correct quantity" },
    { id: "securely_loaded", label: "Securely loaded" },
  ];
  return items.map((i) => ({ ...i, value: null }));
}

export function buildDeliveryChecklist(shipment: Pick<Shipment, "isWhiteGlove">): ChecklistAnswer[] {
  const items: { id: ChecklistItemId; label: string; isWarningItem?: boolean }[] = [
    { id: "correct_location", label: "Correct location" },
    { id: "cargo_delivered", label: "Cargo delivered" },
    ...(shipment.isWhiteGlove
      ? ([
          { id: "white_glove_completed", label: "White Glove service completed" },
          { id: "assembly_completed", label: "Assembly completed (if required)" },
          { id: "packaging_removed", label: "Packaging removed" },
        ] as const)
      : []),
    { id: "customer_satisfied", label: "Customer satisfied" },
  ];
  return items.map((i) => ({ ...i, value: null }));
}

export const WHITE_GLOVE_TASK_LABELS: Record<WhiteGloveTaskType, string> = {
  room_of_choice: "Room of Choice",
  assembly_required: "Assembly Required",
  blanket_wrap: "Blanket Wrap",
  packaging_removal: "Packaging Removal",
  debris_removal: "Debris Removal",
  stairs: "Stairs",
  elevator: "Elevator",
  two_movers: "Two Movers",
  three_movers: "Three Movers",
};

/** A checklist "fails" (raises an exception candidate) when any warning
 * item is answered true, or any required item is answered false. */
export function checklistHasFailure(answers: ChecklistAnswer[]): boolean {
  return answers.some((a) =>
    a.isWarningItem ? a.value === true : a.value === false
  );
}

export function isChecklistComplete(answers: ChecklistAnswer[]): boolean {
  return answers.every((a) => a.value !== null);
}

export function isWhiteGloveComplete(tasks: WhiteGloveTask[]): boolean {
  return tasks.filter((t) => t.required).every((t) => t.completed);
}
