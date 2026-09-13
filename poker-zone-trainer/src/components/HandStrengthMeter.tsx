import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { HandBucket } from "../types/domain";
import { BUCKET_STRENGTH } from "../engine/postflopEngine";
import { colors } from "../theme";

// Postflop scenarios carry a hand-strength bucket, not two concrete cards — there's
// nothing honest to draw as a hand. This gives it a real visual (a filled meter)
// instead of the bare bucket word users found as confusing as the old hand codes.

const BUCKET_COLOR: Record<HandBucket, string> = {
  PREMIUM: colors.zoneRed,
  STRONG: colors.zoneOrange,
  MEDIUM: colors.zoneYellow,
  WEAK: colors.textMuted,
  DRAW: colors.accent,
};

export default function HandStrengthMeter({ bucket, size = "normal" }: { bucket: HandBucket; size?: "normal" | "small" }) {
  const pct = Math.round(BUCKET_STRENGTH[bucket] * 100);
  const height = size === "small" ? 8 : 14;
  const width = size === "small" ? 90 : 160;

  return (
    <View style={styles.container}>
      <Text style={size === "small" ? styles.labelSmall : styles.label}>{bucket}</Text>
      <View style={[styles.track, { width, height, borderRadius: height / 2 }]}>
        <View
          style={[
            styles.fill,
            { width: `${pct}%`, height, borderRadius: height / 2, backgroundColor: BUCKET_COLOR[bucket] },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  label: { color: colors.text, fontSize: 20, fontWeight: "800", letterSpacing: 1, marginBottom: 6 },
  labelSmall: { color: colors.text, fontSize: 12, fontWeight: "800", letterSpacing: 0.5, marginBottom: 4 },
  track: { backgroundColor: colors.border, overflow: "hidden" },
  fill: {},
});
