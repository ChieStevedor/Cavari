/**
 * Cavari Specifier Score — Trigger Evaluation
 *
 * Called after every score recalculation.
 * For each member, evaluate all trigger conditions against their current and
 * previous score data, and create triggered_actions rows where conditions fire.
 *
 * Deduplication is handled in supabase.insertTriggeredAction — no duplicate
 * pending triggers for the same member + trigger_type.
 */

import { insertTriggeredAction } from './supabase'

// Trigger type identifiers — used for deduplication
export const TRIGGER_TYPES = {
  WARMING_FAST:         'warming_fast',
  GOING_COLD:           'going_cold',
  DORMANT_HIGH_FIRMO:   'dormant_high_firmo',
  FIRST_ORDER:          'first_order',
  NARROW_SPECIFIER:     'narrow_specifier',
  LUMINAIRE_THRESHOLD:  'luminaire_threshold',
  REENGAGEMENT:         'reengagement',
}

/**
 * Evaluate all trigger conditions for a single member and insert any that fire.
 *
 * @param {object} member         - members row
 * @param {object} currentScore   - scores row (just calculated)
 * @param {object|null} prevScore - most recent previous scores row (may be null)
 * @param {object|null} spec      - specification_data row
 * @returns {Promise<number>} count of actions created
 */
export async function evaluateTriggers(member, currentScore, prevScore, spec) {
  const actions = []
  const name = member.full_name

  // T1 — Score increased ≥10 in 7 days
  if (prevScore) {
    const pointsGained = currentScore.total_score - prevScore.total_score
    const daysSincePrev = daysBetween(prevScore.calculated_at, currentScore.calculated_at)
    if (pointsGained >= 10 && daysSincePrev <= 7) {
      actions.push({
        member_id:    member.id,
        trigger_type: TRIGGER_TYPES.WARMING_FAST,
        message:      `${name} is warming fast — a personal note today would land well.`,
      })
    }

    // T2 — Score dropped ≥15 in 14 days
    const pointsLost = prevScore.total_score - currentScore.total_score
    if (pointsLost >= 15 && daysSincePrev <= 14) {
      actions.push({
        member_id:    member.id,
        trigger_type: TRIGGER_TYPES.GOING_COLD,
        message:      `${name} is going cold — consider a sample send or a direct call.`,
      })
    }
  }

  // T3 — Dormant segment AND firmographic score ≥18
  if (
    currentScore.segment === 'dormant' &&
    currentScore.score_firmographic >= 18
  ) {
    actions.push({
      member_id:    member.id,
      trigger_type: TRIGGER_TYPES.DORMANT_HIGH_FIRMO,
      message:      `High-potential designer going quiet — this one is worth a personal reach-out.`,
    })
  }

  // T4 — First order placed (orders_placed changed from 0 to 1 or more)
  if (spec && spec.orders_placed >= 1 && prevScore && prevScore.score_specification === 0) {
    actions.push({
      member_id:    member.id,
      trigger_type: TRIGGER_TYPES.FIRST_ORDER,
      message:      `${name} just converted. Flag for Atelier upgrade conversation in 60 days.`,
    })
  }

  // T5 — Brand coverage < 30% AND ≥3 orders
  if (spec && spec.brand_coverage_ratio < 0.30 && spec.orders_placed >= 3) {
    actions.push({
      member_id:    member.id,
      trigger_type: TRIGGER_TYPES.NARROW_SPECIFIER,
      message:      `${name} is a narrow specifier — introduce an underexposed brand personally.`,
    })
  }

  // T6 — Total score ≥80 (Luminaire threshold)
  if (currentScore.total_score >= 80) {
    actions.push({
      member_id:    member.id,
      trigger_type: TRIGGER_TYPES.LUMINAIRE_THRESHOLD,
      message:      `${name} has reached Luminaire threshold — consider a Fondateur invitation.`,
    })
  }

  // T7 — No orders in 90 days AND previously placed ≥2 orders
  if (spec && spec.orders_placed >= 2) {
    const daysSinceOrder = daysSinceLastOrder(spec)
    if (daysSinceOrder !== null && daysSinceOrder > 90) {
      actions.push({
        member_id:    member.id,
        trigger_type: TRIGGER_TYPES.REENGAGEMENT,
        message:      `${name} hasn't ordered in 90 days — re-engagement recommended.`,
      })
    }
  }

  // Insert (with dedup) and count
  let created = 0
  for (const action of actions) {
    const result = await insertTriggeredAction(action)
    // insertTriggeredAction returns existing row on duplicate — check if new
    if (result && !result._duplicate) created++
  }
  return created
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBetween(dateA, dateB) {
  const a = new Date(dateA)
  const b = new Date(dateB)
  return Math.abs((b - a) / (1000 * 60 * 60 * 24))
}

/**
 * Estimate days since last order using days_to_first_order as a proxy.
 * In Phase 3 this will use the actual last_order_date from the tracker.
 */
function daysSinceLastOrder(spec) {
  // We don't have a direct "last_order_date" in Phase 1.
  // Use updated_at on spec as a rough proxy for when spec data was last synced.
  if (!spec.updated_at) return null
  return daysBetween(spec.updated_at, new Date().toISOString())
}
