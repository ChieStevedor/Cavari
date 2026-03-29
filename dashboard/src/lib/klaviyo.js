/**
 * Cavari — Klaviyo Integration (Phase 2)
 *
 * This module provides the sync function for pulling engagement data from
 * Klaviyo's REST API (v2023-12-15).
 *
 * Gate: if VITE_KLAVIYO_API_KEY is not set, syncFromKlaviyo returns early
 * with an error object — the UI should disable the sync button with a tooltip.
 *
 * Activation: Set VITE_KLAVIYO_API_KEY in your Vercel environment variables.
 * All Klaviyo calls are proxied through /api/klaviyo-sync to keep the key
 * server-side.
 */

export const KLAVIYO_ENABLED = Boolean(import.meta.env.VITE_KLAVIYO_API_KEY)

/**
 * Sync engagement data for a single member from Klaviyo.
 *
 * @param {string} klaviyoProfileId  - member.klaviyo_profile_id
 * @returns {Promise<{
 *   email_open_rate: number,
 *   link_clicks_90d: number,
 *   data_source: 'klaviyo'
 * }|{error: string}>}
 */
export async function syncFromKlaviyo(klaviyoProfileId) {
  if (!KLAVIYO_ENABLED) {
    return { error: 'Klaviyo integration not yet active.' }
  }

  if (!klaviyoProfileId) {
    return { error: 'No Klaviyo profile ID set for this member.' }
  }

  const res = await fetch('/api/klaviyo-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId: klaviyoProfileId }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    return { error: err.error || 'Klaviyo sync failed.' }
  }

  const { openRate, clickCount } = await res.json()

  return {
    email_open_rate: openRate ?? 0,
    link_clicks_90d: clickCount ?? 0,
    data_source: 'klaviyo',
  }
}
