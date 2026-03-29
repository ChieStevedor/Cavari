import React from 'react'

/**
 * Shows ↑12 in green, ↓8 in red, or — in grey for no change.
 */
export default function ScoreChangeIndicator({ change }) {
  if (change == null || change === 0) {
    return <span className="text-stone text-xs font-sans">—</span>
  }
  if (change > 0) {
    return (
      <span className="text-rising text-xs font-sans font-medium flex items-center gap-0.5">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
        {change}
      </span>
    )
  }
  return (
    <span className="text-red-400 text-xs font-sans font-medium flex items-center gap-0.5">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      </svg>
      {Math.abs(change)}
    </span>
  )
}
