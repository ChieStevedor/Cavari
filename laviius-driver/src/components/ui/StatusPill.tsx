import { Text, View } from "react-native";

import { actionColorMap, type ActionColor } from "@/constants/theme";

interface StatusPillProps {
  label: string;
  color: ActionColor;
  size?: "sm" | "md";
}

export function StatusPill({ label, color, size = "md" }: StatusPillProps) {
  const c = actionColorMap[color];
  return (
    <View
      style={{ backgroundColor: c.bg }}
      className={["flex-row items-center self-start rounded-full", size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5"].join(" ")}
    >
      <View style={{ backgroundColor: c.fg }} className="h-2 w-2 rounded-full mr-1.5" />
      <Text style={{ color: c.fg }} className={["font-semibold", size === "sm" ? "text-xs" : "text-sm"].join(" ")}>
        {label}
      </Text>
    </View>
  );
}
