import React from 'react'

const SEGMENT_CONFIG = {
  luminaire: {
    label: 'Luminaire',
    className: 'bg-luminaire/10 text-luminaire border border-luminaire/30',
  },
  rising: {
    label: 'Rising',
    className: 'bg-rising/10 text-rising border border-rising/30',
  },
  dormant: {
    label: 'Dormant',
    className: 'bg-dormant/10 text-dormant border border-dormant/30',
  },
  cold: {
    label: 'Cold',
    className: 'bg-cold/10 text-cold border border-cold/30',
  },
}

export default function SegmentBadge({ segment, className = '' }) {
  const config = SEGMENT_CONFIG[segment] ?? SEGMENT_CONFIG.cold
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-2xs font-sans font-medium
                  tracking-widest uppercase rounded-sm ${config.className} ${className}`}
    >
      {config.label}
    </span>
  )
}
