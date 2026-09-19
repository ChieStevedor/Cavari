import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../state/authStore";
import { colors, spacing } from "../theme";

type Focus = "mtt" | "sng";
type Level = "novice" | "advanced";

function OptionCard({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.card, selected && styles.cardSelected]} onPress={onPress}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </TouchableOpacity>
  );
}

export default function OnboardingScreen() {
  const session = useAuthStore((s) => s.session);
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const [focus, setFocus] = useState<Focus>("mtt");
  const [level, setLevel] = useState<Level>("novice");
  const [saving, setSaving] = useState(false);

  const finishOnboarding = async () => {
    if (!session) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({ focus, self_selected_level: level, onboarding_completed: true })
        .eq("id", session.user.id);
      // Reload the store so the root navigator's onboarding_completed check flips
      // and routes into the Home stack — no manual navigation call needed here.
      await loadProfile();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your training</Text>

      <Text style={styles.sectionLabel}>Focus</Text>
      <View style={styles.row}>
        <OptionCard label="MTT" description="Multi-table tournaments" selected={focus === "mtt"} onPress={() => setFocus("mtt")} />
        <OptionCard label="SNG" description="Sit & go" selected={focus === "sng"} onPress={() => setFocus("sng")} />
      </View>

      <Text style={styles.sectionLabel}>Your level</Text>
      <Text style={styles.hint}>
        Paid modules always start at the beginner level and adapt from your real answers — this only affects the free
        module's starting difficulty.
      </Text>
      <View style={styles.row}>
        <OptionCard label="Novice" description="New to tournament strategy" selected={level === "novice"} onPress={() => setLevel("novice")} />
        <OptionCard label="Advanced" description="Comfortable with the basics" selected={level === "advanced"} onPress={() => setLevel("advanced")} />
      </View>

      <TouchableOpacity style={styles.button} onPress={finishOnboarding} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Start training</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: "center" },
  title: { color: colors.text, fontSize: 24, fontWeight: "700", marginBottom: spacing.lg },
  sectionLabel: { color: colors.text, fontSize: 15, fontWeight: "600", marginBottom: spacing.sm },
  hint: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  cardSelected: { borderColor: colors.accent },
  cardLabel: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: spacing.xs },
  cardDescription: { color: colors.textMuted, fontSize: 12 },
  button: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: spacing.md },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: "700" },
});
