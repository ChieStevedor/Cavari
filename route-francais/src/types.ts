export type VocabItem = {
  id: string
  cat: string
  fr: string
  ph: string
  ua: string
}

export type TaskType = 'describe' | 'narrate' | 'argue'

export type Task = {
  id: string
  type: TaskType
  label: string
  words: string
  fr: string
  ua: string
}

export type CardProgress = {
  box: number
  dueAt: number
}

export type Progress = Record<string, CardProgress>

export type DriveMode = 'lesson' | 'endless'
