import { test } from "node:test";
import assert from "node:assert/strict";

import { computeProductPnl } from "./pnl";
import type { Expense, Metric, TimeEntry } from "@/lib/supabase/types";

function metric(overrides: Partial<Metric>): Metric {
  return {
    id: "m1",
    owner_id: "o1",
    product_id: "p1",
    date: new Date().toISOString().slice(0, 10),
    visitors: 0,
    users: 0,
    activated_users: 0,
    returning_users: 0,
    checkout_starts: 0,
    purchases: 0,
    revenue_cents: 0,
    refunds_cents: 0,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: "e1",
    owner_id: "o1",
    product_id: "p1",
    date: new Date().toISOString().slice(0, 10),
    category: "hosting",
    amount_cents: 0,
    description: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

test("P1.6: breakEven is 'unknown' when no expenses have ever been logged, not a bare null", () => {
  const pnl = computeProductPnl([metric({ revenue_cents: 0 })], [], []);
  assert.deepEqual(pnl.breakEven, { status: "unknown" });
});

test("P1.6 BUG REGRESSION: real expenses + $0 MRR is 'not_yet_profitable', not 'unknown'", () => {
  // Exact PixelJournal shape: real spend, real traffic, zero revenue.
  const pnl = computeProductPnl(
    [metric({ revenue_cents: 0, refunds_cents: 0 })],
    [expense({ amount_cents: 43500 })],
    [],
  );
  assert.deepEqual(pnl.breakEven, { status: "not_yet_profitable" });
});

test("P1.6: positive MRR against real costs computes an actual break-even month figure", () => {
  const today = new Date().toISOString().slice(0, 10);
  const pnl = computeProductPnl(
    [metric({ date: today, revenue_cents: 55900 })],
    [expense({ date: today, amount_cents: 9500 })],
    [] as TimeEntry[],
  );
  assert.equal(pnl.breakEven.status, "computed");
  if (pnl.breakEven.status === "computed") {
    assert.ok(Math.abs(pnl.breakEven.months - 9500 / 55900) < 1e-9);
  }
});
