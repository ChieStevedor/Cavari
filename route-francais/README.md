# Route Français

PWA для вивчення французької мови за кермом: словник з вимовою (Web Speech API TTS),
spaced repetition (Leitner-бокси), і вкладка "Продукція" для письма/говоріння з
AI-фідбеком (TCF Canada style).

## Розробка

```bash
npm install
npm run dev
```

## Деплой (Vercel)

Цей додаток — окремий Vercel-проєкт у монорепо `Cavari`. При створенні проєкту
постав **Root Directory** на `route-francais` (див. кореневий `DEPLOYMENT.md`).

Після деплою додай env var у Vercel dashboard → Settings → Environment Variables:

- `ANTHROPIC_API_KEY` — використовується лише серверною функцією `api/feedback.ts`,
  ніколи не потрапляє у клієнтський бандл.

Потім `Redeploy`, щоб змінна підхопилась.
