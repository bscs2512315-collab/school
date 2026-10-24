"use client";

/**
 * Procedural gamification sound effects for ExBoard AI Lightning Arena.
 * Built with Web Audio API for zero latency, 0 external assets, and 100% reliability.
 */

let audioCtx: AudioContext | null = null;
let isMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

export function setLightningMuted(muted: boolean) {
  isMuted = muted;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("lightning_sound_muted", muted ? "true" : "false");
    } catch {
      // ignore
    }
  }
}

export function getLightningMuted(): boolean {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem("lightning_sound_muted") === "true";
    } catch {
      return false;
    }
  }
  return isMuted;
}

/**
 * Click / Select sound: snappy bubble/wood pop
 */
export function playSelectSound() {
  if (getLightningMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(580, t);
  osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);

  gain.gain.setValueAtTime(0.18, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.09);
}

/**
 * Countdown clock tick (regular or urgent low-time)
 */
export function playTickSound(isUrgent = false) {
  if (getLightningMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = isUrgent ? "triangle" : "sine";
  const freq = isUrgent ? 880 : 540;
  osc.frequency.setValueAtTime(freq, t);

  const duration = isUrgent ? 0.06 : 0.04;
  gain.gain.setValueAtTime(isUrgent ? 0.14 : 0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

/**
 * Kahoot-style Correct Answer Chime:
 * Joyful ascending major chord arpeggio (C5 - E5 - G5 - C6)
 */
export function playCorrectSound() {
  if (getLightningMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  const notes = [
    { freq: 523.25, time: 0.0 },    // C5
    { freq: 659.25, time: 0.08 },   // E5
    { freq: 783.99, time: 0.16 },   // G5
    { freq: 1046.5, time: 0.24 },   // C6
  ];

  notes.forEach(({ freq, time }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t + time);

    const noteStart = t + time;
    const noteDuration = 0.35;
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.2, noteStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(noteStart);
    osc.stop(noteStart + noteDuration + 0.02);
  });
}

/**
 * Kahoot-style Incorrect / Oops Sound:
 * Descending cartoon 'wah-wah' / gentle buzzer tone
 */
export function playIncorrectSound() {
  if (getLightningMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  // Low gentle descending dissonance
  osc1.type = "sawtooth";
  osc2.type = "sawtooth";

  osc1.frequency.setValueAtTime(260, t);
  osc1.frequency.linearRampToValueAtTime(175, t + 0.35);

  osc2.frequency.setValueAtTime(245, t);
  osc2.frequency.linearRampToValueAtTime(165, t + 0.35);

  // Lowpass filter to keep it soft and warm, not harsh
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(600, t);
  filter.frequency.linearRampToValueAtTime(300, t + 0.35);

  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain).connect(ctx.destination);

  osc1.start(t);
  osc2.start(t);
  osc1.stop(t + 0.4);
  osc2.stop(t + 0.4);
}

/**
 * Time's Up Sound:
 * Double soft alert chime
 */
export function playTimeoutSound() {
  if (getLightningMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  [0, 0.12].forEach((offset, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(idx === 0 ? 440 : 330, t + offset);

    gain.gain.setValueAtTime(0.15, t + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.22);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t + offset);
    osc.stop(t + offset + 0.24);
  });
}

/**
 * Streak multiplier power-up sound:
 * Whooshing rising synth chord with shimmer
 */
export function playStreakSound() {
  if (getLightningMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  const freqs = [440, 554.37, 659.25, 880];

  freqs.forEach((baseFreq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(baseFreq, t + i * 0.05);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + i * 0.05 + 0.25);

    const noteStart = t + i * 0.05;
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.12, noteStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.3);

    osc.connect(gain).connect(ctx.destination);
    osc.start(noteStart);
    osc.stop(noteStart + 0.32);
  });
}

/**
 * Leaderboard / Round transition sound:
 * Sleek modern swipe whoosh
 */
export function playLeaderboardSound() {
  if (getLightningMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(320, t);
  osc.frequency.exponentialRampToValueAtTime(640, t + 0.2);

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.26);
}

/**
 * Podium / Victory Fanfare:
 * Royal celebratory fanfare (C5, G5, C6)
 */
export function playPodiumSound() {
  if (getLightningMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  const chord = [
    { freq: 523.25, delay: 0 },
    { freq: 659.25, delay: 0.12 },
    { freq: 783.99, delay: 0.24 },
    { freq: 1046.5, delay: 0.36 },
    { freq: 1318.51, delay: 0.48 },
  ];

  chord.forEach(({ freq, delay }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t + delay);

    const noteStart = t + delay;
    const dur = 0.6;
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.18, noteStart + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + dur);

    osc.connect(gain).connect(ctx.destination);
    osc.start(noteStart);
    osc.stop(noteStart + dur + 0.02);
  });
}
