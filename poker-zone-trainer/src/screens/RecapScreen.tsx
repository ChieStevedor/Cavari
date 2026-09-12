import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useSessionStore } from "../state/sessionStore";
import { shortContextLabel } from "../lib/scenarioDisplay";
import HandCards from "../components/HandCards";
import { colors, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Recap">;

export default function RecapScreen({ navigation }: Props) {
  const answered = useSessionStore((s) => s.answered);
  const streak = useSessionStore((s) => s.streak);
  const sessionAccuracy = useSessionStore((s) => s.sessionAccuracy);
  const recentErrors = useSessionStore((s) => s.recentErrors);
  const reset = useSessionStore((s) => s.reset);

  const accuracy = sessionAccuracy();
  const errors = recentErrors();

  const finish = () => {
    reset();
    navigation.replace("Home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session complete</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{answered.length}</Text>
          <Text style={styles.statLabel}>Scenarios</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{accuracy != null ? `${Math.round(accuracy * 100)}%` : "—"}</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
      </View>

      {errors.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>Review your misses</Text>
          <FlatList
            data={errors}
            keyExtractor={(item) => item.scenario.id}
            renderItem={({ item }) => (
              <View style={styles.errorRow}>
                <View style={styles.errorHandBlock}>
                  <HandCards hand={item.scenario.hand} size="small" />
                  <Text style={styles.errorContext}>{shortContextLabel(item.scenario)}</Text>
                </View>
                <View style={styles.errorActions}>
                  <Text style={styles.errorChosen}>You: {item.chosenAction.replace("_", " ")}</Text>
                  <Text style={styles.errorCorrect}>
                    {item.scenario.confidence === "borderline" ? "Per this method: " : "Correct: "}
                    {item.scenario.correctAction.replace("_", " ")}
                  </Text>
                </View>
              </View>
            )}
          />
        </>
      ) : (
        <Text style={styles.perfectText}>No misses this session. Well played.</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={finish}>
        <Text style={styles.buttonText}>Back to modules</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { color: colors.text, fontSize: 24, fontWeight: "700", marginBottom: spacing.lg },
  statsRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  statValue: { color: colors.accent, fontSize: 22, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs },
  sectionLabel: { color: colors.text, fontSize: 15, fontWeight: "600", marginBottom: spacing.sm },
  errorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  errorHandBlock: { gap: spacing.xs },
  errorContext: { color: colors.textMuted, fontSize: 12 },
  errorActions: { alignItems: "flex-end" },
  errorChosen: { color: colors.danger, fontSize: 12 },
  errorCorrect: { color: colors.accent, fontSize: 12, marginTop: spacing.xs },
  perfectText: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.lg },
  button: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: spacing.lg },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: "700" },
});
