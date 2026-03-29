import React, { useEffect } from 'react'

export default function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }) {
  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`card w-full ${maxWidth} relative`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-ivory text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="text-stone hover:text-ivory transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
