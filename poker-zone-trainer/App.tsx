import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { attachAuthListener } from "./src/state/authStore";
import MockModeBanner from "./src/components/MockModeBanner";

export default function App() {
  useEffect(() => {
    attachAuthListener();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <MockModeBanner />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
