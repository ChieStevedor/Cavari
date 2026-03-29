/**
 * Cavari — Resend email sender
 *
 * All email sending goes through Vercel API routes so that the Resend API key
 * is never exposed to the browser.  This module calls those API routes.
 *
 * Environment variables required (server-side, in Vercel):
 *   RESEND_API_KEY      — Resend secret key
 *   DIGEST_RECIPIENT    — Alex's email address
 */

/**
 * Send the weekly digest email via the /api/send-digest route.
 *
 * @param {string} html  - rendered HTML from renderDigestEmail()
 * @param {string} subject
 * @returns {Promise<{id: string}>}
 */
export async function sendDigestEmail(html, subject = 'Cavari Intelligence — Weekly Digest') {
  const res = await fetch('/api/send-digest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, subject }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Failed to send digest email')
  }
  return res.json()
}
