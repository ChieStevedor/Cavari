import { describe, expect, it } from "vitest";
import { rangesBaseTable, mqBaseTable, postflopBaseTable } from "./baseTables";
import { judgeRangesDecision } from "./rangesEngine";
import { judgeMqDecision } from "./mqEngine";
import { judgePostflopDecision } from "./postflopEngine";
import { rankedHands, PREMIUM_HANDS } from "./handRank";
import { ACTION_AGGRESSION, HAND_BUCKETS } from "../types/domain";

describe("handRank", () => {
  it("produces all 169 canonical starting hands with no duplicates", () => {
    const hands = rankedHands();
    expect(hands.length).toBe(169);
    expect(new Set(hands.map((h) => h.code)).size).toBe(169);
  });

  it("ranks AA strongest and 72o weakest", () => {
    const hands = rankedHands();
    expect(hands[0].code).toBe("AA");
    expect(hands[hands.length - 1].code).toBe("72o");
  });
});

describe("rangesEngine", () => {
  const table = rangesBaseTable();

  it("never folds a premium hand on open", () => {
    for (const position of ["UTG", "MP", "CO", "BTN"]) {
      for (const hand of PREMIUM_HANDS) {
        expect(judgeRangesDecision(hand, position, table).action).not.toBe("FOLD");
      }
    }
  });

  it("widens the opening range at later position", () => {
    const utgOpens = rankedHands().filter((h) => judgeRangesDecision(h.code, "UTG", table).action === "RAISE").length;
    const btnOpens = rankedHands().filter((h) => judgeRangesDecision(h.code, "BTN", table).action === "RAISE").length;
    expect(btnOpens).toBeGreaterThan(utgOpens);
  });
});

describe("mqEngine", () => {
  const table = mqBaseTable();

  it("never folds a premium hand", () => {
    for (const hand of PREMIUM_HANDS) {
      const { action } = judgeMqDecision({ handCode: hand, position: "UTG", m: 25, playersLeftToAct: 5 }, table);
      expect(action).not.toBe("FOLD");
    }
  });

  it("widens the shove range as M drops", () => {
    const greenShoves = rankedHands().filter(
      (h) => judgeMqDecision({ handCode: h.code, position: "CO", m: 30, playersLeftToAct: 2 }, table).action === "ALL_IN"
    ).length;
    const redShoves = rankedHands().filter(
      (h) => judgeMqDecision({ handCode: h.code, position: "CO", m: 3, playersLeftToAct: 2 }, table).action === "ALL_IN"
    ).length;
    expect(redShoves).toBeGreaterThan(greenShoves);
  });
});

describe("postflopEngine", () => {
  const table = postflopBaseTable();

  it("is never less aggressive in Red than in Green for the same hand bucket", () => {
    for (const bucket of HAND_BUCKETS) {
      const green = judgePostflopDecision(bucket, "GREEN", table);
      const red = judgePostflopDecision(bucket, "RED", table);
      expect(ACTION_AGGRESSION[red.action]).toBeGreaterThanOrEqual(ACTION_AGGRESSION[green.action]);
    }
  });
});
