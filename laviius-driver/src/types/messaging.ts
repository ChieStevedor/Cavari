export type MessageParticipantRole = "dispatcher" | "carrier_dispatcher" | "internal" | "driver";

export interface MessageParticipant {
  id: string;
  name: string;
  role: MessageParticipantRole;
  avatarUri?: string;
}

export type MessageContentType = "text" | "quick_reply" | "voice" | "photo";

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  contentType: MessageContentType;
  text?: string;
  voiceUri?: string;
  voiceDurationSec?: number;
  photoUri?: string;
  sentAt: string;
  readAt?: string;
  deliveryStatus: "queued" | "sent" | "delivered" | "failed";
}

export interface MessageThread {
  id: string;
  shipmentId?: string; // shipment-specific conversations
  shipmentNumber?: string;
  participants: MessageParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export const QUICK_REPLIES = [
  "On my way",
  "Arrived",
  "Running 15 min late",
  "Loaded, en route",
  "Delivered",
  "Need assistance",
] as const;
