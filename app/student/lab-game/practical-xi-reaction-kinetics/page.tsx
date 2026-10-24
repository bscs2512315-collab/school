"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol, ppt } from "../_practical/helpers";

const CLEAR_LIQ = "#f1f5f9";
const FAINT_SULFUR = "#fef08a";
const OPAQUE_SULFUR = "#fef9c3";
const DENSE_SULFUR = "#fde047";

const config: PracticalConfig = {
  title: "Reaction Kinetics (Na₂S₂O₃ + HCl)",
  kicker: "Reaction Rates & Collision Theory",
  ionLabel: "Rate ∝ [Reactant]",
  radical: "Kinetics of Colloidal Sulfur Formation",
  group: "Class XI Practical 7",
  grade: "XI",
  reagents: [
    { id: "thiosulphate", color: "#e0f2fe", label: "0.1 M Na₂S₂O₃" },
    { id: "water", color: "#dbe9f4", label: "Distilled Water" },
    { id: "hcl", color: "#e0f2fe", label: "1.0 M HCl" },
    { id: "timer", color: "#f59e0b", label: "Stopwatch Timer" },
  ],
  steps: [
    {
      tutor: "Pick up Conical Flask 1 (Tube 1) placed over the black cross 'X' on the white tile.",
      x: "pick up Flask 1 (50 mL Na₂S₂O₃)",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Add 50 mL 0.1 M Na₂S₂O₃ + 5 mL 1.0 M HCl and start stopwatch immediately.",
      x: "add 1.0 M HCl & start timer",
      item: "hcl",
      tube: 0,
      pour: "hcl",
      zoom: true,
      pre: {
        title: "Flask 1: Maximum Concentration [Na₂S₂O₃] = 0.091 M",
        body: "Reaction produces colloidal sulfur precipitate: Na₂S₂O₃ + 2HCl → 2NaCl + SO₂ + S↓ + H₂O. Time how long until the cross 'X' beneath the flask is obscured.",
      },
      post: {
        title: "Cross 'X' Disappears at t₁ = 28 seconds!",
        body: "Dense colloidal sulfur makes the solution completely opaque, obscuring the cross 'X'. Rate (1/t₁) = 0.0357 s⁻¹.",
        eq: "t₁ = 28 s | 1/t₁ = 0.0357 s⁻¹",
      },
    },
    {
      tutor: "Pick up Conical Flask 2 (Tube 2) for Medium Concentration.",
      x: "pick up Flask 2 (30 mL Na₂S₂O₃)",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Add 30 mL Na₂S₂O₃ + 20 mL H₂O + 5 mL 1.0 M HCl and start stopwatch.",
      x: "add 1.0 M HCl & start timer",
      item: "hcl",
      tube: 1,
      pour: "hcl",
      zoom: true,
      pre: {
        title: "Flask 2: Moderate Concentration [Na₂S₂O₃] = 0.055 M",
        body: "With fewer reactant particles per unit volume, collision frequency decreases, slowing down sulfur precipitation.",
      },
      post: {
        title: "Cross 'X' Disappears at t₂ = 47 seconds!",
        body: "Lower concentration requires longer time to produce the threshold mass of sulfur: t₂ = 47 s. Rate (1/t₂) = 0.0213 s⁻¹.",
        eq: "t₂ = 47 s | 1/t₂ = 0.0213 s⁻¹",
      },
    },
    {
      tutor: "Pick up Conical Flask 3 (Tube 3) for Low Concentration.",
      x: "pick up Flask 3 (10 mL Na₂S₂O₃)",
      item: "tube",
      tube: 2,
    },
    {
      tutor: "Add 10 mL Na₂S₂O₃ + 40 mL H₂O + 5 mL 1.0 M HCl and start stopwatch.",
      x: "add 1.0 M HCl & start timer",
      item: "hcl",
      tube: 2,
      pour: "hcl",
      zoom: true,
      pre: {
        title: "Flask 3: Low Concentration [Na₂S₂O₃] = 0.018 M",
        body: "Highly diluted thiosulphate exhibits the lowest effective collision rate, leading to the slowest precipitation rate.",
      },
      post: {
        title: "Cross 'X' Disappears at t₃ = 140 seconds!",
        body: "Slowest reaction rate: t₃ = 140 s. Rate (1/t₃) = 0.0071 s⁻¹.",
        eq: "t₃ = 140 s | 1/t₃ = 0.0071 s⁻¹",
      },
    },
    {
      tutor: "Plot Concentration vs 1/t to deduce the rate law.",
      x: "plot rate graph",
      item: "tube",
      tube: 0,
      post: {
        title: "Linear Rate Law Verified: Rate ∝ [Na₂S₂O₃]¹",
        body: "The plot of 1/t (Reaction Rate) versus [Na₂S₂O₃] yields a perfect straight line passing through the origin, proving the reaction is first order with respect to sodium thiosulphate.",
        eq: "Rate = k [Na₂S₂O₃]¹",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    // Flask 1 (High conc):
    if (step === 1) t[0] = { ...ppt(DENSE_SULFUR, FAINT_SULFUR, 0.65, 0.95), fizz: true };
    else if (step >= 2) t[0] = ppt(DENSE_SULFUR, OPAQUE_SULFUR, 0.65, 0.98);

    // Flask 2 (Medium conc):
    if (step === 3) t[1] = { ...ppt(DENSE_SULFUR, FAINT_SULFUR, 0.65, 0.9), fizz: true };
    else if (step >= 4) t[1] = ppt(DENSE_SULFUR, OPAQUE_SULFUR, 0.65, 0.95);

    // Flask 3 (Low conc):
    if (step === 5) t[2] = { ...ppt(DENSE_SULFUR, FAINT_SULFUR, 0.65, 0.8), fizz: true };
    else if (step >= 6) t[2] = ppt(DENSE_SULFUR, OPAQUE_SULFUR, 0.65, 0.9);

    return t;
  },
  summary: [
    {
      test: "Flask 1: 50 mL Na₂S₂O₃ + 0 mL H₂O + 5 mL HCl",
      obs: "Cross 'X' invisible at t₁ = 28 s",
      inf: "Highest rate: 1/t₁ = 0.0357 s⁻¹",
      eq: "Na₂S₂O₃ + 2HCl → 2NaCl + SO₂ + S↓ + H₂O",
      liquid: OPAQUE_SULFUR,
      ppt: DENSE_SULFUR,
    },
    {
      test: "Flask 2: 30 mL Na₂S₂O₃ + 20 mL H₂O + 5 mL HCl",
      obs: "Cross 'X' invisible at t₂ = 47 s",
      inf: "Medium rate: 1/t₂ = 0.0213 s⁻¹",
      eq: "Rate ∝ [Na₂S₂O₃]",
      liquid: OPAQUE_SULFUR,
      ppt: DENSE_SULFUR,
    },
    {
      test: "Flask 3: 10 mL Na₂S₂O₃ + 40 mL H₂O + 5 mL HCl",
      obs: "Cross 'X' invisible at t₃ = 140 s",
      inf: "Lowest rate: 1/t₃ = 0.0071 s⁻¹",
      eq: "Rate ∝ [Na₂S₂O₃]",
      liquid: OPAQUE_SULFUR,
      ppt: DENSE_SULFUR,
    },
    {
      test: "Kinetic Plot (1/t vs Concentration)",
      obs: "Straight line through origin",
      inf: "Reaction is 1st order in [Na₂S₂O₃]: Rate = k[Na₂S₂O₃]",
      eq: "Rate = k [Na₂S₂O₃]¹",
      liquid: OPAQUE_SULFUR,
      ppt: DENSE_SULFUR,
    },
  ],
  procedure: [
    "Mark a dark black cross 'X' on a white sheet of paper and place it beneath a 100 cm³ conical flask.",
    "Prepare five mixtures containing 50, 40, 30, 20, and 10 cm³ of 0.1 M Na₂S₂O₃ made up to 50 cm³ with distilled water.",
    "Add 5.0 cm³ of 1.0 M HCl to Flask 1 and start the stopwatch immediately while swirling once.",
    "Look vertically down through the mouth of the flask and stop the timer the instant the cross 'X' is no longer visible.",
    "Repeat the procedure for the remaining flasks and record the respective times t (in seconds).",
    "Calculate 1/t for each run and plot a graph of 1/t (y-axis) against Volume of Na₂S₂O₃ (x-axis).",
    "A straight line verifies that the rate of reaction is directly proportional to reactant concentration.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
