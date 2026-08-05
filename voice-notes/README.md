# Voice Notes (Android)

Нативний Android-застосунок (Kotlin) для голосових нотаток українською:
натисніть кнопку — або скажіть "Hey, Naomi" з будь-якого екрана — і голосове
повідомлення перетвориться на текстову нотатку через OpenAI Whisper
(`language=uk`), збережену локально в Room database.

## План розробки (5 кроків)

1. **Дані та зберігання** — Room database (`Note`, `NoteDao`, `AppDatabase`,
   `NotesRepository`) для локального списку нотаток з датою й часом.
2. **Запис і транскрипція** — `AudioRecorder` (MediaRecorder → `.m4a`) та
   `WhisperApiClient` (OkHttp, multipart-запит до Whisper API з
   `language=uk`).
3. **Фонові сервіси** — `RecordingForegroundService` (запис → транскрипція →
   збереження, з notification) і `WakeWordService` (Vosk, офлайн і
   безкоштовно, фраза "Hey, Naomi", запускає запис без відкриття екрана).
4. **Інтерфейс і віджет** — мінімалістичний Compose-екран (кругла
   мікрофон-кнопка, перемикач "прослуховування активне", список нотаток) +
   Home Screen Widget з тією самою кнопкою Start/Stop.
5. **Дозволи, збірка, встановлення** — `RECORD_AUDIO`,
   `FOREGROUND_SERVICE(_MICROPHONE)`, `POST_NOTIFICATIONS`; збірка APK через
   Android Studio і встановлення на телефон Alex через USB-налагодження.

## Структура коду

```
voice-notes/
├── app/src/main/java/com/cavari/voicenotes/
│   ├── MainActivity.kt              — Compose UI, permissions, toggles
│   ├── VoiceNotesApp.kt             — Application, resumes wake-word listener
│   ├── data/                        — Room: Note, NoteDao, AppDatabase, NotesRepository
│   ├── recording/AudioRecorder.kt   — MediaRecorder → .m4a
│   ├── transcription/WhisperApiClient.kt — OpenAI Whisper API call (uk)
│   ├── service/
│   │   ├── RecordingForegroundService.kt — record / stop / transcribe / save
│   │   └── WakeWordService.kt            — Vosk "Hey, Naomi" listener (offline)
│   ├── widget/RecordWidgetProvider.kt    — home screen Start/Stop button
│   └── util/                        — RecordingState, ListeningState (SharedPreferences)
└── app/src/main/res/                — strings (uk), themes, icons, widget layout
```

> **Про Picovoice:** початково цей план передбачав Picovoice Porcupine для
> wake-word, але Picovoice закрив безкоштовний тариф 30.06.2026 і перейшов
> на суто B2B-модель продажів. Замінено на **Vosk** — офлайн, безкоштовний
> назавжди, без акаунту.

## Перед першою збіркою

### 1. OpenAI ключ (не комітиться в git)

Скопіюйте `local.properties.example` → `local.properties` (у корені
`voice-notes/`) і заповніть:

```properties
OPENAI_API_KEY=sk-...
```

`OPENAI_API_KEY` — https://platform.openai.com/api-keys (потрібен платний
доступ до Whisper API; ціна ≈$0.006/хв, потрібна прив'язана картка в
Billing).

### 2. Модель для wake-word "Hey, Naomi" (Vosk, безкоштовно, без акаунту)

`WakeWordService` розпізнає фразу повністю офлайн через Vosk — потрібно
один раз завантажити невелику англомовну модель (жодної реєстрації чи
ключа не треба):

```bash
cd ~/Downloads
curl -LO https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
mv vosk-model-small-en-us-0.15 ~/Cavari/voice-notes/app/src/main/assets/model-en-us
```

Перевір, що вміст (папки `am/`, `conf/`, `graph/`, ...) лежить прямо в
`app/src/main/assets/model-en-us/`, а не на рівень глибше. Без цієї теки
`WakeWordService` не зможе запуститись (перемикач "прослуховування" в
застосунку покаже сповіщення з помилкою й сам вимкнеться).

Модель важить ~40 МБ і в git не комітиться (вже додано в `.gitignore`) —
кожен, хто збирає проєкт, завантажує її собі один раз цим самим способом.

## Збірка APK (Android Studio)

1. **Відкрити проєкт**: Android Studio → `Open` → виберіть теку
   `voice-notes/` (не весь репозиторій `Cavari`).
2. Дочекайтесь Gradle sync. Якщо Android Studio повідомить про відсутній
   `gradle-wrapper.jar`, виконайте `File → Sync Project with Gradle Files`
   — Studio сама його згенерує (Gradle-версію задано в
   `gradle/wrapper/gradle-wrapper.properties`).
3. Переконайтесь, що `local.properties` заповнений (крок вище) і що
   `assets/model-en-us/` містить розпаковану Vosk-модель.
4. **Build → Generate Signed Bundle / APK…**
   - Оберіть **APK**.
   - Створіть новий keystore (**Create new…**), якщо ще немає, і збережіть
     пароль — він знадобиться для наступних оновлень.
   - Build Variant: **release**.
5. Після збірки Android Studio покаже сповіщення `locate` — APK буде в
   `app/release/app-release.apk`.

## Встановлення на телефон через USB

1. На телефоні: **Налаштування → Про телефон** → 7 разів натиснути
   **Номер збірки**, щоб увімкнути режим розробника.
2. **Налаштування → Система → Для розробників** → увімкнути
   **Налагодження USB**.
3. Підключіть телефон до комп'ютера USB-кабелем, підтвердьте діалог
   "Дозволити налагодження USB" на екрані телефону.
4. В Android Studio: панель **Device Manager** покаже підключений телефон.
   Натисніть зелену кнопку **Run ▶** (або перетягніть APK-файл на телефон і
   встановіть вручну, дозволивши "Встановлення з невідомих джерел").
5. При першому запуску надайте дозволи на мікрофон і сповіщення, коли
   застосунок їх запитає.

## Перевірка "готово за 5 секунд"

- Натисніть круглу кнопку мікрофона → скажіть щось українською → натисніть
  ще раз, щоб зупинити → за кілька секунд нотатка з'явиться в списку.
- Увімкніть перемикач "Прослуховування активне", скажіть **"Hey, Naomi"** з
  вимкненим екраном/іншого застосунку → запис почнеться автоматично;
  скажіть текст нотатки, потім відкрийте застосунок і натисніть кнопку ще
  раз, щоб зупинити запис і зберегти нотатку.

## Обмеження (навмисно, за скоупом)

- Немає редагування нотаток заднім числом, тегів/папок, хмарної
  синхронізації — нотатки живуть лише в Room database на одному телефоні.
- Foreground Service для wake-word слухає постійно, поки перемикач
  увімкнений — це витрачає батарею; в UI є явний індикатор і кнопка
  вимкнути.
- Wake-фраза активації "Hey, Naomi" — англійською (модель Vosk англомовна),
  сам запис і транскрипція — повністю українською.
