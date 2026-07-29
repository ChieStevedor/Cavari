import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNowStrict } from "date-fns";
import { router } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useMessageThreadsQuery } from "@/api/queries";
import { EmptyState } from "@/components/ui/EmptyState";
import { color } from "@/constants/theme";
import { useMessagesStore } from "@/stores/messagesStore";
import type { MessageThread } from "@/types/messaging";

const ROLE_LABEL: Record<string, string> = {
  dispatcher: "Dispatcher",
  carrier_dispatcher: "Carrier Dispatcher",
  internal: "Internal Team",
  driver: "You",
};

function ThreadRow({ thread }: { thread: MessageThread }) {
  const other = thread.participants.find((p) => p.role !== "driver");
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/messages/${thread.id}` as never)}
      className="flex-row items-center py-3.5 border-b border-border-subtle active:opacity-70"
    >
      <View className="h-12 w-12 rounded-full bg-bg-elevated-2 items-center justify-center mr-3">
        <Ionicons name="person" size={22} color={color.textSecondary} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-text-primary text-[16px] font-semibold" numberOfLines={1}>
            {other ? ROLE_LABEL[other.role] ?? other.name : "Thread"}
          </Text>
          <Text className="text-text-tertiary text-[12px]">
            {formatDistanceToNowStrict(new Date(thread.updatedAt), { addSuffix: false })}
          </Text>
        </View>
        {thread.shipmentNumber ? (
          <Text className="text-brand text-[12px] font-medium mt-0.5">{thread.shipmentNumber}</Text>
        ) : null}
        <Text className="text-text-secondary text-[14px] mt-0.5" numberOfLines={1}>
          {thread.lastMessage?.text ?? "No messages yet"}
        </Text>
      </View>
      {thread.unreadCount > 0 ? (
        <View className="h-5 w-5 rounded-full bg-brand items-center justify-center ml-2">
          <Text className="text-white text-[11px] font-bold">{thread.unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const threads = useMessagesStore((s) => s.threads);
  useMessageThreadsQuery();

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-3 pb-2">
        <Text className="text-text-primary text-[28px] font-bold">Messages</Text>
      </View>
      {threads.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No conversations yet"
          description="Messages from dispatch, your carrier, and shipment-specific threads will show up here."
        />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => <ThreadRow thread={item} />}
        />
      )}
    </View>
  );
}
