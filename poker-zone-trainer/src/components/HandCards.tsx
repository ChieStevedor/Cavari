import React from "react";
import { StyleSheet, View } from "react-native";
import PlayingCard from "./PlayingCard";
import HandStrengthMeter from "./HandStrengthMeter";
import { cardsForHandCode } from "../lib/handCards";
import { HAND_BUCKETS, HandBucket } from "../types/domain";

function isHandBucket(value: string): value is HandBucket {
  return (HAND_BUCKETS as string[]).includes(value);
}

export default function HandCards({ hand, size = "normal" }: { hand: string; size?: "normal" | "small" }) {
  const cards = cardsForHandCode(hand);
  if (!cards) {
    // Postflop module scenarios carry a hand-strength bucket (PREMIUM, STRONG, ...),
    // not a concrete two-card hand — shown as a strength meter instead of cards.
    if (isHandBucket(hand)) return <HandStrengthMeter bucket={hand} size={size} />;
    return null;
  }
  return (
    <View style={styles.row}>
      <PlayingCard card={cards[0]} size={size} />
      <PlayingCard card={cards[1]} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
});
