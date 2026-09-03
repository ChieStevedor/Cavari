# AUDIT.md — Аудит коду репозиторію Cavari, проєкт Laviius

**Дата аудиту:** 2026-09-03
**Репозиторій:** `ChieStevedor/Cavari` (монорепозиторій, кілька незалежних продуктів)
**Гілка, з якої проводився аудит:** `claude/cavari-code-audit-ijzocv` (аналіз охоплює всі гілки репозиторію, зміни в код не вносились)

## ⚠️ Найважливіше, що треба знати перед читанням звіту

Жоден з шести модулів, перелічених у завданні, не існує в єдиному, зібраному вигляді. Кожен
модуль Laviius — це **окрема, ніколи не змерджена гілка Claude Code-сесії**. Гілки не змерджені
одна з одною і не змерджені в `main`. Це означає:

- Немає жодного коміту, де driver app, dispatcher console, shipment wizard і production
  infrastructure існували б одночасно в одному дереві файлів.
- Кожен модуль розробляла окрема сесія, яка не бачила коду інших сесій — звідси дублювання типів,
  чотири різні словники статусів замовлення, дві незалежні (і по-різному завершені) реалізації
  "Freight Intelligence" та "Adaptive Workflow", і два конкуруючі варіанти shipment-візарда.
- У `main` реально задеплойовний лише **landing page**. Все інше на сьогодні існує тільки як вихідний
  код на віддалених гілках і ніколи не працювало разом як єдина система.

Відповідність модулів із завдання до гілок:

| Модуль із завдання | Знайдено? | Гілка | Змерджено в main? |
|---|---|---|---|
| Landing page | ✅ Так | `main` (пряма історія) + дублююча незмерджена гілка `claude/laviius-landing-page-ks7kea` (старіша, той самий вміст) | ✅ Так |
| Shipment request wizard | ✅ Так | `claude/laviius-shipment-wizard-v2-n7jzl5` | ❌ Ні |
| Dispatcher console | ✅ Так | `claude/dispatcher-console-e2477u` | ❌ Ні |
| Driver app | ✅ Так (окремий React Native/Expo застосунок, поза `laviius/`) | `claude/laviius-driver-app-41vj2z`, папка `laviius-driver/` | ❌ Ні |
| Production infrastructure | ✅ Так (Supabase-бекенд, CI, backup, security) | `claude/laviius-prod-infrastructure-b4swxh` | ❌ Ні |
| Dispatch background worker | ❌ **Не знайдено ніде** | — | — |

**Dispatch background worker відсутній повністю.** Перевірено всі 4 гілки Laviius (пошук за
`worker`, `queue`, `cron`, `scheduler`, `background`, Supabase Edge Functions) — знайдено лише
щоденний GitHub Actions cron для **бекапу бази даних** (`laviius-db-backup.yml`), який не має
жодного стосунку до диспетчеризації. Реальний ендпоінт `POST /api/shipments` на гілці
production infrastructure свідомо повертає `501 Not Implemented` — тобто навіть синхронного шляху
"замовлення → база даних" не існує, не кажучи вже про фоновий воркер, який би призначав
перевізників чи обробляв чергу.

Репозиторій також містить продукти, що **не стосуються Laviius** і не входять у скоуп цього
аудиту: `claims-system` (автоматизація претензій за пошкоджений товар для бренду освітлення
Cavari — Gmail/Shopify/FedEx/Claude Vision), `finance-tracker` + `finance-tracker-family` (особисті
PWA для обліку фінансів), і кореневий сайт `cavari.design` (маркетинговий сайт бренду освітлення
Cavari — **інший бізнес з такою ж назвою**, що також живе в цьому репозиторії). Ці частини згадані
нижче лише для повноти карти репозиторію, без глибокого розбору бізнес-логіки.

---

## 1. АРХІТЕКТУРА

### 1.1 Стек технологій за модулями

| Модуль | Мова/фреймворк | Стан-менеджмент | БД / бекенд | Хостинг (задекларований) |
|---|---|---|---|---|
| **Landing page** (`laviius/`, гілка `main`) | Next.js 16.2.12 (App Router), React 19.2.4, TypeScript, Tailwind CSS v4, Framer Motion 12 | — (статичний контент) | немає | Vercel (per-project Root Directory `laviius`, див. §6) |
| **Shipment wizard v2** (`laviius/`, гілка `claude/laviius-shipment-wizard-v2-n7jzl5`) | той самий Next.js-застосунок `laviius/` + react-hook-form 7, zod 4, `@hookform/resolvers` | React state + localStorage (`laviius:shipment-draft:v1`, `laviius:shipment-templates:v1`) | немає (жодного мережевого виклику) | той самий Vercel-проєкт, якби гілку змерджено |
| **Dispatcher console** (`laviius/`, гілка `claude/dispatcher-console-e2477u`) | той самий Next.js-застосунок `laviius/` + react-hook-form 7, zod 4, `@tanstack/react-virtual` | React `useReducer`/Context (`DispatcherProvider`, `store.tsx`) + localStorage лише для налаштувань черги | немає (всі дані — `Math.random()`-генератор `mockData.ts`) | той самий Vercel-проєкт, якби гілку змерджено |
| **Driver app** (`laviius-driver/`, гілка `claude/laviius-driver-app-41vj2z`) | React Native 0.76.5 + Expo SDK 52 (`expo-router` 4, файлова маршрутизація), TypeScript, NativeWind (Tailwind для RN) | Zustand 5 (5 сторів, 4 з persist в AsyncStorage) + TanStack Query 5 (з persist-client) | немає (мок API-клієнт, `USE_MOCK = true`) | не задекларовано — немає `eas.json`, немає CI, немає assets-файлів, на які посилається `app.json` |
| **Production infrastructure** (`laviius/`, гілка `claude/laviius-prod-infrastructure-b4swxh`) | той самий Next.js-застосунок `laviius/` + Supabase JS клієнт, Zod-схеми валідації, Vitest | — | **Supabase (Postgres + Auth + Storage)**, 9 SQL-міграцій з RLS | Vercel (веб) + Supabase (БД) + AWS S3-сумісне сховище (бекапи) — задекларовано, реально не піднято |

Усі три Next.js-варіанти (landing page / wizard / dispatcher / prod-infra) — це **одне й те саме
дерево `laviius/`**, редаговане чотирма різними незалежними гілками одного базового коміту.
Жодна пара цих гілок не змерджена одна з одною, тож на практиці "той самий Vercel-проєкт" сьогодні
показує лише landing page.

### 1.2 Схема модулів і як вони пов'язані

- **Landing page → Shipment wizard**: кнопка "Request Delivery" у навбарі веде на `/book`
  **лише на гілці shipment-wizard** (`Navbar.tsx` змінено саме там, щоб замінити
  `mailto:hello@laviius.com` на `href="/book"`). У `main` кнопка досі відкриває `mailto:`.
  Тобто навіть цей найпростіший зв'язок "лендінг → візард" існує тільки в незмердженому вигляді.
- **Shipment wizard → Dispatcher console**: **зв'язку немає**. Wizard ніколи нічого нікуди не
  надсилає (симульований `setTimeout` замість мережевого виклику). Автор коду dispatcher console
  прямо документує це в `docs/DISPATCHER_CONSOLE.md`: тип `Shipment` у dispatcher-консолі
  **спроєктовано** так, ніби він приймає `ShipmentFormValues` з wizard-гілки, але **функції-адаптера
  не існує**, бо "гілка wizard не змерджена" (цитата з коду/документації).
- **Dispatcher console → Driver app**: **зв'язку немає**. Обидва застосунки визначають власний,
  структурно несумісний тип `Shipment` (див. §4.1) і не мають спільного API чи спільного пакета
  типів.
- **Driver app → Production infrastructure**: **зв'язку немає**. Driver app не імпортує Supabase,
  не звертається до жодного бекенд-URL окрім заглушки `https://api.laviius.com/v1`
  (`EXPO_PUBLIC_API_URL`, і той не використовується, бо `USE_MOCK = true`).
- **Production infrastructure → всі інші**: єдиний реальний бекенд-код (Supabase-схема,
  `/api/shipments` роут) існує тільки тут, і сам він — незавершений скелет (`501 Not Implemented`,
  сторінки `/wizard` і `/dashboard` — порожні заглушки `return null`).
- **Landing page ↔ `cavari.design`**: жодного зв'язку — це різні продукти під однаковою назвою
  компанії, що співіснують в одному репозиторії (лендінг Laviius — Next.js у `laviius/`;
  `cavari.design` — статичний HTML у корені репо й у `website/`, продає освітлювальні прилади).

**Висновок:** архітектурно це не "система з чотирьох модулів", а **чотири незалежні прототипи**,
кожен із власним уявленням про доменну модель, які теоретично мали б стати одним продуктом, але
жодного разу не інтегровувались.

### 1.3 Точки входу кожного застосунку

| Застосунок | Точка входу | Файл |
|---|---|---|
| Landing page | `/` | [`laviius/src/app/page.tsx`](https://github.com/ChieStevedor/Cavari/blob/main/laviius/src/app/page.tsx) |
| Shipment wizard | `/book` | [`laviius/src/app/book/page.tsx`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-shipment-wizard-v2-n7jzl5/laviius/src/app/book/page.tsx) |
| Dispatcher console | `/dispatcher` (і `/dispatcher/queue`, `/dispatcher/live-map`, ще 7 підрозділів-заглушок) | [`laviius/src/app/dispatcher/page.tsx`](https://github.com/ChieStevedor/Cavari/blob/claude/dispatcher-console-e2477u/laviius/src/app/dispatcher/page.tsx) |
| Driver app | `expo-router/entry` → `src/app/index.tsx` (auth-гейт) → `(tabs)/home` | [`laviius-driver/src/app/index.tsx`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-driver-app-41vj2z/laviius-driver/src/app/index.tsx) |
| Production infra (API) | `POST /api/shipments` (єдиний написаний роут, повертає 501) | [`laviius/src/app/api/shipments/route.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/src/app/api/shipments/route.ts) |
| Production infra (свої заглушки `/wizard`, `/dashboard`) | `return null`, конкурують з реальним `/book` з іншої гілки | [`laviius/src/app/wizard/page.tsx`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/src/app/wizard/page.tsx), [`laviius/src/app/dashboard/page.tsx`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/src/app/dashboard/page.tsx) |

---

## 2. КАРТА ФАЙЛІВ

### 2.1 Landing page (`laviius/`, гілка `main`)

| Ключові файли | Що робить |
|---|---|
| [`laviius/src/app/layout.tsx`](https://github.com/ChieStevedor/Cavari/blob/main/laviius/src/app/layout.tsx), [`page.tsx`](https://github.com/ChieStevedor/Cavari/blob/main/laviius/src/app/page.tsx) | Кореневий layout і єдина сторінка — послідовність маркетингових секцій |
| [`laviius/src/components/layout/Navbar.tsx`](https://github.com/ChieStevedor/Cavari/blob/main/laviius/src/components/layout/Navbar.tsx), [`Footer.tsx`](https://github.com/ChieStevedor/Cavari/blob/main/laviius/src/components/layout/Footer.tsx) | Навігація; CTA-кнопки — це `mailto:` посилання (`carriers@laviius.com`, `hello@laviius.com`), не форми |
| `laviius/src/components/sections/{Hero,ProblemSection,SolutionSteps,Features,DashboardPreview,WhyLaviius,Testimonials,Coverage,FinalCta}.tsx` | 9 маркетингових секцій одної сторінки, суто презентаційний контент |
| `laviius/src/components/illustrations/{DashboardMockup,DriverAppScreen,PhoneFrame,PhoneMockup,TrackingScreen}.tsx` | Статичні SVG/React-макети "дашборда" й "додатку водія" для лендінгу — **не пов'язані** з реальним driver app чи dispatcher console, це окремі декоративні компоненти з власними захардкодженими текстами на кшталт "In Transit" / "Picked Up" / "Delivered" |
| `laviius/src/components/ui/{Badge,Button,Container,Reveal,SectionHeading}.tsx` | Спільні UI-примітиви лендінгу |

### 2.2 Shipment Request Wizard v2.0 (гілка `claude/laviius-shipment-wizard-v2-n7jzl5`)

| Ключові файли | Що робить |
|---|---|
| [`laviius/src/app/book/page.tsx`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-shipment-wizard-v2-n7jzl5/laviius/src/app/book/page.tsx) | Точка входу `/book` |
| [`laviius/src/components/wizard/ShipmentWizard.tsx`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-shipment-wizard-v2-n7jzl5/laviius/src/components/wizard/ShipmentWizard.tsx) | Оркестратор 5-кроково­го візарда, симульована відправка (`setTimeout(900ms)` замість API), генерація reference number на клієнті |
| `laviius/src/components/wizard/steps/{StepPickup,StepDelivery,StepShipmentDetails,StepRequiredService,StepReview}.tsx` | 5 кроків: Pickup → Delivery → Shipment Details (Cargo) → Required Service (Vehicle+Services+Priority) → Review |
| [`laviius/src/lib/shipment/pricing.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-shipment-wizard-v2-n7jzl5/laviius/src/lib/shipment/pricing.ts), [`constants.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-shipment-wizard-v2-n7jzl5/laviius/src/lib/shipment/constants.ts) | Формула ціни та тарифні таблиці (детально в §3.1) |
| [`laviius/src/lib/shipment/rules.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-shipment-wizard-v2-n7jzl5/laviius/src/lib/shipment/rules.ts) | Реальний "Adaptive Workflow" — логіка показу/приховування полів залежно від типу вантажу |
| [`laviius/src/lib/shipment/intelligence.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-shipment-wizard-v2-n7jzl5/laviius/src/lib/shipment/intelligence.ts) | Реальна "Freight Intelligence" — клієнтські евристики-підказки (розмір авто, вантажники, страхування) |
| [`laviius/src/lib/shipment/{storage,templates}.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-shipment-wizard-v2-n7jzl5/laviius/src/lib/shipment/storage.ts) | Автозбереження чернетки й шаблонів у `localStorage`, мережі не торкається |
| [`laviius/src/lib/shipment/googleMaps.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-shipment-wizard-v2-n7jzl5/laviius/src/lib/shipment/googleMaps.ts) | Google Places Autocomplete (реальна інтеграція, деградує до ручного вводу без ключа) |
| [`laviius/src/types/shipment.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-shipment-wizard-v2-n7jzl5/laviius/src/types/shipment.ts) | Доменна модель заявки (без поля статусу життєвого циклу — див. §4.1) |
| [`laviius/docs/SHIPMENT_WIZARD_DESIGN.md`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-shipment-wizard-v2-n7jzl5/laviius/docs/SHIPMENT_WIZARD_DESIGN.md) | Дизайн-документ (191 рядок) з обґрунтуванням Adaptive Workflow / Progressive Disclosure |

### 2.3 Dispatcher Console (гілка `claude/dispatcher-console-e2477u`)

| Ключові файли | Що робить |
|---|---|
| [`laviius/src/app/dispatcher/{layout,page}.tsx`](https://github.com/ChieStevedor/Cavari/blob/claude/dispatcher-console-e2477u/laviius/src/app/dispatcher/page.tsx) | Точка входу; layout ставить `DispatcherProvider` + `ConsoleShell` навколо всіх під-маршрутів |
| [`laviius/src/lib/dispatcher/store.tsx`](https://github.com/ChieStevedor/Cavari/blob/claude/dispatcher-console-e2477u/laviius/src/lib/dispatcher/store.tsx) | Reducer-стор: `ASSIGN_CARRIER`, генерація invoice-статусу, "живий" фід через `setInterval` кожні 20с (не реальний realtime) |
| [`laviius/src/lib/dispatcher/mockData.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/dispatcher-console-e2477u/laviius/src/lib/dispatcher/mockData.ts) | 701 рядок — генератор усіх даних консолі (`Math.random()`), включно з "AI"-ранжуванням перевізників |
| [`laviius/src/types/dispatcher.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/dispatcher-console-e2477u/laviius/src/types/dispatcher.ts) | Доменна модель диспетчерської (281 рядок) — власний `ShipmentStatus`, окремий від усіх інших гілок |
| `laviius/src/components/dispatcher/queue/{ShipmentQueue,QueueToolbar,columns,sort}.tsx` | Віртуалізована таблиця замовлень, фільтри, збережені перегляди, CSV-експорт (клієнтський) |
| `laviius/src/components/dispatcher/drawer/{ShipmentDrawer,tabs/*}.tsx` | Бічна панель картки замовлення: Summary/Timeline/Carrier/Communication/Documents |
| `laviius/src/components/dispatcher/{feed/ActionFeed*.tsx, alerts/AlertCenter.tsx, kpi/*.tsx, map/LiveMap.tsx}` | Стрічка дій, алерти SLA, KPI-плашки, схематична (не справжня SDK) карта |
| `laviius/src/app/dispatcher/{carriers,claims,customers,drivers,reports,settings,shipments}/page.tsx` | 7 розділів навігації — усі рендерять лише `<ComingSoon />` |
| [`laviius/docs/DISPATCHER_CONSOLE.md`](https://github.com/ChieStevedor/Cavari/blob/claude/dispatcher-console-e2477u/laviius/docs/DISPATCHER_CONSOLE.md) | 335-рядковий архітектурний документ, сам описує відсутність бекенду й адаптера з wizard-гілкою |

### 2.4 Driver App (гілка `claude/laviius-driver-app-41vj2z`, папка `laviius-driver/` — окремий застосунок поза `laviius/`)

| Ключові файли | Що робить |
|---|---|
| [`laviius-driver/src/app/_layout.tsx`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-driver-app-41vj2z/laviius-driver/src/app/_layout.tsx), [`index.tsx`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-driver-app-41vj2z/laviius-driver/src/app/index.tsx) | Кореневий провайдер (query client, connectivity, push-реєстрація) і auth-гейт |
| `laviius-driver/src/app/(tabs)/{home,jobs,messages,profile}/index.tsx` | 4 вкладки нижньої навігації |
| `laviius-driver/src/app/job/[id]/{accept,navigate,arrival,loading-checklist,cargo-verification,photos,confirm-loaded,unload-checklist,white-glove,signature,pod,report-issue}.tsx` | 12 екранів workflow однієї доставки — детально в §3.3 |
| [`laviius-driver/src/domain/workflow.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-driver-app-41vj2z/laviius-driver/src/domain/workflow.ts) | Машина станів доставки — 15 стадій, лише вперед, без відкату |
| `laviius-driver/src/domain/{checklists,issues,selectors}.ts` | Логіка чек-листів (умови провалу), типи проблем/винятків |
| `laviius-driver/src/stores/{authStore,connectivityStore,messagesStore,shipmentStore,syncQueueStore}.ts` | 5 Zustand-сторів — усі локальні, дані ніколи не йдуть на сервер (детально в §3.3, §4.2) |
| `laviius-driver/src/lib/{location,notifications,offlineSync,photoCapture,haptics}.ts` | Реальні інтеграції з Expo API (GPS, push, фонова синхронізація, камера, вібро) |
| [`laviius-driver/src/api/client.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-driver-app-41vj2z/laviius-driver/src/api/client.ts) | `const USE_MOCK = true` — головний перемикач, який вимикає будь-яку реальну мережу |
| [`laviius-driver/src/types/shipment.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-driver-app-41vj2z/laviius-driver/src/types/shipment.ts) | Ще одна, третя незалежна доменна модель "Shipment" — без жодного поля ціни |
| [`laviius-driver/ARCHITECTURE.md`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-driver-app-41vj2z/laviius-driver/ARCHITECTURE.md) | Документує майбутній `POST /push-tokens`, якого ніде не викликано в коді |
| `laviius-driver/app.json` | Bundle ID `com.laviius.driver` (iOS/Android), дозволи камери/геолокації/біометрії; **немає `eas.json`** |

### 2.5 Production Infrastructure (гілка `claude/laviius-prod-infrastructure-b4swxh`)

| Ключові файли | Що робить |
|---|---|
| `laviius/supabase/migrations/0001…0009_*.sql` | 9 SQL-міграцій — повна схема БД з RLS (детально в §3.4) |
| [`laviius/supabase/seed.sql`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/supabase/seed.sql) | Дев-дані (1 компанія, 1 перевізник); явно позначено "ніколи не запускати на проді" |
| [`laviius/src/app/api/shipments/route.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/src/app/api/shipments/route.ts) | Єдиний написаний API-роут; валідує Zod-схемою, авторизує через Supabase, але завершується `501 Not Implemented` |
| `laviius/src/lib/supabase/{client,server,admin}.ts` | Три Supabase-клієнти: публічний, RLS-scoped серверний, service-role (окремо, задокументовано "тільки для довірених фонових задач") |
| [`laviius/src/lib/rate-limit.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/src/lib/rate-limit.ts) | Upstash Redis rate-limiter — написаний, але **не підключений** до `/api/shipments` |
| [`laviius/src/lib/cors.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/src/lib/cors.ts) | CORS allow-list за `ALLOWED_ORIGINS` |
| [`laviius/src/lib/intelligence/freight-intelligence.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/src/lib/intelligence/freight-intelligence.ts) | **Порожня заглушка** (`export {}`, 14 рядків) — та сама фіча вже реально реалізована на wizard-гілці (§4.3) |
| [`laviius/src/lib/rules/adaptive-workflow.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/src/lib/rules/adaptive-workflow.ts) | **Порожня заглушка** — та сама фіча вже реально реалізована на wizard-гілці (§4.3) |
| [`laviius/src/types/shipment.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/src/types/shipment.ts) | **Четверта** незалежна доменна модель "Shipment" (детально в §4.1) |
| `laviius/scripts/{backup-db.sh,sync-storage.sh}` | `pg_dump` → S3 та `rclone sync` Storage-бакета → S3 |
| `.github/workflows/{laviius-ci.yml,laviius-db-backup.yml}`, `.github/dependabot.yml` | CI (tsc/lint/test/`npm audit`/build), щоденний cron бекапу, Dependabot |
| `laviius/docs/{SECURITY.md,RUNBOOK-RESTORE.md,MIGRATION-CHECKLIST.md}` | Політики безпеки, процедура відновлення з бекапу, чекліст secrets для CI |
| `laviius/vitest.config.mts`, [`laviius/src/lib/validation/shipment.test.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/src/lib/validation/shipment.test.ts) | Єдиний тестовий файл у всьому Laviius-скоупі — 5 тестів на Zod-схему |

### 2.6 Поза скоупом Laviius (для повноти карти репозиторію)

| Модуль | Стек | Призначення |
|---|---|---|
| `claims-system/` | Node.js/Express, googleapis, Playwright, `@anthropic-ai/sdk` | Автоматизація претензій по пошкодженим товарам для бренду освітлення Cavari: Gmail-поллінг → Shopify lookup → фрод-перевірки → рішення → подача claim у FedEx (браузерна автоматизація) → щоденний трекер відшкодувань |
| `finance-tracker/`, `finance-tracker-family/` | React + Vite + TS | Особисті PWA обліку фінансів, без стосунку до Laviius |
| корінь репо (`index.html`, `trade.html`, `website/index.html`, `CNAME=cavari.design`) | Статичний HTML + Tailwind CDN | Маркетинговий сайт бренду декоративного освітлення "Cavari" (інший бізнес, що просто має ту саму назву компанії) |

---

## 3. БІЗНЕС-ЛОГІКА ПО ФІЧАХ

### 3.1 Bookings / Shipment Request Wizard

**Реалізовано:**
- 5-кроковий флоу: Pickup → Delivery → Shipment Details (Cargo) → Required Service (Vehicle +
  Services + Priority) → Review. Порядок кроків не змінювався; коміт
  ["Reorder Review step..."](https://github.com/ChieStevedor/Cavari/commit/74243d4) лише
  переставив картки *всередині* екрана Review (Vehicle/Services тепер вище Cargo), сам порядок
  кроків не чіпав.
- Адаптивні поля залежно від типу вантажу (pallets/furniture/appliances мають власні підполя).
- Google Places Autocomplete для адрес (з graceful fallback на ручний ввід).
- Автозбереження чернетки й "шаблони замовлення" — обидва тільки в `localStorage` браузера,
  нічого не синхронізується між пристроями.
- Оцінка ціни у форматі діапазону (low–high) — рахується на льоту при кожній зміні форми.
- Завантаження фото/документів через `UploadZone` — **не справжнє завантаження**: файл ніколи нікуди
  не відправляється, є лише локальний `URL.createObjectURL()`-прев'ю; форма навіть симулює 12%-ву
  ймовірність "збою мережі" з авто-повтором, хоча реальної мережі там немає.

**Заглушка/симуляція:**
- `handleSubmit()` у [`ShipmentWizard.tsx`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-shipment-wizard-v2-n7jzl5/laviius/src/components/wizard/ShipmentWizard.tsx)
  — коментар прямо каже `// Simulated network round-trip to the booking API.`, далі
  `await new Promise(resolve => setTimeout(resolve, 900))`. Жодного `fetch`/API-роута немає.
- Номер заявки (`LV-XXXXXX`) генерується випадково на клієнті, а не сервером.
- Екран успіху показує захардкоджений текст `"Current Status: Waiting for Carrier Assignment"` і
  `"Estimated Response Time: Under 15 minutes"` — жодне з цих значень не бекається реальними даними.
- Кнопка на екрані успіху веде на `/dashboard`, якого **не існує в цій гілці** (мертве посилання).

**Не доробено:** ціна ніколи нікуди не зберігається (в БД навіть немає відповідної колонки — §4.4);
реального бекенд-ендпоінта немає взагалі.

### 3.2 Dispatch (Dispatcher Console)

**Реалізовано (повністю інтерактивно, на моках):**
- Черга замовлень: віртуалізована таблиця, 4 вбудовані збережені перегляди (All / Needs Action /
  In Transit / Delivered), сортування, вибір колонок (зберігається в `localStorage`), закріплення
  рядків, масовий вибір + CSV-експорт (клієнтський, без сервера).
- Картка замовлення (Drawer) з 5 вкладками: Summary (нотатки через react-hook-form+zod), Timeline
  (аудит-трек), Carrier (ранжовані рекомендації + дія "Assign Carrier"), Communication
  (повідомлення по каналах), Documents.
- Дія "Assign Carrier" — реально змінює статус на `assigned`, підбирає доступного водія,
  додає подію в timeline, знімає елемент зі стрічки дій.
- Дія "Generate Invoice" — реально змінює `billingStatus` на `invoiced`.
- Стрічка дій (Action Feed), центр алертів (SLA-ризики, протермінований страховий поліс тощо),
  KPI-панель, глобальний пошук, гарячі клавіші, схематична "жива карта" (без реальної Maps SDK).
- "Живі" оновлення ETA імітуються `setInterval` кожні 20 секунд — не є реальним realtime/websocket.

**Заглушка (задекларовано і видно користувачу, не приховано):**
- 7 із 12 пунктів меню (`carriers, claims, customers, drivers, reports, settings, shipments`)
  показують лише `<ComingSoon />` — жодних даних чи логіки. Задокументовано в
  `docs/DISPATCHER_CONSOLE.md` як "Deferred scope".
- "AI"-ранжування перевізників (`rankCarriersForShipment`) — задокументовано як розрахований на
  майбутню заміну на реальну модель; наразі це чиста евристична функція без жодного ML/AI-виклику.

**Не доробено:** повністю відсутній бекенд — жодного `fetch`/Supabase/WebSocket-виклику ніде в
коді консолі; increased реальна дія "Assign Carrier" ніколи не зберігається поза оперативною
пам'яттю вкладки браузера.

### 3.3 Driver Flow (Driver App)

**Реалізовано:** повний UI 12-екранного робочого циклу однієї доставки з машиною станів
[`workflow.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-driver-app-41vj2z/laviius-driver/src/domain/workflow.ts)
(15 стадій, суворо вперед, без відкату назад — це свідоме архітектурне обмеження, задокументоване в
`ARCHITECTURE.md`):

`assigned → en_route_pickup → arrived_pickup → loading_checklist → cargo_verification →
pickup_photos → confirm_loaded → en_route_delivery → arrived_delivery → unload_checklist →
[white_glove_tasks] → [customer_signature] → delivery_photos → pod_generated → completed`

(стадії в дужках пропускаються, якщо `!shipment.isWhiteGlove` / `!shipment.requiresSignature`).

- Реальна камера (`expo-camera`) для фото на кожному етапі, з GPS-тегуванням і стисненням
  зображення.
- Реальний GPS (`expo-location`) на етапах arrival/navigate.
- Реальний підпис клієнта (`react-native-signature-canvas`).
- Реальний голосовий запис при репорті проблеми (`expo-av`).
- Чек-листи з логікою провалу: якщо відповідь провальна, **автоматично** створюється `exception`
  (наприклад "visible damage" на верифікації вантажу автоматично репортить `damage`-issue) — водія
  при цьому **не блокує** продовження роботи.
- Push-реєстрація через Expo, offline-черга синхронізації (`syncQueueStore`) з фоновим завданням
  (`expo-background-fetch`, кожні 15 хв).
- Месенджер: список тредів, quick-replies, статус доставки повідомлення.

**Заглушка/мок:**
- **Увесь бекенд замінено моками** — `const USE_MOCK = true` в `api/client.ts` вимикає будь-яку
  реальну мережу; всі дані водія й замовлень — фікстури з `mockData.ts`.
- Логін завжди авторизує як той самий захардкоджений `mockDriver` з фейковим токеном — поля вводу
  логіна/пароля в UI взагалі немає.
- Кнопка "Go Off Duty" на головному екрані — порожній обробник (`onPress={() => {}}`), нічого не
  робить.
- Push-токен реально отримується від Expo, але **ніколи нікуди не надсилається** — задокументований
  у `ARCHITECTURE.md` ендпоінт `POST /push-tokens` ніде в коді не викликається.
- Виявлення відхилення від маршруту (`watchPositionDuringRoute`, `hasDeviatedSignificantly`) —
  повністю написане, але **жодним екраном не викликається** (мертвий код).
- `expo-secure-store` заявлений як залежність і Expo-плагін, але ніде не використовується — токен
  сесії зберігається в звичайному AsyncStorage, хоча коментар у коді каже, що "у продакшені це буде
  замінено на secure-store".
- Месенджер технічно підтримує типи повідомлень `voice`/`photo`/`quick_reply` на рівні типів і
  стору, але жоден екран не дає користувачу відправити щось, крім тексту.
- Ассети, на які посилається `app.json` (`icon.png`, `splash.png`, `adaptive-icon.png`), **відсутні
  в комміті** — застосунок у такому вигляді не збереться нативно.
- Немає `eas.json` — конфігурації білда взагалі не існує.

### 3.4 Payments

**Платіжної системи в репозиторії немає ніде.** Жодного Stripe/PayPal/іншого платіжного провайдера
не знайдено в жодній з чотирьох гілок Laviius, ні в `claims-system`. Найближче до "оплати" —
поле `billingStatus` (`not_ready | ready_to_invoice | invoiced | paid`) у dispatcher-консолі, яке
змінюється кнопкою "Generate Invoice" — це суто зміна enum-значення в моковому сторі, без жодного
реального документа рахунку, PDF, платіжного шлюзу чи збереження в БД.

### 3.5 Production infrastructure / backend

**Реалізовано:** повна схема Postgres (Supabase) з RLS на кожній таблиці, аудит-лог (append-only,
через `SECURITY DEFINER`-тригер), тришарова стратегія бекапів (Git/Vercel-історія → щоденний
`pg_dump` в S3 → щоденний `rclone sync` Storage-бакета в S3), CI (`tsc` → lint → test →
`npm audit` → build), security-заголовки (CSP, HSTS, X-Frame-Options тощо), Dependabot.

**Заглушка/не доробено:**
- `POST /api/shipments` — єдиний написаний роут, валідує вхід і авторизує користувача, але
  завершується `return NextResponse.json({error:"Not implemented"}, {status:501})` — коміту, який
  реально пише в таблицю `shipments`, не існує.
- `/wizard` і `/dashboard` — обидві сторінки це `export default function Page() { return null; }`
  з коментарем-специфікацією, що там має бути. Це **інша, незавершена спроба** shipment wizard —
  конкурує з уже повністю збудованим `/book` на іншій гілці (§4.3).
- `freight-intelligence.ts` і `adaptive-workflow.ts` у цій гілці — порожні заглушки-специфікації
  (`export {}`), хоча ідентичні за назвою фічі вже реально реалізовані на wizard-гілці.
- Rate limiting (`lib/rate-limit.ts`) написаний, але **не підключений** до єдиного реального роута —
  сам `route.ts` документує це у своєму TODO.
- Політика видалення даних за PIPEDA (7-річне зберігання) описана як "placeholder policy statement,
  not yet a working feature" (`docs/SECURITY.md`).
- `types/database.ts` — ручний тимчасовий тип, з TODO замінити на згенерований Supabase CLI.
- Таблиця `carriers` (перевізники) — довідник платформи, ще **не прив'язаний** до таблиці
  `shipments` (немає FK/призначення перевізника на рівні БД).

---

## 4. ЗНАЙДЕНІ ПРОБЛЕМИ

### 4.1 Головна логічна суперечність: чотири різні словники статусу замовлення

Кожна гілка вигадала власний enum "статус замовлення", і жоден із них не збігається з іншими:

| Гілка | Поле | Значення |
|---|---|---|
| Shipment wizard | — | **Взагалі немає поля статусу життєвого циклу.** Є лише `UploadedFile.status` (`uploading/done/error`) — статус завантаження файлу, не замовлення. |
| Dispatcher console | `ShipmentStatus` ([`types/dispatcher.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/dispatcher-console-e2477u/laviius/src/types/dispatcher.ts)) | `waiting_assignment \| assigned \| driver_en_route \| picked_up \| delivered \| delayed \| cancelled` (7 значень) |
| Driver app | `ShipmentStatus` ([`types/shipment.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-driver-app-41vj2z/laviius-driver/src/types/shipment.ts)) | `upcoming \| active \| exception \| completed \| cancelled` (5 значень, грубий рівень) + окремий `ShipmentStage` на 15 значень для деталізації workflow |
| Production infra (тип + SQL check-constraint) | `ShipmentStatus` ([`types/shipment.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/src/types/shipment.ts), [`0005_shipments.sql`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/supabase/migrations/0005_shipments.sql)) | `draft \| submitted \| confirmed \| in_transit \| delivered \| cancelled` (6 значень) |

Немає жодної пари гілок з однаковим набором статусів. Якщо ці модулі об'єднати без узгодження,
неможливо буде однозначно відповісти на питання "яке замовлення зараз доставляється" — кожна
частина системи по-своєму трактуватиме той самий момент життєвого циклу.

### 4.2 Дублювання/розбіжність доменної моделі "Shipment" — 4 незалежні визначення

Окрім статусу, кожна гілка з нуля визначає власний тип `Shipment`/`ShipmentRecord` з різними
іменами й формами тих самих полів:

- **Wizard** (`ShipmentFormValues`): `cargo.weight` (число), `cargo.dimensions{length,width,height,unit}`,
  `service.vehicle: VehicleType`, `service.services: ServiceType[]`.
- **Dispatcher** (`Shipment`): **буквально копіює** унії `CargoType`/`VehicleType`/`ServiceType` з
  wizard-гілки один в один (підтверджено — значення ідентичні), але через copy-paste, не через
  імпорт спільного пакета — майбутня зміна в одній гілці не потрапить в іншу автоматично. Додає
  власні поля (`billingStatus`, `assignedCarrier`, `timeline`) яких нема більше ніде.
- **Driver app** (`Shipment`): `ShipmentServiceType = cartage | white_glove | first_mile | last_mile
  | ltl | commercial` — це **інше поняття під тією самою назвою `ServiceType`**, ніж у
  wizard/dispatcher (там `ServiceType` — це список доп.послуг на кшталt liftgate/assembly/tailgate,
  тут — категорія відправлення). Збігається лише значення `white_glove`, і то випадково. Своя
  окрема сутність `WhiteGloveTask` частково повторює значення `ServiceType` з wizard/dispatcher
  (`assembly`, `blanket_wrap`, `debris_removal`, `two_movers`, `three_movers`), але у вигляді
  об'єктів-задач з прапорцем `completed`, а не плаского enum. `CargoItem` не має жодного поля
  "тип вантажу" (`CargoType`), яке б відповідало wizard-у — лише вільний текст `description`.
- **Production infra** (`ShipmentRecord`): `cargo.weightKg` (кілограми, а не фунти/довільна одиниця
  як у wizard), `cargo.declaredValueCents` (у центах), `vehicle.vehicleType: string` (вільний
  рядок, **не** enum `VehicleType` з wizard/dispatcher).

Практичний наслідок: якби ці чотири гілки злили сьогодні "як є", жоден з модулів не зміг би
прочитати дані, створені іншим модулем, без ручного адаптера — а такого адаптера ніде не написано
(документ dispatcher-консолі відкрито визнає його відсутність).

### 4.3 Одна й та сама фіча реалізована двічі, по-різному, у двох гілках

- **Freight Intelligence**: на гілці wizard ([`lib/shipment/intelligence.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-shipment-wizard-v2-n7jzl5/laviius/src/lib/shipment/intelligence.ts)) — це робочі
  клієнтські евристики (рекомендація розміру авто, вантажників, страхування). На гілці
  production-infra ([`lib/intelligence/freight-intelligence.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/src/lib/intelligence/freight-intelligence.ts)) — та сама назва фічі, але
  файл — порожня заглушка з TODO. Дві сесії, не бачачи одна одну, почали одну й ту саму роботу
  з нуля; одна довела до робочого стану, інша — ні.
- **Adaptive Workflow**: аналогічно — реальна реалізація на wizard-гілці
  ([`lib/shipment/rules.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-shipment-wizard-v2-n7jzl5/laviius/src/lib/shipment/rules.ts)), порожня заглушка з тими самими назвами типів
  (`AdaptiveFieldKey`, `AdaptiveRule`, `VisibilityState`) на production-infra-гілці
  ([`lib/rules/adaptive-workflow.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/src/lib/rules/adaptive-workflow.ts)).
- **Сам Shipment Wizard**: production-infra-гілка містить власний маршрут `/wizard`
  ([`src/app/wizard/page.tsx`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/src/app/wizard/page.tsx)) — порожня заглушка `return null` з коментарем "не проєктувати UX
  тут, це власність Wizard Master Prompt". Тим часом на іншій гілці Wizard Master Prompt уже
  **повністю реалізований** — але як окремий маршрут `/book`, не `/wizard`. Це два різні URL для
  того самого наміру, обидва не інтегровані одне з одним.

### 4.4 Ціна рахується, але ніде не зберігається

Формула ціни визначена лише в одному місці — [`lib/shipment/pricing.ts`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-shipment-wizard-v2-n7jzl5/laviius/src/lib/shipment/pricing.ts) на wizard-гілці:

```
price = round((VEHICLE_BASE_RATE_USD[vehicle] + Σ SERVICE_ADDON_USD[service]) × PRIORITY_MULTIPLIER[priority])
low  = price × 0.9
high = price × 1.15
```

Тарифи — захардкоджені константи (наприклад `cargo_van` = $120, `tailgate` = +$35,
`asap` = ×1.5), **без урахування відстані чи ваги вантажу**, що нетипово для реального
ціноутворення у вантажоперевезеннях. Ще важливіше: таблиця `shipments` у схемі БД
([`0005_shipments.sql`](https://github.com/ChieStevedor/Cavari/blob/claude/laviius-prod-infrastructure-b4swxh/laviius/supabase/migrations/0005_shipments.sql)) **не має жодної колонки під ціну/суму/rate** — лише
`pickup/delivery/cargo/vehicle jsonb`, `services text[]`, без `price`/`amount`/`total`. Диспетчерська
консоль оперує лише `billingStatus` (enum), без жодного числового поля суми. Тобто розрахована на
клієнті ціна ніде в системі не має місця для збереження — навіть якби всі гілки завтра змерджали.

### 4.5 Відсутня обробка помилок у критичних місцях

- **Диспетчеризація**: єдиний реальний API-роут (`/api/shipments`, production-infra) сам
  документує себе як "scaffold, not a finished endpoint" і завершується `501`. Тобто обробки
  помилок там формально немає, бо немає й самої операції, яку слід було б захищати.
- **Rate limiting написаний, але не підключений**: `lib/rate-limit.ts` існує саме для захисту
  публічного endpoint бронювання від зловживань (як явно сказано в `SECURITY.md`), але сам
  `route.ts` це підтверджує у власному TODO-коментарі — ризик abuse залишається відкритим навіть
  якби роут запрацював "як є".
- **Wizard**: оскільки відправка форми симулюється (`setTimeout`), у коді немає жодного шляху
  обробки реального збою мережі при сабміті замовлення — `catch`-блок ловить лише помилки
  локальної валідації.
- **Driver app**: push-токен отримується, але шлях його передачі на бекенд не написаний — тобто
  функціонально "сповіщення" ніколи не долетять, і це не супроводжується жодним попередженням
  користувачу чи логуванням помилки, бо помилки як такої немає — просто відсутній виклик.

### 4.6 Незавершені/"мертві" гілки коду

- `laviius-driver/src/lib/location.ts` — `watchPositionDuringRoute()` і
  `hasDeviatedSignificantly()` повністю написані, але жоден екран/стор їх не викликає.
- Кнопка "Go Off Duty" на driver app — порожній обробник `onPress={() => {}}`.
- `expo-secure-store` — заявлена залежність і Expo-плагін в driver app, ніде не імпортується.
- `zod`/`react-hook-form`/`@hookform/resolvers` в `package.json` driver app — під час аудиту не
  знайдено жодного реального використання цих бібліотек у коді екранів (потребує додаткової
  перевірки перед видаленням, але схоже на "мертву" залежність).
- Ілюстрації лендінгу (`DashboardMockup.tsx`) мають захардкоджені рядки `"In Transit"`,
  `"Picked Up"`, `"Delivered"` — це суто декоративний текст на маркетинговій сторінці, що
  **не пов'язаний** із жодним реальним enum статусу з інших гілок, хоч і виглядає схоже — ризик
  того, що читач коду сплутає це з реальним джерелом правди.
- Кнопка "Save on `/dashboard`" на екрані успіху wizard-а веде на маршрут, якого немає в цій гілці.

### 4.7 TODO/FIXME, зафіксовані безпосередньо в коді

Явних `TODO`/`FIXME` найбільше саме на гілці production infrastructure (де вони — усвідомлена
частина скоупу "scaffold", а не забуті нотатки):

- `laviius/src/app/api/shipments/route.ts:5,41,44` — TODO по rate limiting, CORS, запису в
  audit_log, і сам insert у `shipments`.
- `laviius/src/app/dashboard/page.tsx:1`, `laviius/src/app/wizard/page.tsx:1` — TODO "entry point,
  ще не реалізовано".
- `laviius/src/lib/intelligence/freight-intelligence.ts:1,5`, `laviius/src/lib/rules/adaptive-workflow.ts:1`
  — TODO "not implemented yet".
- `laviius/src/types/database.ts:1,20` — TODO замінити ручний тип на згенерований Supabase CLI.
- `laviius/docs/SECURITY.md:153` — політика видалення даних відкрито позначена як
  "placeholder policy statement, not yet a working feature".

На гілках wizard, dispatcher console і driver app **буквальних TODO/FIXME практично немає** — але
це тому, що симуляції там задокументовані прямим коментарем поруч із кодом (наприклад
`// Simulated network round-trip to the booking API.`), а не тому, що там усе реально доробено.

---

## 5. ЗАЛЕЖНОСТІ

### 5.1 Зовнішні API/сервіси

| Сервіс | Де використовується | Реальна інтеграція чи заглушка |
|---|---|---|
| Google Maps/Places JS API | Shipment wizard (`lib/shipment/googleMaps.ts`) | Реальна — автопідказки адрес, з graceful fallback |
| Supabase (Postgres, Auth, Storage) | Production infrastructure | Реальна схема й клієнти, але єдиний ендпоінт що ними користується повертає 501 |
| Upstash Redis | Production infrastructure (`lib/rate-limit.ts`) | Реальний код rate-limiter'а, але не підключений до жодного роута |
| AWS S3-сумісне сховище | Production infrastructure (бекап-скрипти) | Реальні скрипти, не перевірено на практиці (немає доказу, що бакет реально піднято) |
| Expo Push Notification Service | Driver app | Реальна реєстрація токена; токен ніколи не надсилається на бекенд |
| **Stripe / будь-який платіжний провайдер** | — | **Відсутній у всьому репозиторії** |
| **Apollo.io** | — | **Не використовується в коді Laviius ніде** (є лише як непідключений MCP-конектор у поточній сесії, до коду не стосується) |
| Google OAuth (Gmail + Sheets), Shopify Admin API, FedEx portal, Anthropic Claude Vision | `claims-system` (поза скоупом Laviius) | Реальні інтеграції, окремий продукт |

### 5.2 Змінні середовища / секрети

| Змінна | Гілка/модуль | Призначення |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Shipment wizard | Ключ Google Places (клієнтський) |
| `GOOGLE_PLACES_API_KEY` | Production infrastructure (`.env.example`) | **Та сама інтеграція, інша назва змінної** — ніде в коді цієї гілки не використовується (мертва/забігла наперед конфігурація), і не збігається з іменем, яке реально читає код wizard-гілки |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production infrastructure | Публічний Supabase-клієнт |
| `SUPABASE_SERVICE_ROLE_KEY` | Production infrastructure | Service-role клієнт (обхід RLS, лише довірений бекенд) |
| `SUPABASE_DB_URL` | Production infrastructure | Пряме підключення для `pg_dump`-бекапу |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Production infrastructure | Rate limiter |
| `ALLOWED_ORIGINS` | Production infrastructure | CORS allow-list |
| `BACKUP_BUCKET`, `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` (лок.), `BACKUP_AWS_ACCESS_KEY_ID`/`BACKUP_AWS_SECRET_ACCESS_KEY` (CI-секрети), `AWS_REGION` | Production infrastructure | Бекап у S3; **різні імена для локального `.env` і GitHub Actions secrets** — задокументовано і навмисно, але легко переплутати |
| `EXPO_PUBLIC_API_URL` | Driver app | URL бекенду (не використовується, поки `USE_MOCK=true`) |

**Для `claims-system` (поза Laviius):** `GOOGLE_CLIENT_ID/SECRET`, `GOOGLE_ACCESS/REFRESH_TOKEN`,
`CLAIMS_EMAIL`, `GOOGLE_SPREADSHEET_ID`, `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ACCESS_TOKEN`,
`ANTHROPIC_API_KEY`, `FEDEX_PORTAL_EMAIL/PASSWORD`, `FEDEX_ACCOUNT_NUMBER`,
`CLAIM_WINDOW_HOURS`, `AUTO_APPROVE_THRESHOLD` — повний перелік у
[`claims-system/.env.example`](https://github.com/ChieStevedor/Cavari/blob/main/claims-system/.env.example).

---

## 6. СТАН ДЕПЛОЮ

### 6.1 Що реально задеплойовано і працює зараз

Із коду репозиторію **достовірно підтвердити фактичний стан Vercel/Supabase-акаунтів
неможливо** — нижче йдеться про те, що *готове до деплою за станом гілки `main`*, а не про
підтверджений факт роботи на проді.

- **Landing page** (`laviius/`, `main`) — єдина частина Laviius, яка змерджена і теоретично
  розгортається як окремий Vercel-проєкт (`Root Directory: laviius`) згідно з чеклистом у
  [`DEPLOYMENT.md`](https://github.com/ChieStevedor/Cavari/blob/main/DEPLOYMENT.md). CI-перевірка
  [`.github/workflows/no-root-vercel-json.yml`](https://github.com/ChieStevedor/Cavari/blob/main/.github/workflows/no-root-vercel-json.yml) активна на `main` і блокує повернення кореневого
  `vercel.json` (інцидент 2026-07, описаний у `DEPLOYMENT.md`, який і призвів до появи цього
  правила).
- Кореневий сайт `cavari.design` (GitHub Pages, `CNAME` у корені репо) — інший продукт, не
  Laviius; імовірно віддається статично з кореня репозиторію/`website/`.

### 6.2 Що існує тільки локально / в розробці (на гілках, не в проді)

- **Shipment Request Wizard v2.0** — повністю написаний, але живе виключно на гілці
  `claude/laviius-shipment-wizard-v2-n7jzl5`. Якщо цю гілку не змержено — маршруту `/book` в
  проді немає.
- **Dispatcher Console** — повністю написаний UI на моках, живе виключно на гілці
  `claude/dispatcher-console-e2477u`. У проді немає взагалі — навіть якби змержили, консоль і
  далі не мала б жодного реального бекенду, бо той пишеться на третій, окремій гілці.
- **Driver App** — окремий мобільний застосунок на гілці `claude/laviius-driver-app-41vj2z`;
  не має жодного налаштованого механізму збірки (`eas.json` відсутній), тому наразі його навіть
  **неможливо зібрати й опублікувати** в App Store/Play Store в поточному стані коміту — бракує і
  конфігурації, і задекларованих іконок/спланш-скрінів.
- **Production Infrastructure** (Supabase-схема, CI, бекапи, security-заголовки) — все живе на
  гілці `claude/laviius-prod-infrastructure-b4swxh`. Доки вона не змерджена: (а) жоден із
  CI-воркфлоу цієї гілки (`laviius-ci.yml`, `laviius-db-backup.yml`) фактично не виконується
  на GitHub, оскільки `paths:`-фільтр і сам файл існують лише на невмердженій гілці; (б) жодного
  реального бекапу бази даних не відбувається, попри те, що весь механізм для цього написаний;
  (в) навіть якби Supabase-проєкт існував і міграції застосували вручну, єдиний write-ендпоінт
  все одно повертає `501`.
- Дублююча гілка `claude/laviius-landing-page-ks7kea` — старіший, ідентичний за вмістом варіант
  лендінгу, що існував паралельно з тим, який зрештою потрапив у `main` іншим шляхом (прямим
  комітом `eb40a65 "Add Laviius landing page"`, а не мержем цієї гілки). Її можна вважати
  архівною/зайвою.

### 6.3 Прямі посилання на ключові файли

Усі посилання наведено безпосередньо в таблицях §2–§4 вище, кожне веде на конкретний файл у
відповідній гілці (`main` для landing page, окрема Laviius-гілка для кожного з решти чотирьох
модулів).

---

## Підсумок для передачі в інший чат (для перевірки бізнес-логіки)

Перш ніж перевіряти бізнес-логіку, варто мати на увазі: перевіряти доведеться **чотири окремі,
не інтегровані одна з одною реалізації** одного задуму, кожна зі своєю версією "що таке
замовлення" (§4.1–4.2). Питання типу "яка ціна показується диспетчеру" чи "який статус бачить
водій, коли клієнт бачить 'Waiting for Carrier Assignment'" **не мають відповіді в поточному коді**,
бо потрібного зв'язку між гілками просто не існує — це не помилка розрахунку, а повна відсутність
інтеграції. Будь-яка перевірка бізнес-логіки має або (а) оцінювати кожен модуль ізольовано за його
власними внутрішніми правилами (ціноутворення в §4.4, workflow водія в §3.3, RLS-політики в §3.5),
або (б) почати з рішення, чию доменну модель (§4.2) брати за єдине джерело правди для об'єднання.
