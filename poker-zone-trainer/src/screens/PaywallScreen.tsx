import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { purchasePaidModulesPackage, restorePurchases, hasActiveEntitlement } from "../lib/revenuecat";
import { colors, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

export default function PaywallScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  const purchase = async () => {
    setLoading(true);
    try {
      const info = await purchasePaidModulesPackage();
      if (hasActiveEntitlement(info)) {
        navigation.replace("Home");
      }
    } catch (e: any) {
      if (!e?.userCancelled) {
        Alert.alert("Purchase failed", e?.message ?? "Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const restore = async () => {
    setLoading(true);
    try {
      const info = await restorePurchases();
      if (hasActiveEntitlement(info)) {
        navigation.replace("Home");
      } else {
        Alert.alert("Nothing to restore", "No active subscription was found for this account.");
      }
    } catch (e: any) {
      Alert.alert("Restore failed", e?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unlock every module</Text>
      <Text style={styles.body}>
        You've used your free trial sessions for this module. Subscribe to keep training M/Q-ratio and postflop
        decisions with unlimited sessions.
      </Text>

      <TouchableOpacity style={styles.button} onPress={purchase} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Subscribe</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={restore} disabled={loading}>
        <Text style={styles.restoreText}>Restore purchases</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace("Home")}>
        <Text style={styles.backText}>Back to free module</Text>
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
  restoreText: { color: colors.textMuted, textAlign: "center", marginTop: spacing.lg },
  backText: { color: colors.textMuted, textAlign: "center", marginTop: spacing.md, fontSize: 13 },
});
