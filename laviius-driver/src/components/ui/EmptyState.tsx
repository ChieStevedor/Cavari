import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { color } from "@/constants/theme";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-bg-elevated-2 mb-5">
        <Ionicons name={icon} size={36} color={color.textTertiary} />
      </View>
      <Text className="text-[22px] text-text-primary font-bold text-center mb-2">{title}</Text>
      <Text className="text-[17px] text-text-secondary text-center leading-6">{description}</Text>
      {action ? <View className="mt-6 w-full">{action}</View> : null}
    </View>
  );
}
