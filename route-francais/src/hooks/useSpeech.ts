import { useCallback, useEffect, useState } from 'react'

type SpeechStatus = {
  supported: boolean
  voiceCount: number
  error: string | null
  lastAttempt: string | null
}

export function useSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [status, setStatus] = useState<SpeechStatus>({
    supported,
    voiceCount: 0,
    error: null,
    lastAttempt: null,
  })

  useEffect(() => {
    if (!supported) return
    const update = () => setStatus((s) => ({ ...s, voiceCount: window.speechSynthesis.getVoices().length }))
    update()
    window.speechSynthesis.onvoiceschanged = update
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [supported])

  const say = useCallback(
    (text: string) => {
      setStatus((s) => ({ ...s, lastAttempt: text }))
      if (!supported) {
        setStatus((s) => ({ ...s, error: 'Web Speech API недоступний у цьому браузері/пристрої' }))
        return
      }
      try {
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.lang = 'fr-FR'
        u.rate = 0.9
        u.volume = 1
        const voices = window.speechSynthesis.getVoices()
        const fr = voices.find((v) => v.lang?.toLowerCase().startsWith('fr'))
        if (fr) u.voice = fr
        u.onerror = (e) => setStatus((s) => ({ ...s, error: `Помилка відтворення: ${e.error || 'невідома'}` }))
        u.onstart = () => setStatus((s) => ({ ...s, error: null }))
        window.speechSynthesis.speak(u)
      } catch (e) {
        setStatus((s) => ({ ...s, error: String((e as Error).message || e) }))
      }
    },
    [supported],
  )

  return { status, say }
}
