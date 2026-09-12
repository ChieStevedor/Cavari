import React from "react";
import { StyleSheet, Text, View } from "react-native";
import PlayingCard from "./PlayingCard";
import { cardsForHandCode } from "../lib/handCards";
import { colors } from "../theme";

export default function HandCards({ hand }: { hand: string }) {
  const cards = cardsForHandCode(hand);
  if (!cards) {
    // Postflop module scenarios carry a hand-strength bucket label (PREMIUM,
    // STRONG, ...), not a concrete two-card hand — nothing to draw as cards.
    return <Text style={styles.bucketLabel}>{hand}</Text>;
  }
  return (
    <View style={styles.row}>
      <PlayingCard card={cards[0]} />
      <PlayingCard card={cards[1]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  bucketLabel: { color: colors.text, fontSize: 32, fontWeight: "800", letterSpacing: 1 },
});
