import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { MOCK_MODE } from "./mockMode";
import { mockBackend } from "./mock/mockBackend";

const extra = Constants.expoConfig?.extra ?? {};
const supabaseUrl = (extra.supabaseUrl as string) ?? "";
const supabaseAnonKey = (extra.supabaseAnonKey as string) ?? "";

function createRealClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

// mockBackend implements only the subset of the SupabaseClient surface this app
// actually calls (see the header comment in mockBackend.ts) — the cast is
// intentional and safe because every call site is under our control.
export const supabase: SupabaseClient = MOCK_MODE ? (mockBackend as unknown as SupabaseClient) : createRealClient();
