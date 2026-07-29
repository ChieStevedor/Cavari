import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/ui/Card";
import { PrimaryActionBar } from "@/components/ui/PrimaryActionBar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { color } from "@/constants/theme";
import { useAdvanceWorkflow } from "@/hooks/useAdvanceWorkflow";
import { getCurrentPosition } from "@/lib/location";
import { useShipmentStore } from "@/stores/shipmentStore";
import type { Address } from "@/types/shipment";

function buildMapsUrl(address: Address): string {
  const query = encodeURIComponent(`${address.line1}, ${address.city}, ${address.state} ${address.zip}`);
  return Platform.select({
    ios: `maps://?daddr=${query}&dirflg=d`,
    android: `google.navigation:q=${query}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
  }) as string;
}

/** Launches the driver's preferred navigation app for the current leg.
 * This screen intentionally does not embed a map — spec calls for
 * launching the OS-native nav app the driver already trusts, not
 * reinventing turn-by-turn inside Laviius. */
export default function NavigateScreen() {
  const { id, leg } = useLocalSearchParams<{ id: string; leg: "pickup" | "delivery" }>();
  const insets = useSafeAreaInsets();
  const shipment = useShipmentStore((s) => s.getById(id));
  const advance = useAdvanceWorkflow(id);
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    getCurrentPosition().catch(() => {});
  }, []);

  if (!shipment) return null;
  const address = leg === "delivery" ? shipment.delivery : shipment.pickup;
  const appointmentWindow = leg === "delivery" ? shipment.deliveryWindow : shipment.pickupWindow;

  const launchNav = () => {
    Linking.openURL(buildMapsUrl(address)).catch(() => {});
    setLaunched(true);
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScreenHeader title={leg === "delivery" ? "Navigate to Delivery" : "Navigate to Pickup"} />
      <View className="flex-1 px-4 pt-2">
        <Card className="items-center py-10 mb-4 bg-go-muted border-go/30">
          <Ionicons name="navigate" size={36} color={color.go} />
          <Text className="text-text-primary text-[19px] font-bold mt-3 text-center">{address.label}</Text>
          <Text className="text-text-secondary text-[14px] mt-1 text-center">
            {address.line1}, {address.city}, {address.state} {address.zip}
          </Text>
        </Card>

        <Card className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={16} color={color.textSecondary} />
            <Text className="text-text-secondary text-[14px] ml-2">Appointment</Text>
          </View>
          <Text className="text-text-primary text-[14px] font-semibold">
            {new Date(appointmentWindow.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </Text>
        </Card>

        {address.accessNotes ? (
          <Card className="flex-row items-start">
            <Ionicons name="information-circle-outline" size={16} color={color.info} />
            <Text className="text-text-secondary text-[14px] ml-2 flex-1">{address.accessNotes}</Text>
          </Card>
        ) : null}
      </View>

      <PrimaryActionBar
        label={launched ? "Open Navigation Again" : "Launch Navigation"}
        onPress={launchNav}
        secondaryLabel={launched ? "I've Arrived" : undefined}
        onSecondaryPress={() => advance()}
      />
    </View>
  );
}
