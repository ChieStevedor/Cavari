/**
 * Cavari — Score Recalculation Engine
 *
 * Runs the full scoring pipeline for one or all members:
 *   1. Fetch all relevant data from Supabase
 *   2. Calculate scores via scoring.js
 *   3. Insert new score rows (history preserved)
 *   4. Evaluate triggers and create triggered_actions
 *   5. Log the recalculation run
 */

import {
  getMembers,
  getMemberById,
  getFirmographicData,
  getEngagementData,
  getSpecificationData,
  getRelationshipEvents,
  getLatestScore,
  insertScore,
  insertRecalcLog,
} from './supabase'
import { calculateScore } from './scoring'
import { evaluateTriggers } from './triggers'

/**
 * Recalculate scores for all members.
 *
 * @param {string|null} adminUserId  - for logging
 * @param {function} onProgress     - callback(current, total)
 * @returns {Promise<{ membersUpdated: number, actionsGenerated: number }>}
 */
export async function recalculateAllScores(adminUserId = null, onProgress = null) {
  const members = await getMembers()
  let actionsGenerated = 0

  for (let i = 0; i < members.length; i++) {
    const member = members[i]
    const generated = await recalculateMemberScore(member)
    actionsGenerated += generated
    if (onProgress) onProgress(i + 1, members.length)
  }

  await insertRecalcLog({
    triggered_by:      adminUserId,
    members_updated:   members.length,
    actions_generated: actionsGenerated,
  })

  return { membersUpdated: members.length, actionsGenerated }
}

/**
 * Recalculate score for a single member.
 *
 * @param {object|string} memberOrId  - full member row or just the UUID
 * @returns {Promise<number>} number of triggered actions created
 */
export async function recalculateMemberScore(memberOrId) {
  const member = typeof memberOrId === 'string'
    ? await getMemberById(memberOrId)
    : memberOrId

  const [firmo, eng, spec, events, prevScore] = await Promise.all([
    getFirmographicData(member.id),
    getEngagementData(member.id),
    getSpecificationData(member.id),
    getRelationshipEvents(member.id),
    getLatestScore(member.id),
  ])

  const scoreResult = calculateScore(firmo, eng, spec, events)

  const newScore = await insertScore({
    member_id:            member.id,
    score_firmographic:   scoreResult.score_firmographic,
    score_engagement:     scoreResult.score_engagement,
    score_specification:  scoreResult.score_specification,
    score_relationship:   scoreResult.score_relationship,
    total_score:          scoreResult.total_score,
    segment:              scoreResult.segment,
  })

  const actionsCreated = await evaluateTriggers(member, newScore, prevScore, spec)
  return actionsCreated
}
