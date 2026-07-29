import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { ChecklistRow } from "@/components/ui/ChecklistRow";
import { color } from "@/constants/theme";
import { checklistHasFailure, isChecklistComplete } from "@/domain/checklists";
import type { ChecklistAnswer, ChecklistItemId } from "@/types/shipment";

interface ChecklistScreenBodyProps {
  answers: ChecklistAnswer[];
  onAnswer: (itemId: ChecklistItemId, value: boolean) => void;
}

/** Shared body for Loading Checklist / Cargo Verification / Unload
 * Checklist — three screens, one interaction pattern (spec: "minimize
 * typing, prefer scanning, photos, toggles and confirmations"). */
export function ChecklistScreenBody({ answers, onAnswer }: ChecklistScreenBodyProps) {
  const hasFailure = checklistHasFailure(answers);

  return (
    <View className="px-4">
      <View className="rounded-xl bg-bg-elevated border border-border-subtle px-4">
        {answers.map((a) => (
          <ChecklistRow
            key={a.id}
            label={a.label}
            value={a.value}
            isWarningItem={a.isWarningItem}
            onChange={(value) => onAnswer(a.id, value)}
          />
        ))}
      </View>

      {hasFailure ? (
        <View className="flex-row items-start mt-4 bg-danger-muted rounded-lg p-3">
          <Ionicons name="alert-circle" size={18} color={color.danger} />
          <Text className="text-danger text-[13px] ml-2 flex-1">
            This will raise an exception for dispatch. You can still continue — report additional details from
            Report Issue if needed.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export { isChecklistComplete };
