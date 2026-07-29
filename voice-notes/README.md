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
   збереження, з notification) і `WakeWordService` (Picovoice Porcupine,
   кастомна фраза "Hey, Naomi", запускає запис без відкриття екрана).
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
│   │   └── WakeWordService.kt            — Porcupine "Hey, Naomi" listener
│   ├── widget/RecordWidgetProvider.kt    — home screen Start/Stop button
│   └── util/                        — RecordingState, ListeningState (SharedPreferences)
└── app/src/main/res/                — strings (uk), themes, icons, widget layout
```

## Перед першою збіркою

### 1. Ключі API (не комітяться в git)

Скопіюйте `local.properties.example` → `local.properties` (у корені
`voice-notes/`) і заповніть:

```properties
OPENAI_API_KEY=sk-...
PICOVOICE_ACCESS_KEY=...
```

- `OPENAI_API_KEY` — https://platform.openai.com/api-keys (потрібен платний
  доступ до Whisper API; ціна ≈$0.006/хв).
- `PICOVOICE_ACCESS_KEY` — безкоштовний тир на https://console.picovoice.ai/

### 2. Кастомна wake-фраза "Hey, Naomi"

Porcupine не має вбудованої фрази "Hey, Naomi" — її потрібно один раз
створити безкоштовно:

1. Зайдіть на https://console.picovoice.ai/ → **Porcupine** → **Create
   Wake Word**.
2. Введіть фразу `Hey Naomi`, платформа — **Android**.
3. Завантажте файл `Hey-Naomi_en_android_v3_0_0.ppn` (назва залежить від
   версії SDK).
4. Перейменуйте його на `hey_naomi_android.ppn` і покладіть у
   `app/src/main/assets/hey_naomi_android.ppn`.

Без цього файлу `WakeWordService` не зможе запуститись (перемикач
"прослуховування" в застосунку просто не активується).

## Збірка APK (Android Studio)

1. **Відкрити проєкт**: Android Studio → `Open` → виберіть теку
   `voice-notes/` (не весь репозиторій `Cavari`).
2. Дочекайтесь Gradle sync. Якщо Android Studio повідомить про відсутній
   `gradle-wrapper.jar`, виконайте `File → Sync Project with Gradle Files`
   — Studio сама його згенерує (Gradle-версію задано в
   `gradle/wrapper/gradle-wrapper.properties`).
3. Переконайтесь, що `local.properties` заповнений (крок вище) і що
   `hey_naomi_android.ppn` лежить в `assets/`.
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
- Wake-фраза активації "Hey, Naomi" — англійською (обмеження безкоштовного
  тиру Porcupine), сам запис і транскрипція — повністю українською.
