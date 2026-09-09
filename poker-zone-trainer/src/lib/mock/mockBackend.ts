// In-memory mock of the exact Supabase surface this app actually calls (see the
// grep-verified call sites: auth.signUp/signInWithPassword/signOut/getSession/
// getUser/onAuthStateChange, from(table).select/update/upsert/eq/limit/single, and
// rpc('start_module_session' | 'record_attempt' | 'delete_own_account')).
//
// Used only when src/lib/mockMode.ts detects there's no real Supabase project
// configured, so the full app flow can be previewed with zero backend setup. Data
// lives only in this process's memory and resets on every app restart — it is never
// sent anywhere. The RPC handlers below mirror the logic in
// supabase/migrations/0006_rpcs.sql closely enough for a faithful preview, but that
// SQL is the real source of truth; keep them in sync by hand if either changes.

import type { Action, Scenario } from "../../types/domain";
import { generateAllScenarios } from "../../engine/scenarioGenerator";

const SCENARIOS_PER_MODULE_MOCK = 40; // smaller than the real 150-200 for a fast local preview

type Row = Record<string, unknown>;

interface MockAuthUser {
  id: string;
  email?: string;
}
interface MockSession {
  user: MockAuthUser;
}

type AuthListener = (event: string, session: MockSession | null) => void;

function nowIso(): string {
  return new Date().toISOString();
}

class MockQueryBuilder implements PromiseLike<{ data: any; error: { message: string } | null }> {
  private mode: "select" | "update" | "upsert" = "select";
  private payload: Row = {};
  private conflictCols?: string[];
  private filters: [string, unknown][] = [];
  private singleFlag = false;
  private limitN?: number;

  constructor(private rows: Row[], private table: string) {}

  select(_cols: string): this {
    this.mode = "select";
    return this;
  }

  update(payload: Row): this {
    this.mode = "update";
    this.payload = payload;
    return this;
  }

  upsert(payload: Row, opts?: { onConflict?: string }): this {
    this.mode = "upsert";
    this.payload = payload;
    this.conflictCols = opts?.onConflict?.split(",");
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push([column, value]);
    return this;
  }

  limit(n: number): this {
    this.limitN = n;
    return this;
  }

  single(): this {
    this.singleFlag = true;
    return this;
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }

  private matches(row: Row): boolean {
    return this.filters.every(([col, val]) => row[col] === val);
  }

  private async execute(): Promise<{ data: any; error: { message: string } | null }> {
    if (this.mode === "select") {
      let result = this.rows.filter((r) => this.matches(r));
      if (this.limitN != null) result = result.slice(0, this.limitN);
      if (this.singleFlag) {
        const row = result[0];
        return row ? { data: row, error: null } : { data: null, error: { message: `mock: no row in ${this.table}` } };
      }
      return { data: result, error: null };
    }

    if (this.mode === "update") {
      for (const row of this.rows) {
        if (this.matches(row)) Object.assign(row, this.payload);
      }
      return { data: null, error: null };
    }

    // upsert
    const conflictCols = this.conflictCols ?? Object.keys(this.payload).slice(0, 1);
    const existing = this.rows.find((r) => conflictCols.every((c) => r[c] === this.payload[c]));
    if (existing) Object.assign(existing, this.payload);
    else this.rows.push({ ...this.payload });
    return { data: null, error: null };
  }
}

class MockBackend {
  private profiles: Row[] = [];
  private progress: Row[] = [];
  private decisionHistory: Row[] = [];
  private scenarioBank: Row[] = [];
  private moduleTrialUsage: Row[] = [];
  private subscriptions: Row[] = [];
  private feedbackFlags: Row[] = [];
  private users = new Map<string, { id: string; password: string }>();
  private currentSession: MockSession | null = null;
  private listeners: AuthListener[] = [];
  private nextUserId = 1;

  constructor() {
    const scenarios = generateAllScenarios(SCENARIOS_PER_MODULE_MOCK);
    this.scenarioBank = scenarios.map((s: Scenario) => ({
      id: s.id,
      module: s.module,
      hand: s.hand,
      context: s.context,
      zone: s.zone ?? null,
      correct_action: s.correctAction,
      confidence: s.confidence,
      timer_seconds: s.timerSeconds,
    }));
  }

  private notify(event: string) {
    for (const listener of this.listeners) listener(event, this.currentSession);
  }

  private createProfileRow(id: string): Row {
    return {
      id,
      age_confirmed: false,
      focus: "mtt",
      self_selected_level: "novice",
      push_opt_in: false,
      onboarding_completed: false,
      created_at: nowIso(),
    };
  }

  auth = {
    signUp: async ({ email, password }: { email: string; password: string }) => {
      if (this.users.has(email)) {
        return { error: { message: "User already registered" } };
      }
      const id = `mock-user-${this.nextUserId++}`;
      this.users.set(email, { id, password });
      this.profiles.push(this.createProfileRow(id));
      this.currentSession = { user: { id, email } };
      this.notify("SIGNED_IN");
      return { error: null };
    },

    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const user = this.users.get(email);
      if (!user || user.password !== password) {
        return { error: { message: "Invalid login credentials" } };
      }
      this.currentSession = { user: { id: user.id, email } };
      this.notify("SIGNED_IN");
      return { error: null };
    },

    signOut: async () => {
      this.currentSession = null;
      this.notify("SIGNED_OUT");
      return { error: null };
    },

    getSession: async () => ({ data: { session: this.currentSession } }),

    getUser: async () => ({ data: { user: this.currentSession?.user ?? null } }),

    onAuthStateChange: (callback: AuthListener) => {
      this.listeners.push(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.listeners = this.listeners.filter((l) => l !== callback);
            },
          },
        },
      };
    },
  };

  from(table: string): MockQueryBuilder {
    const map: Record<string, Row[]> = {
      profiles: this.profiles,
      progress: this.progress,
      decision_history: this.decisionHistory,
      scenario_bank: this.scenarioBank,
      module_trial_usage: this.moduleTrialUsage,
      subscriptions: this.subscriptions,
      feedback_flags: this.feedbackFlags,
    };
    const rows = map[table];
    if (!rows) throw new Error(`mock backend: unknown table ${table}`);
    return new MockQueryBuilder(rows, table);
  }

  rpc = async (name: string, params: Record<string, unknown> = {}): Promise<{ data: any; error: { message: string } | null }> => {
    const userId = this.currentSession?.user.id;
    if (!userId) return { data: null, error: { message: "mock: not authenticated" } };

    if (name === "start_module_session") {
      return { data: this.startModuleSession(userId, params.p_module as string), error: null };
    }
    if (name === "record_attempt") {
      return { data: this.recordAttempt(userId, params.p_scenario_id as string, params.p_chosen_action as Action), error: null };
    }
    if (name === "delete_own_account") {
      this.deleteOwnAccount(userId);
      return { data: null, error: null };
    }
    return { data: null, error: { message: `mock: unknown rpc ${name}` } };
  };

  private startModuleSession(userId: string, module: string) {
    if (module === "ranges") return { allowed: true, trial_remaining: null };

    const entitled = this.subscriptions.find((s) => s.user_id === userId)?.entitlement_active === true;
    if (entitled) return { allowed: true, trial_remaining: null };

    const TRIAL_LIMIT = 5;
    let usage = this.moduleTrialUsage.find((r) => r.user_id === userId && r.module === module);
    if (!usage) {
      usage = { user_id: userId, module, sessions_used: 0 };
      this.moduleTrialUsage.push(usage);
    }
    const used = usage.sessions_used as number;
    if (used >= TRIAL_LIMIT) return { allowed: false, trial_remaining: 0 };

    usage.sessions_used = used + 1;
    return { allowed: true, trial_remaining: TRIAL_LIMIT - (used + 1) };
  }

  private recordAttempt(userId: string, scenarioId: string, chosenAction: Action) {
    const scenario = this.scenarioBank.find((s) => s.id === scenarioId);
    if (!scenario) throw new Error(`mock: unknown scenario ${scenarioId}`);

    const isCorrect = chosenAction === scenario.correct_action;
    this.decisionHistory.push({
      user_id: userId,
      scenario_id: scenarioId,
      module: scenario.module,
      chosen_action: chosenAction,
      correct_action: scenario.correct_action,
      is_correct: isCorrect,
      confidence: scenario.confidence,
      created_at: nowIso(),
    });

    let progressRow = this.progress.find((p) => p.user_id === userId && p.module === scenario.module);
    if (!progressRow) {
      progressRow = {
        user_id: userId,
        module: scenario.module,
        level: 1,
        accuracy_last_20: null,
        accuracy_overall: null,
        attempts_overall: 0,
        correct_overall: 0,
      };
      this.progress.push(progressRow);
    }

    const recentVerified = this.decisionHistory
      .filter((d) => d.user_id === userId && d.module === scenario.module && d.confidence === "verified")
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, 20);
    const last20Total = recentVerified.length;
    const last20Correct = recentVerified.filter((d) => d.is_correct).length;
    const accuracyLast20 = last20Total > 0 ? last20Correct / last20Total : null;
    const didLevelUp = last20Total >= 20 && (accuracyLast20 ?? 0) >= 0.8;

    if (scenario.confidence === "verified") {
      progressRow.attempts_overall = (progressRow.attempts_overall as number) + 1;
      if (isCorrect) progressRow.correct_overall = (progressRow.correct_overall as number) + 1;
    }
    if (didLevelUp) progressRow.level = (progressRow.level as number) + 1;
    progressRow.accuracy_last_20 = accuracyLast20;
    progressRow.accuracy_overall =
      (progressRow.attempts_overall as number) > 0
        ? (progressRow.correct_overall as number) / (progressRow.attempts_overall as number)
        : null;

    return {
      is_correct: isCorrect,
      correct_action: scenario.correct_action,
      confidence: scenario.confidence,
      did_level_up: didLevelUp,
      level: progressRow.level,
      accuracy_last_20: progressRow.accuracy_last_20,
      accuracy_overall: progressRow.accuracy_overall,
    };
  }

  private deleteOwnAccount(userId: string) {
    this.profiles = this.profiles.filter((r) => r.id !== userId);
    this.progress = this.progress.filter((r) => r.user_id !== userId);
    this.decisionHistory = this.decisionHistory.filter((r) => r.user_id !== userId);
    this.moduleTrialUsage = this.moduleTrialUsage.filter((r) => r.user_id !== userId);
    this.subscriptions = this.subscriptions.filter((r) => r.user_id !== userId);
    this.feedbackFlags = this.feedbackFlags.filter((r) => r.user_id !== userId);
    for (const [email, user] of this.users.entries()) {
      if (user.id === userId) this.users.delete(email);
    }
    this.currentSession = null;
    this.notify("SIGNED_OUT");
  }

  /** Used by the mock RevenueCat layer to flip entitlement state on "purchase". */
  setEntitlement(active: boolean) {
    const userId = this.currentSession?.user.id;
    if (!userId) return;
    let row = this.subscriptions.find((s) => s.user_id === userId);
    if (!row) {
      row = { user_id: userId, entitlement_active: active };
      this.subscriptions.push(row);
    } else {
      row.entitlement_active = active;
    }
  }

  hasEntitlement(): boolean {
    const userId = this.currentSession?.user.id;
    if (!userId) return false;
    return this.subscriptions.find((s) => s.user_id === userId)?.entitlement_active === true;
  }
}

export const mockBackend = new MockBackend();
