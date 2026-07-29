import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { color } from "@/constants/theme";
import { useConnectivityStore } from "@/stores/connectivityStore";
import { useSyncQueueStore } from "@/stores/syncQueueStore";

export function OfflineBanner() {
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const pendingCount = useSyncQueueStore((s) => s.queue.length);

  if (isOnline && pendingCount === 0) return null;

  return (
    <View
      className={["flex-row items-center justify-center py-2 px-4", isOnline ? "bg-info-muted" : "bg-attention-muted"].join(" ")}
      accessibilityLiveRegion="polite"
    >
      <Ionicons
        name={isOnline ? "sync-outline" : "cloud-offline-outline"}
        size={14}
        color={isOnline ? color.info : color.attention}
      />
      <Text className={["ml-2 text-[13px] font-medium", isOnline ? "text-info" : "text-attention"].join(" ")}>
        {isOnline
          ? `Syncing ${pendingCount} update${pendingCount === 1 ? "" : "s"}…`
          : `Offline — ${pendingCount} update${pendingCount === 1 ? "" : "s"} will sync automatically`}
      </Text>
    </View>
  );
}
