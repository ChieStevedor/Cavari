/**
 * Cavari Specifier Score — Weekly Digest Generator
 *
 * Assembles the digest payload from current score data.
 * The payload is used both to render the preview UI and to build the email.
 */

/**
 * Build the weekly digest data payload.
 *
 * @param {Array} allScores       - rows from member_latest_scores view
 * @param {Array} allPrevScores   - latest scores from the PREVIOUS calculation round
 * @param {Array} pendingActions  - rows from triggered_actions where status = 'pending'
 * @param {Array} allSpecData     - rows from specification_data
 * @param {Array} newMembers      - members created in the last 7 days (with their latest score)
 * @returns {object} digestPayload
 */
export function buildDigestPayload(
  allScores,
  allPrevScores,
  pendingActions,
  allSpecData,
  newMembers,
) {
  const prevMap  = Object.fromEntries(allPrevScores.map(s => [s.member_id, s]))
  const specMap  = Object.fromEntries(allSpecData.map(s => [s.member_id, s]))

  // 1. Top 5 Rising — greatest score gain this week
  const withChange = allScores
    .map(s => ({
      ...s,
      change: s.total_score - (prevMap[s.member_id]?.total_score ?? s.total_score),
    }))
    .filter(s => s.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, 5)

  // 2. Watch list — Luminaires whose score declined
  const watchList = allScores
    .filter(s => s.segment === 'luminaire')
    .map(s => ({
      ...s,
      change: s.total_score - (prevMap[s.member_id]?.total_score ?? s.total_score),
    }))
    .filter(s => s.change < 0)

  // 3. New members worth attention (score > 60)
  const newHighPotential = (newMembers || []).filter(m => m.total_score > 60)

  // 4. Pending action count
  const pendingCount = pendingActions.length

  // 5. Portfolio coverage note — brand least specified across network
  const specArray = allSpecData.filter(s => s.orders_placed > 0)
  const avgCoverage = specArray.length
    ? specArray.reduce((sum, s) => sum + s.brand_coverage_ratio, 0) / specArray.length
    : 0

  return {
    topRising:         withChange,
    watchList,
    newHighPotential,
    pendingCount,
    avgPortfolioCoverage: avgCoverage,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Render the digest as an HTML email string.
 * Uses inline styles for maximum email client compatibility.
 *
 * @param {object} payload - from buildDigestPayload
 * @param {string} dashboardUrl - link back to the dashboard
 * @returns {string} HTML string
 */
export function renderDigestEmail(payload, dashboardUrl = 'https://dashboard.cavari.design') {
  const { topRising, watchList, newHighPotential, pendingCount, avgPortfolioCoverage, generatedAt } = payload
  const weekOf = new Date(generatedAt).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const row = (label, value) => `
    <tr>
      <td style="padding:4px 12px 4px 0;color:#9E9890;font-size:12px;font-family:Jost,sans-serif;">${label}</td>
      <td style="padding:4px 0;color:#F5F3EF;font-size:13px;font-family:Jost,sans-serif;">${value}</td>
    </tr>`

  const sectionTitle = (text) => `
    <h2 style="margin:32px 0 12px;font-family:'Playfair Display',Georgia,serif;font-size:18px;
               color:#C6A87D;font-weight:500;border-bottom:1px solid #2A2A2A;padding-bottom:8px;">
      ${text}
    </h2>`

  const risingRows = topRising.length
    ? topRising.map(m => row(
        `${m.full_name} — ${m.studio_name || '—'}`,
        `${m.total_score} <span style="color:#4A7C59">(+${m.change})</span>`
      )).join('')
    : row('No significant movers this week', '—')

  const watchRows = watchList.length
    ? watchList.map(m => row(
        `${m.full_name}`,
        `${m.total_score} <span style="color:#EF4444">(${m.change})</span>`
      )).join('')
    : row('All Luminaires are holding steady', '—')

  const newRows = newHighPotential.length
    ? newHighPotential.map(m => row(
        `${m.full_name || m.email} — ${m.studio_name || '—'}`,
        `Score: ${m.total_score}`
      )).join('')
    : row('No new high-potential members this week', '—')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Cavari Intelligence — ${weekOf}</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EF;font-family:Jost,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EF;padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0"
             style="background:#0F0F0F;border:1px solid #2A2A2A;">

        <!-- Header -->
        <tr>
          <td style="padding:40px 40px 24px;border-bottom:1px solid #2A2A2A;">
            <p style="margin:0 0 4px;font-family:'Playfair Display',Georgia,serif;
                      font-size:24px;color:#C6A87D;letter-spacing:0.08em;">CAVARI</p>
            <p style="margin:0;font-size:11px;color:#9E9890;letter-spacing:0.2em;
                      text-transform:uppercase;">Intelligence Digest — ${weekOf}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px 40px;">

            ${sectionTitle('This week\'s movers')}
            <table width="100%" cellpadding="0" cellspacing="0">
              ${risingRows}
            </table>

            ${sectionTitle('Watch list')}
            <p style="margin:0 0 8px;font-size:12px;color:#9E9890;font-family:Jost,sans-serif;">
              Luminaires with a score decline
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${watchRows}
            </table>

            ${sectionTitle('New members worth your attention')}
            <table width="100%" cellpadding="0" cellspacing="0">
              ${newRows}
            </table>

            ${sectionTitle('Pending actions')}
            <p style="font-size:14px;color:#F5F3EF;font-family:Jost,sans-serif;margin:0 0 12px;">
              ${pendingCount} action${pendingCount !== 1 ? 's' : ''} waiting in your queue.
            </p>
            <a href="${dashboardUrl}"
               style="display:inline-block;background:#C6A87D;color:#0F0F0F;
                      font-family:Jost,sans-serif;font-size:12px;font-weight:500;
                      letter-spacing:0.1em;text-transform:uppercase;
                      padding:10px 20px;text-decoration:none;">
              Open Dashboard
            </a>

            ${sectionTitle('Portfolio coverage')}
            <p style="font-size:14px;color:#F5F3EF;font-family:Jost,sans-serif;margin:0;">
              Average brand coverage across active specifiers:
              <strong style="color:#C6A87D;">${(avgPortfolioCoverage * 100).toFixed(0)}%</strong>.
              ${avgPortfolioCoverage < 0.4
                ? 'Consider introducing underexposed brands in personal outreach this week.'
                : 'Coverage is healthy — keep encouraging breadth.'}
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #2A2A2A;">
            <p style="margin:0;font-size:11px;color:#9E9890;font-family:Jost,sans-serif;">
              Cavari Intelligence — internal use only. Do not forward.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
