import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryActionBar } from "@/components/ui/PrimaryActionBar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { color } from "@/constants/theme";
import { isWhiteGloveComplete } from "@/domain/checklists";
import { useAdvanceWorkflow } from "@/hooks/useAdvanceWorkflow";
import { useShipmentStore } from "@/stores/shipmentStore";

/** Auto-enabled only when `shipment.isWhiteGlove` — the workflow state
 * machine (`skipIf`) skips this screen entirely for standard freight. */
export default function WhiteGloveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const shipment = useShipmentStore((s) => s.getById(id));
  const setWhiteGloveTaskComplete = useShipmentStore((s) => s.setWhiteGloveTaskComplete);
  const setChecklistAnswer = useShipmentStore((s) => s.setChecklistAnswer);
  const advance = useAdvanceWorkflow(id);

  if (!shipment) return null;

  const complete = isWhiteGloveComplete(shipment.whiteGloveTasks);

  const handleContinue = () => {
    setChecklistAnswer(shipment.id, "deliveryChecklist", "white_glove_completed", true);
    if (shipment.whiteGloveTasks.some((t) => t.type === "assembly_required")) {
      setChecklistAnswer(shipment.id, "deliveryChecklist", "assembly_completed", true);
    }
    if (shipment.whiteGloveTasks.some((t) => t.type === "packaging_removal")) {
      setChecklistAnswer(shipment.id, "deliveryChecklist", "packaging_removed", true);
    }
    advance();
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="White Glove Tasks" subtitle={shipment.shipmentNumber} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View className="flex-row items-center bg-premium-muted rounded-lg p-3 mb-4">
          <Ionicons name="sparkles" size={16} color={color.premium} />
          <Text className="text-premium text-[13px] ml-2 flex-1">Complete every required task before generating the customer signature.</Text>
        </View>

        <View className="rounded-xl bg-bg-elevated border border-border-subtle">
          {shipment.whiteGloveTasks.map((task, idx) => (
            <Pressable
              key={task.type}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: task.completed }}
              accessibilityLabel={task.label}
              onPress={() => {
                Haptics.selectionAsync();
                setWhiteGloveTaskComplete(shipment.id, task.type, !task.completed);
              }}
              className={["flex-row items-center px-4 py-3.5", idx > 0 ? "border-t border-border-subtle" : ""].join(" ")}
            >
              <View
                className={[
                  "h-7 w-7 rounded-md items-center justify-center mr-3 border-2",
                  task.completed ? "bg-go border-go" : "border-border",
                ].join(" ")}
              >
                {task.completed ? <Ionicons name="checkmark" size={18} color="#0B0F19" /> : null}
              </View>
              <View className="flex-1">
                <Text className="text-text-primary text-[15px] font-medium">
                  {task.label}
                  {!task.required ? <Text className="text-text-tertiary text-[12px]"> (optional)</Text> : null}
                </Text>
                {task.detail ? <Text className="text-text-secondary text-[13px] mt-0.5">{task.detail}</Text> : null}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <PrimaryActionBar label="Complete White Glove Tasks" onPress={handleContinue} disabled={!complete} />
    </View>
  );
}
