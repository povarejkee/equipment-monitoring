import { Injectable } from '@angular/core';

const STORAGE_KEY = 'em_sound_alerts_enabled';

/**
 * Plays a short beep for new critical alerts. No audio asset needed — a
 * two-tone beep via the Web Audio API. The on/off preference is a
 * per-browser convenience (not account data), so it lives in
 * localStorage rather than round-tripping to the backend.
 */
@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private audioCtx: AudioContext | null = null;

  get enabled(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'false'; // on by default
    } catch {
      return true;
    }
  }

  set enabled(value: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      /* private browsing / storage disabled — the toggle just won't persist */
    }
  }

  /** Pass `force: true` for an explicit "test sound" action, which should
   * play regardless of the enabled toggle — otherwise a user who just
   * switched it off couldn't preview what they're turning back on. */
  play(force = false): void {
    if (!force && !this.enabled) return;
    try {
      this.audioCtx ??= new AudioContext();
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      [880, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, now + i * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.12);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.14);
        osc.stop(now + i * 0.14 + 0.13);
      });
    } catch {
      /* AudioContext unsupported/blocked (autoplay policy) — silently skip */
    }
  }
}
