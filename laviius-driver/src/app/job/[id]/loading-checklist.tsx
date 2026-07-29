import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChecklistScreenBody } from "@/components/job/ChecklistScreenBody";
import { PrimaryActionBar } from "@/components/ui/PrimaryActionBar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { isChecklistComplete } from "@/domain/checklists";
import { useAdvanceWorkflow } from "@/hooks/useAdvanceWorkflow";
import { useLocalSearchParams } from "expo-router";
import { useShipmentStore } from "@/stores/shipmentStore";
import type { ChecklistItemId } from "@/types/shipment";

const LOADING_ITEM_IDS: ChecklistItemId[] = ["packaging_acceptable", "securely_loaded"];

export default function LoadingChecklistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const shipment = useShipmentStore((s) => s.getById(id));
  const setChecklistAnswer = useShipmentStore((s) => s.setChecklistAnswer);
  const advance = useAdvanceWorkflow(id);

  if (!shipment) return null;

  const answers = shipment.pickupChecklist.filter((a) => LOADING_ITEM_IDS.includes(a.id));
  const complete = isChecklistComplete(answers);

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Loading Checklist" subtitle={shipment.shipmentNumber} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Text className="px-4 text-text-secondary text-[15px] mb-4">
          Confirm the cargo is packaged and loaded correctly before you continue.
        </Text>
        <ChecklistScreenBody
          answers={answers}
          onAnswer={(itemId, value) => setChecklistAnswer(shipment.id, "pickupChecklist", itemId, value)}
        />
      </ScrollView>
      <PrimaryActionBar label="Continue to Cargo Verification" onPress={() => advance()} disabled={!complete} />
    </View>
  );
}
