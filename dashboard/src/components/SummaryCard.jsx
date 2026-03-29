import React from 'react'

export default function SummaryCard({ label, value, sub, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <p className="label">{label}</p>
      <p className="font-serif text-3xl text-ivory mt-1">{value ?? '—'}</p>
      {sub && <p className="text-stone text-xs font-sans mt-1">{sub}</p>}
    </div>
  )
}
