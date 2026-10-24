"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol } from "../_practical/helpers";

const BROWN_IODINE = "#78350f";
const STRAW_YELLOW = "#fef08a";
const DEEP_NAVY_BLUE = "#1e3a8a";
const CLEAR_ENDPOINT = "#f8fafc";

const config: PracticalConfig = {
  title: "Iodometric Standardization of Sodium Thiosulphate",
  kicker: "Iodometry & Indirect Redox Titration",
  ionLabel: "Na₂S₂O₃",
  radical: "Sodium Thiosulphate",
  group: "Class XI Practical 4",
  grade: "XI",
  reagents: [
    { id: "iodineMix", color: BROWN_IODINE, label: "0.01M KIO₃ + KI + H₂SO₄" },
    { id: "thiosulphate", color: "#e0f2fe", label: "Na₂S₂O₃ Solution" },
    { id: "starchIndicator", color: "#f1f5f9", label: "Starch Indicator" },
  ],
  steps: [
    {
      tutor: "Pick up the reaction conical flask (Tube 1) from the stand.",
      x: "pick up conical flask",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Add 10 mL 0.01 M KIO₃ + 10 mL KI + 5 mL dil. H₂SO₄ to liberate Iodine.",
      x: "liberate Iodine (I₂)",
      item: "iodineMix",
      tube: 0,
      pour: "iodineMix",
      pre: {
        title: "Quantitative Iodine Liberation",
        body: "Potassium iodate oxidizes iodide ions in acidic medium to liberate a stoichiometric quantity of dark brown free iodine: IO₃⁻ + 5I⁻ + 6H⁺ → 3I₂ + 3H₂O.",
      },
      post: {
        title: "Deep Brown Iodine Solution Formed",
        body: "Liberated iodine forms the brown tri-iodide complex (I₃⁻). Ready for titration against thiosulphate.",
        eq: "IO₃⁻ + 5I⁻ + 6H⁺ → 3I₂ + 3H₂O",
      },
    },
    {
      tutor: "Titrate with Na₂S₂O₃ until the dark brown color fades to light straw-yellow.",
      x: "titrate to straw-yellow",
      item: "thiosulphate",
      tube: 0,
      pour: "thiosulphate",
      zoom: true,
      pre: {
        title: "Pre-Indicator Titration",
        body: "Sodium thiosulphate reduces iodine to iodide: I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻. Titrate until only a trace of iodine remains (straw-yellow) before adding starch.",
      },
      post: {
        title: "Straw-Yellow Colour Reached",
        body: "Most iodine is reduced. Solution is light straw-yellow, ready for starch indicator addition.",
        eq: "I₂ + 2Na₂S₂O₃ → 2NaI + Na₂S₄O₆ (Sodium Tetrathionate)",
      },
    },
    {
      tutor: "Add 2–3 drops of freshly prepared 1% Starch Indicator using the dropper.",
      x: "add Starch Indicator",
      item: "starchIndicator",
      tube: 0,
      pour: "starchIndicator",
      zoom: true,
      pre: {
        title: "Starch-Iodine Complex Formation",
        body: "Starch helical amylose chains trap residual tri-iodide ions forming an intensely colored deep navy-blue inclusion complex.",
      },
      post: {
        title: "Intense Deep Navy-Blue Complex Formed!",
        body: "The solution turns vivid navy-blue, providing a razor-sharp visible endpoint.",
      },
    },
    {
      tutor: "Continue dropwise titration with Na₂S₂O₃ until the blue color is completely discharged to colorless.",
      x: "reach sharp colorless endpoint",
      item: "thiosulphate",
      tube: 0,
      pour: "thiosulphate",
      zoom: true,
      post: {
        title: "Sharp Colorless Endpoint (V₁ = 20.30 cm³)",
        body: "The last trace of iodine is completely reduced, causing instantaneous discharge of the blue complex to water-clear.",
        eq: "Burette Reading V₁ = 20.30 cm³",
      },
    },
    {
      tutor: "Pick up Conical Flask 2 (Tube 2) for Trial 2.",
      x: "pick up Flask 2",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Titrate Trial 2 with Na₂S₂O₃ to concordant sharp colorless endpoint.",
      x: "titrate Trial 2",
      item: "thiosulphate",
      tube: 1,
      pour: "thiosulphate",
      zoom: true,
      post: {
        title: "Concordant Reading = 20.30 cm³ → Molarity Confirmed",
        body: "Trial 2 confirms concordant volume at 20.30 cm³. Exact molarity of Na₂S₂O₃ is calculated to be 0.0985 M.",
        eq: "M_thiosulphate = (6 × M_KIO₃ × V_KIO₃) / V_thiosulphate = (6 × 0.01 × 10.0) / 20.30 = 0.0985 M",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    // Tube 0 (Trial 1):
    if (step === 1) t[0] = sol(BROWN_IODINE, 0.55, 0.9);
    else if (step === 2) t[0] = sol(STRAW_YELLOW, 0.65, 0.85);
    else if (step === 3) t[0] = sol(DEEP_NAVY_BLUE, 0.72, 0.95);
    else if (step >= 4) t[0] = sol(CLEAR_ENDPOINT, 0.8, 0.75);

    // Tube 1 (Trial 2):
    if (step === 5) t[1] = sol(BROWN_IODINE, 0.55, 0.9);
    else if (step >= 6) t[1] = sol(CLEAR_ENDPOINT, 0.8, 0.75);

    return t;
  },
  summary: [
    {
      test: "10 cm³ 0.01M KIO₃ + 10% KI + dil. H₂SO₄",
      obs: "Deep reddish-brown solution",
      inf: "Stoichiometric liberation of free Iodine (I₂)",
      eq: "IO₃⁻ + 5I⁻ + 6H⁺ → 3I₂ + 3H₂O",
      liquid: BROWN_IODINE,
      ppt: BROWN_IODINE,
    },
    {
      test: "Titration with Na₂S₂O₃ to straw yellow",
      obs: "Brown color fades to light straw-yellow",
      inf: "Major portion of I₂ reduced to I⁻",
      eq: "I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻",
      liquid: STRAW_YELLOW,
      ppt: STRAW_YELLOW,
    },
    {
      test: "Addition of 1% Starch Indicator",
      obs: "Instantaneous deep navy blue colour",
      inf: "Starch-iodine inclusion complex formed",
      eq: "Amylose + I₃⁻ → [Starch-Iodine Complex] (Blue)",
      liquid: DEEP_NAVY_BLUE,
      ppt: DEEP_NAVY_BLUE,
    },
    {
      test: "Final dropwise titration to endpoint",
      obs: "Blue color completely discharged to clear colorless",
      inf: "Complete reduction of I₂; Concordant V = 20.30 cm³",
      eq: "M_thiosulphate = (6 × 0.01 × 10.0) / 20.30 = 0.0985 M",
      liquid: CLEAR_ENDPOINT,
      ppt: CLEAR_ENDPOINT,
    },
  ],
  procedure: [
    "Fill a clean burette with sodium thiosulphate (Na₂S₂O₃) solution and set meniscus to zero.",
    "Pipette 10.0 cm³ of standard 0.01 M KIO₃ solution into a conical flask.",
    "Add 10.0 cm³ of 10% KI solution followed by 5.0 cm³ of 1 M dilute H₂SO₄ (solution turns deep brown).",
    "Titrate against Na₂S₂O₃ solution until the brown colour fades to a pale straw-yellow.",
    "Add 2–3 drops of freshly prepared 1% starch indicator solution (turns intense navy-blue).",
    "Continue dropwise titration with continuous swirling until the blue color is sharply discharged to completely colorless.",
    "Repeat the titration for concordant burette readings and calculate the exact molarity of Na₂S₂O₃.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
