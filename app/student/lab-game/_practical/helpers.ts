import type { TubeVis } from "./PracticalScene";

// Shared tube-visual builders so each practical config stays short & consistent.
export const EMPTY: TubeVis = { fill: 0, color: "#ffffff", opacity: 0, powder: false, precip: null, precipAmt: 0 };

// A clear/tinted solution (no precipitate).
export const sol = (color: string, f = 0.62, op = 0.76): TubeVis => ({ fill: f, color, opacity: op, powder: false, precip: null, precipAmt: 0 });

// A coloured precipitate suspended in a tinted solution.
export const ppt = (precip: string, liquid: string, f = 0.6, op = 0.66): TubeVis => ({ fill: f, color: liquid, opacity: op, powder: false, precip, precipAmt: 0.85 });

// Dry salt powder at the bottom (before water is added).
export const powder: TubeVis = { ...EMPTY, powder: true };

// Salt powder + water (before shaking dissolves it).
export const withWater = (color: string): TubeVis => ({ fill: 0.7, color, opacity: 0.55, powder: true, precip: null, precipAmt: 0 });

// A fizzing solution — salt + acid giving off gas (effervescence).
export const gas = (color = "#eef1f2", f = 0.5): TubeVis => ({ fill: f, color, opacity: 0.5, powder: false, precip: null, precipAmt: 0, fizz: true });

// A milky/cloudy white suspension (e.g. lime water turned milky).
export const milky = (f = 0.55): TubeVis => ({ fill: f, color: "#e6eaec", opacity: 0.78, powder: false, precip: "#eef1f4", precipAmt: 0.85 });

export const five = (): TubeVis[] => [{ ...EMPTY }, { ...EMPTY }, { ...EMPTY }, { ...EMPTY }, { ...EMPTY }];
