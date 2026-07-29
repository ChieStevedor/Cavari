import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { mockDriver } from "@/api/mockData";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";

/**
 * Session entry point. Returning drivers with biometrics enrolled unlock
 * with Face ID / Touch ID / fingerprint in one tap — no password typing
 * before a shift. First-time sign-in is a stand-in for the carrier SSO
 * flow (out of scope here; this app receives drivers already provisioned
 * by the Carrier Portal).
 */
export default function LoginScreen() {
  const driver = useAuthStore((s) => s.driver);
  const isUnlocked = useAuthStore((s) => s.isUnlocked);
  const isBiometricEnrolled = useAuthStore((s) => s.isBiometricEnrolled);
  const signIn = useAuthStore((s) => s.signIn);
  const unlock = useAuthStore((s) => s.unlock);
  const setBiometricEnrolled = useAuthStore((s) => s.setBiometricEnrolled);
  const insets = useSafeAreaInsets();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attemptBiometricUnlock = async () => {
    setError(null);
    setIsAuthenticating(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        setError("Biometrics not available on this device.");
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Laviius Driver",
        cancelLabel: "Cancel",
      });
      if (result.success) unlock();
      else setError("Authentication failed. Try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    if (driver && isBiometricEnrolled) {
      attemptBiometricUnlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (driver && isUnlocked) return <Redirect href="/(tabs)/home" />;

  return (
    <View className="flex-1 bg-bg items-center justify-center px-8" style={{ paddingTop: insets.top }}>
      <View className="h-24 w-24 rounded-3xl bg-brand items-center justify-center mb-6">
        <Ionicons name="cube" size={44} color="#FFFFFF" />
      </View>
      <Text className="text-text-primary text-[26px] font-bold mb-1">Laviius Driver</Text>
      <Text className="text-text-secondary text-[15px] text-center mb-10">Commercial freight, done right.</Text>

      {error ? <Text className="text-danger text-[13px] mb-4 text-center">{error}</Text> : null}

      {driver && isBiometricEnrolled ? (
        <Button
          label="Unlock with Face ID"
          icon={<Ionicons name="scan-outline" size={18} color="#FFFFFF" />}
          onPress={attemptBiometricUnlock}
          loading={isAuthenticating}
          fullWidth
        />
      ) : (
        <Button
          label="Sign In"
          onPress={async () => {
            signIn(mockDriver, "mock-session-token");
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (hasHardware && isEnrolled) setBiometricEnrolled(true);
          }}
          fullWidth
        />
      )}
    </View>
  );
}
