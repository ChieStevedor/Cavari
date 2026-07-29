import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { color } from "@/constants/theme";
import { useAuthStore } from "@/stores/authStore";
import { useMessagesStore } from "@/stores/messagesStore";
import { QUICK_REPLIES } from "@/types/messaging";
import type { Message } from "@/types/messaging";

function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  return (
    <View className={["max-w-[80%] mb-3", isMine ? "self-end items-end" : "self-start items-start"].join(" ")}>
      <View
        className={[
          "rounded-2xl px-4 py-2.5",
          isMine ? "bg-brand rounded-br-sm" : "bg-bg-elevated-2 rounded-bl-sm",
        ].join(" ")}
      >
        <Text className={isMine ? "text-white text-[15px]" : "text-text-primary text-[15px]"}>{message.text}</Text>
      </View>
      <Text className="text-text-tertiary text-[11px] mt-1">
        {new Date(message.sentAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        {message.deliveryStatus === "queued" ? " · Queued" : ""}
      </Text>
    </View>
  );
}

export default function ThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const insets = useSafeAreaInsets();
  const driver = useAuthStore((s) => s.driver);
  const thread = useMessagesStore((s) => s.threads.find((t) => t.id === threadId));
  const messages = useMessagesStore((s) => s.messagesByThread[threadId] ?? []);
  const sendMessage = useMessagesStore((s) => s.sendMessage);
  const markThreadRead = useMessagesStore((s) => s.markThreadRead);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    markThreadRead(threadId);
  }, [threadId, markThreadRead]);

  if (!thread || !driver) return null;

  const send = (text: string) => {
    if (!text.trim()) return;
    sendMessage(threadId, driver.id, "text", { text: text.trim() });
    setDraft("");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <ScreenHeader title={thread.shipmentNumber ?? "Conversation"} subtitle={thread.participants.find((p) => p.role !== "driver")?.name} />

      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1, justifyContent: "flex-end" }}
        renderItem={({ item }) => <MessageBubble message={item} isMine={item.senderId === driver.id} />}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }} className="mb-2">
        {QUICK_REPLIES.map((reply) => (
          <Pressable
            key={reply}
            accessibilityRole="button"
            onPress={() => send(reply)}
            className="px-3.5 py-2 rounded-full bg-bg-elevated-2 border border-border active:opacity-70"
          >
            <Text className="text-text-primary text-[13px] font-medium">{reply}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        className="flex-row items-center px-4 pt-2 border-t border-border-subtle gap-2"
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message"
          placeholderTextColor={color.textTertiary}
          className="flex-1 h-11 bg-bg-elevated border border-border rounded-full px-4 text-text-primary text-[15px]"
          accessibilityLabel="Message input"
          onSubmitEditing={() => send(draft)}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          onPress={() => send(draft)}
          disabled={!draft.trim()}
          className={["h-11 w-11 rounded-full items-center justify-center", draft.trim() ? "bg-brand" : "bg-bg-elevated-2"].join(" ")}
        >
          <Ionicons name="send" size={18} color={draft.trim() ? "#FFFFFF" : color.textTertiary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
