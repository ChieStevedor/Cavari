import type { VercelRequest, VercelResponse } from '@vercel/node'

type Task = {
  type: 'describe' | 'narrate' | 'argue'
  fr: string
}

function buildSystemPrompt(isSpeech: boolean): string {
  return `Ти - викладач французької, готуєш учня (носій української, ціль CLB7/TCF Canada) до письмової/усної секції іспиту. Дай фідбек УКРАЇНСЬКОЮ мовою на текст учня французькою. Формат рівно такий:
ГРАМАТИКА: (до 5 найважливіших помилок, кожна як "було → треба")
СТРУКТУРА: (1-2 речення, чи логічний і зв'язний текст)
СЛОВНИК: (1-2 речення, чи достатньо різноманітний для B1)
РІВЕНЬ: (A2 / B1 / B2, одне речення чому)
ПОРАДА: (одна конкретна порада на наступного разу)
Будь чесним, не хвали за замовчуванням. Стисло, без води.${isSpeech ? ' Це транскрипт усного мовлення (можливі дрібні помилки розпізнавання) - фокусуйся на структурі речень і словнику, а не на дрібницях транскрипції.' : ''}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Server misconfiguration: ANTHROPIC_API_KEY not set' })
    return
  }

  const { task, text, isSpeech } = req.body as { task?: Task; text?: string; isSpeech?: boolean }
  if (!task?.fr || !task?.type || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'Missing task or text' })
    return
  }

  const sys = buildSystemPrompt(!!isSpeech)
  const userMsg = `Завдання (${task.type}): "${task.fr}"\n\nТекст учня:\n"""${text}"""`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: `${sys}\n\n${userMsg}` }],
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('Anthropic API error', response.status, errBody)
      res.status(502).json({ error: 'Upstream feedback request failed' })
      return
    }

    const data = (await response.json()) as { content: { type: string; text?: string }[] }
    const feedback = data.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('\n')

    res.status(200).json({ feedback })
  } catch (e) {
    console.error('feedback handler failed', e)
    res.status(500).json({ error: 'Internal error' })
  }
}
