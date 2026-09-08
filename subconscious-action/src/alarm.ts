export function playAlarm(): void {
  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const beepStarts = [0, 0.35, 0.7];

  beepStarts.forEach((offset) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.25);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime + offset);
    oscillator.stop(ctx.currentTime + offset + 0.3);
  });

  setTimeout(() => ctx.close(), 1200);
}

export function vibrateAlarm(): void {
  navigator.vibrate?.([200, 100, 200, 100, 200]);
}

export async function notifyAlarm(title: string, body: string): Promise<void> {
  if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'practice-timer',
    });
  } catch {
    // Best effort — sound and vibration already cover the primary alert.
  }
}
