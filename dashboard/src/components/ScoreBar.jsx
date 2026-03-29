import React from 'react'

/**
 * Mini horizontal bar — gold fill on dark background.
 * @param {number} score  0–100
 * @param {number} max    default 100
 */
export default function ScoreBar({ score = 0, max = 100, height = 4, className = '' }) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100))
  return (
    <div
      className={`bg-border rounded-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <div
        className="h-full bg-gold rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/**
 * Stacked bar showing all four category scores.
 */
export function StackedScoreBar({ firmo, engagement, specification, relationship }) {
  const total = (firmo || 0) + (engagement || 0) + (specification || 0) + (relationship || 0)
  const bars = [
    { label: 'Firmographic',  value: firmo,         color: '#C6A87D', max: 25 },
    { label: 'Engagement',    value: engagement,    color: '#4A7C59', max: 25 },
    { label: 'Specification', value: specification, color: '#9E9890', max: 35 },
    { label: 'Relationship',  value: relationship,  color: '#6B7280', max: 15 },
  ]

  return (
    <div>
      <div className="flex h-3 rounded-sm overflow-hidden gap-px">
        {bars.map(bar => (
          <div
            key={bar.label}
            title={`${bar.label}: ${bar.value ?? 0}/${bar.max}`}
            style={{
              width: `${((bar.value || 0) / 100) * 100}%`,
              backgroundColor: bar.color,
              minWidth: (bar.value || 0) > 0 ? 2 : 0,
            }}
          />
        ))}
        {/* Unfilled remainder */}
        <div
          className="flex-1 bg-border"
          style={{ minWidth: total < 100 ? 2 : 0 }}
        />
      </div>
      <div className="flex gap-4 mt-2">
        {bars.map(bar => (
          <div key={bar.label} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: bar.color }}
            />
            <span className="text-2xs text-stone font-sans">
              {bar.label} <span className="text-ivory">{bar.value ?? 0}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
