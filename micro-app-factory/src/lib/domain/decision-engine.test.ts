import { test } from "node:test";
import assert from "node:assert/strict";

import { recommendForProduct, recommendForValidation } from "./decision-engine";
import type { ProductPnl } from "./pnl";

function pnl(overrides: Partial<ProductPnl>): ProductPnl {
  return {
    grossRevenueCents: 0,
    refundsCents: 0,
    netRevenueCents: 0,
    totalCostCents: 0,
    totalHours: 0,
    netProfitCents: 0,
    profitPerHourCents: null,
    revenuePerHourCents: null,
    mrrCents: 0,
    monthlyOperatingCostCents: 0,
    breakEven: { status: "unknown" },
    ...overrides,
  };
}

test("REGRESSION: PixelJournal's exact acceptance-test numbers still recommend KILL", () => {
  const result = recommendForProduct(
    { visitors: 346, users: 138, activatedUsers: 15, returningUsers: 0, checkoutStarts: 5, purchases: 0, revenueCents: 0 },
    pnl({ totalHours: 41, netProfitCents: -43500, mrrCents: 0, profitPerHourCents: -1061 }),
  );
  assert.equal(result.recommendation, "KILL");
});

test("REGRESSION: TeamPulse's exact acceptance-test numbers still recommend SCALE", () => {
  const result = recommendForProduct(
    { visitors: 1060, users: 480, activatedUsers: 350, returningUsers: 259, checkoutStarts: 183, purchases: 104, revenueCents: 86800 },
    pnl({ totalHours: 52, netProfitCents: 72300, mrrCents: 55900, profitPerHourCents: 1390 }),
  );
  assert.equal(result.recommendation, "SCALE");
});

test("BUG REGRESSION: 346 visitors / 10 activated / $0 revenue / -$435 / 41h is KILL, not INSUFFICIENT_DATA or ITERATE", () => {
  // This is the exact hypothetical from the acceptance test that used to
  // return CONTINUE_VALIDATING ("not enough data") with 0 returning users,
  // and ITERATE with 2 returning users — despite the underlying economics
  // (real traffic, real losses, zero revenue) not changing at all.
  const totals = {
    visitors: 346,
    users: 138,
    activatedUsers: 10, // below the 15-activation kill threshold on purpose
    returningUsers: 0,
    checkoutStarts: 5,
    purchases: 0,
    revenueCents: 0,
  };
  const productPnl = pnl({ totalHours: 41, netProfitCents: -43500 });

  const withoutReturners = recommendForProduct(totals, productPnl);
  assert.equal(withoutReturners.recommendation, "KILL");
  assert.equal(withoutReturners.reasonCodes[0], "negative_economics_after_investment");

  const withTwoReturners = recommendForProduct({ ...totals, returningUsers: 2 }, productPnl);
  assert.equal(
    withTwoReturners.recommendation,
    "KILL",
    "2 incidental returning users must not flip a losing product to ITERATE",
  );
});

test("INSUFFICIENT_DATA: a brand-new product with little traffic and little time invested", () => {
  const result = recommendForProduct(
    { visitors: 8, users: 3, activatedUsers: 1, returningUsers: 0, checkoutStarts: 0, purchases: 0, revenueCents: 0 },
    pnl({ totalHours: 2 }),
  );
  assert.equal(result.recommendation, "INSUFFICIENT_DATA");
});

test("INSUFFICIENT_DATA gate is crossed by hours alone, even with few visitors", () => {
  const result = recommendForProduct(
    { visitors: 5, users: 2, activatedUsers: 0, returningUsers: 0, checkoutStarts: 0, purchases: 0, revenueCents: 0 },
    pnl({ totalHours: 15 }),
  );
  assert.notEqual(result.recommendation, "INSUFFICIENT_DATA");
});

test("exactly 1 positive signal (weak retention only) is ITERATE, not SCALE", () => {
  const result = recommendForProduct(
    // activatedUsers kept below the 15-user monetization-kill threshold and
    // totalHours below the 20h economics-kill threshold, so only the
    // signal-counting path is being exercised here.
    { visitors: 200, users: 80, activatedUsers: 10, returningUsers: 6, checkoutStarts: 10, purchases: 0, revenueCents: 0 },
    pnl({ totalHours: 15, mrrCents: 0, profitPerHourCents: null }),
  );
  assert.equal(result.recommendation, "ITERATE");
});

test("exactly 3 positive signals cross the SCALE bar", () => {
  const result = recommendForProduct(
    { visitors: 200, users: 80, activatedUsers: 30, returningUsers: 10, checkoutStarts: 10, purchases: 5, revenueCents: 5000 },
    pnl({ totalHours: 15, mrrCents: 2000, profitPerHourCents: 50, netProfitCents: 1000 }),
  );
  // signals: everCollectedRevenue=true, currentMrr=true, realRetention=true(10>=5),
  // profitableUnitEconomics=true(mrr>0 && profitPerHour>0) => 4/4, well past the bar
  assert.equal(result.recommendation, "SCALE");
});

test("2 positive signals fall just short of SCALE and land on ITERATE", () => {
  const result = recommendForProduct(
    // revenue ever collected + current mrr = 2 signals; retention below floor, unprofitable
    { visitors: 200, users: 80, activatedUsers: 30, returningUsers: 2, checkoutStarts: 10, purchases: 3, revenueCents: 3000 },
    pnl({ totalHours: 15, mrrCents: 1000, profitPerHourCents: -50, netProfitCents: -200 }),
  );
  assert.equal(result.recommendation, "ITERATE");
});

test("recommendForValidation is unchanged: purchases still mean BUILD", () => {
  const result = recommendForValidation({
    visitors: 330,
    signups: 62,
    activatedUsers: 43,
    returningUsers: 13,
    checkoutStarts: 24,
    purchases: 16,
    revenueCents: 14400,
    costCents: 2000,
    hours: 13,
  });
  assert.equal(result.recommendation, "BUILD");
});
