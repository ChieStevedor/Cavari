import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { setAgeGateConfirmed } from "../lib/localFlags";
import { colors, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "AgeGate">;

export default function AgeGateScreen({ navigation }: Props) {
  const [checked, setChecked] = useState(false);

  const handleContinue = async () => {
    if (!checked) return;
    await setAgeGateConfirmed();
    navigation.replace("Auth");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Poker Zone Trainer</Text>
      <Text style={styles.body}>
        This app deals with real-money poker strategy training. You must be 17 or older to continue.
      </Text>

      <TouchableOpacity style={styles.checkboxRow} onPress={() => setChecked((c) => !c)}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <Text style={styles.checkboxLabel}>I confirm I am 17 years of age or older</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !checked && styles.buttonDisabled]}
        disabled={!checked}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: "center" },
  title: { color: colors.text, fontSize: 28, fontWeight: "700", marginBottom: spacing.md },
  body: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: spacing.xl },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.xl },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: colors.background, fontWeight: "700" },
  checkboxLabel: { color: colors.text, fontSize: 15, flex: 1 },
  button: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: "700" },
});
