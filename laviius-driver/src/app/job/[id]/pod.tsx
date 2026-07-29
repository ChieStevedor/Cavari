import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/ui/Card";
import { PrimaryActionBar } from "@/components/ui/PrimaryActionBar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { color } from "@/constants/theme";
import { useAdvanceWorkflow } from "@/hooks/useAdvanceWorkflow";
import { getCurrentPosition } from "@/lib/location";
import { useAuthStore } from "@/stores/authStore";
import { useShipmentStore } from "@/stores/shipmentStore";

/**
 * Digital Proof of Delivery. Auto-generated the moment the driver lands
 * here — the customer receives it immediately (spec) via the backend once
 * the sync queue flushes. The driver's only remaining action is to
 * acknowledge completion.
 */
export default function ProofOfDeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const shipment = useShipmentStore((s) => s.getById(id));
  const generatePOD = useShipmentStore((s) => s.generatePOD);
  const driver = useAuthStore((s) => s.driver);
  const advance = useAdvanceWorkflow(id);

  useEffect(() => {
    if (shipment && !shipment.pod?.driverId && driver) {
      getCurrentPosition().then((gps) => {
        generatePOD(shipment.id, driver.id, driver.name, gps ?? undefined);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipment?.id]);

  if (!shipment) return null;
  const pod = shipment.pod;
  const deliveryPhotos = shipment.photos.filter((p) => p.category === "delivery");

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Proof of Delivery" subtitle={shipment.shipmentNumber} showBack={false} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Card className="items-center py-6 mb-4 bg-go-muted border-go/30">
          <Ionicons name="document-text" size={32} color={color.go} />
          <Text className="text-text-primary text-[18px] font-bold mt-2">POD Generated</Text>
          <Text className="text-text-secondary text-[13px] mt-1">
            {pod ? new Date(pod.generatedAt).toLocaleString() : "Generating…"}
          </Text>
        </Card>

        <Card className="mb-3">
          <Text className="text-text-tertiary text-[12px] font-semibold uppercase mb-2">Delivered To</Text>
          <Text className="text-text-primary text-[15px]">{pod?.deliveredToName ?? shipment.delivery.contactName ?? "—"}</Text>
          <Text className="text-text-secondary text-[13px] mt-0.5">{shipment.delivery.line1}, {shipment.delivery.city}</Text>
        </Card>

        <Card className="mb-3">
          <Text className="text-text-tertiary text-[12px] font-semibold uppercase mb-2">Driver</Text>
          <Text className="text-text-primary text-[15px]">{pod?.driverName ?? driver?.name}</Text>
        </Card>

        {pod?.signature ? (
          <Card className="mb-3">
            <Text className="text-text-tertiary text-[12px] font-semibold uppercase mb-2">Signature</Text>
            <Image source={{ uri: pod.signature.svgOrPngUri }} style={{ width: "100%", height: 100 }} contentFit="contain" />
            <Text className="text-text-secondary text-[13px] mt-1">{pod.signature.signerName}</Text>
          </Card>
        ) : null}

        {deliveryPhotos.length > 0 ? (
          <Card className="mb-3">
            <Text className="text-text-tertiary text-[12px] font-semibold uppercase mb-2">Photos ({deliveryPhotos.length})</Text>
            <View className="flex-row flex-wrap gap-2">
              {deliveryPhotos.map((p) => (
                <Image key={p.id} source={{ uri: p.localUri }} style={{ width: 72, height: 72, borderRadius: 8 }} />
              ))}
            </View>
          </Card>
        ) : null}

        {shipment.exceptions.length > 0 ? (
          <Card className="mb-3 border-danger/30 bg-danger-muted">
            <Text className="text-danger text-[12px] font-semibold uppercase mb-2">
              Exceptions ({shipment.exceptions.length})
            </Text>
            {shipment.exceptions.map((e) => (
              <Text key={e.id} className="text-text-primary text-[13px] py-0.5">
                {e.label}
              </Text>
            ))}
          </Card>
        ) : null}
      </ScrollView>
      <PrimaryActionBar label="Complete Shipment" onPress={() => advance()} />
    </View>
  );
}
