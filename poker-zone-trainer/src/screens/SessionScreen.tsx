import React, { useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import type { Action } from "../types/domain";
import { useSessionStore } from "../state/sessionStore";
import { answerOptionsFor } from "../lib/answerOptions";
import { recordAttempt, submitFeedback, RecordAttemptResult } from "../lib/api";
import HandCards from "../components/HandCards";
import ShoveTable from "../components/ShoveTable";
import { describeScenario, parseMqContext, chipsForM } from "../lib/scenarioDisplay";
import { GLOSSARY, GlossaryEntry } from "../lib/glossary";
import type { ShovePosition } from "../types/domain";
import { colors, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Session">;

const ZONE_COLOR: Record<string, string> = {
  GREEN: colors.zoneGreen,
  YELLOW: colors.zoneYellow,
  ORANGE: colors.zoneOrange,
  RED: colors.zoneRed,
};

export default function SessionScreen({ navigation }: Props) {
  const currentScenario = useSessionStore((s) => s.currentScenario);
  const isFinished = useSessionStore((s) => s.isFinished);
  const recordAnswer = useSessionStore((s) => s.recordAnswer);

  const scenario = currentScenario();
  const [timeLeft, setTimeLeft] = useState(scenario?.timerSeconds ?? 0);
  const [result, setResult] = useState<RecordAttemptResult | null>(null);
  const [chosenAction, setChosenAction] = useState<Action | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [glossaryEntry, setGlossaryEntry] = useState<GlossaryEntry | null>(null);

  const options = useMemo(() => (scenario ? answerOptionsFor(scenario) : []), [scenario]);
  const display = useMemo(() => (scenario ? describeScenario(scenario) : null), [scenario]);
  const mqInfo = useMemo(
    () => (scenario?.module === "mq" ? parseMqContext(scenario.context) : null),
    [scenario]
  );
  const mqChips = useMemo(() => (mqInfo ? chipsForM(mqInfo.m) : null), [mqInfo]);

  useEffect(() => {
    if (isFinished()) {
      navigation.replace("Recap");
    }
  }, [isFinished, navigation]);

  useEffect(() => {
    if (!scenario || result) return;
    setTimeLeft(scenario.timerSeconds);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario?.id]);

  if (!scenario) return null;

  const handleTimeout = () => {
    // No answer submitted — skipped locally, doesn't hit the server (see design
    // note in the api module: only real submitted answers count toward stats).
    // Shown as "not quite" and advances on Next, same as a wrong answer.
    setChosenAction(options[0]);
    setResult({
      isCorrect: false,
      correctAction: scenario.correctAction,
      confidence: scenario.confidence,
      didLevelUp: false,
      level: 0,
      accuracyLast20: null,
      accuracyOverall: null,
    });
  };

  const submitAnswer = async (action: Action) => {
    if (submitting || result) return;
    setSubmitting(true);
    try {
      const res = await recordAttempt(scenario.id, action);
      setChosenAction(action);
      setResult(res);
    } catch (e) {
      console.warn("[session] failed to record attempt", e);
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (result && chosenAction) {
      recordAnswer(scenario, chosenAction, result.isCorrect);
    }
    setResult(null);
    setChosenAction(null);
    setFeedbackSent(false);
  };

  const sendFeedback = async (vote: "up" | "down") => {
    setFeedbackSent(true);
    try {
      await submitFeedback(scenario.id, vote);
    } catch (e) {
      console.warn("[session] failed to submit feedback", e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>Question {useSessionStore.getState().index + 1}</Text>
        <Text style={[styles.timer, timeLeft <= 3 && styles.timerUrgent]}>{timeLeft}s</Text>
      </View>

      <View style={styles.card}>
        <HandCards hand={scenario.hand} />
        {mqInfo && mqChips ? (
          <>
            <ShoveTable heroPosition={mqInfo.position as ShovePosition} playersLeftToAct={mqInfo.playersLeftToAct} />
            <View style={styles.contextRow}>
              <Text style={styles.context}>
                {`Blinds ${mqChips.sb}/${mqChips.bb} · Pot ${mqChips.pot} · Your stack ~${mqChips.stack}`}
              </Text>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => setGlossaryEntry(GLOSSARY.CHIPS)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.infoIcon}>ⓘ</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
        {scenario.module === "ranges" ? <ShoveTable heroPosition={scenario.context as ShovePosition} /> : null}
        {display?.contextLines.map((line, i) => (
          <View key={i} style={styles.contextRow}>
            <Text style={styles.context}>{line.text}</Text>
            {line.glossaryKey ? (
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => setGlossaryEntry(GLOSSARY[line.glossaryKey!])}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.infoIcon}>ⓘ</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
        {scenario.zone ? (
          <View style={styles.contextRow}>
            <Text style={[styles.zoneBadge, { color: ZONE_COLOR[scenario.zone] }]}>{scenario.zone} ZONE</Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setGlossaryEntry(GLOSSARY.ZONE)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.infoIcon}>ⓘ</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <Modal visible={!!glossaryEntry} transparent animationType="fade" onRequestClose={() => setGlossaryEntry(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTerm}>{glossaryEntry?.term}</Text>
            <Text style={styles.modalExplanation}>{glossaryEntry?.explanation}</Text>
            <TouchableOpacity style={styles.modalClose} onPress={() => setGlossaryEntry(null)}>
              <Text style={styles.modalCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {!result && display ? <Text style={styles.prompt}>{display.prompt}</Text> : null}

      {!result ? (
        <View style={styles.options}>
          {options.map((action) => (
            <TouchableOpacity key={action} style={styles.optionButton} onPress={() => submitAnswer(action)} disabled={submitting}>
              <Text style={styles.optionText}>{action.replace("_", " ")}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.feedback}>
          <Text style={[styles.resultText, { color: result.isCorrect ? colors.accent : colors.danger }]}>
            {result.isCorrect ? "Correct" : "Not quite"}
          </Text>
          <Text style={styles.resultDetail}>
            {result.confidence === "borderline"
              ? `Per this method — ${result.correctAction.replace("_", " ")}`
              : `The correct answer — ${result.correctAction.replace("_", " ")}`}
          </Text>

          {!feedbackSent ? (
            <View style={styles.thumbRow}>
              <Text style={styles.thumbLabel}>This decision looks wrong?</Text>
              <TouchableOpacity onPress={() => sendFeedback("up")}>
                <Text style={styles.thumb}>👍</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => sendFeedback("down")}>
                <Text style={styles.thumb}>👎</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.thanksText}>Thanks for the feedback</Text>
          )}

          <TouchableOpacity style={styles.nextButton} onPress={goNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.lg },
  progressText: { color: colors.textMuted, fontSize: 13 },
  timer: { color: colors.text, fontSize: 16, fontWeight: "700" },
  timerUrgent: { color: colors.danger },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  context: { color: colors.textMuted, fontSize: 15 },
  contextRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm },
  infoButton: { padding: 2 },
  infoIcon: { color: colors.textMuted, fontSize: 15 },
  zoneBadge: { fontSize: 13, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 360,
  },
  modalTerm: { color: colors.text, fontSize: 18, fontWeight: "800", marginBottom: spacing.sm },
  modalExplanation: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  modalClose: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  modalCloseText: { color: colors.background, fontSize: 15, fontWeight: "700" },
  prompt: { color: colors.text, fontSize: 15, textAlign: "center", marginBottom: spacing.md },
  options: { flexDirection: "row", gap: spacing.md, justifyContent: "center" },
  optionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
  },
  optionText: { color: colors.text, fontSize: 16, fontWeight: "700" },
  feedback: { alignItems: "center" },
  resultText: { fontSize: 22, fontWeight: "800", marginBottom: spacing.xs },
  resultDetail: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.lg },
  thumbRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  thumbLabel: { color: colors.textMuted, fontSize: 12, marginRight: spacing.sm },
  thumb: { fontSize: 22 },
  thanksText: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.lg },
  nextButton: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, paddingHorizontal: spacing.xl },
  nextButtonText: { color: colors.background, fontSize: 16, fontWeight: "700" },
});
