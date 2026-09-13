import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SHOVE_POSITIONS, ShovePosition } from "../types/domain";
import { colors } from "../theme";

const TABLE_WIDTH = 280;
const TABLE_HEIGHT = 180;
const RX = 118;
const RY = 62;
const SEAT_SIZE = 40;
const HERO_SEAT_SIZE = 48;

interface Props {
  heroPosition: ShovePosition;
  /** Module 2 (shove) only. Omit for module 1 (opening ranges) — there's no one
   * folded yet, the pot just hasn't been opened, so every other seat is neutral. */
  playersLeftToAct?: number;
}

/** Direct response to user feedback: naming a position in text meant nothing without
 * seeing where it actually sits at the table. Draws the 9 named seats around an
 * oval, hero's seat fixed at the bottom. In shove mode (playersLeftToAct given):
 * seats before hero dimmed (mq's prompt is always "everyone before you has folded"),
 * up to N seats after hero highlighted as still live. In open mode (module 1): just
 * hero's seat highlighted, everyone else neutral — no one has folded yet. */
export default function ShoveTable({ heroPosition, playersLeftToAct }: Props) {
  const heroIdx = SHOVE_POSITIONS.indexOf(heroPosition);
  const shoveMode = playersLeftToAct !== undefined;
  const stillToActCount = shoveMode ? Math.min(playersLeftToAct, SHOVE_POSITIONS.length - heroIdx - 1) : 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.table}>
        <View style={styles.felt} />
        {SHOVE_POSITIONS.map((pos, i) => {
          const isHero = i === heroIdx;
          const isStillToAct = shoveMode && !isHero && i > heroIdx && i - heroIdx <= stillToActCount;
          const isDimmed = shoveMode && !isHero && !isStillToAct;
          const angle = ((90 + (i - heroIdx) * (360 / SHOVE_POSITIONS.length)) * Math.PI) / 180;
          const size = isHero ? HERO_SEAT_SIZE : SEAT_SIZE;
          const left = TABLE_WIDTH / 2 + RX * Math.cos(angle) - size / 2;
          const top = TABLE_HEIGHT / 2 + RY * Math.sin(angle) - size / 2;

          return (
            <View
              key={pos}
              style={[
                styles.seat,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  left,
                  top,
                  backgroundColor: isHero ? colors.accent : colors.surface,
                  borderColor: isStillToAct ? colors.zoneOrange : colors.border,
                  borderWidth: isStillToAct ? 2 : 1,
                  opacity: isDimmed ? 0.45 : 1,
                },
              ]}
            >
              <Text style={[styles.seatLabel, isHero && styles.seatLabelHero]}>{isHero ? "YOU" : pos}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendText}>You</Text>
        </View>
        {shoveMode ? (
          <>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { borderColor: colors.zoneOrange, borderWidth: 2, backgroundColor: "transparent" }]} />
              <Text style={styles.legendText}>Still to act</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.surface, opacity: 0.45, borderColor: colors.border, borderWidth: 1 }]} />
              <Text style={styles.legendText}>Folded</Text>
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },
  table: { width: TABLE_WIDTH, height: TABLE_HEIGHT },
  felt: {
    position: "absolute",
    left: (TABLE_WIDTH - RX * 2) / 2 + 8,
    top: (TABLE_HEIGHT - RY * 2) / 2 + 8,
    width: RX * 2 - 16,
    height: RY * 2 - 16,
    borderRadius: RY,
    backgroundColor: "#0F2A22",
    borderWidth: 1,
    borderColor: colors.border,
  },
  seat: { position: "absolute", alignItems: "center", justifyContent: "center" },
  seatLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "700" },
  seatLabelHero: { color: colors.background, fontSize: 11, fontWeight: "800" },
  legendRow: { flexDirection: "row", gap: 14, marginTop: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: colors.textMuted, fontSize: 11 },
});
