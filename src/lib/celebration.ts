'use client';

/** Subtle celebration chime built on the Web Audio API (no asset files needed). */
export function playChime() {
  try {
    const w = window as unknown as { AudioContext?: new () => AudioCtxType };
    if (!w.AudioContext) return;
    const ctx = new w.AudioContext();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6 arpeggio
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.0001, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.16, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 1);
    });
    setTimeout(() => void ctx.suspend(), 1400);
  } catch {
    /* audio is non-essential */
  }
}

interface AudioCtxType {
  currentTime: number;
  createOscillator(): Osc;
  createGain(): Gain;
  destination: unknown;
  suspend(): Promise<void>;
}
interface Osc { frequency: { value: number }; type: string; connect(n: Gain): void; start(t: number): void; stop(t: number): void; }
interface Gain { gain: { setValueAtTime(v: number, t: number): void; exponentialRampToValueAtTime(v: number, t: number): void }; connect(d: unknown): void; }

/** Haptic buzz where supported (mobile). */
export function buzz() {
  try {
    const nav = navigator as unknown as { vibrate?: (ms: number) => void };
    if (nav.vibrate) nav.vibrate(120);
  } catch {
    /* no-op */
  }
}