import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import type { ModuleId } from "../types/domain";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../state/authStore";
import { useSessionStore } from "../state/sessionStore";
import { fetchScenariosForModule, startModuleSession } from "../lib/api";
import { colors, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

interface ModuleMeta {
  id: ModuleId;
  title: string;
  description: string;
  free: boolean;
}

const MODULES: ModuleMeta[] = [
  { id: "ranges", title: "Positional Ranges", description: "Opening ranges by seat", free: true },
  { id: "mq", title: "M/Q-Ratio", description: "Push/fold by stack depth", free: false },
  { id: "postflop", title: "Postflop by Zone", description: "Stack-zone-driven postflop play", free: false },
];

interface ProgressRow {
  module: ModuleId;
  level: number;
  accuracy_overall: number | null;
}

export default function HomeScreen({ navigation }: Props) {
  const session = useAuthStore((s) => s.session);
  const startSession = useSessionStore((s) => s.startSession);
  const [progress, setProgress] = useState<Record<string, ProgressRow>>({});
  const [loadingModule, setLoadingModule] = useState<ModuleId | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadProgress = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase.from("progress").select("module, level, accuracy_overall").eq("user_id", session.user.id);
    const byModule: Record<string, ProgressRow> = {};
    for (const row of data ?? []) byModule[row.module] = row as ProgressRow;
    setProgress(byModule);
  }, [session]);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProgress();
    setRefreshing(false);
  };

  const selectModule = async (module: ModuleId) => {
    setLoadingModule(module);
    try {
      const gate = await startModuleSession(module);
      if (!gate.allowed) {
        navigation.navigate("Paywall", { module });
        return;
      }
      const scenarios = await fetchScenariosForModule(module, progress[module]?.level ?? 1);
      startSession(module, scenarios);
      navigation.navigate("Session", { module });
    } catch (e) {
      console.warn("[home] failed to start module", e);
    } finally {
      setLoadingModule(null);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Training modules</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <Text style={styles.settingsLink}>Settings</Text>
        </TouchableOpacity>
      </View>

      {MODULES.map((mod) => {
        const p = progress[mod.id];
        return (
          <TouchableOpacity
            key={mod.id}
            style={styles.card}
            onPress={() => selectModule(mod.id)}
            disabled={loadingModule !== null}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>{mod.title}</Text>
              {mod.free ? (
                <Text style={styles.freeBadge}>FREE</Text>
              ) : (
                <Text style={styles.paidBadge}>TRIAL</Text>
              )}
            </View>
            <Text style={styles.cardDescription}>{mod.description}</Text>
            {p ? (
              <Text style={styles.cardStats}>
                Level {p.level}
                {p.accuracy_overall != null ? ` · ${Math.round(p.accuracy_overall * 100)}% accuracy` : ""}
              </Text>
            ) : (
              <Text style={styles.cardStats}>Not started</Text>
            )}
            {loadingModule === mod.id ? <ActivityIndicator style={styles.spinner} color={colors.accent} /> : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: 24, fontWeight: "700" },
  settingsLink: { color: colors.textMuted, fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  freeBadge: { color: colors.accent, fontSize: 11, fontWeight: "700" },
  paidBadge: { color: colors.warning, fontSize: 11, fontWeight: "700" },
  cardDescription: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  cardStats: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
  spinner: { marginTop: spacing.sm },
});
