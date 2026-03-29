/**
 * Cavari — Project Tracker Sync (Phase 3)
 *
 * Pulls specification data from a separate Supabase Project Tracker database.
 * All calls are proxied through /api/tracker-sync to keep service role keys
 * server-side.
 *
 * Gate: requires both VITE_PROJECT_TRACKER_ENABLED=true (set when the
 * /api/tracker-sync route has been configured in Vercel with the correct env
 * vars: PROJECT_TRACKER_SUPABASE_URL and PROJECT_TRACKER_SERVICE_KEY).
 */

export const TRACKER_ENABLED = import.meta.env.VITE_PROJECT_TRACKER_ENABLED === 'true'

/**
 * Sync specification data for a member from the Project Tracker.
 *
 * @param {string} memberId   - Cavari member UUID
 * @param {string} memberEmail
 * @returns {Promise<{
 *   projects_registered: number,
 *   orders_placed: number,
 *   total_order_value: number,
 *   brand_coverage_ratio: number,
 *   days_to_first_order: number|null,
 *   order_value_trend: 'declining'|'flat'|'growing',
 *   data_source: 'supabase_sync'
 * }|{error: string}>}
 */
export async function syncFromProjectTracker(memberId, memberEmail) {
  if (!TRACKER_ENABLED) {
    return { error: 'Project Tracker integration not yet active.' }
  }

  const res = await fetch('/api/tracker-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId, memberEmail }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    return { error: err.error || 'Project Tracker sync failed.' }
  }

  const data = await res.json()
  return { ...data, data_source: 'supabase_sync' }
}
