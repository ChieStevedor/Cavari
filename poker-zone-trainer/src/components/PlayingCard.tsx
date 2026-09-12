import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { CardSpec } from "../lib/handCards";

export default function PlayingCard({ card }: { card: CardSpec }) {
  const tint = card.color === "red" ? "#D64545" : "#1A1A1A";
  return (
    <View style={styles.card}>
      <Text style={[styles.cornerRank, { color: tint }]}>{card.rank}</Text>
      <Text style={[styles.cornerSuit, { color: tint }]}>{card.suit}</Text>
      <Text style={[styles.suitBig, { color: tint }]}>{card.suit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 64,
    height: 92,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9DCE3",
    alignItems: "center",
    justifyContent: "center",
  },
  cornerRank: { position: "absolute", top: 4, left: 6, fontSize: 13, fontWeight: "800", lineHeight: 14 },
  cornerSuit: { position: "absolute", top: 17, left: 6, fontSize: 12, lineHeight: 13 },
  suitBig: { fontSize: 28, fontWeight: "700" },
});
