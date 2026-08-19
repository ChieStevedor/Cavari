import type { Task } from '../types'

export async function getFeedback(task: Task, userText: string, isSpeech: boolean): Promise<string> {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, text: userText, isSpeech }),
  })
  if (!response.ok) {
    throw new Error(`feedback request failed: ${response.status}`)
  }
  const data = (await response.json()) as { feedback: string }
  return data.feedback
}
