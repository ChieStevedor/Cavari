/**
 * Cavari Specifier Score — Scoring Algorithm
 *
 * Score = Category 1 (25) + Category 2 (25) + Category 3 (35) + Category 4 (15)
 *
 * To adjust weights, edit the WEIGHTS and multiplier constants below.
 * Never hardcode these values inline — all configuration lives here.
 */

// ── Weight targets (must sum to 100) ─────────────────────────────────────────
export const WEIGHTS = {
  firmographic:  25,  // Category 1
  engagement:    25,  // Category 2
  specification: 35,  // Category 3
  relationship:  15,  // Category 4
}

// ── Total portfolio brand count (used for coverage ratio calculation) ─────────
// Update this constant as Cavari adds new brands to its portfolio.
export const TOTAL_PORTFOLIO_BRANDS = 12

// ── Firmographic multipliers ──────────────────────────────────────────────────
const FIRMO_MULT = {
  firm_size:          3,
  project_type:       3,
  geography:          2,
  years_in_practice:  1,
}

// Maximum raw firmographic score (used for normalisation)
const FIRMO_MAX =
  4 * FIRMO_MULT.firm_size +
  4 * FIRMO_MULT.project_type +
  4 * FIRMO_MULT.geography +
  4 * FIRMO_MULT.years_in_practice  // = 36

// ── Engagement multipliers ────────────────────────────────────────────────────
const ENG_MULT = {
  email_open_rate:      3,
  link_clicks:          3,
  trade_page_revisits:  2,
  outreach_response:    1,
}

const ENG_MAX =
  3 * ENG_MULT.email_open_rate +
  3 * ENG_MULT.link_clicks +
  3 * ENG_MULT.trade_page_revisits +
  4 * ENG_MULT.outreach_response  // = 31

// ── Specification multipliers ─────────────────────────────────────────────────
const SPEC_MULT = {
  projects_registered: 2,
  orders_placed:       3,
  total_order_value:   3,
  brand_coverage:      2,
  days_to_first_order: 2,
  order_value_trend:   1,
}

const SPEC_MAX =
  3 * SPEC_MULT.projects_registered +
  5 * SPEC_MULT.orders_placed +
  5 * SPEC_MULT.total_order_value +
  3 * SPEC_MULT.brand_coverage +
  4 * SPEC_MULT.days_to_first_order +
  3 * SPEC_MULT.order_value_trend  // = 57

// ── Relationship caps ─────────────────────────────────────────────────────────
const RELATIONSHIP_CAP   = 15
const RELATIONSHIP_FLOOR = 0

// ── Point lookups ─────────────────────────────────────────────────────────────

function firmSizePoints(value) {
  const map = { solo: 1, small: 2, mid: 3, large: 4 }
  return map[value] ?? 0
}

function projectTypePoints(value) {
  const map = { residential: 2, commercial: 2, hospitality: 4, mixed: 3 }
  return map[value] ?? 0
}

function geographyPoints(value) {
  const map = { nyc_la: 4, major_secondary: 3, other_major: 2, secondary: 1 }
  return map[value] ?? 0
}

function yearsPoints(value) {
  const map = { less_2: 1, two_5: 2, five_10: 3, ten_plus: 4 }
  return map[value] ?? 0
}

function emailOpenRatePoints(rate) {
  if (rate >= 0.60) return 3
  if (rate >= 0.30) return 2
  if (rate >= 0.10) return 1
  return 0
}

function linkClicksPoints(clicks) {
  if (clicks >= 10) return 3
  if (clicks >= 4)  return 2
  if (clicks >= 1)  return 1
  return 0
}

function revisitPoints(revisits) {
  if (revisits >= 5) return 3
  if (revisits >= 2) return 2
  if (revisits >= 1) return 1
  return 0
}

function outreachPoints(response) {
  const map = { none: 0, replied: 2, positive: 4 }
  return map[response] ?? 0
}

function projectsRegisteredPoints(count) {
  if (count >= 4) return 3
  if (count >= 2) return 2
  if (count >= 1) return 1
  return 0
}

function ordersPlacedPoints(count) {
  if (count >= 5) return 5
  if (count >= 2) return 4
  if (count >= 1) return 2
  return 0
}

function totalOrderValuePoints(value) {
  if (value >= 50000) return 5
  if (value >= 20000) return 4
  if (value >= 5000)  return 3
  if (value > 0)      return 1
  return 0
}

function brandCoveragePoints(ratio) {
  if (ratio >= 0.70) return 3
  if (ratio >= 0.40) return 2
  if (ratio >= 0.20) return 1
  return 0
}

function daysToFirstOrderPoints(days) {
  if (days === null || days === undefined) return 0
  if (days <= 7)  return 4
  if (days <= 30) return 3
  if (days <= 90) return 2
  return 1
}

function orderTrendPoints(trend) {
  const map = { declining: 0, flat: 1, growing: 3 }
  return map[trend] ?? 0
}

// ── Relationship event values ─────────────────────────────────────────────────
const RELATIONSHIP_EVENT_POINTS = {
  met_in_person:              +4,
  positive_response:          +3,
  referral:                   +5,
  press_mention:              +4,
  dissatisfaction_unresolved: -5,
  dissatisfaction_resolved:   +2,
}

// ── Category scorers ──────────────────────────────────────────────────────────

/**
 * Score Category 1 — Firmographic Potential
 * @param {object} firmo - row from firmographic_data
 * @returns {number} 0–25
 */
export function scoreFirmographic(firmo) {
  if (!firmo) return 0
  const raw =
    firmSizePoints(firmo.firm_size)         * FIRMO_MULT.firm_size +
    projectTypePoints(firmo.project_type)   * FIRMO_MULT.project_type +
    geographyPoints(firmo.geography)        * FIRMO_MULT.geography +
    yearsPoints(firmo.years_in_practice)    * FIRMO_MULT.years_in_practice
  return Math.round((raw / FIRMO_MAX) * WEIGHTS.firmographic)
}

/**
 * Score Category 2 — Engagement Signals
 * @param {object} eng - row from engagement_data
 * @returns {number} 0–25
 */
export function scoreEngagement(eng) {
  if (!eng) return 0
  const raw =
    emailOpenRatePoints(eng.email_open_rate) * ENG_MULT.email_open_rate +
    linkClicksPoints(eng.link_clicks_90d)    * ENG_MULT.link_clicks +
    revisitPoints(eng.trade_page_revisits)   * ENG_MULT.trade_page_revisits +
    outreachPoints(eng.outreach_response)    * ENG_MULT.outreach_response
  return Math.round((raw / ENG_MAX) * WEIGHTS.engagement)
}

/**
 * Score Category 3 — Specification Behaviour
 * @param {object} spec - row from specification_data
 * @returns {number} 0–35
 */
export function scoreSpecification(spec) {
  if (!spec) return 0
  const raw =
    projectsRegisteredPoints(spec.projects_registered) * SPEC_MULT.projects_registered +
    ordersPlacedPoints(spec.orders_placed)              * SPEC_MULT.orders_placed +
    totalOrderValuePoints(spec.total_order_value)       * SPEC_MULT.total_order_value +
    brandCoveragePoints(spec.brand_coverage_ratio)      * SPEC_MULT.brand_coverage +
    daysToFirstOrderPoints(spec.days_to_first_order)    * SPEC_MULT.days_to_first_order +
    orderTrendPoints(spec.order_value_trend)             * SPEC_MULT.order_value_trend
  return Math.round((raw / SPEC_MAX) * WEIGHTS.specification)
}

/**
 * Score Category 4 — Relationship Warmth
 * @param {Array} events - rows from relationship_events
 * @returns {number} 0–15
 */
export function scoreRelationship(events) {
  if (!events || events.length === 0) return 0
  const raw = events.reduce((sum, e) => {
    return sum + (RELATIONSHIP_EVENT_POINTS[e.event_type] ?? 0)
  }, 0)
  return Math.max(RELATIONSHIP_FLOOR, Math.min(RELATIONSHIP_CAP, raw))
}

/**
 * Derive segment label from total score.
 * @param {number} score 0–100
 * @returns {'luminaire'|'rising'|'dormant'|'cold'}
 */
export function deriveSegment(score) {
  if (score >= 75) return 'luminaire'
  if (score >= 50) return 'rising'
  if (score >= 25) return 'dormant'
  return 'cold'
}

/**
 * Calculate the full score for a member.
 *
 * @param {object} firmo         - firmographic_data row (or null)
 * @param {object} eng           - engagement_data row (or null)
 * @param {object} spec          - specification_data row (or null)
 * @param {Array}  events        - relationship_events rows
 * @returns {{
 *   score_firmographic: number,
 *   score_engagement:   number,
 *   score_specification: number,
 *   score_relationship: number,
 *   total_score:        number,
 *   segment:            string,
 * }}
 */
export function calculateScore(firmo, eng, spec, events) {
  const score_firmographic  = scoreFirmographic(firmo)
  const score_engagement    = scoreEngagement(eng)
  const score_specification = scoreSpecification(spec)
  const score_relationship  = scoreRelationship(events)
  const total_score         = score_firmographic + score_engagement + score_specification + score_relationship
  const segment             = deriveSegment(total_score)

  return {
    score_firmographic,
    score_engagement,
    score_specification,
    score_relationship,
    total_score,
    segment,
  }
}
