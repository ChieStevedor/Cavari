import { Redirect } from "expo-router";

import { useAuthStore } from "@/stores/authStore";

/** Auth gate. Expo Router resolves "/" to this file; it never renders
 * anything itself, just redirects to the right entry point. */
export default function Index() {
  const driver = useAuthStore((s) => s.driver);
  const isUnlocked = useAuthStore((s) => s.isUnlocked);

  if (!driver) return <Redirect href="/login" />;
  if (!isUnlocked) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)/home" />;
}
