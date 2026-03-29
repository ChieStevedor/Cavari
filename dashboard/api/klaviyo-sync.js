/**
 * Vercel Serverless Function — POST /api/klaviyo-sync (Phase 2)
 *
 * Proxies Klaviyo API calls to keep the API key server-side.
 * Required env vars: KLAVIYO_API_KEY
 *
 * Request body: { profileId: string }
 * Response: { openRate: number, clickCount: number }
 */

export const config = { runtime: 'edge' }

const KLAVIYO_API_VERSION = '2023-12-15'

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const apiKey = process.env.KLAVIYO_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Klaviyo integration not yet active.' }),
      { status: 503 }
    )
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON.' }), { status: 400 })
  }

  const { profileId } = body
  if (!profileId) {
    return new Response(JSON.stringify({ error: 'profileId is required.' }), { status: 400 })
  }

  const headers = {
    Authorization: `Klaviyo-API-Key ${apiKey}`,
    revision:      KLAVIYO_API_VERSION,
    accept:        'application/json',
  }

  // Fetch profile metrics
  const metricsRes = await fetch(
    `https://a.klaviyo.com/api/profiles/${profileId}/`,
    { headers }
  )

  if (!metricsRes.ok) {
    const errData = await metricsRes.json().catch(() => ({}))
    return new Response(
      JSON.stringify({ error: errData.detail || 'Klaviyo API error.' }),
      { status: metricsRes.status }
    )
  }

  const profileData = await metricsRes.json()
  const attributes  = profileData?.data?.attributes ?? {}

  // Extract engagement metrics from profile properties
  const openRate   = attributes.properties?.email_open_rate ?? 0
  const clickCount = attributes.properties?.link_clicks_90d ?? 0

  return new Response(
    JSON.stringify({ openRate, clickCount }),
    { status: 200 }
  )
}
