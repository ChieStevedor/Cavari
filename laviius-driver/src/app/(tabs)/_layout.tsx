import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { color } from "@/constants/theme";
import { useMessagesStore } from "@/stores/messagesStore";

/** Four tabs, no more — spec is explicit. Home is mission control, Jobs is
 * the full worklist, Messages is shipment + carrier comms, Profile is the
 * driver's own record. */
export default function TabsLayout() {
  const unreadTotal = useMessagesStore((s) => s.threads.reduce((sum, t) => sum + t.unreadCount, 0));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.brand,
        tabBarInactiveTintColor: color.textTertiary,
        tabBarStyle: {
          backgroundColor: color.bgElevated,
          borderTopColor: color.border,
          height: 84,
          paddingTop: 8,
          paddingBottom: 24,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: "Home",
          tabBarIcon: ({ color: c, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={26} color={c} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs/index"
        options={{
          title: "Today's Jobs",
          tabBarIcon: ({ color: c, focused }) => (
            <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={26} color={c} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages/index"
        options={{
          title: "Messages",
          tabBarBadge: unreadTotal > 0 ? unreadTotal : undefined,
          tabBarIcon: ({ color: c, focused }) => (
            <Ionicons name={focused ? "chatbubble" : "chatbubble-outline"} size={24} color={c} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ color: c, focused }) => (
            <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={26} color={c} />
          ),
        }}
      />
    </Tabs>
  );
}
