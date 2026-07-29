import "../../global.css";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { queryClient, queryPersister } from "@/api/queryClient";
import { registerBackgroundSync } from "@/lib/offlineSync";
import { registerForPushNotificationsAsync } from "@/lib/notifications";
import { initConnectivityListener } from "@/stores/connectivityStore";
import { initSyncOnReconnect } from "@/stores/syncQueueStore";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubConnectivity = initConnectivityListener();
    const unsubSync = initSyncOnReconnect();
    registerBackgroundSync().catch(() => {});
    registerForPushNotificationsAsync().catch(() => {});

    setIsReady(true);
    SplashScreen.hideAsync().catch(() => {});

    return () => {
      unsubConnectivity();
      unsubSync();
    };
  }, []);

  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: queryPersister }}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0B0F19" } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen
              name="job/[id]/index"
              options={{ presentation: "card" }}
            />
            <Stack.Screen
              name="job/[id]/report-issue"
              options={{ presentation: "modal" }}
            />
          </Stack>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
