import { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { disableReminders, enableReminders, getPushState, type PushSupportState } from '../push';

export default function ReminderToggle() {
  const [state, setState] = useState<PushSupportState | 'loading'>('loading');

  useEffect(() => {
    getPushState().then(setState);
  }, []);

  if (state === 'unsupported') return null;

  async function handleClick() {
    if (state === 'subscribed') {
      setState(await disableReminders());
    } else {
      try {
        setState(await enableReminders());
      } catch {
        setState('not-subscribed');
      }
    }
  }

  const label =
    state === 'subscribed'
      ? 'Нагадування о 6:30 увімкнено'
      : state === 'denied'
        ? 'Сповіщення заблоковані в браузері'
        : 'Увімкнути нагадування о 6:30';

  const Icon = state === 'subscribed' ? BellRing : state === 'denied' ? BellOff : Bell;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === 'denied' || state === 'loading'}
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
        state === 'subscribed'
          ? 'bg-[#5B3A9E] text-white'
          : 'bg-[#5B3A9E]/10 text-[#5B3A9E] disabled:text-[#241C35]/30'
      }`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
    </button>
  );
}
