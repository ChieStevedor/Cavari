import React, { useEffect, useState } from 'react'
import {
  getAllLatestScores,
  getPendingActions,
  supabase,
} from '../lib/supabase'
import { buildDigestPayload, renderDigestEmail } from '../lib/digest'
import { sendDigestEmail } from '../lib/resend'

export default function WeeklyDigest() {
  const [payload, setPayload]   = useState(null)
  const [html, setHtml]         = useState('')
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const [sendMsg, setSendMsg]   = useState('')
  const [sendError, setSendError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        // Current latest scores
        const currentScores = await getAllLatestScores()

        // Previous scores (older than most recent per member)
        const since = new Date()
        since.setDate(since.getDate() - 14)
        const { data: hist } = await supabase
          .from('scores')
          .select('member_id, total_score, calculated_at')
          .gte('calculated_at', since.toISOString())
          .order('calculated_at', { ascending: false })

        const prevMap = {}
        if (hist) {
          hist.forEach(row => {
            if (!prevMap[row.member_id]) {
              prevMap[row.member_id] = { skip: true }
            } else if (prevMap[row.member_id].skip) {
              prevMap[row.member_id] = row
            }
          })
        }
        const prevScores = Object.values(prevMap).filter(r => r.total_score != null)

        // Pending actions
        const pending = await getPendingActions()

        // Spec data for coverage note
        const { data: specData } = await supabase.from('specification_data').select('*')

        // New members in last 7 days with scores
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const newMemberIds = currentScores
          .filter(s => s.created_at && new Date(s.created_at) >= weekAgo)
          .map(s => s.member_id)
        const newMembersWithScore = currentScores.filter(s => newMemberIds.includes(s.member_id))

        const p = buildDigestPayload(
          currentScores,
          prevScores,
          pending,
          specData || [],
          newMembersWithScore,
        )
        setPayload(p)
        setHtml(renderDigestEmail(p))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSend() {
    setSending(true)
    setSendMsg('')
    setSendError('')
    try {
      await sendDigestEmail(html)
      setSendMsg('Digest sent successfully.')
    } catch (err) {
      setSendError(err.message || 'Failed to send digest.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-stone text-sm font-sans animate-pulse">Building digest…</p>
      </div>
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-ivory text-2xl mb-1">Weekly Digest</h1>
          <p className="text-stone text-sm font-sans">
            Preview and send this week's intelligence report. Scheduled every Monday at 08:00.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {sendMsg && <p className="text-rising text-xs font-sans">{sendMsg}</p>}
          {sendError && <p className="text-red-400 text-xs font-sans">{sendError}</p>}
          <button
            onClick={handleSend}
            disabled={sending}
            className="btn-primary tracking-widest uppercase text-xs disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send now'}
          </button>
        </div>
      </div>

      {/* Digest summary stats */}
      {payload && (
        <div className="grid sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Top movers"       value={payload.topRising.length} />
          <StatCard label="On watch list"    value={payload.watchList.length} />
          <StatCard label="New (score 60+)"  value={payload.newHighPotential.length} />
          <StatCard label="Pending actions"  value={payload.pendingCount} />
        </div>
      )}

      {/* Email preview */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <p className="text-stone text-2xs font-sans tracking-widest uppercase">Email preview</p>
          <p className="text-stone text-xs font-sans">
            Sent to <span className="text-ivory">Alex</span> via Resend
          </p>
        </div>
        <div className="overflow-auto max-h-[680px]">
          <iframe
            srcDoc={html}
            title="Digest preview"
            className="w-full border-0"
            style={{ height: 660, minHeight: 400 }}
            sandbox="allow-same-origin"
          />
        </div>
      </div>

      {/* Schedule note */}
      <div className="mt-4 card">
        <p className="text-stone text-xs font-sans">
          <span className="text-ivory">Scheduled delivery:</span>{' '}
          Every Monday at 08:00 via Vercel Cron (<code className="text-gold text-2xs">0 8 * * 1</code>).
          Cron route: <code className="text-gold text-2xs">/api/send-weekly-digest</code>.
          Toggle via the <code className="text-gold text-2xs">vercel.json</code> cron config.
        </p>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="card text-center">
      <p className="font-serif text-2xl text-ivory">{value}</p>
      <p className="label mt-1">{label}</p>
    </div>
  )
}
