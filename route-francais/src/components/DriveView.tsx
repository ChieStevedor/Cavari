import { useCallback, useEffect, useRef, useState } from 'react'
import { BY_CAT, VOCAB } from '../data/vocab'
import { useSpeech } from '../hooks/useSpeech'
import { BOX_INTERVAL_DAYS, LESSON_SIZE, pick } from '../lib/leitner'
import { loadProgress, saveProgress } from '../lib/storage'
import { tone } from '../lib/tone'
import { C } from '../theme'
import type { DriveMode, Progress, VocabItem } from '../types'
import { SpeakerButton } from './SpeakerButton'

export function DriveView() {
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [mode, setMode] = useState<DriveMode>('lesson')
  const [queue, setQueue] = useState<VocabItem[]>([])
  const [idx, setIdx] = useState(0)
  const [options, setOptions] = useState<VocabItem[]>([])
  const [answered, setAnswered] = useState<{ correct: boolean; pickedId: string } | null>(null)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)
  const spokeRef = useRef<string | null>(null)
  const { status: ttsStatus, say } = useSpeech()

  useEffect(() => {
    setProgress(loadProgress())
    setLoaded(true)
  }, [])

  const persistProgress = useCallback((next: Progress) => {
    setProgress(next)
    saveProgress(next)
  }, [])

  const buildQueue = useCallback((m: DriveMode, prog: Progress) => {
    const now = Date.now()
    if (m === 'lesson') {
      const unseen = VOCAB.filter((v) => !prog[v.id])
      const due = VOCAB.filter((v) => prog[v.id] && prog[v.id].dueAt <= now)
      const pool = unseen.length ? unseen : due.length ? due : VOCAB
      return pick(pool, Math.min(LESSON_SIZE, pool.length))
    }
    const due = VOCAB.filter((v) => prog[v.id] && prog[v.id].dueAt <= now)
    const rest = VOCAB.filter((v) => !due.includes(v))
    return [...pick(due, due.length), ...pick(rest, rest.length)]
  }, [])

  const startSession = useCallback(
    (m: DriveMode) => {
      if (!progress) return
      setMode(m)
      setQueue(buildQueue(m, progress))
      setIdx(0)
      setAnswered(null)
      setSessionCorrect(0)
      setSessionTotal(0)
    },
    [progress, buildQueue],
  )

  useEffect(() => {
    if (loaded && queue.length === 0) startSession(mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  const card = queue[idx]
  const isNew = card ? !progress?.[card.id] : false

  useEffect(() => {
    if (!card) return
    if (!isNew) {
      const sameCat = BY_CAT[card.cat].filter((v) => v.id !== card.id)
      const distractors = pick(sameCat.length >= 2 ? sameCat : VOCAB.filter((v) => v.id !== card.id), 2)
      setOptions(pick([card, ...distractors], 3))
    }
    setAnswered(null)
    if (spokeRef.current !== card.id) {
      spokeRef.current = card.id
      say(card.fr)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, isNew])

  function advance(nextProg: Progress) {
    if (idx + 1 < queue.length) setIdx((i) => i + 1)
    else {
      setQueue(buildQueue(mode, nextProg))
      setIdx(0)
    }
  }

  function confirmSeen() {
    if (!progress || !card) return
    const next = { ...progress, [card.id]: { box: 1, dueAt: Date.now() } }
    persistProgress(next)
    advance(next)
  }

  function handleAnswer(opt: VocabItem) {
    if (answered || !card || !progress) return
    const correct = opt.id === card.id
    setAnswered({ correct, pickedId: opt.id })
    tone(correct ? 'ok' : 'bad')
    if (!correct) setTimeout(() => say(card.fr), 400)

    const prevBox = progress[card.id]?.box || 0
    const nextBox = correct ? Math.min(prevBox + 1, BOX_INTERVAL_DAYS.length - 1) : 1
    const dueAt = Date.now() + BOX_INTERVAL_DAYS[nextBox] * 86400000
    const next = { ...progress, [card.id]: { box: nextBox, dueAt } }
    persistProgress(next)

    setSessionTotal((t) => t + 1)
    if (correct) setSessionCorrect((c) => c + 1)
    setTimeout(() => advance(next), correct ? 900 : 1600)
  }

  function resetProgress() {
    persistProgress({})
    startSession(mode)
  }

  if (!loaded || !card) {
    return (
      <div className="font-mono text-sm text-center py-10" style={{ color: C.textDim }}>
        Завантаження…
      </div>
    )
  }

  const sessionLen = mode === 'lesson' ? Math.min(LESSON_SIZE, queue.length) : null
  const dialFraction = sessionLen ? idx / sessionLen : Math.min(sessionTotal / 12, 1)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs tracking-widest" style={{ color: C.textDim }}>
          ЗА КЕРМОМ
        </div>
        <button onClick={resetProgress} className="font-mono text-xs underline" style={{ color: C.textDim }}>
          скинути
        </button>
      </div>

      {ttsStatus.error && (
        <div
          className="rounded-lg px-3 py-2 font-mono text-xs"
          style={{ background: C.panel, border: `1px solid ${C.panelEdge}`, color: C.red }}
        >
          TTS: {ttsStatus.error}
        </div>
      )}

      <div className="flex rounded-full p-1" style={{ background: C.panel, border: `1px solid ${C.panelEdge}` }}>
        <button
          onClick={() => startSession('lesson')}
          className="flex-1 py-2 rounded-full text-sm font-semibold transition-colors"
          style={{ background: mode === 'lesson' ? C.amber : 'transparent', color: mode === 'lesson' ? '#1B1305' : C.textDim }}
        >
          Поїздка
        </button>
        <button
          onClick={() => startSession('endless')}
          className="flex-1 py-2 rounded-full text-sm font-semibold transition-colors"
          style={{ background: mode === 'endless' ? C.blue : 'transparent', color: mode === 'endless' ? '#0A1620' : C.textDim }}
        >
          Дорога
        </button>
      </div>

      <div className="flex justify-center py-2">
        <svg width="128" height="128" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="56" fill="none" stroke={C.panelEdge} strokeWidth="8" />
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke={C.amber}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 56}
            strokeDashoffset={2 * Math.PI * 56 * (1 - dialFraction)}
            transform="rotate(-90 64 64)"
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
          <text x="64" y="58" textAnchor="middle" fontFamily="monospace" fontSize="26" fill={C.text}>
            {sessionCorrect}
          </text>
          <text x="64" y="78" textAnchor="middle" fontFamily="monospace" fontSize="11" fill={C.textDim}>
            / {sessionTotal || 0}
          </text>
        </svg>
      </div>

      <div className="rounded-2xl px-6 py-7 flex flex-col items-center gap-3" style={{ background: C.panel, border: `1px solid ${C.panelEdge}` }}>
        <div className="flex items-center gap-2">
          <div className="font-mono text-xs tracking-widest" style={{ color: C.textDim }}>
            {card.cat.toUpperCase()}
          </div>
          {isNew && (
            <div className="font-mono text-xs tracking-widest px-2 py-0.5 rounded-full" style={{ background: C.amberDim, color: C.amber }}>
              НОВЕ
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-center leading-tight" style={{ color: C.text }}>
            {card.fr}
          </div>
          <SpeakerButton onClick={() => say(card.fr)} />
        </div>
        <div className="text-sm font-mono" style={{ color: C.textDim }}>
          [{card.ph}]
        </div>
        {isNew && (
          <div className="text-lg text-center pt-1" style={{ color: C.amber }}>
            {card.ua}
          </div>
        )}
      </div>

      {isNew ? (
        <button
          onClick={confirmSeen}
          className="rounded-xl py-5 text-lg font-semibold text-center active:scale-[0.98] transition-transform"
          style={{ background: C.amber, color: '#1B1305' }}
        >
          Далі →
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          {options.map((opt) => {
            let bg: string = C.panel
            let border: string = C.panelEdge
            if (answered) {
              if (opt.id === card.id) {
                bg = C.amberDim
                border = C.amber
              } else if (opt.id === answered.pickedId) {
                bg = '#3A1D16'
                border = C.red
              }
            }
            return (
              <button
                key={opt.id}
                onClick={() => handleAnswer(opt)}
                disabled={!!answered}
                className="rounded-xl py-5 text-lg font-semibold text-center active:scale-[0.98] transition-transform"
                style={{ background: bg, border: `1px solid ${border}`, color: C.text }}
              >
                {opt.ua}
              </button>
            )
          })}
        </div>
      )}
      <div className="text-center font-mono text-xs" style={{ color: C.textDim }}>
        Слухай. Тич. Не дивись довго.
      </div>
    </div>
  )
}
