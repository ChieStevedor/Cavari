import { test } from "node:test";
import assert from "node:assert/strict";

import {
  maturityForStatus,
  MATURITY_BY_STATUS,
  PRODUCT_PIPELINE_BUCKET,
  ACTIVE_PRODUCT_STATUSES,
  canTransitionProduct,
  canTransitionIdea,
} from "./statuses";

test("maturityForStatus: canonical mapping matches spec ordering (Winner=5, Scale=6)", () => {
  assert.equal(maturityForStatus("BUILDING"), 2);
  assert.equal(maturityForStatus("LAUNCHED"), 3);
  assert.equal(maturityForStatus("MEASURING"), 3);
  assert.equal(maturityForStatus("ITERATING"), 3);
  assert.equal(maturityForStatus("WINNER"), 5);
  assert.equal(maturityForStatus("SCALE"), 6);
});

test("maturityForStatus: KILLED/ARCHIVED intentionally undefined (freeze, don't reset)", () => {
  assert.equal(maturityForStatus("KILLED"), undefined);
  assert.equal(maturityForStatus("ARCHIVED"), undefined);
});

test("MATURITY_BY_STATUS never regresses: every defined value is monotonic with pipeline progress", () => {
  // BUILDING(2) <= LIVE family(3) <= WINNER(5) <= SCALE(6), per the spec's
  // own 5=Winner/6=Scale ordering (not a typical "winner is terminal" scale).
  assert.ok(MATURITY_BY_STATUS.BUILDING! < MATURITY_BY_STATUS.LAUNCHED!);
  assert.ok(MATURITY_BY_STATUS.LAUNCHED! < MATURITY_BY_STATUS.WINNER!);
  assert.ok(MATURITY_BY_STATUS.WINNER! < MATURITY_BY_STATUS.SCALE!);
});

test("PRODUCT_PIPELINE_BUCKET: SCALE is a first-class bucket (regression for the confirmed pipeline bug)", () => {
  assert.equal(PRODUCT_PIPELINE_BUCKET.SCALE, "SCALE");
  assert.equal(PRODUCT_PIPELINE_BUCKET.KILLED, undefined);
  assert.equal(PRODUCT_PIPELINE_BUCKET.ARCHIVED, undefined);
});

test("ACTIVE_PRODUCT_STATUSES includes SCALE", () => {
  assert.ok(ACTIVE_PRODUCT_STATUSES.includes("SCALE"));
});

test("canTransitionProduct: MEASURING -> SCALE and MEASURING -> KILLED both allowed", () => {
  assert.ok(canTransitionProduct("MEASURING", "SCALE"));
  assert.ok(canTransitionProduct("MEASURING", "KILLED"));
});

test("canTransitionProduct: KILLED is terminal except for archiving", () => {
  assert.equal(canTransitionProduct("KILLED", "BUILDING"), false);
  assert.equal(canTransitionProduct("KILLED", "WINNER"), false);
  assert.ok(canTransitionProduct("KILLED", "ARCHIVED"));
});

test("canTransitionIdea: VALIDATING -> APPROVED_TO_BUILD allowed, VALIDATING -> LAUNCHED not", () => {
  assert.ok(canTransitionIdea("VALIDATING", "APPROVED_TO_BUILD"));
  assert.equal(canTransitionIdea("VALIDATING", "LAUNCHED"), false);
});
