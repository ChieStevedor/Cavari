import { C } from '../theme'

type Props = {
  onClick: () => void
  size?: number
}

export function SpeakerButton({ onClick, size = 44 }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="Озвучити"
      className="rounded-full flex items-center justify-center active:scale-90 transition-transform shrink-0"
      style={{ width: size, height: size, background: C.amberDim, border: `1px solid ${C.amber}` }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill={C.amber} />
        <path d="M16.5 8.5a5 5 0 010 7" stroke={C.amber} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M19 6a8.5 8.5 0 010 12" stroke={C.amber} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    </button>
  )
}
