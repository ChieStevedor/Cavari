import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { useConnectivityStore } from "@/stores/connectivityStore";
import { useSyncQueueStore } from "@/stores/syncQueueStore";
import type { Message, MessageContentType, MessageThread } from "@/types/messaging";

interface MessagesState {
  threads: MessageThread[];
  messagesByThread: Record<string, Message[]>;
  hydrate: (threads: MessageThread[]) => void;
  sendMessage: (
    threadId: string,
    senderId: string,
    contentType: MessageContentType,
    content: { text?: string; voiceUri?: string; voiceDurationSec?: number; photoUri?: string }
  ) => void;
  markThreadRead: (threadId: string) => void;
}

export const useMessagesStore = create<MessagesState>()(
  persist(
    (set, get) => ({
      threads: [],
      messagesByThread: {},

      hydrate: (threads) => set({ threads }),

      sendMessage: (threadId, senderId, contentType, content) => {
        const online = useConnectivityStore.getState().isOnline;
        const message: Message = {
          id: `msg_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
          threadId,
          senderId,
          contentType,
          sentAt: new Date().toISOString(),
          deliveryStatus: online ? "sent" : "queued",
          ...content,
        };
        set((s) => ({
          messagesByThread: {
            ...s.messagesByThread,
            [threadId]: [...(s.messagesByThread[threadId] ?? []), message],
          },
          threads: s.threads.map((t) =>
            t.id === threadId ? { ...t, lastMessage: message, updatedAt: message.sentAt } : t
          ),
        }));
        useSyncQueueStore.getState().enqueue({
          type: "message_sent",
          shipmentId: get().threads.find((t) => t.id === threadId)?.shipmentId ?? "",
          payload: { threadId, messageId: message.id, contentType, ...content },
        });
      },

      markThreadRead: (threadId) => {
        set((s) => ({
          threads: s.threads.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t)),
        }));
      },
    }),
    {
      name: "laviius-driver-messages",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
