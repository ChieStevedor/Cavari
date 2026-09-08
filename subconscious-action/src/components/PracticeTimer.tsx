import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { notifyAlarm, playAlarm, vibrateAlarm } from '../alarm';

interface Props {
  defaultMinutes: number;
}

type Status = 'idle' | 'running' | 'paused' | 'done';

const MINUTE_OPTIONS = [3, 5, 7, 10, 15];

export default function PracticeTimer({ defaultMinutes }: Props) {
  const [selectedMinutes, setSelectedMinutes] = useState(defaultMinutes);
  const [remainingSeconds, setRemainingSeconds] = useState(defaultMinutes * 60);
  const [status, setStatus] = useState<Status>('idle');
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (status !== 'running') return;

    if (remainingSeconds <= 0) {
      setStatus('done');
      playAlarm();
      vibrateAlarm();
      void notifyAlarm('Час вийшов', 'Практику завершено — час записати відчуття.');
      return;
    }

    const timeout = setTimeout(() => setRemainingSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timeout);
  }, [status, remainingSeconds]);

  useEffect(() => {
    if (status === 'running') {
      navigator.wakeLock
        ?.request('screen')
        .then((lock) => {
          wakeLockRef.current = lock;
        })
        .catch(() => {});
    } else {
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
    }

    return () => {
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [status]);

  function handleStart() {
    setRemainingSeconds(selectedMinutes * 60);
    setStatus('running');
  }

  function handleReset() {
    setStatus('idle');
    setRemainingSeconds(selectedMinutes * 60);
  }

  const minutesLeft = Math.floor(remainingSeconds / 60);
  const secondsLeft = remainingSeconds % 60;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#241C35]/5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#241C35]/80">
        <Timer className="h-4 w-4" />
        Таймер практики
      </h2>

      {status === 'idle' ? (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {MINUTE_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => {
                  setSelectedMinutes(minutes);
                  setRemainingSeconds(minutes * 60);
                }}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedMinutes === minutes
                    ? 'bg-[#5B3A9E] text-white'
                    : 'bg-[#241C35]/5 text-[#241C35] hover:bg-[#5B3A9E]/10'
                }`}
              >
                {minutes} хв
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleStart}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5B3A9E] py-3 text-sm font-semibold text-white hover:bg-[#4A2F82]"
          >
            <Play className="h-4 w-4" strokeWidth={2.5} />
            Почати {selectedMinutes} хв
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div
            className={`text-4xl font-bold tabular-nums ${status === 'done' ? 'text-[#5B3A9E]' : 'text-[#241C35]'}`}
          >
            {status === 'done' ? 'Час вийшов!' : `${minutesLeft}:${String(secondsLeft).padStart(2, '0')}`}
          </div>
          <div className="flex w-full gap-2">
            {status !== 'done' && (
              <button
                type="button"
                onClick={() => setStatus((s) => (s === 'running' ? 'paused' : 'running'))}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#5B3A9E]/10 py-2.5 text-sm font-semibold text-[#5B3A9E]"
              >
                {status === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {status === 'running' ? 'Пауза' : 'Продовжити'}
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#241C35]/5 py-2.5 text-sm font-semibold text-[#241C35]"
            >
              <RotateCcw className="h-4 w-4" />
              Скинути
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
