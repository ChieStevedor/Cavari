import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { CardSpec } from "../lib/handCards";

const SIZES = {
  normal: { width: 64, height: 92, rankFont: 13, suitCornerFont: 12, suitBigFont: 28 },
  small: { width: 34, height: 48, rankFont: 9, suitCornerFont: 8, suitBigFont: 15 },
};

export default function PlayingCard({ card, size = "normal" }: { card: CardSpec; size?: "normal" | "small" }) {
  const tint = card.color === "red" ? "#D64545" : "#1A1A1A";
  const dims = SIZES[size];
  return (
    <View style={[styles.card, { width: dims.width, height: dims.height }]}>
      <Text style={[styles.cornerRank, { color: tint, fontSize: dims.rankFont, lineHeight: dims.rankFont + 1 }]}>
        {card.rank}
      </Text>
      <Text style={[styles.cornerSuit, { color: tint, fontSize: dims.suitCornerFont, lineHeight: dims.suitCornerFont + 1 }]}>
        {card.suit}
      </Text>
      <Text style={[styles.suitBig, { color: tint, fontSize: dims.suitBigFont }]}>{card.suit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9DCE3",
    alignItems: "center",
    justifyContent: "center",
  },
  cornerRank: { position: "absolute", top: 4, left: 6, fontWeight: "800" },
  cornerSuit: { position: "absolute", top: 17, left: 6 },
  suitBig: { fontWeight: "700" },
});
