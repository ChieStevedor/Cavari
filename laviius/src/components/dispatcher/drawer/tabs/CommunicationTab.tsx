"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { MessageSquare, Send } from "lucide-react";
import type { MessageChannel, Shipment } from "@/types/dispatcher";
import { useDispatcher } from "@/lib/dispatcher/store";
import { EmptyState } from "@/components/dispatcher/shared/EmptyState";
import { Avatar } from "@/components/dispatcher/shared/Avatar";
import { formatRelativeTime } from "@/lib/dispatcher/time";
import { cn } from "@/lib/cn";

const CHANNELS: { id: MessageChannel; label: string }[] = [
  { id: "customer", label: "Customer" },
  { id: "carrier", label: "Carrier" },
  { id: "driver", label: "Driver" },
  { id: "internal", label: "Internal" },
];

const messageSchema = z.object({
  body: z.string().trim().min(1, "Message can't be empty.").max(1000),
});
type MessageFormValues = z.infer<typeof messageSchema>;

export function CommunicationTab({ shipment }: { shipment: Shipment }) {
  const { sendMessage } = useDispatcher();
  const [channel, setChannel] = useState<MessageChannel>("customer");
  const { register, handleSubmit, reset } = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { body: "" },
  });

  const thread = shipment.messages.filter((m) => m.channel === channel);

  function onSubmit(values: MessageFormValues) {
    sendMessage(shipment.id, channel, values.body);
    reset();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            onClick={() => setChannel(c.id)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors",
              channel === c.id ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-navy",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="my-4 flex-1 space-y-3">
        {thread.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description={`Start the conversation with the ${channel} on this shipment.`}
            className="py-10"
          />
        ) : (
          thread.map((m) => (
            <div key={m.id} className="flex gap-2.5">
              <Avatar name={m.authorName} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-navy">{m.authorName}</span>
                  <span className="text-xs text-slate-400">{formatRelativeTime(m.timestamp)} ago</span>
                </div>
                <p className="mt-0.5 rounded-lg rounded-tl-none bg-slate-50 px-3 py-2 text-sm text-navy">{m.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2 border-t border-slate-100 pt-3">
        <textarea
          {...register("body")}
          rows={2}
          placeholder={`Message the ${channel}…`}
          className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy placeholder:text-slate-400 focus:border-electric focus:outline-none focus:ring-1 focus:ring-electric"
        />
        <button
          type="submit"
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-electric text-white hover:bg-electric-light"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
