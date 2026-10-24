"use client";

/**
 * Procedural lab sound effects via the Web Audio API — no audio files.
 *   • flame: soft filtered brown-noise hiss/roar (Bunsen burner)
 *   • water: brighter band-passed noise with a gentle burble (running tap)
 * Each returns a { stop } handle; useLoopSound wires it to a boolean.
 */

import { useEffect } from "react";

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// Two seconds of looping noise (brown-ish: integrated white noise).
function noiseBuffer(ac: AudioContext): AudioBuffer {
  const n = ac.sampleRate * 2;
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    d[i] = last * 3.2;
  }
  return buf;
}

type Handle = { stop: () => void };

function playFlame(): Handle | null {
  const ac = getCtx();
  if (!ac) return null;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  src.loop = true;
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 480;
  const gain = ac.createGain();
  gain.gain.value = 0;
  src.connect(lp).connect(gain).connect(ac.destination);
  src.start();
  gain.gain.linearRampToValueAtTime(0.14, ac.currentTime + 0.25);
  return {
    stop: () => {
      gain.gain.cancelScheduledValues(ac.currentTime);
      gain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.2);
      try { src.stop(ac.currentTime + 0.3); } catch { /* already stopped */ }
    },
  };
}

function playWater(): Handle | null {
  const ac = getCtx();
  if (!ac) return null;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  src.loop = true;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1600;
  bp.Q.value = 0.7;
  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 700;
  const gain = ac.createGain();
  gain.gain.value = 0;
  // gentle burble
  const lfo = ac.createOscillator();
  lfo.frequency.value = 7;
  const lfoGain = ac.createGain();
  lfoGain.gain.value = 250;
  lfo.connect(lfoGain).connect(bp.frequency);
  src.connect(hp).connect(bp).connect(gain).connect(ac.destination);
  src.start();
  lfo.start();
  gain.gain.linearRampToValueAtTime(0.12, ac.currentTime + 0.15);
  return {
    stop: () => {
      gain.gain.cancelScheduledValues(ac.currentTime);
      gain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.15);
      try { src.stop(ac.currentTime + 0.25); lfo.stop(ac.currentTime + 0.25); } catch { /* already stopped */ }
    },
  };
}

// One-shot: glass being set down on the bench (a short bright clink).
export function playClink() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  [1900, 2700, 3600].forEach((f, i) => {
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12 / (i + 1), t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + 0.24);
  });
}

// One-shot: a soft footstep (low filtered noise thud).
export function playStep() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 320;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.07, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  src.connect(lp).connect(g).connect(ac.destination);
  src.start(t);
  src.stop(t + 0.14);
}

// One-shot: liquid pouring (short band-passed water burst).
export function playPour() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1400;
  bp.Q.value = 0.8;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.1, t + 0.1);
  g.gain.setValueAtTime(0.1, t + 0.9);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
  src.connect(bp).connect(g).connect(ac.destination);
  src.start(t);
  src.stop(t + 1.25);
}

// One-shot: picking up / dragging a glass item (soft scrape + a glassy ping).
export function playGrab() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2200;
  bp.Q.value = 1.2;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.06, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  src.connect(bp).connect(g).connect(ac.destination);
  src.start(t);
  src.stop(t + 0.2);
  const o = ac.createOscillator();
  o.type = "sine";
  o.frequency.value = 2600;
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0, t);
  g2.gain.linearRampToValueAtTime(0.05, t + 0.005);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  o.connect(g2).connect(ac.destination);
  o.start(t);
  o.stop(t + 0.16);
}

const FACTORIES: Record<"flame" | "water", () => Handle | null> = {
  flame: playFlame,
  water: playWater,
};

// Play a looping effect while `active` is true.
export function useLoopSound(active: boolean, type: "flame" | "water") {
  useEffect(() => {
    if (!active) return;
    const h = FACTORIES[type]();
    return () => h?.stop();
  }, [active, type]);
}

/**
 * Procedural arcade gaming sound for CORRECT answers:
 * Joyful ascending arpeggio (C5 -> E5 -> G5 -> C6) with rich harmonics + positive haptic pulse.
 */
export function playGameCorrectSound() {
  if (typeof window === "undefined") return;

  // Haptic pulse on mobile devices
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([50, 40, 90]);
    } catch {
      /* ignore */
    }
  }

  const ac = getCtx();
  if (!ac) return;

  const now = ac.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  notes.forEach((freq, idx) => {
    const startTime = now + idx * 0.065;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = idx === notes.length - 1 ? "sine" : "triangle";
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.22, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + (idx === notes.length - 1 ? 0.45 : 0.22));

    osc.connect(gain).connect(ac.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.48);
  });
}

/**
 * Procedural arcade gaming sound for WRONG answers:
 * Snappy double buzzer error tone (descending saw/square wave) + jarring vibration.
 */
export function playGameWrongSound() {
  if (typeof window === "undefined") return;

  // Vibration pattern on mobile devices
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([140, 60, 180]);
    } catch {
      /* ignore */
    }
  }

  const ac = getCtx();
  if (!ac) return;

  const now = ac.currentTime;

  // 2 quick arcade error buzzes
  [0, 0.12].forEach((offset) => {
    const startTime = now + offset;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(210, startTime);
    osc.frequency.exponentialRampToValueAtTime(110, startTime + 0.09);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, startTime);
    filter.frequency.exponentialRampToValueAtTime(250, startTime + 0.09);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.1);

    osc.connect(filter).connect(gain).connect(ac.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.11);
  });
}

