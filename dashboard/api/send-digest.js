/**
 * Vercel Serverless Function — POST /api/send-digest
 *
 * Sends the weekly digest email via Resend.
 * Required env vars: RESEND_API_KEY, DIGEST_RECIPIENT
 */

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const apiKey    = process.env.RESEND_API_KEY
  const recipient = process.env.DIGEST_RECIPIENT

  if (!apiKey || !recipient) {
    return new Response(
      JSON.stringify({ error: 'RESEND_API_KEY or DIGEST_RECIPIENT not configured.' }),
      { status: 500 }
    )
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), { status: 400 })
  }

  const { html, subject } = body
  if (!html) {
    return new Response(JSON.stringify({ error: 'Missing html in request body.' }), { status: 400 })
  }

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    'Cavari Intelligence <digest@cavari.design>',
      to:      [recipient],
      subject: subject || 'Cavari Intelligence — Weekly Digest',
      html,
    }),
  })

  const data = await resendRes.json()
  if (!resendRes.ok) {
    return new Response(JSON.stringify({ error: data.message || 'Resend error.' }), { status: 502 })
  }

  return new Response(JSON.stringify({ id: data.id }), { status: 200 })
}
