/**
 * Vercel Serverless Function — POST /api/tracker-sync (Phase 3)
 *
 * Queries the separate Supabase Project Tracker database and returns
 * computed specification data for a given member.
 *
 * Required env vars:
 *   PROJECT_TRACKER_SUPABASE_URL
 *   PROJECT_TRACKER_SERVICE_KEY
 *   TOTAL_PORTFOLIO_BRANDS  (optional — defaults to 12)
 *
 * Request body: { memberId: string, memberEmail: string }
 */

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const trackerUrl = process.env.PROJECT_TRACKER_SUPABASE_URL
  const trackerKey = process.env.PROJECT_TRACKER_SERVICE_KEY

  if (!trackerUrl || !trackerKey) {
    return new Response(
      JSON.stringify({ error: 'Project Tracker integration not yet active.' }),
      { status: 503 }
    )
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON.' }), { status: 400 })
  }

  const { memberId, memberEmail } = body
  if (!memberId && !memberEmail) {
    return new Response(JSON.stringify({ error: 'memberId or memberEmail required.' }), { status: 400 })
  }

  const TOTAL_BRANDS = parseInt(process.env.TOTAL_PORTFOLIO_BRANDS || '12', 10)

  const headers = {
    apikey:        trackerKey,
    Authorization: `Bearer ${trackerKey}`,
    'Content-Type': 'application/json',
  }

  // Query projects from tracker (assumes a "projects" table with designer_email + brand)
  const projectsRes = await fetch(
    `${trackerUrl}/rest/v1/projects?designer_email=eq.${encodeURIComponent(memberEmail)}&select=*`,
    { headers }
  )

  if (!projectsRes.ok) {
    return new Response(
      JSON.stringify({ error: 'Failed to query Project Tracker.' }),
      { status: 502 }
    )
  }

  const projects = await projectsRes.json()

  // Compute specification fields
  const projectsRegistered = projects.length
  const orders = projects.filter(p => p.order_placed)
  const ordersPlaced = orders.length
  const totalOrderValue = orders.reduce((sum, p) => sum + (p.order_value || 0), 0)

  // Brand coverage: distinct brands ordered / total portfolio brands
  const distinctBrands = new Set(orders.map(p => p.brand_id).filter(Boolean))
  const brandCoverageRatio = TOTAL_BRANDS > 0 ? distinctBrands.size / TOTAL_BRANDS : 0

  // Days to first order
  const orderDates = orders
    .map(p => p.order_date)
    .filter(Boolean)
    .map(d => new Date(d))
    .sort((a, b) => a - b)
  const memberCreatedAt = orders[0]?.designer_created_at
  let daysToFirstOrder = null
  if (orderDates.length > 0 && memberCreatedAt) {
    daysToFirstOrder = Math.round(
      (orderDates[0] - new Date(memberCreatedAt)) / (1000 * 60 * 60 * 24)
    )
  }

  // Order value trend: compare last 3 vs previous 3
  let orderValueTrend = 'flat'
  if (orders.length >= 6) {
    const sorted = [...orders].sort((a, b) => new Date(a.order_date) - new Date(b.order_date))
    const prev3  = sorted.slice(-6, -3).reduce((s, p) => s + (p.order_value || 0), 0) / 3
    const last3  = sorted.slice(-3).reduce((s, p) => s + (p.order_value || 0), 0) / 3
    if (last3 > prev3 * 1.1)      orderValueTrend = 'growing'
    else if (last3 < prev3 * 0.9) orderValueTrend = 'declining'
  }

  return new Response(
    JSON.stringify({
      projects_registered:  projectsRegistered,
      orders_placed:        ordersPlaced,
      total_order_value:    totalOrderValue,
      brand_coverage_ratio: brandCoverageRatio,
      days_to_first_order:  daysToFirstOrder,
      order_value_trend:    orderValueTrend,
    }),
    { status: 200 }
  )
}
