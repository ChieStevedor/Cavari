import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { color } from "@/constants/theme";

interface CountdownChipProps {
  targetIso: string;
  label: string;
}

function formatRemaining(ms: number): { text: string; overdue: boolean } {
  const overdue = ms < 0;
  const abs = Math.abs(ms);
  const totalMin = Math.round(abs / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const text = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return { text, overdue };
}

/** Live-updating "time until" chip — pickup/delivery countdowns on Home
 * and Job Details. Updates every 30s; cheap enough to not warrant a timer
 * store. */
export function CountdownChip({ targetIso, label }: CountdownChipProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const { text, overdue } = formatRemaining(new Date(targetIso).getTime() - now);

  return (
    <View className="flex-row items-center">
      <Ionicons name="time-outline" size={14} color={overdue ? color.danger : color.textSecondary} />
      <Text
        className={["ml-1 text-[13px] font-medium", overdue ? "text-danger" : "text-text-secondary"].join(" ")}
      >
        {label} {overdue ? `${text} overdue` : `in ${text}`}
      </Text>
    </View>
  );
}
