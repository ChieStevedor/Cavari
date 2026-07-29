import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { color } from "@/constants/theme";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, onBack, showBack = true, right }: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
      <View className="flex-row items-center flex-1">
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={onBack ?? (() => router.back())}
            className="h-11 w-11 items-center justify-center -ml-2 mr-1"
          >
            <Ionicons name="chevron-back" size={26} color={color.textPrimary} />
          </Pressable>
        ) : null}
        <View className="flex-1">
          <Text className="text-[20px] font-bold text-text-primary" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-[13px] text-text-secondary" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {right}
    </View>
  );
}
