import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChecklistScreenBody } from "@/components/job/ChecklistScreenBody";
import { Card } from "@/components/ui/Card";
import { PrimaryActionBar } from "@/components/ui/PrimaryActionBar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { checklistHasFailure, isChecklistComplete } from "@/domain/checklists";
import { useAdvanceWorkflow } from "@/hooks/useAdvanceWorkflow";
import { useShipmentStore } from "@/stores/shipmentStore";
import type { ChecklistItemId } from "@/types/shipment";

const VERIFY_ITEM_IDS: ChecklistItemId[] = ["cargo_matches_order", "correct_quantity", "visible_damage"];

export default function CargoVerificationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const shipment = useShipmentStore((s) => s.getById(id));
  const setChecklistAnswer = useShipmentStore((s) => s.setChecklistAnswer);
  const reportException = useShipmentStore((s) => s.reportException);
  const advance = useAdvanceWorkflow(id);

  if (!shipment) return null;

  const answers = shipment.pickupChecklist.filter((a) => VERIFY_ITEM_IDS.includes(a.id));
  const complete = isChecklistComplete(answers);

  const handleContinue = () => {
    if (checklistHasFailure(answers)) {
      reportException(shipment.id, {
        type: "damage",
        label: "Cargo verification exception at pickup",
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
      <ScreenHeader title="Verify Cargo" subtitle={shipment.shipmentNumber} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 mb-4">
          <Card>
            {shipment.cargo.map((item) => (
              <Text key={item.id} className="text-text-primary text-[14px] py-1">
                {item.quantity}× {item.description}
              </Text>
            ))}
          </Card>
        </View>
        <ChecklistScreenBody
          answers={answers}
          onAnswer={(itemId, value) => setChecklistAnswer(shipment.id, "pickupChecklist", itemId, value)}
        />
      </ScrollView>
      <PrimaryActionBar label="Continue to Photos" onPress={handleContinue} disabled={!complete} />
    </View>
  );
}
