import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { color } from "@/constants/theme";
import type { CapturedPhoto } from "@/types/shipment";

interface PhotoGridProps {
  photos: CapturedPhoto[];
  onAddPress: () => void;
  minRequired?: number;
}

const UPLOAD_ICON: Record<CapturedPhoto["uploadStatus"], keyof typeof Ionicons.glyphMap> = {
  pending: "cloud-upload-outline",
  uploading: "cloud-upload-outline",
  uploaded: "checkmark-circle",
  failed: "alert-circle",
};

export function PhotoGrid({ photos, onAddPress, minRequired = 0 }: PhotoGridProps) {
  return (
    <View>
      <View className="flex-row flex-wrap gap-3">
        {photos.map((photo) => (
          <View key={photo.id} className="h-24 w-24 rounded-lg overflow-hidden bg-bg-elevated-2">
            <Image source={{ uri: photo.localUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            <View className="absolute bottom-1 right-1 bg-black/60 rounded-full p-0.5">
              <Ionicons
                name={UPLOAD_ICON[photo.uploadStatus]}
                size={14}
                color={photo.uploadStatus === "uploaded" ? color.go : photo.uploadStatus === "failed" ? color.danger : color.textSecondary}
              />
            </View>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add photo"
          onPress={onAddPress}
          className="h-24 w-24 rounded-lg border-2 border-dashed border-border items-center justify-center active:opacity-70"
        >
          <Ionicons name="camera-outline" size={26} color={color.textSecondary} />
          <Text className="text-text-secondary text-xs mt-1">Add</Text>
        </Pressable>
      </View>
      {minRequired > 0 && photos.length < minRequired ? (
        <Text className="text-attention text-[13px] mt-2">
          {minRequired - photos.length} more photo{minRequired - photos.length === 1 ? "" : "s"} required
        </Text>
      ) : null}
    </View>
  );
}
