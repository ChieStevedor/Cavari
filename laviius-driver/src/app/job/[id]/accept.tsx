import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/ui/Card";
import { PrimaryActionBar } from "@/components/ui/PrimaryActionBar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { color } from "@/constants/theme";
import { useAdvanceWorkflow } from "@/hooks/useAdvanceWorkflow";
import { useShipmentStore } from "@/stores/shipmentStore";

export default function AcceptAssignmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const shipment = useShipmentStore((s) => s.getById(id));
  const advance = useAdvanceWorkflow(id);

  if (!shipment) return null;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="New Assignment" showBack={false} />
      <View className="flex-1 px-4 pt-2">
        <Card className="items-center py-8 mb-4">
          <Ionicons name="cube" size={40} color={color.brand} />
          <Text className="text-text-primary text-[22px] font-bold mt-3">{shipment.shipmentNumber}</Text>
          <Text className="text-text-secondary text-[15px] mt-1">{shipment.customerName}</Text>
        </Card>

        <Card className="mb-3">
          <Text className="text-text-tertiary text-[12px] font-semibold uppercase mb-1">Pickup</Text>
          <Text className="text-text-primary text-[15px]">{shipment.pickup.line1}, {shipment.pickup.city}</Text>
        </Card>
        <Card className="mb-3">
          <Text className="text-text-tertiary text-[12px] font-semibold uppercase mb-1">Delivery</Text>
          <Text className="text-text-primary text-[15px]">{shipment.delivery.line1}, {shipment.delivery.city}</Text>
        </Card>
        {shipment.isWhiteGlove ? (
          <Card className="flex-row items-center">
            <Ionicons name="sparkles" size={16} color={color.premium} />
            <Text className="text-premium text-[14px] font-semibold ml-2">White Glove Service</Text>
          </Card>
        ) : null}
      </View>
      <PrimaryActionBar label="Accept Assignment" onPress={() => advance("en_route_pickup")} />
    </View>
  );
}
