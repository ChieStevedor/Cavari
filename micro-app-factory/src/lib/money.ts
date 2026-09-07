// Shared money representation (P1.7 remediation). Every form that collects
// a dollar amount for a cents-denominated column was re-deriving its own
// `Math.round(x * 100)` conversion — one of them (the idea form's expected
// price field) was missed entirely and saved dollars straight into a cents
// column. This is the one place that conversion happens now.
//
// Display formatting (formatCents, etc.) stays in lib/format.ts — that part
// was already centralized and correct; only the dollars<->cents conversion
// was duplicated.

export function dollarsToCents(dollars: number): number;
export function dollarsToCents(dollars: number | undefined): number | undefined;
export function dollarsToCents(dollars: number | undefined): number | undefined {
  if (dollars === undefined) return undefined;
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number;
export function centsToDollars(cents: number | null | undefined): number | undefined;
export function centsToDollars(cents: number | null | undefined): number | undefined {
  if (cents === null || cents === undefined) return undefined;
  return cents / 100;
}

/**
 * Formats one value out of a decision's evidence JSON for display,
 * inferring intent from the key name. Fixes the confirmed bug where the
 * Decisions page printed raw integers like `55900` for a `mrr_cents` key
 * instead of `$559.00`.
 */
export function formatEvidenceValue(key: string, value: unknown): string {
  if (typeof value !== "number") return String(value);
  if (key.endsWith("_cents")) {
    return (value / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
  }
  if (key.includes("hours")) return `${value}h`;
  return value.toLocaleString("en-US");
}
