import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SignaturePad, type SignatureViewRef } from "@/components/ui/SignaturePad";
import { Button } from "@/components/ui/Button";
import { PrimaryActionBar } from "@/components/ui/PrimaryActionBar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { color } from "@/constants/theme";
import { useAdvanceWorkflow } from "@/hooks/useAdvanceWorkflow";
import { getCurrentPosition } from "@/lib/location";
import { useShipmentStore } from "@/stores/shipmentStore";

export default function SignatureScreenRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const shipment = useShipmentStore((s) => s.getById(id));
  const setSignature = useShipmentStore((s) => s.setSignature);
  const advance = useAdvanceWorkflow(id);

  const [signerName, setSignerName] = useState(shipment?.delivery.contactName ?? "");
  const padRef = useRef<SignatureViewRef>(null);

  if (!shipment) return null;

  const handleCapture = async (dataUri: string) => {
    const gps = (await getCurrentPosition()) ?? undefined;
    setSignature(shipment.id, {
      signerName: signerName.trim() || "Customer",
      svgOrPngUri: dataUri,
      signedAt: new Date().toISOString(),
      gps,
    });
    advance();
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Customer Signature Required" subtitle={shipment.shipmentNumber} />
      <View className="flex-1 px-4">
        <Text className="text-text-secondary text-[13px] font-semibold uppercase mb-2">Signed by</Text>
        <TextInput
          value={signerName}
          onChangeText={setSignerName}
          placeholder="Customer name"
          placeholderTextColor={color.textTertiary}
          className="h-touch bg-bg-elevated border border-border rounded-lg px-4 text-text-primary text-[16px] mb-4"
          accessibilityLabel="Signer name"
        />

        <Text className="text-text-secondary text-[13px] font-semibold uppercase mb-2">Signature</Text>
        <SignaturePad ref={padRef} onCapture={handleCapture} />
        <View className="mt-3">
          <Button label="Clear" variant="ghost" onPress={() => padRef.current?.clearSignature()} />
        </View>
      </View>
      <PrimaryActionBar
        label="Confirm Signature"
        onPress={() => padRef.current?.readSignature()}
        disabled={signerName.trim().length === 0}
      />
    </View>
  );
}
