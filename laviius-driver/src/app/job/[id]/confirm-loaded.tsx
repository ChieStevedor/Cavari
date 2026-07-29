import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/ui/Card";
import { PrimaryActionBar } from "@/components/ui/PrimaryActionBar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { color } from "@/constants/theme";
import { useAdvanceWorkflow } from "@/hooks/useAdvanceWorkflow";
import { useShipmentStore } from "@/stores/shipmentStore";

export default function ConfirmLoadedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const shipment = useShipmentStore((s) => s.getById(id));
  const advance = useAdvanceWorkflow(id);

  if (!shipment) return null;

  const pickupPhotoCount = shipment.photos.filter((p) => p.category === "pickup").length;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Confirm Loaded" subtitle={shipment.shipmentNumber} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Card className="mb-3">
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-text-secondary text-[14px]">Cargo items</Text>
            <Text className="text-text-primary text-[14px] font-semibold">{shipment.cargo.length}</Text>
          </View>
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-text-secondary text-[14px]">Total weight</Text>
            <Text className="text-text-primary text-[14px] font-semibold">{shipment.totalWeightLbs} lbs</Text>
          </View>
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-text-secondary text-[14px]">Pickup photos</Text>
            <Text className="text-text-primary text-[14px] font-semibold">{pickupPhotoCount}</Text>
          </View>
        </Card>

        <View className="flex-row items-center bg-go-muted rounded-lg p-3">
          <Ionicons name="checkmark-circle" size={18} color={color.go} />
          <Text className="text-go text-[13px] ml-2 flex-1">Cargo verified and loaded. Ready to depart for delivery.</Text>
        </View>
      </ScrollView>
      <PrimaryActionBar label="Confirm Loaded — Start Route" onPress={() => advance()} />
    </View>
  );
}
