/**
 * Vercel Cron Function — GET /api/send-weekly-digest
 * Runs every Monday at 08:00 (configured in vercel.json).
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   RESEND_API_KEY, DIGEST_RECIPIENT
 */

export const config = { runtime: 'edge' }

export default async function handler(req) {
  // Vercel cron calls with GET; protect against manual abuse
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const apiKey      = process.env.RESEND_API_KEY
  const recipient   = process.env.DIGEST_RECIPIENT

  if (!supabaseUrl || !supabaseKey || !apiKey || !recipient) {
    return new Response(JSON.stringify({ error: 'Missing environment variables.' }), { status: 500 })
  }

  // ── Fetch data from Supabase ────────────────────────────────────────────────
  const headers = {
    apikey:        supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  }

  const [scoresRes, actionsRes, specRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/member_latest_scores?select=*`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/triggered_actions?status=eq.pending&select=*`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/specification_data?select=*`, { headers }),
  ])

  const [allScores, pendingActions, specData] = await Promise.all([
    scoresRes.json(),
    actionsRes.json(),
    specRes.json(),
  ])

  // New members in last 7 days
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const newMembersWithScore = allScores.filter(s => s.created_at && new Date(s.created_at) >= weekAgo)

  // Build payload (simplified inline to avoid module imports in edge runtime)
  const topRising = allScores.filter(s => s.segment === 'rising').slice(0, 5)
  const watchList = allScores.filter(s => s.segment === 'luminaire').slice(0, 5)
  const newHighPotential = newMembersWithScore.filter(m => (m.total_score || 0) > 60)
  const avgCoverage = specData.length
    ? specData.reduce((sum, s) => sum + (s.brand_coverage_ratio || 0), 0) / specData.length
    : 0

  const weekOf = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const html = buildEmail({ topRising, watchList, newHighPotential, pendingActions, avgCoverage, weekOf })

  // ── Send via Resend ─────────────────────────────────────────────────────────
  const sendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    'Cavari Intelligence <digest@cavari.design>',
      to:      [recipient],
      subject: `Cavari Intelligence — ${weekOf}`,
      html,
    }),
  })

  const result = await sendRes.json()
  if (!sendRes.ok) {
    return new Response(JSON.stringify({ error: result.message }), { status: 502 })
  }

  return new Response(JSON.stringify({ ok: true, id: result.id }), { status: 200 })
}

function buildEmail({ topRising, watchList, newHighPotential, pendingActions, avgCoverage, weekOf }) {
  const row = (name, detail) =>
    `<tr>
      <td style="padding:4px 16px 4px 0;color:#9E9890;font-size:12px;font-family:Jost,sans-serif;">${name}</td>
      <td style="padding:4px 0;color:#F5F3EF;font-size:13px;font-family:Jost,sans-serif;">${detail}</td>
    </tr>`

  const sec = (title) =>
    `<h2 style="margin:28px 0 10px;font-family:'Playfair Display',Georgia,serif;font-size:17px;
                color:#C6A87D;font-weight:500;border-bottom:1px solid #2A2A2A;padding-bottom:6px;">
       ${title}
     </h2>`

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Cavari — ${weekOf}</title></head>
<body style="margin:0;padding:0;background:#F5F3EF;font-family:Jost,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EF;padding:40px 20px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#0F0F0F;border:1px solid #2A2A2A;">
<tr><td style="padding:40px 40px 24px;border-bottom:1px solid #2A2A2A;">
  <p style="margin:0 0 4px;font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#C6A87D;letter-spacing:0.08em;">CAVARI</p>
  <p style="margin:0;font-size:11px;color:#9E9890;letter-spacing:0.2em;text-transform:uppercase;">Intelligence Digest — ${weekOf}</p>
</td></tr>
<tr><td style="padding:24px 40px 40px;">
  ${sec('This week\'s movers')}
  <table width="100%" cellpadding="0" cellspacing="0">
    ${topRising.length
      ? topRising.map(m => row(m.full_name || m.email, `Score: ${m.total_score}`)).join('')
      : row('No significant movers this week', '—')}
  </table>
  ${sec('Watch list')}
  <table width="100%" cellpadding="0" cellspacing="0">
    ${watchList.length
      ? watchList.map(m => row(m.full_name || m.email, `Score: ${m.total_score}`)).join('')
      : row('All Luminaires are holding steady', '—')}
  </table>
  ${sec('New members worth your attention')}
  <table width="100%" cellpadding="0" cellspacing="0">
    ${newHighPotential.length
      ? newHighPotential.map(m => row(m.full_name || m.email, `Score: ${m.total_score}`)).join('')
      : row('No new high-potential members this week', '—')}
  </table>
  ${sec('Pending actions')}
  <p style="font-size:14px;color:#F5F3EF;font-family:Jost,sans-serif;margin:0 0 12px;">
    ${pendingActions.length} action${pendingActions.length !== 1 ? 's' : ''} waiting in your queue.
  </p>
  ${sec('Portfolio coverage')}
  <p style="font-size:14px;color:#F5F3EF;font-family:Jost,sans-serif;margin:0;">
    Average brand coverage: <strong style="color:#C6A87D;">${(avgCoverage * 100).toFixed(0)}%</strong>.
    ${avgCoverage < 0.4 ? 'Consider introducing underexposed brands in outreach this week.' : 'Coverage is healthy.'}
  </p>
</td></tr>
<tr><td style="padding:16px 40px;border-top:1px solid #2A2A2A;">
  <p style="margin:0;font-size:11px;color:#9E9890;font-family:Jost,sans-serif;">Cavari Intelligence — internal use only.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}
