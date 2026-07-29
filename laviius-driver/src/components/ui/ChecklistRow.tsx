import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

import { color } from "@/constants/theme";

interface ChecklistRowProps {
  label: string;
  value: boolean | null;
  isWarningItem?: boolean;
  onChange: (value: boolean) => void;
}

/** Binary confirm/deny row used throughout pickup/delivery/white-glove
 * checklists. Warning items (e.g. "Visible damage?") invert the color
 * semantics: answering true is the alarming outcome, not the safe one. */
export function ChecklistRow({ label, value, isWarningItem, onChange }: ChecklistRowProps) {
  const yesIsAlarming = isWarningItem;

  return (
    <View className="flex-row items-center justify-between py-3.5 border-b border-border-subtle last:border-b-0">
      <Text className="flex-1 text-[17px] text-text-primary pr-3">{label}</Text>
      <View className="flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: No`}
          accessibilityState={{ selected: value === false }}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(false);
          }}
          className={[
            "h-touch w-[64px] items-center justify-center rounded-md border",
            value === false
              ? yesIsAlarming
                ? "bg-go-muted border-go"
                : "bg-danger-muted border-danger"
              : "bg-bg-elevated-2 border-border",
          ].join(" ")}
        >
          <Ionicons
            name="close"
            size={22}
            color={value === false ? (yesIsAlarming ? color.go : color.danger) : color.textTertiary}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: Yes`}
          accessibilityState={{ selected: value === true }}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(true);
          }}
          className={[
            "h-touch w-[64px] items-center justify-center rounded-md border",
            value === true
              ? yesIsAlarming
                ? "bg-danger-muted border-danger"
                : "bg-go-muted border-go"
              : "bg-bg-elevated-2 border-border",
          ].join(" ")}
        >
          <Ionicons
            name="checkmark"
            size={22}
            color={value === true ? (yesIsAlarming ? color.danger : color.go) : color.textTertiary}
          />
        </Pressable>
      </View>
    </View>
  );
}
