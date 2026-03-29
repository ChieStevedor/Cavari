import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getMemberById,
  getFirmographicData,
  getEngagementData,
  getSpecificationData,
  getRelationshipEvents,
  getLatestScore,
  getScoreHistory,
  getMemberActions,
  logRelationshipEvent,
} from '../lib/supabase'
import { recalculateMemberScore } from '../lib/recalculate'
import { useAuth } from '../contexts/AuthContext'
import SegmentBadge from '../components/SegmentBadge'
import { StackedScoreBar } from '../components/ScoreBar'
import ScoreChangeIndicator from '../components/ScoreChangeIndicator'
import Modal from '../components/Modal'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { KLAVIYO_ENABLED, syncFromKlaviyo } from '../lib/klaviyo'
import { TRACKER_ENABLED, syncFromProjectTracker } from '../lib/projectTracker'

const RELATIONSHIP_EVENT_OPTIONS = [
  { value: 'met_in_person',              label: 'Met in person (trade show / showroom / site)' },
  { value: 'positive_response',          label: 'Responded positively to personal outreach' },
  { value: 'referral',                   label: 'Referred another designer to Cavari' },
  { value: 'press_mention',              label: 'Mentioned Cavari to press or brand contact' },
  { value: 'dissatisfaction_unresolved', label: 'Expressed dissatisfaction (unresolved)' },
  { value: 'dissatisfaction_resolved',   label: 'Expressed dissatisfaction (resolved well)' },
]

const EVENT_POINTS = {
  met_in_person:              '+4',
  positive_response:          '+3',
  referral:                   '+5',
  press_mention:              '+4',
  dissatisfaction_unresolved: '−5',
  dissatisfaction_resolved:   '+2',
}

export default function MemberDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [member, setMember]           = useState(null)
  const [firmo, setFirmo]             = useState(null)
  const [eng, setEng]                 = useState(null)
  const [spec, setSpec]               = useState(null)
  const [events, setEvents]           = useState([])
  const [latestScore, setLatestScore] = useState(null)
  const [scoreHistory, setScoreHistory] = useState([])
  const [actions, setActions]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [recalcLoading, setRecalcLoading] = useState(false)

  // Collapsible sections
  const [open, setOpen] = useState({ firmo: false, eng: false, spec: false, rel: false })

  // Log event modal
  const [showEventModal, setShowEventModal] = useState(false)
  const [eventType, setEventType]   = useState('')
  const [eventNotes, setEventNotes] = useState('')
  const [eventLoading, setEventLoading] = useState(false)

  // Sync feedback
  const [syncMsg, setSyncMsg] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [m, f, e, s, ev, score, hist, acts] = await Promise.all([
          getMemberById(id),
          getFirmographicData(id),
          getEngagementData(id),
          getSpecificationData(id),
          getRelationshipEvents(id),
          getLatestScore(id),
          getScoreHistory(id, 12),
          getMemberActions(id),
        ])
        setMember(m)
        setFirmo(f)
        setEng(e)
        setSpec(s)
        setEvents(ev)
        setLatestScore(score)
        setScoreHistory(hist.map(h => ({
          ...h,
          week: new Date(h.calculated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        })))
        setActions(acts)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleRecalculate() {
    setRecalcLoading(true)
    try {
      await recalculateMemberScore(id)
      // Refresh score data
      const [score, hist] = await Promise.all([
        getLatestScore(id),
        getScoreHistory(id, 12),
      ])
      setLatestScore(score)
      setScoreHistory(hist.map(h => ({
        ...h,
        week: new Date(h.calculated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      })))
    } finally {
      setRecalcLoading(false)
    }
  }

  async function handleLogEvent(e) {
    e.preventDefault()
    if (!eventType) return
    setEventLoading(true)
    try {
      const newEvent = await logRelationshipEvent(id, eventType, eventNotes, user?.id)
      setEvents(prev => [newEvent, ...prev])
      setShowEventModal(false)
      setEventType('')
      setEventNotes('')
      // Recalculate after new event
      await handleRecalculate()
    } finally {
      setEventLoading(false)
    }
  }

  async function handleKlaviyoSync() {
    setSyncMsg('Syncing from Klaviyo…')
    const result = await syncFromKlaviyo(member.klaviyo_profile_id)
    if (result.error) {
      setSyncMsg(`Klaviyo: ${result.error}`)
      return
    }
    // Update engagement data and recalculate
    const { upsertEngagementData } = await import('../lib/supabase')
    await upsertEngagementData(id, result)
    const updated = await getEngagementData(id)
    setEng(updated)
    await handleRecalculate()
    setSyncMsg('Klaviyo sync complete.')
    setTimeout(() => setSyncMsg(''), 4000)
  }

  async function handleTrackerSync() {
    setSyncMsg('Syncing from Project Tracker…')
    const result = await syncFromProjectTracker(id, member.email)
    if (result.error) {
      setSyncMsg(`Project Tracker: ${result.error}`)
      return
    }
    const { upsertSpecificationData } = await import('../lib/supabase')
    await upsertSpecificationData(id, result)
    const updated = await getSpecificationData(id)
    setSpec(updated)
    await handleRecalculate()
    setSyncMsg('Project Tracker sync complete.')
    setTimeout(() => setSyncMsg(''), 4000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-stone text-sm font-sans animate-pulse">Loading member…</p>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-stone font-sans">Member not found.</p>
        <Link to="/" className="btn-ghost mt-4 inline-block">← Back to dashboard</Link>
      </div>
    )
  }

  const toggle = key => setOpen(o => ({ ...o, [key]: !o[key] }))

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn-ghost text-xs tracking-widest uppercase mb-6 flex items-center gap-1">
        ← Back
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-serif text-ivory text-2xl">{member.full_name}</h1>
            {latestScore && <SegmentBadge segment={latestScore.segment} />}
          </div>
          <p className="text-stone text-sm font-sans">{member.studio_name || '—'}</p>
          <p className="text-stone text-2xs font-sans tracking-widest uppercase mt-1">{member.trade_tier}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/members/${id}/edit`} className="btn-secondary text-xs tracking-widest uppercase">
            Edit member
          </Link>
          <button
            onClick={handleRecalculate}
            disabled={recalcLoading}
            className="btn-primary text-xs tracking-widest uppercase disabled:opacity-50"
          >
            {recalcLoading ? 'Recalculating…' : 'Recalculate score'}
          </button>
        </div>
      </div>

      {/* Score hero */}
      {latestScore ? (
        <div className="card mb-5">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <div>
              <p className="label">Total score</p>
              <p className="font-serif text-5xl text-gold">{latestScore.total_score}</p>
              <p className="text-stone text-xs font-sans mt-1">
                Last calculated {new Date(latestScore.calculated_at).toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Firmographic', value: latestScore.score_firmographic, max: 25 },
                { label: 'Engagement',   value: latestScore.score_engagement,   max: 25 },
                { label: 'Specification', value: latestScore.score_specification, max: 35 },
                { label: 'Relationship', value: latestScore.score_relationship,  max: 15 },
              ].map(cat => (
                <div key={cat.label}>
                  <p className="font-serif text-xl text-ivory">{cat.value}</p>
                  <p className="text-stone text-2xs font-sans tracking-widest uppercase">{cat.label}</p>
                  <p className="text-stone text-2xs font-sans">/ {cat.max}</p>
                </div>
              ))}
            </div>
          </div>
          <StackedScoreBar
            firmo={latestScore.score_firmographic}
            engagement={latestScore.score_engagement}
            specification={latestScore.score_specification}
            relationship={latestScore.score_relationship}
          />
        </div>
      ) : (
        <div className="card mb-5">
          <p className="text-stone font-sans text-sm">
            No score yet — recalculate to generate an initial score.
          </p>
        </div>
      )}

      {/* Score history chart */}
      {scoreHistory.length > 1 && (
        <div className="card mb-5">
          <p className="label mb-4">Score history — last 12 weeks</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={scoreHistory}>
              <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fill: '#9E9890', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#9E9890', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#161616', border: '1px solid #2A2A2A', borderRadius: 2 }}
                labelStyle={{ color: '#F5F3EF', fontFamily: 'Jost', fontSize: 12 }}
                itemStyle={{ color: '#C6A87D' }}
              />
              <Line
                type="monotone"
                dataKey="total_score"
                stroke="#C6A87D"
                strokeWidth={2}
                dot={{ fill: '#C6A87D', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Left column: data sections */}
        <div className="space-y-3">
          {/* Firmographic */}
          <CollapsibleSection
            label="Firmographic Potential"
            score={latestScore?.score_firmographic}
            maxScore={25}
            open={open.firmo}
            onToggle={() => toggle('firmo')}
            editLink={`/members/${id}/edit#firmographic`}
          >
            {firmo ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <DataItem label="Firm size"         value={firmo.firm_size} />
                <DataItem label="Project type"      value={firmo.project_type} />
                <DataItem label="Geography"         value={firmo.geography} />
                <DataItem label="Years in practice" value={firmo.years_in_practice} />
              </dl>
            ) : (
              <p className="text-stone text-sm font-sans">No firmographic data entered yet.</p>
            )}
          </CollapsibleSection>

          {/* Engagement */}
          <CollapsibleSection
            label="Engagement Signals"
            score={latestScore?.score_engagement}
            maxScore={25}
            open={open.eng}
            onToggle={() => toggle('eng')}
            editLink={`/members/${id}/edit#engagement`}
          >
            {syncMsg && (
              <p className="text-xs font-sans text-amber mb-3">{syncMsg}</p>
            )}
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleKlaviyoSync}
                disabled={!KLAVIYO_ENABLED || !member.klaviyo_profile_id}
                title={!KLAVIYO_ENABLED ? 'Klaviyo integration not yet active.' : ''}
                className="text-2xs font-sans tracking-widest uppercase border border-border
                           text-stone hover:text-ivory hover:border-stone px-3 py-1.5
                           transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
              >
                Sync from Klaviyo
              </button>
            </div>
            {eng ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <DataItem label="Email open rate"    value={`${(eng.email_open_rate * 100).toFixed(0)}%`} />
                <DataItem label="Link clicks (90d)"  value={eng.link_clicks_90d} />
                <DataItem label="Page revisits"      value={eng.trade_page_revisits} />
                <DataItem label="Outreach response"  value={eng.outreach_response} />
                <DataItem label="Data source"        value={eng.data_source} />
              </dl>
            ) : (
              <p className="text-stone text-sm font-sans">No engagement data entered yet.</p>
            )}
          </CollapsibleSection>

          {/* Specification */}
          <CollapsibleSection
            label="Specification Behaviour"
            score={latestScore?.score_specification}
            maxScore={35}
            open={open.spec}
            onToggle={() => toggle('spec')}
            editLink={`/members/${id}/edit#specification`}
          >
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleTrackerSync}
                disabled={!TRACKER_ENABLED}
                title={!TRACKER_ENABLED ? 'Project Tracker integration not yet active.' : ''}
                className="text-2xs font-sans tracking-widest uppercase border border-border
                           text-stone hover:text-ivory hover:border-stone px-3 py-1.5
                           transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
              >
                Sync from Project Tracker
              </button>
            </div>
            {spec ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <DataItem label="Projects registered" value={spec.projects_registered} />
                <DataItem label="Orders placed"       value={spec.orders_placed} />
                <DataItem label="Total order value"   value={`$${Number(spec.total_order_value).toLocaleString()}`} />
                <DataItem label="Brand coverage"      value={`${(spec.brand_coverage_ratio * 100).toFixed(0)}%`} />
                <DataItem label="Days to first order" value={spec.days_to_first_order ?? 'N/A'} />
                <DataItem label="Order trend"         value={spec.order_value_trend} />
                <DataItem label="Data source"         value={spec.data_source} />
              </dl>
            ) : (
              <p className="text-stone text-sm font-sans">No specification data entered yet.</p>
            )}
          </CollapsibleSection>

          {/* Relationship */}
          <CollapsibleSection
            label="Relationship Warmth"
            score={latestScore?.score_relationship}
            maxScore={15}
            open={open.rel}
            onToggle={() => toggle('rel')}
          >
            <button
              onClick={() => setShowEventModal(true)}
              className="btn-primary text-2xs tracking-widest uppercase mb-4"
            >
              + Log event
            </button>
            {events.length === 0 ? (
              <p className="text-stone text-sm font-sans">No relationship events logged yet.</p>
            ) : (
              <div className="space-y-2">
                {events.map(ev => (
                  <div key={ev.id} className="border-l-2 border-gold/30 pl-3 py-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-ivory text-xs font-sans font-medium">
                        {RELATIONSHIP_EVENT_OPTIONS.find(o => o.value === ev.event_type)?.label || ev.event_type}
                      </p>
                      <span className="text-2xs text-gold font-sans">
                        {EVENT_POINTS[ev.event_type]}
                      </span>
                    </div>
                    {ev.notes && <p className="text-stone text-xs font-sans">{ev.notes}</p>}
                    <p className="text-stone text-2xs font-sans mt-0.5">
                      {new Date(ev.logged_at).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>
        </div>

        {/* Right column: actions + orders */}
        <div className="space-y-5">
          {/* Triggered actions for this member */}
          <div className="card">
            <p className="label mb-3">Action history</p>
            {actions.length === 0 ? (
              <p className="text-stone text-sm font-sans">No triggered actions for this member yet.</p>
            ) : (
              <div className="space-y-2">
                {actions.map(a => (
                  <div key={a.id} className="flex gap-3 items-start py-2 border-b border-border/50 last:border-0">
                    <span className={`text-2xs font-sans font-medium px-2 py-0.5 rounded-sm uppercase tracking-widest shrink-0 ${
                      a.status === 'pending'   ? 'bg-amber/10 text-amber' :
                      a.status === 'actioned'  ? 'bg-rising/10 text-rising' :
                      'bg-border text-stone'
                    }`}>
                      {a.status}
                    </span>
                    <p className="text-ivory text-xs font-sans">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="card">
            <p className="label mb-3">Order summary</p>
            {spec ? (
              <dl className="space-y-2">
                <DataItem label="Total order value" value={`$${Number(spec.total_order_value).toLocaleString()}`} />
                <DataItem label="Orders placed"     value={spec.orders_placed} />
                <DataItem label="Brand coverage"    value={`${(spec.brand_coverage_ratio * 100).toFixed(0)}%`} />
                <DataItem label="Value trend"       value={spec.order_value_trend} />
              </dl>
            ) : (
              <p className="text-stone text-sm font-sans">No order data available yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Log event modal */}
      {showEventModal && (
        <Modal title="Log relationship event" onClose={() => setShowEventModal(false)}>
          <form onSubmit={handleLogEvent} className="space-y-4">
            <div>
              <label className="label">Event type</label>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                className="select"
                required
              >
                <option value="">Select an event…</option>
                {RELATIONSHIP_EVENT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label} ({EVENT_POINTS[o.value]})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea
                value={eventNotes}
                onChange={e => setEventNotes(e.target.value)}
                className="input h-24 resize-none"
                placeholder="Add context if useful…"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowEventModal(false)} className="btn-ghost">
                Cancel
              </button>
              <button
                type="submit"
                disabled={eventLoading || !eventType}
                className="btn-primary text-xs tracking-widest uppercase disabled:opacity-50"
              >
                {eventLoading ? 'Logging…' : 'Log event'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function CollapsibleSection({ label, score, maxScore, open, onToggle, editLink, children }) {
  return (
    <div className="card p-0 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-dim/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-serif text-ivory text-sm">{label}</span>
          {score != null && (
            <span className="text-2xs font-sans text-gold">
              {score}<span className="text-stone">/{maxScore}</span>
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-stone transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="pt-4">{children}</div>
          {editLink && (
            <Link
              to={editLink}
              className="mt-4 inline-block text-2xs font-sans tracking-widest uppercase text-stone hover:text-gold transition-colors"
            >
              Edit →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function DataItem({ label, value }) {
  return (
    <div className="flex flex-col">
      <dt className="text-2xs font-sans text-stone tracking-widest uppercase">{label}</dt>
      <dd className="text-ivory text-sm font-sans mt-0.5 capitalize">{value ?? '—'}</dd>
    </div>
  )
}
