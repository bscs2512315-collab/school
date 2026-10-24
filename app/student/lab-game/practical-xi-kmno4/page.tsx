"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol } from "../_practical/helpers";

const OXALIC_CLEAR = "#e0f2fe";
const TRANSIENT_VIOLET = "#c084fc";
const PALE_PINK_ENDPOINT = "#f472b6";
const DEEP_PURPLE_KMNO4 = "#4a044e";

const config: PracticalConfig = {
  title: "Standardization of KMnO₄ Solution Against Oxalic Acid",
  kicker: "Permanganometry & Redox Titration",
  ionLabel: "KMnO₄",
  radical: "Potassium Permanganate",
  group: "Class XI Practical 2",
  grade: "XI",
  reagents: [
    { id: "oxalic", color: "#dfe8ef", label: "0.1 M Oxalic Acid" },
    { id: "h2so4", color: "#e0f2fe", label: "Dilute H₂SO₄" },
    { id: "kmno4", color: DEEP_PURPLE_KMNO4, label: "KMnO₄ Solution" },
    { id: "burner", color: "#f59e0b", label: "Bunsen Burner" },
  ],
  steps: [
    {
      tutor: "Pick up the reaction conical flask (Tube 1) from the stand.",
      x: "pick up conical flask",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Add 10 mL of 0.1 M standard Oxalic Acid into the flask.",
      x: "add 10 mL Oxalic Acid",
      item: "oxalic",
      tube: 0,
      pour: "oxalic",
      pre: {
        title: "Primary Reducing Agent",
        body: "Pipette accurately 10.0 cm³ of standard 0.1 M hydrated oxalic acid solution into a clean conical flask.",
      },
      post: {
        title: "Standard Oxalic Acid Ready",
        body: "10.0 cm³ of 0.1 M oxalic acid solution is charged in the reaction flask.",
      },
    },
    {
      tutor: "Add 10 mL of 1 M dilute H₂SO₄ to acidify the solution.",
      x: "add dilute H₂SO₄",
      item: "h2so4",
      tube: 0,
      pour: "h2so4",
      pre: {
        title: "Acidic Medium Role",
        body: "Dilute H₂SO₄ provides the H⁺ ions required for reduction of MnO₄⁻ to colorless Mn²⁺ (Mn⁺⁷ → Mn⁺²) and prevents precipitation of insoluble brown MnO₂.",
      },
      post: {
        title: "Acidic Medium Created",
        body: "Solution is strongly acidic with sulfate ions.",
      },
    },
    {
      tutor: "Heat the flask gently on the Bunsen burner to 60–70 °C.",
      x: "heat to 60–70 °C",
      item: "tube",
      tube: 0,
      heat: true,
      zoom: true,
      pre: {
        title: "Thermal Activation (60–70 °C)",
        body: "The uncatalyzed reaction between MnO₄⁻ and C₂O₄²⁻ has high activation energy. Heating to 60–70 °C ensures immediate reaction with the first drop of KMnO₄.",
      },
      post: {
        title: "Heated to 65 °C",
        body: "The warm solution is ready for smooth, rapid redox titration.",
        eq: "Temperature = 60–70 °C",
      },
    },
    {
      tutor: "Titrate hot solution with KMnO₄ dropwise with vigorous swirling.",
      x: "titrate with KMnO₄",
      item: "kmno4",
      tube: 0,
      pour: "kmno4",
      zoom: true,
      pre: {
        title: "Self-Indicator Redox Action",
        body: "KMnO₄ acts as its own indicator. The dark purple permanganate ion is instantly reduced by hot oxalate into colorless Mn²⁺ with CO₂ effervescence.",
      },
      post: {
        title: "Rapid Decolorization with CO₂ Evolution",
        body: "Purple KMnO₄ decolorizes completely as it oxidizes oxalic acid: 2MnO₄⁻ + 5C₂O₄²⁻ + 16H⁺ → 2Mn²⁺ + 10CO₂↑ + 8H₂O.",
        eq: "2KMnO₄ + 5H₂C₂O₄ + 3H₂SO₄ → K₂SO₄ + 2MnSO₄ + 10CO₂↑ + 8H₂O",
      },
    },
    {
      tutor: "Continue dropwise titration until a permanent faint pink color persists for 30 seconds.",
      x: "reach permanent faint pink endpoint",
      item: "kmno4",
      tube: 0,
      pour: "kmno4",
      zoom: true,
      post: {
        title: "Permanent Pale Pink Endpoint (V₁ = 19.80 cm³)",
        body: "All oxalic acid has been completely oxidized. A single extra unreacted drop of KMnO₄ imparts a permanent faint pink color to the solution.",
        eq: "Burette Reading V₁ = 19.80 cm³",
      },
    },
    {
      tutor: "Pick up Conical Flask 2 (Tube 2) for Trial 2.",
      x: "pick up Flask 2",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Titrate Trial 2 (10 mL Oxalic Acid + 10 mL H₂SO₄, heated to 65 °C) with KMnO₄ to concordant endpoint.",
      x: "titrate Trial 2",
      item: "kmno4",
      tube: 1,
      pour: "kmno4",
      zoom: true,
      post: {
        title: "Concordant Reading = 19.80 cm³ → Molarity Confirmed",
        body: "Trial 2 confirms concordant volume at 19.80 cm³. Molarity of KMnO₄ is determined to be 0.0202 M (Strength = 3.19 g/dm³).",
        eq: "M_KMnO₄ = (2 × M_acid × V_acid) / (5 × V_KMnO₄) = (2 × 0.10 × 10.0) / (5 × 19.80) = 0.0202 M",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    // Tube 0 (Trial 1):
    if (step === 1) t[0] = sol(OXALIC_CLEAR, 0.45, 0.7);
    else if (step === 2) t[0] = sol(OXALIC_CLEAR, 0.58, 0.7);
    else if (step === 3) t[0] = sol(OXALIC_CLEAR, 0.58, 0.75);
    else if (step === 4) t[0] = { ...sol(TRANSIENT_VIOLET, 0.68, 0.8), fizz: true };
    else if (step >= 5) t[0] = sol(PALE_PINK_ENDPOINT, 0.76, 0.85);

    // Tube 1 (Trial 2):
    if (step === 6) t[1] = sol(OXALIC_CLEAR, 0.58, 0.7);
    else if (step >= 7) t[1] = sol(PALE_PINK_ENDPOINT, 0.76, 0.85);

    return t;
  },
  summary: [
    {
      test: "10 cm³ 0.1 M Oxalic Acid + 10 cm³ dil. H₂SO₄ (heated to 65 °C)",
      obs: "Hot clear colorless solution",
      inf: "Acidified reducing agent ready",
      eq: "H₂C₂O₄ + H₂SO₄ (aq)",
      liquid: OXALIC_CLEAR,
      ppt: OXALIC_CLEAR,
    },
    {
      test: "Titration with dark purple KMnO₄ (initial drops)",
      obs: "Purple drops decolorize with brisk effervescence",
      inf: "Redox reaction in progress: Mn⁺⁷ → Mn⁺² (colorless)",
      eq: "2MnO₄⁻ + 5C₂O₄²⁻ + 16H⁺ → 2Mn²⁺ + 10CO₂↑ + 8H₂O",
      liquid: TRANSIENT_VIOLET,
      ppt: TRANSIENT_VIOLET,
    },
    {
      test: "Endpoint with KMnO₄ (at 19.80 cm³)",
      obs: "Permanent faint pink colour persists >30s",
      inf: "Complete redox equivalence (Self-Indicator)",
      eq: "2KMnO₄ + 5H₂C₂O₄ + 3H₂SO₄ → K₂SO₄ + 2MnSO₄ + 10CO₂ + 8H₂O",
      liquid: PALE_PINK_ENDPOINT,
      ppt: PALE_PINK_ENDPOINT,
    },
    {
      test: "Concordant Volumetric Calculation",
      obs: "Concordant V = 19.80 cm³ KMnO₄",
      inf: "Molarity = 0.0202 M | Strength = 3.19 g/dm³",
      eq: "M = (2 × 0.10 × 10.0) / (5 × 19.80) = 0.0202 M",
      liquid: PALE_PINK_ENDPOINT,
      ppt: PALE_PINK_ENDPOINT,
    },
  ],
  procedure: [
    "Fill a clean burette with standard KMnO₄ solution and record the initial reading (upper meniscus).",
    "Pipette 10.0 cm³ of 0.1 M standard oxalic acid solution into a clean 250 cm³ conical flask.",
    "Add 10.0 cm³ of 1 M dilute sulfuric acid (H₂SO₄) to provide an acidic medium.",
    "Heat the contents of the flask on a wire gauze to 60–70 °C (until steam begins to rise).",
    "Titrate the hot mixture against KMnO₄ solution dropwise with vigorous swirling.",
    "The dark purple color of KMnO₄ will decolorize instantly as CO₂ gas evolves.",
    "Stop titration when a permanent faint pink color persists throughout the solution for at least 30 seconds.",
    "Repeat the titration to obtain three concordant readings and calculate the exact molarity of KMnO₄.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
