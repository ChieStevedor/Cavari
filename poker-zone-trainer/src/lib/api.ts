import { supabase } from "./supabase";
import type { Action, ModuleId, Scenario } from "../types/domain";

const SESSION_LENGTH = 15;

// Learning-strategy progression (added 2026-09-13): level 1 sees only clear-cut
// ("verified") scenarios; from this level on, borderline (near-threshold) hands are
// mixed in too. Reuses the existing verified/borderline label as the difficulty axis
// instead of introducing a separate difficulty field. This is a client-side content
// filter, not a difficulty *computation* — the level value itself still comes only
// from `progress` (Rule 2: adaptive difficulty is computed and stored server-side).
const LEVEL_BORDERLINE_UNLOCK = 2;

export interface StartModuleSessionResult {
  allowed: boolean;
  trialRemaining: number | null;
}

/** Server-side gate on module access (free trial count / entitlement). Never
 * decided on-device. */
export async function startModuleSession(module: ModuleId): Promise<StartModuleSessionResult> {
  const { data, error } = await supabase.rpc("start_module_session", { p_module: module });
  if (error) throw error;
  return { allowed: data.allowed, trialRemaining: data.trial_remaining };
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

// Direct response to user feedback: with real opening ranges (UTG opens ~10% of
// hands), a pure random draw from scenario_bank is 80-90% FOLD-correct scenarios —
// statistically honest, but a session that's almost all "obviously fold" teaches
// nothing. Groups by correct_action and round-robins across groups so a session
// gets a reasonable mix of actions instead of mirroring raw hand frequency.
function pickBalancedByAction<T extends { correct_action: string }>(rows: T[], count: number): T[] {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const group = groups.get(row.correct_action);
    if (group) group.push(row);
    else groups.set(row.correct_action, [row]);
  }
  const shuffledGroups = [...groups.values()].map(shuffle);

  const selected: T[] = [];
  let round = 0;
  while (selected.length < count && shuffledGroups.some((g) => round < g.length)) {
    for (const group of shuffledGroups) {
      if (round < group.length) selected.push(group[round]);
      if (selected.length >= count) break;
    }
    round++;
  }
  return shuffle(selected);
}

export async function fetchScenariosForModule(module: ModuleId, level = 1): Promise<Scenario[]> {
  let query = supabase
    .from("scenario_bank")
    .select("id, module, hand, context, zone, correct_action, confidence, timer_seconds")
    .eq("module", module);

  if (level < LEVEL_BORDERLINE_UNLOCK) {
    query = query.eq("confidence", "verified");
  }

  const { data, error } = await query.limit(200);
  if (error) throw error;

  const selected = pickBalancedByAction(data, SESSION_LENGTH);
  return selected.map((row) => ({
    id: row.id,
    module: row.module,
    hand: row.hand,
    context: row.context,
    zone: row.zone ?? undefined,
    correctAction: row.correct_action,
    confidence: row.confidence,
    timerSeconds: row.timer_seconds,
  }));
}

export interface RecordAttemptResult {
  isCorrect: boolean;
  correctAction: Action;
  confidence: "verified" | "borderline";
  didLevelUp: boolean;
  level: number;
  accuracyLast20: number | null;
  accuracyOverall: number | null;
}

/** The ONLY place a scenario is judged — always server-side (see record_attempt SQL
 * function). The client never compares the chosen action to the correct one itself. */
export async function recordAttempt(scenarioId: string, chosenAction: Action): Promise<RecordAttemptResult> {
  const { data, error } = await supabase.rpc("record_attempt", {
    p_scenario_id: scenarioId,
    p_chosen_action: chosenAction,
  });
  if (error) throw error;
  return {
    isCorrect: data.is_correct,
    correctAction: data.correct_action,
    confidence: data.confidence,
    didLevelUp: data.did_level_up,
    level: data.level,
    accuracyLast20: data.accuracy_last_20,
    accuracyOverall: data.accuracy_overall,
  };
}

export async function submitFeedback(scenarioId: string, vote: "up" | "down"): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;
  const { error } = await supabase
    .from("feedback_flags")
    .upsert({ user_id: userId, scenario_id: scenarioId, vote }, { onConflict: "user_id,scenario_id" });
  if (error) throw error;
}

export async function deleteOwnAccount(): Promise<void> {
  const { error } = await supabase.rpc("delete_own_account");
  if (error) throw error;
  await supabase.auth.signOut();
}
