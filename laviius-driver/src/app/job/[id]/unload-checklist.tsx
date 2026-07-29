import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChecklistScreenBody } from "@/components/job/ChecklistScreenBody";
import { PrimaryActionBar } from "@/components/ui/PrimaryActionBar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { checklistHasFailure, isChecklistComplete } from "@/domain/checklists";
import { useAdvanceWorkflow } from "@/hooks/useAdvanceWorkflow";
import { useShipmentStore } from "@/stores/shipmentStore";
import type { ChecklistItemId } from "@/types/shipment";

const UNLOAD_ITEM_IDS: ChecklistItemId[] = ["correct_location", "cargo_delivered"];

export default function UnloadChecklistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const shipment = useShipmentStore((s) => s.getById(id));
  const setChecklistAnswer = useShipmentStore((s) => s.setChecklistAnswer);
  const reportException = useShipmentStore((s) => s.reportException);
  const advance = useAdvanceWorkflow(id);

  if (!shipment) return null;

  const answers = shipment.deliveryChecklist.filter((a) => UNLOAD_ITEM_IDS.includes(a.id));
  const complete = isChecklistComplete(answers);

  const handleContinue = () => {
    if (checklistHasFailure(answers)) {
      reportException(shipment.id, {
        type: "wrong_freight",
        label: "Unload verification exception",
        notes: answers
          .filter((a) => (a.isWarningItem ? a.value === true : a.value === false))
          .map((a) => a.label)
          .join(", "),
        photoIds: [],
      });
    }
    advance();
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Unload Checklist" subtitle={shipment.shipmentNumber} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Text className="px-4 text-text-secondary text-[15px] mb-4">Confirm the delivery before unloading continues.</Text>
        <ChecklistScreenBody
          answers={answers}
          onAnswer={(itemId, value) => setChecklistAnswer(shipment.id, "deliveryChecklist", itemId, value)}
        />
      </ScrollView>
      <PrimaryActionBar label="Continue" onPress={handleContinue} disabled={!complete} />
    </View>
  );
}
