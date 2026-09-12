import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface Profile {
  id: string;
  age_confirmed: boolean;
  focus: "mtt" | "sng";
  self_selected_level: "novice" | "advanced";
  push_opt_in: boolean;
  onboarding_completed: boolean;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  initializing: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  loadProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  initializing: true,
  setSession: (session) => set({ session, initializing: false }),
  setProfile: (profile) => set({ profile }),
  loadProfile: async () => {
    const userId = get().session?.user.id;
    if (!userId) return;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error) {
      console.warn("[authStore] failed to load profile", error.message);
      return;
    }
    set({ profile: data as Profile });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));

let listenerAttached = false;

/** Call once at app root to keep the store in sync with Supabase auth state. */
export function attachAuthListener(): void {
  if (listenerAttached) return;
  listenerAttached = true;

  supabase.auth.getSession().then(({ data }) => {
    useAuthStore.getState().setSession(data.session);
    if (data.session) void useAuthStore.getState().loadProfile();
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session);
    if (session) void useAuthStore.getState().loadProfile();
  });
}
