import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Notifications from "expo-notifications";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../state/authStore";
import { colors, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "PushPermission">;

export default function PushPermissionScreen({ navigation }: Props) {
  const session = useAuthStore((s) => s.session);
  const [requesting, setRequesting] = useState(false);

  // Stamp age_confirmed now that a user row exists — the checkbox itself was
  // confirmed on-device before signup (see AgeGateScreen).
  useEffect(() => {
    if (!session) return;
    void supabase.from("profiles").update({ age_confirmed: true }).eq("id", session.user.id);
  }, [session]);

  const requestAndContinue = async () => {
    if (!session) return;
    setRequesting(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      await supabase
        .from("profiles")
        .update({ push_opt_in: status === "granted" })
        .eq("id", session.user.id);
    } catch (e) {
      console.warn("[push] permission request failed", e);
    } finally {
      setRequesting(false);
      navigation.replace("Onboarding");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stay sharp</Text>
      <Text style={styles.body}>
        Turn on notifications for streak reminders and new content drops. You can change this later in Settings.
      </Text>
      <TouchableOpacity style={styles.button} onPress={requestAndContinue} disabled={requesting}>
        <Text style={styles.buttonText}>Enable notifications</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.replace("Onboarding")}>
        <Text style={styles.skipText}>Not now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: "center" },
  title: { color: colors.text, fontSize: 24, fontWeight: "700", marginBottom: spacing.md },
  body: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: spacing.xl },
  button: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: "700" },
  skipText: { color: colors.textMuted, textAlign: "center", marginTop: spacing.md },
});
