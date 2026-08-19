// Minimal ambient types for the (non-standard) Web Speech API SpeechRecognition
// interface, which isn't part of TypeScript's DOM lib.

interface SpeechRecognitionResultItem {
  transcript: string
}

interface SpeechRecognitionResultEntry {
  0: SpeechRecognitionResultItem
  length: number
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: {
    length: number
    [index: number]: SpeechRecognitionResultEntry
  }
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition
  webkitSpeechRecognition?: new () => SpeechRecognition
}
