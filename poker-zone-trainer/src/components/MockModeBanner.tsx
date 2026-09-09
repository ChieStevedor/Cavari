import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MOCK_MODE } from "../lib/mockMode";
import { colors } from "../theme";

/** Always-visible reminder that Supabase/RevenueCat are mocked — never let this
 * blend in with a real preview. See src/lib/mockMode.ts for how it's detected. */
export default function MockModeBanner() {
  if (!MOCK_MODE) return null;
  return (
    <View style={styles.banner} pointerEvents="none">
      <Text style={styles.text}>MOCK MODE — no real Supabase/RevenueCat, data resets on restart</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.warning,
    paddingVertical: 4,
    zIndex: 999,
  },
  text: {
    color: colors.background,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
});
