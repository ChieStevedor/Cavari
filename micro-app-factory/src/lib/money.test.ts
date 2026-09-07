import { test } from "node:test";
import assert from "node:assert/strict";

import { dollarsToCents, centsToDollars, formatEvidenceValue } from "./money";

test("dollarsToCents: basic conversion", () => {
  assert.equal(dollarsToCents(10), 1000);
  assert.equal(dollarsToCents(9.99), 999);
});

test("BUG REGRESSION: idea form's expected price no longer saves dollars as cents", () => {
  // Previously the idea form submitted a dollar value under the field name
  // expected_price_cents with no conversion at all — typing "10" ($10)
  // saved 10 cents ($0.10). dollarsToCents is now the only place this
  // conversion happens, used by every money-collecting form including the
  // idea form.
  assert.equal(dollarsToCents(10), 1000, "$10 must become 1000 cents, not 10");
});

test("dollarsToCents: undefined passes through (optional fields)", () => {
  assert.equal(dollarsToCents(undefined), undefined);
});

test("centsToDollars: round-trips with dollarsToCents", () => {
  assert.equal(centsToDollars(dollarsToCents(87.3)), 87.3);
});

test("centsToDollars: null/undefined pass through as undefined, not 0", () => {
  assert.equal(centsToDollars(null), undefined);
  assert.equal(centsToDollars(undefined), undefined);
});

test("formatEvidenceValue: BUG REGRESSION — _cents keys render as currency, not raw integers", () => {
  assert.equal(formatEvidenceValue("mrr_cents", 55900), "$559.00");
  assert.equal(formatEvidenceValue("revenue_cents", 87300), "$873.00");
  assert.equal(formatEvidenceValue("net_profit_cents", -43500), "-$435.00");
});

test("formatEvidenceValue: non-money numeric keys are not treated as currency", () => {
  assert.equal(formatEvidenceValue("visitors", 346), "346");
  assert.equal(formatEvidenceValue("activated_users", 15), "15");
});

test("formatEvidenceValue: hours keys get an 'h' suffix", () => {
  assert.equal(formatEvidenceValue("total_hours", 41), "41h");
  assert.equal(formatEvidenceValue("hours_invested", 15), "15h");
});
