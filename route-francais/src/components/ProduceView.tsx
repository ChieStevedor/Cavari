import { useRef, useState } from 'react'
import { TASKS } from '../data/tasks'
import { getFeedback } from '../lib/feedback'
import { C } from '../theme'

type Sub = 'writing' | 'speaking'

export function ProduceView() {
  const [sub, setSub] = useState<Sub>('writing')
  const [taskIdx, setTaskIdx] = useState(0)
  const [text, setText] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [speechSupported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition))
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const task = TASKS[taskIdx]
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  function nextTask() {
    setTaskIdx((i) => (i + 1) % TASKS.length)
    setText('')
    setFeedback(null)
  }

  function toggleRecording() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }
    const rec = new SR()
    rec.lang = 'fr-FR'
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (e) => {
      let chunk = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        chunk += e.results[i][0].transcript + ' '
      }
      setText((prev) => (prev ? prev + ' ' + chunk.trim() : chunk.trim()))
    }
    rec.onerror = (e) => console.error('speech recognition error', e)
    rec.onend = () => setRecording(false)
    recognitionRef.current = rec
    rec.start()
    setRecording(true)
  }

  async function submit() {
    if (!text.trim() || loading) return
    setLoading(true)
    setFeedback(null)
    try {
      const fb = await getFeedback(task, text, sub === 'speaking')
      setFeedback(fb)
    } catch (e) {
      console.error(e)
      setFeedback("Помилка перевірки. Перевір з'єднання і спробуй ще раз.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="font-mono text-xs tracking-widest" style={{ color: C.textDim }}>
        ПРОДУКЦІЯ · НЕ ЗА КЕРМОМ
      </div>

      <div className="flex rounded-full p-1" style={{ background: C.panel, border: `1px solid ${C.panelEdge}` }}>
        <button
          onClick={() => {
            setSub('writing')
            setFeedback(null)
          }}
          className="flex-1 py-2 rounded-full text-sm font-semibold transition-colors"
          style={{ background: sub === 'writing' ? C.blue : 'transparent', color: sub === 'writing' ? '#0A1620' : C.textDim }}
        >
          Письмо
        </button>
        <button
          onClick={() => {
            setSub('speaking')
            setFeedback(null)
            setText('')
          }}
          className="flex-1 py-2 rounded-full text-sm font-semibold transition-colors"
          style={{ background: sub === 'speaking' ? C.blue : 'transparent', color: sub === 'speaking' ? '#0A1620' : C.textDim }}
        >
          Говоріння
        </button>
      </div>

      <div className="rounded-2xl px-5 py-5 flex flex-col gap-3" style={{ background: C.panel, border: `1px solid ${C.panelEdge}` }}>
        <div className="flex items-center gap-2">
          <div className="font-mono text-xs tracking-widest px-2 py-0.5 rounded-full" style={{ background: C.blueDim, color: C.blue }}>
            {task.label}
          </div>
          <div className="font-mono text-xs" style={{ color: C.textDim }}>
            {task.words}
          </div>
        </div>
        <div className="text-lg font-semibold" style={{ color: C.text }}>
          {task.fr}
        </div>
        <div className="text-sm" style={{ color: C.textDim }}>
          {task.ua}
        </div>
      </div>

      {sub === 'speaking' && (
        <div className="flex flex-col items-center gap-2">
          {speechSupported ? (
            <button
              onClick={toggleRecording}
              className="rounded-full w-20 h-20 flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: recording ? C.red : C.amber }}
            >
              <div
                className="rounded-sm"
                style={{ width: recording ? 20 : 0, height: recording ? 20 : 0, background: '#1B1305' }}
              />
              {!recording && (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="12" rx="3" fill="#1B1305" />
                  <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="#1B1305" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          ) : (
            <div className="text-sm text-center" style={{ color: C.textDim }}>
              Розпізнавання мовлення недоступне в цьому браузері. Спробуй Chrome на комп'ютері, або говори вголос і впиши
              текст сам нижче.
            </div>
          )}
          <div className="font-mono text-xs" style={{ color: C.textDim }}>
            {recording ? 'Запис… натисни, щоб зупинити' : 'натисни, щоб говорити французькою'}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={sub === 'speaking' ? "Транскрипт з'явиться тут — можеш виправити вручну" : 'Пиши тут французькою…'}
          rows={6}
          className="rounded-xl px-4 py-3 text-base resize-none focus:outline-none"
          style={{ background: C.bg, border: `1px solid ${C.panelEdge}`, color: C.text }}
        />
        <div className="text-right font-mono text-xs" style={{ color: C.textDim }}>
          {wordCount} слів
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={submit}
          disabled={!text.trim() || loading}
          className="flex-1 rounded-xl py-4 text-base font-semibold active:scale-[0.98] transition-transform disabled:opacity-40"
          style={{ background: C.amber, color: '#1B1305' }}
        >
          {loading ? 'Перевіряю…' : 'Перевірити'}
        </button>
        <button
          onClick={nextTask}
          className="rounded-xl px-5 py-4 text-base font-semibold active:scale-[0.98] transition-transform"
          style={{ background: C.panel, border: `1px solid ${C.panelEdge}`, color: C.textDim }}
        >
          Інше завдання
        </button>
      </div>

      {feedback && (
        <div
          className="rounded-2xl px-5 py-4 whitespace-pre-wrap text-sm leading-relaxed"
          style={{ background: C.panel, border: `1px solid ${C.amberDim}`, color: C.text }}
        >
          {feedback}
        </div>
      )}
    </div>
  )
}
