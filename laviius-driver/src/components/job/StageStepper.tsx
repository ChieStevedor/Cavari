import { View } from "react-native";

import { color } from "@/constants/theme";
import { getStageProgress } from "@/domain/workflow";
import type { Shipment } from "@/types/shipment";

/** Slim linear progress indicator shown on Job Details — gives the driver
 * a glanceable sense of "how far into this job am I" without a busy
 * multi-step stepper UI (spec: avoid overloaded screens). */
export function StageStepper({ shipment }: { shipment: Shipment }) {
  const progress = getStageProgress(shipment);
  return (
    <View className="h-1.5 rounded-full bg-bg-elevated-2 overflow-hidden">
      <View
        style={{ width: `${Math.max(4, progress * 100)}%`, backgroundColor: color.go }}
        className="h-full rounded-full"
      />
    </View>
  );
}
