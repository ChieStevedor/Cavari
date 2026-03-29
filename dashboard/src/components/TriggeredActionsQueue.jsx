import React, { useState, useEffect } from 'react'
import { getPendingActions, updateActionStatus } from '../lib/supabase'

export default function TriggeredActionsQueue() {
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const data = await getPendingActions()
      setActions(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleAction(id, status) {
    await updateActionStatus(id, status)
    setActions(prev => prev.filter(a => a.id !== id))
  }

  if (loading) {
    return (
      <div className="card">
        <p className="text-stone text-xs font-sans tracking-widest uppercase animate-pulse">
          Loading actions…
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="font-serif text-ivory text-base mb-4">
        Recommended Actions
        {actions.length > 0 && (
          <span className="ml-2 text-xs font-sans text-amber bg-amber/10 px-2 py-0.5 rounded-sm">
            {actions.length}
          </span>
        )}
      </h3>

      {actions.length === 0 ? (
        <p className="text-stone text-sm font-sans">
          Nothing pressing right now — the queue is clear.
        </p>
      ) : (
        <div className="space-y-3">
          {actions.map(action => (
            <div
              key={action.id}
              className="border border-amber/20 bg-amber/5 rounded-sm p-3"
            >
              <p className="text-ivory text-sm font-sans leading-relaxed mb-2">
                {action.message}
              </p>
              {action.members && (
                <p className="text-stone text-2xs font-sans tracking-widest uppercase mb-3">
                  {action.members.studio_name || action.members.full_name}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(action.id, 'actioned')}
                  className="text-2xs font-sans tracking-widest uppercase text-gold
                             hover:text-ivory border border-gold/30 hover:border-ivory/30
                             px-3 py-1.5 transition-colors duration-150 rounded-sm"
                >
                  Mark actioned
                </button>
                <button
                  onClick={() => handleAction(action.id, 'dismissed')}
                  className="text-2xs font-sans tracking-widest uppercase text-stone
                             hover:text-ivory px-3 py-1.5 transition-colors duration-150"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
