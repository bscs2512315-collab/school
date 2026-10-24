"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol } from "../_practical/helpers";

const CLEAR_SAMPLE = "#e2e8f0"; // clear colorless liquid
const RED_PH1 = "#dc2626"; // pH 1.0 strong acid (red)
const ORANGE_PH3 = "#ea580c"; // pH 3.0 weak acid (orange)
const GREEN_PH7 = "#16a34a"; // pH 7.0 neutral (green)
const BLUE_PH9 = "#0d9488"; // pH 9.0 weak base (teal/blue-green)
const VIOLET_PH13 = "#6b21a8"; // pH 13.0 strong base (deep violet)

const config: PracticalConfig = {
  title: "Determination of pH of Solutions",
  kicker: "pH & Indicators",
  ionLabel: "pH Scale",
  radical: "pH & Nature of Solutions",
  group: "Class X Practical 3",
  grade: "X",
  reagents: [
    { id: "hcl", color: "#e0f2fe", label: "0.1 M HCl" },
    { id: "vinegar", color: "#fef3c7", label: "Vinegar (CH₃COOH)" },
    { id: "water", color: "#dbe9f4", label: "Dist. Water" },
    { id: "soap", color: "#e0e7ff", label: "Soap Solution" },
    { id: "naoh", color: "#e0f2fe", label: "0.1 M NaOH" },
    { id: "indicator", color: "#15803d", label: "Universal Indicator" },
  ],
  steps: [
    // -------------------------------------------------------------
    // TUBE 1: 0.1 M HCl (pH 1.0)
    // -------------------------------------------------------------
    {
      tutor: "Pick up Test Tube 1 from the stand.",
      x: "pick up Tube 1",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Add 5 mL of 0.1 M HCl solution into Test Tube 1.",
      x: "add 0.1 M HCl",
      item: "hcl",
      tube: 0,
      pour: "hcl",
      pre: {
        title: "Sample 1: 0.1 M HCl",
        body: "Hydrochloric acid is a strong mineral acid that completely dissociates into H⁺ and Cl⁻ ions in aqueous solution.",
      },
      post: {
        title: "Colorless HCl in Tube 1",
        body: "5 mL of clear, colorless 0.1 M HCl solution is placed in Test Tube 1.",
      },
    },
    {
      tutor: "Add 2–3 drops of Universal Indicator to Test Tube 1.",
      x: "add Universal Indicator",
      item: "indicator",
      tube: 0,
      pour: "indicator",
      zoom: true,
      post: {
        title: "Vibrant Red (pH 1.0) → Strong Acid",
        body: "Universal indicator turns deep vibrant red at pH 1.0, confirming a strongly acidic solution.",
        eq: "pH = −log₁₀[H⁺] = −log₁₀(0.1) = 1.0",
      },
    },

    // -------------------------------------------------------------
    // TUBE 2: Vinegar (pH 3.0)
    // -------------------------------------------------------------
    {
      tutor: "Pick up Test Tube 2 from the stand.",
      x: "pick up Tube 2",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Add 5 mL of Vinegar (acetic acid) into Test Tube 2.",
      x: "add Vinegar",
      item: "vinegar",
      tube: 1,
      pour: "vinegar",
      pre: {
        title: "Sample 2: Vinegar (CH₃COOH)",
        body: "Vinegar is dilute acetic acid, a weak organic acid that partially ionizes in aqueous solution.",
      },
      post: {
        title: "Colorless Vinegar in Tube 2",
        body: "5 mL of clear Vinegar is placed in Test Tube 2.",
      },
    },
    {
      tutor: "Add 2–3 drops of Universal Indicator to Test Tube 2.",
      x: "add Universal Indicator",
      item: "indicator",
      tube: 1,
      pour: "indicator",
      zoom: true,
      post: {
        title: "Orange-Yellow (pH 3.0) → Weak Acid",
        body: "Universal indicator turns orange-yellow at pH ~3.0, confirming a weakly acidic solution.",
        eq: "CH₃COOH ⇌ CH₃COO⁻ + H⁺ (pH ≈ 2.8–3.0)",
      },
    },

    // -------------------------------------------------------------
    // TUBE 3: Distilled Water (pH 7.0)
    // -------------------------------------------------------------
    {
      tutor: "Pick up Test Tube 3 from the stand.",
      x: "pick up Tube 3",
      item: "tube",
      tube: 2,
    },
    {
      tutor: "Add 5 mL of Distilled Water into Test Tube 3.",
      x: "add Distilled Water",
      item: "water",
      tube: 2,
      pour: "water",
      pre: {
        title: "Sample 3: Distilled Water",
        body: "Pure distilled water has balanced H⁺ and OH⁻ ions at 25°C: [H⁺] = [OH⁻] = 1.0 × 10⁻⁷ M.",
      },
      post: {
        title: "Pure Water in Tube 3",
        body: "5 mL of clear distilled water is placed in Test Tube 3.",
      },
    },
    {
      tutor: "Add 2–3 drops of Universal Indicator to Test Tube 3.",
      x: "add Universal Indicator",
      item: "indicator",
      tube: 2,
      pour: "indicator",
      zoom: true,
      post: {
        title: "Grass Green (pH 7.0) → Neutral",
        body: "Universal indicator turns crisp grass-green at pH 7.0, confirming neutral water.",
        eq: "[H⁺] = [OH⁻] = 10⁻⁷ M ⇒ pH = 7.0",
      },
    },

    // -------------------------------------------------------------
    // TUBE 4: Soap Solution (pH 9.0)
    // -------------------------------------------------------------
    {
      tutor: "Pick up Test Tube 4 from the stand.",
      x: "pick up Tube 4",
      item: "tube",
      tube: 3,
    },
    {
      tutor: "Add 5 mL of Soap Solution into Test Tube 4.",
      x: "add Soap Solution",
      item: "soap",
      tube: 3,
      pour: "soap",
      pre: {
        title: "Sample 4: Soap Solution",
        body: "Soap is a sodium salt of fatty acids. Hydrolysis of carboxylate ions produces a mild excess of hydroxide ions (OH⁻).",
      },
      post: {
        title: "Soap Solution in Tube 4",
        body: "5 mL of soap solution is placed in Test Tube 4.",
      },
    },
    {
      tutor: "Add 2–3 drops of Universal Indicator to Test Tube 4.",
      x: "add Universal Indicator",
      item: "indicator",
      tube: 3,
      pour: "indicator",
      zoom: true,
      post: {
        title: "Blue Colour (pH 9.0) → Weak Base",
        body: "Universal indicator turns distinct blue at pH ~9.0, indicating a mildly alkaline solution.",
        eq: "RCOO⁻ + H₂O ⇌ RCOOH + OH⁻ (pH ≈ 9.0)",
      },
    },

    // -------------------------------------------------------------
    // TUBE 5: 0.1 M NaOH (pH 13.0)
    // -------------------------------------------------------------
    {
      tutor: "Pick up Test Tube 5 from the stand.",
      x: "pick up Tube 5",
      item: "tube",
      tube: 4,
    },
    {
      tutor: "Add 5 mL of 0.1 M NaOH solution into Test Tube 5.",
      x: "add 0.1 M NaOH",
      item: "naoh",
      tube: 4,
      pour: "naoh",
      pre: {
        title: "Sample 5: 0.1 M NaOH",
        body: "0.1 M sodium hydroxide completely dissociates into Na⁺ and OH⁻ ions: [OH⁻] = 0.1 M, pOH = 1.0, pH = 13.0.",
      },
      post: {
        title: "Colorless NaOH in Tube 5",
        body: "5 mL of clear 0.1 M NaOH solution is placed in Test Tube 5.",
      },
    },
    {
      tutor: "Add 2–3 drops of Universal Indicator to Test Tube 5.",
      x: "add Universal Indicator",
      item: "indicator",
      tube: 4,
      pour: "indicator",
      zoom: true,
      post: {
        title: "Deep Violet / Purple (pH 13.0) → Strong Base",
        body: "Universal indicator turns deep violet/purple at pH 13.0, confirming a strongly alkaline caustic solution.",
        eq: "pH = 14 − pOH = 14 − 1.0 = 13.0",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    // Tube 0 (HCl): step 1 = clear HCl, step >= 2 = Red (pH 1)
    if (step === 1) t[0] = sol(CLEAR_SAMPLE, 0.55, 0.7);
    else if (step >= 2) t[0] = sol(RED_PH1, 0.65, 0.9);

    // Tube 1 (Vinegar): step 4 = clear Vinegar, step >= 5 = Orange (pH 3)
    if (step === 4) t[1] = sol(CLEAR_SAMPLE, 0.55, 0.7);
    else if (step >= 5) t[1] = sol(ORANGE_PH3, 0.65, 0.9);

    // Tube 2 (Water): step 7 = clear Water, step >= 8 = Green (pH 7)
    if (step === 7) t[2] = sol(CLEAR_SAMPLE, 0.55, 0.7);
    else if (step >= 8) t[2] = sol(GREEN_PH7, 0.65, 0.9);

    // Tube 3 (Soap): step 10 = clear Soap, step >= 11 = Blue (pH 9)
    if (step === 10) t[3] = sol(CLEAR_SAMPLE, 0.55, 0.7);
    else if (step >= 11) t[3] = sol(BLUE_PH9, 0.65, 0.9);

    // Tube 4 (NaOH): step 13 = clear NaOH, step >= 14 = Violet (pH 13)
    if (step === 13) t[4] = sol(CLEAR_SAMPLE, 0.55, 0.7);
    else if (step >= 14) t[4] = sol(VIOLET_PH13, 0.65, 0.9);

    return t;
  },
  summary: [
    {
      test: "0.1 M HCl + Universal Indicator",
      obs: "Colorless liquid turns vibrant red",
      inf: "pH = 1.0 (Strongly Acidic)",
      eq: "pH = −log₁₀[H⁺] = 1.0",
      liquid: RED_PH1,
      ppt: RED_PH1,
    },
    {
      test: "Vinegar (CH₃COOH) + Universal Indicator",
      obs: "Colorless liquid turns orange-yellow",
      inf: "pH = 3.0 (Weakly Acidic)",
      eq: "CH₃COOH ⇌ CH₃COO⁻ + H⁺",
      liquid: ORANGE_PH3,
      ppt: ORANGE_PH3,
    },
    {
      test: "Distilled Water + Universal Indicator",
      obs: "Colorless water turns grass green",
      inf: "pH = 7.0 (Neutral)",
      eq: "[H⁺] = [OH⁻] = 10⁻⁷ M",
      liquid: GREEN_PH7,
      ppt: GREEN_PH7,
    },
    {
      test: "Soap Solution + Universal Indicator",
      obs: "Liquid turns distinct blue",
      inf: "pH = 9.0 (Mildly Basic)",
      eq: "RCOO⁻ + H₂O ⇌ RCOOH + OH⁻",
      liquid: BLUE_PH9,
      ppt: BLUE_PH9,
    },
    {
      test: "0.1 M NaOH + Universal Indicator",
      obs: "Colorless liquid turns deep violet / purple",
      inf: "pH = 13.0 (Strongly Basic)",
      eq: "pH = 14 − pOH = 13.0",
      liquid: VIOLET_PH13,
      ppt: VIOLET_PH13,
    },
  ],
  procedure: [
    "Arrange five clean test tubes labeled 1 to 5 in the test tube rack.",
    "Add 5 mL of 0.1 M HCl, Vinegar, Distilled Water, Soap Solution, and 0.1 M NaOH into tubes 1–5 respectively.",
    "Add 2–3 drops of Universal Indicator solution to each test tube and gently swirl.",
    "Observe the instantaneous colour transformation in each tube against the standard universal pH chart.",
    "Classify samples as strongly acidic (red), weakly acidic (orange), neutral (green), weakly basic (blue), or strongly basic (violet).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
