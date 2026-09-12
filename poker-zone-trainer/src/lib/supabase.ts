import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";

const extra = Constants.expoConfig?.extra ?? {};
const supabaseUrl = (extra.supabaseUrl as string) ?? "";
const supabaseAnonKey = (extra.supabaseAnonKey as string) ?? "";

if (!supabaseUrl || supabaseUrl.includes("PLACEHOLDER")) {
  console.warn(
    "[supabase] SUPABASE_URL is not configured — set it in app.json `expo.extra` " +
      "or via EAS build secrets before running against a real backend."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
