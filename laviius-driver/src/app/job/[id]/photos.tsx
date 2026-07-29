import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCapturePhoto } from "@/api/mutations";
import { PhotoGrid } from "@/components/ui/PhotoGrid";
import { PrimaryActionBar } from "@/components/ui/PrimaryActionBar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useAdvanceWorkflow } from "@/hooks/useAdvanceWorkflow";
import { compressPhoto } from "@/lib/photoCapture";
import { getCurrentPosition } from "@/lib/location";
import { useShipmentStore } from "@/stores/shipmentStore";
import type { PhotoCategory } from "@/types/shipment";

const MIN_PHOTOS = 1;

export default function PhotosScreen() {
  const { id, leg } = useLocalSearchParams<{ id: string; leg: "pickup" | "delivery" }>();
  const insets = useSafeAreaInsets();
  const shipment = useShipmentStore((s) => s.getById(id));
  const advance = useAdvanceWorkflow(id);
  const capturePhoto = useCapturePhoto(id);

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraOpen, setCameraOpen] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!shipment) return null;

  const category: PhotoCategory = leg === "delivery" ? "delivery" : "pickup";
  const photos = shipment.photos.filter((p) => p.category === category);

  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setCameraOpen(true);
  };

  const takePicture = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
    if (!photo) return;
    setCameraOpen(false);
    const compressedUri = await compressPhoto(photo.uri);
    const gps = (await getCurrentPosition()) ?? undefined;
    capturePhoto.mutate({ localUri: compressedUri, category, gps });
  };

  if (isCameraOpen) {
    return (
      <View className="flex-1 bg-black">
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
          className="absolute bottom-0 left-0 right-0 items-center pt-6 bg-black/40"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Capture photo"
            onPress={takePicture}
            className="h-20 w-20 rounded-full bg-white items-center justify-center border-4 border-white/40 active:opacity-80"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close camera"
          onPress={() => setCameraOpen(false)}
          className="absolute top-14 left-4 h-11 w-11 rounded-full bg-black/50 items-center justify-center"
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScreenHeader
        title={leg === "delivery" ? "Delivery Photos" : "Pickup Photos"}
        subtitle={shipment.shipmentNumber}
      />
      <View className="px-4 flex-1">
        <Text className="text-text-secondary text-[15px] mb-4">
          Capture clear photos of the cargo. Photos are attached to the shipment automatically and upload in the
          background.
        </Text>
        <PhotoGrid photos={photos} onAddPress={openCamera} minRequired={MIN_PHOTOS} />
      </View>
      <PrimaryActionBar
        label={leg === "delivery" ? "Generate Proof of Delivery" : "Continue"}
        onPress={() => advance()}
        disabled={photos.length < MIN_PHOTOS}
      />
    </View>
  );
}
