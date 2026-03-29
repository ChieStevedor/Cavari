import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SummaryCard from '../components/SummaryCard'
import SegmentBadge from '../components/SegmentBadge'
import ScoreBar from '../components/ScoreBar'
import ScoreChangeIndicator from '../components/ScoreChangeIndicator'
import TriggeredActionsQueue from '../components/TriggeredActionsQueue'
import { getAllLatestScores, supabase } from '../lib/supabase'

const TIERS    = ['atelier', 'studio', 'associate', 'prospect']
const SEGMENTS = ['luminaire', 'rising', 'dormant', 'cold']
const GEOS     = ['nyc_la', 'major_secondary', 'other_major', 'secondary']
const PROJ_TYPES = ['residential', 'commercial', 'hospitality', 'mixed']

const GEO_LABELS = {
  nyc_la: 'NYC / LA', major_secondary: 'Toronto / Chicago / Miami',
  other_major: 'Other major', secondary: 'Secondary',
}

const SORT_OPTIONS = [
  { value: 'score_desc',   label: 'Score ↓' },
  { value: 'score_asc',    label: 'Score ↑' },
  { value: 'change_desc',  label: 'Change ↓' },
  { value: 'name_asc',     label: 'Name A–Z' },
]

export default function Dashboard() {
  const navigate = useNavigate()

  const [scores, setScores]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [sortBy, setSortBy]     = useState('score_desc')
  const [filterSegment, setFilterSegment] = useState('')
  const [filterTier, setFilterTier]       = useState('')
  const [searchTerm, setSearchTerm]       = useState('')

  // Fetch previous week's scores for change calculation
  const [prevScores, setPrevScores] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const current = await getAllLatestScores()
        setScores(current)

        // Fetch previous score (2nd most recent per member) for change indicator
        // We pull all scores from the last 14 days and take the penultimate per member
        const since = new Date()
        since.setDate(since.getDate() - 14)
        const { data: hist } = await supabase
          .from('scores')
          .select('member_id, total_score, calculated_at')
          .gte('calculated_at', since.toISOString())
          .order('calculated_at', { ascending: false })
        if (hist) {
          // For each member, skip the first (latest) and take the second
          const byMember = {}
          hist.forEach(row => {
            if (!byMember[row.member_id]) {
              byMember[row.member_id] = { skip: true }
            } else if (byMember[row.member_id].skip) {
              byMember[row.member_id] = row
            }
          })
          setPrevScores(Object.values(byMember).filter(r => r.total_score != null))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const prevMap = useMemo(() => {
    return Object.fromEntries(prevScores.map(s => [s.member_id, s.total_score]))
  }, [prevScores])

  const enriched = useMemo(() => scores.map(s => ({
    ...s,
    change: prevMap[s.member_id] != null
      ? s.total_score - prevMap[s.member_id]
      : null,
  })), [scores, prevMap])

  // Summary stats
  const totalActive   = enriched.length
  const luminaireCount = enriched.filter(s => s.segment === 'luminaire').length
  const risingCount    = enriched.filter(s => s.change != null && s.change >= 10).length
  const atRiskCount    = enriched.filter(s => s.change != null && s.change <= -15).length

  // Filter + sort
  const filtered = useMemo(() => {
    let rows = enriched
    if (searchTerm)     rows = rows.filter(s =>
      (s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studio_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (filterSegment)  rows = rows.filter(s => s.segment === filterSegment)
    if (filterTier)     rows = rows.filter(s => s.trade_tier === filterTier)

    const sorted = [...rows]
    switch (sortBy) {
      case 'score_asc':   sorted.sort((a, b) => a.total_score - b.total_score); break
      case 'change_desc': sorted.sort((a, b) => (b.change ?? 0) - (a.change ?? 0)); break
      case 'name_asc':    sorted.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '')); break
      default:            sorted.sort((a, b) => b.total_score - a.total_score)
    }
    return sorted
  }, [enriched, searchTerm, filterSegment, filterTier, sortBy])

  function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Active members"   value={totalActive} />
        <SummaryCard label="Luminaires"       value={luminaireCount} sub="Score 75+" />
        <SummaryCard label="Rising this week" value={risingCount}    sub="+10 pts or more" />
        <SummaryCard label="At risk"          value={atRiskCount}    sub="−15 pts or more" />
      </div>

      {/* Main grid: table + actions */}
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-5">
        {/* Score table */}
        <div className="card p-0 overflow-hidden">
          {/* Table toolbar */}
          <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name or studio…"
              className="input flex-1 min-w-[160px] max-w-xs py-2"
            />
            <select value={filterSegment} onChange={e => setFilterSegment(e.target.value)} className="select w-auto py-2">
              <option value="">All segments</option>
              {SEGMENTS.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select value={filterTier} onChange={e => setFilterTier(e.target.value)} className="select w-auto py-2">
              <option value="">All tiers</option>
              {TIERS.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="select w-auto py-2">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <p className="text-stone text-sm font-sans animate-pulse">Loading members…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center px-4">
              <p className="text-stone text-sm font-sans">
                {enriched.length === 0
                  ? "No members yet — add your first designer to begin scoring."
                  : "No members match these filters. Try broadening your search."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {['Name', 'Studio', 'Tier', 'Score', 'Segment', 'Change', 'Updated', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-2xs font-sans tracking-widest uppercase text-stone font-normal whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(member => (
                    <tr
                      key={member.member_id}
                      onClick={() => navigate(`/members/${member.member_id}`)}
                      className="border-b border-border/50 table-row-hover"
                    >
                      <td className="px-4 py-3 font-sans text-ivory whitespace-nowrap font-medium">
                        {member.full_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-stone whitespace-nowrap">
                        {member.studio_name || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-2xs font-sans tracking-widest uppercase text-stone">
                          {member.trade_tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-medium text-ivory w-7 text-right shrink-0">
                            {member.total_score}
                          </span>
                          <ScoreBar score={member.total_score} className="w-16 shrink-0" height={4} />
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <SegmentBadge segment={member.segment} />
                      </td>
                      <td className="px-4 py-3">
                        <ScoreChangeIndicator change={member.change} />
                      </td>
                      <td className="px-4 py-3 text-stone text-xs whitespace-nowrap">
                        {formatDate(member.calculated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/members/${member.member_id}`) }}
                          className="text-2xs font-sans tracking-widest uppercase text-stone hover:text-gold transition-colors"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Triggered actions queue */}
        <div className="mt-5 lg:mt-0">
          <TriggeredActionsQueue />
        </div>
      </div>
    </div>
  )
}
