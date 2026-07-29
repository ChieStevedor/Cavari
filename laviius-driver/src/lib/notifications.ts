import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Push notification setup. Categories match the spec's minimized set:
 * assignment received, schedule changed, dispatcher message, customer
 * update, urgent instruction. Everything else is intentionally NOT pushed
 * — the Action Center is the source of truth for routine workflow state,
 * notifications are reserved for things that need the driver's attention
 * right now, even if the app is backgrounded.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushCategory =
  | "assignment_received"
  | "schedule_changed"
  | "dispatcher_message"
  | "customer_update"
  | "urgent_instruction";

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("urgent", {
      name: "Urgent",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync("default", {
      name: "Updates",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export function addNotificationResponseListener(
  onResponse: (category: PushCategory | undefined, data: Record<string, unknown>) => void
) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    onResponse(data?.category as PushCategory | undefined, data);
  });
}
