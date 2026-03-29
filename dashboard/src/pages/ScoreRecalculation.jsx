import React, { useEffect, useState } from 'react'
import { recalculateAllScores } from '../lib/recalculate'
import { getRecalcLog } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function ScoreRecalculation() {
  const { user } = useAuth()

  const [log, setLog]             = useState([])
  const [logLoading, setLogLoading] = useState(true)
  const [running, setRunning]     = useState(false)
  const [progress, setProgress]   = useState({ current: 0, total: 0 })
  const [lastResult, setLastResult] = useState(null)
  const [error, setError]         = useState('')

  useEffect(() => {
    loadLog()
  }, [])

  async function loadLog() {
    setLogLoading(true)
    try {
      const data = await getRecalcLog(20)
      setLog(data)
    } finally {
      setLogLoading(false)
    }
  }

  async function handleRecalculateAll() {
    setRunning(true)
    setError('')
    setProgress({ current: 0, total: 0 })
    try {
      const result = await recalculateAllScores(user?.id, (current, total) => {
        setProgress({ current, total })
      })
      setLastResult(result)
      await loadLog()
    } catch (err) {
      setError(err.message || 'Recalculation failed.')
    } finally {
      setRunning(false)
    }
  }

  const pct = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  return (
    <div className="max-w-screen-md mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-serif text-ivory text-2xl mb-1">Score Recalculation</h1>
      <p className="text-stone text-sm font-sans mb-8">
        Trigger a full scoring run across all members. New score rows are inserted —
        history is never overwritten.
      </p>

      {/* Recalculate control */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-serif text-ivory text-base mb-0.5">Recalculate all scores</p>
            <p className="text-stone text-xs font-sans">
              Fetches current data for every member, scores them, and evaluates trigger conditions.
            </p>
          </div>
          <button
            onClick={handleRecalculateAll}
            disabled={running}
            className="btn-primary tracking-widest uppercase text-xs disabled:opacity-50 shrink-0"
          >
            {running ? 'Running…' : 'Run now'}
          </button>
        </div>

        {/* Progress bar */}
        {running && progress.total > 0 && (
          <div className="mt-5">
            <div className="flex justify-between text-2xs text-stone font-sans mb-1.5">
              <span>{progress.current} of {progress.total} members</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gold transition-all duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Result */}
        {lastResult && !running && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-rising text-sm font-sans">
              Done — {lastResult.membersUpdated} members updated,{' '}
              {lastResult.actionsGenerated} new actions generated.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 text-red-400 text-sm font-sans">{error}</p>
        )}
      </div>

      {/* Log */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-border">
          <h2 className="font-serif text-ivory text-base">Recalculation log</h2>
        </div>

        {logLoading ? (
          <div className="py-10 text-center">
            <p className="text-stone text-sm font-sans animate-pulse">Loading log…</p>
          </div>
        ) : log.length === 0 ? (
          <div className="py-10 text-center px-4">
            <p className="text-stone text-sm font-sans">
              No recalculations on record yet — run your first one above.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {['Date & time', 'Members updated', 'Actions generated', 'Triggered by'].map(h => (
                  <th key={h} className="px-4 py-3 text-2xs font-sans tracking-widest uppercase text-stone font-normal whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {log.map(row => (
                <tr key={row.id} className="border-b border-border/50">
                  <td className="px-4 py-3 text-ivory font-sans whitespace-nowrap">
                    {new Date(row.calculated_at).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 font-sans text-ivory">{row.members_updated}</td>
                  <td className="px-4 py-3 font-sans text-ivory">{row.actions_generated}</td>
                  <td className="px-4 py-3 text-stone font-sans">
                    {row.admin_users?.name || 'System'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
