import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { useAuthStore } from "../state/authStore";
import { getAgeGateConfirmed } from "../lib/localFlags";
import { configureRevenueCat } from "../lib/revenuecat";
import { colors } from "../theme";

import AgeGateScreen from "../screens/AgeGateScreen";
import AuthScreen from "../screens/AuthScreen";
import PushPermissionScreen from "../screens/PushPermissionScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import HomeScreen from "../screens/HomeScreen";
import SessionScreen from "../screens/SessionScreen";
import RecapScreen from "../screens/RecapScreen";
import PaywallScreen from "../screens/PaywallScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export default function RootNavigator() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const initializing = useAuthStore((s) => s.initializing);
  const [ageConfirmed, setAgeConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    void getAgeGateConfirmed().then(setAgeConfirmed);
  }, []);

  useEffect(() => {
    if (session?.user.id) configureRevenueCat(session.user.id);
  }, [session?.user.id]);

  if (initializing || ageConfirmed === null || (session && !profile)) {
    return <LoadingScreen />;
  }

  const screenOptions = { headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerShadowVisible: false };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!session ? (
          <>
            <Stack.Screen name="AgeGate" component={AgeGateScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
          </>
        ) : !profile!.onboarding_completed ? (
          <>
            <Stack.Screen name="PushPermission" component={PushPermissionScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Session" component={SessionScreen} options={{ title: "" }} />
            <Stack.Screen name="Recap" component={RecapScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Paywall" component={PaywallScreen} options={{ title: "" }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
