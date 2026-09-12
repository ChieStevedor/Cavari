import { create } from "zustand";
import type { Action, ModuleId, Scenario } from "../types/domain";

const RECAP_ERROR_LIMIT = 10; // "last 5-10 mistakes" per Rule 5 (recap, not spaced repetition)

export interface AnsweredScenario {
  scenario: Scenario;
  chosenAction: Action;
  isCorrect: boolean;
}

interface SessionState {
  module: ModuleId | null;
  queue: Scenario[];
  index: number;
  answered: AnsweredScenario[];
  streak: number;
  startSession: (module: ModuleId, scenarios: Scenario[]) => void;
  recordAnswer: (scenario: Scenario, chosenAction: Action, isCorrect: boolean) => void;
  currentScenario: () => Scenario | null;
  isFinished: () => boolean;
  recentErrors: () => AnsweredScenario[];
  sessionAccuracy: () => number | null;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  module: null,
  queue: [],
  index: 0,
  answered: [],
  streak: 0,

  startSession: (module, scenarios) => set({ module, queue: scenarios, index: 0, answered: [], streak: 0 }),

  recordAnswer: (scenario, chosenAction, isCorrect) =>
    set((state) => ({
      answered: [...state.answered, { scenario, chosenAction, isCorrect }],
      index: state.index + 1,
      streak: isCorrect ? state.streak + 1 : 0,
    })),

  currentScenario: () => {
    const { queue, index } = get();
    return index < queue.length ? queue[index] : null;
  },

  isFinished: () => {
    const { queue, index } = get();
    return index >= queue.length;
  },

  recentErrors: () => {
    const errors = get().answered.filter((a) => !a.isCorrect);
    return errors.slice(-RECAP_ERROR_LIMIT);
  },

  // Local, at-a-glance session accuracy for the recap screen. This mirrors the
  // server's exclusion rule (Rule 1) by filtering 'borderline' scenarios, but the
  // authoritative accuracy% lives in Supabase `progress` (see Rule 2) — this value
  // is a same-session convenience, not the official stat.
  sessionAccuracy: () => {
    const verified = get().answered.filter((a) => a.scenario.confidence === "verified");
    if (verified.length === 0) return null;
    const correct = verified.filter((a) => a.isCorrect).length;
    return correct / verified.length;
  },

  reset: () => set({ module: null, queue: [], index: 0, answered: [], streak: 0 }),
}));
