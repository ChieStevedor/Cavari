import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

function isPlaceholder(value: unknown): boolean {
  return typeof value !== "string" || value.length === 0 || value.includes("PLACEHOLDER");
}

/**
 * True when there's no real Supabase project configured. Drives an automatic
 * fallback to the in-app mock backend (src/lib/mock/mockBackend.ts) so the full
 * app flow can be previewed without setting up Supabase/RevenueCat first.
 *
 * Explicitly set `expo.extra.mockMode` to `false` in app.json to force the real
 * backend even with placeholder-looking values (e.g. while debugging config), or
 * to `true` to force mock mode even once real credentials are filled in.
 */
export const MOCK_MODE: boolean =
  typeof extra.mockMode === "boolean" ? extra.mockMode : isPlaceholder(extra.supabaseUrl);

if (MOCK_MODE) {
  // eslint-disable-next-line no-console
  console.warn(
    "[mock-mode] No real Supabase project configured — using the in-memory mock backend. " +
      "Data resets on app restart and is never sent anywhere. Set real credentials in " +
      "app.json > expo.extra to use a real backend."
  );
}
