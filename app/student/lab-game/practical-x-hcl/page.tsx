"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol } from "../_practical/helpers";

const NA2CO3_CLEAR = "#f1f5f9"; // colourless standard sodium carbonate solution
const STRAW_YELLOW = "#f59e0b"; // methyl orange in basic medium (pH > 4.4)
const ORANGE_INTERMEDIATE = "#f97316"; // transitional colour with CO₂ effervescence
const ONION_PINK = "#f43f5e"; // permanent faint onion-pink / light red endpoint (pH 3.1–4.4)

const config: PracticalConfig = {
  title: "Molarity of HCl with Standard Na₂CO₃",
  kicker: "Volumetric Analysis",
  ionLabel: "HCl",
  radical: "Hydrochloric Acid (HCl)",
  group: "Class X Practical 2",
  grade: "X",
  reagents: [
    { id: "na2co3", color: "#f1f5f9", label: "0.1 M Na₂CO₃" },
    { id: "methylOrange", color: "#f59e0b", label: "Methyl Orange" },
    { id: "hcl", color: "#e0f2fe", label: "HCl Solution" },
    { id: "water", color: "#dbe9f4", label: "Dist. Water" },
  ],
  steps: [
    {
      tutor: "Pick up a test tube from the stand.",
      x: "pick up the test tube",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Add 10 mL standard 0.1 M Na₂CO₃ into the test tube.",
      x: "add 0.1 M Na₂CO₃",
      item: "na2co3",
      tube: 0,
      pour: "na2co3",
      pre: {
        title: "Primary Standard Solution",
        body: "Anhydrous sodium carbonate (Na₂CO₃) is a primary standard because it can be obtained in high chemical purity. Take 10.0 cm³ of 0.1 M standard base solution.",
      },
      post: {
        title: "Standard Na₂CO₃ Ready",
        body: "10.0 cm³ of 0.1 M standard sodium carbonate solution is placed in the tube.",
      },
    },
    {
      tutor: "Add 2 drops of Methyl Orange indicator.",
      x: "add Methyl Orange",
      item: "methylOrange",
      tube: 0,
      pour: "methylOrange",
      pre: {
        title: "Methyl Orange Indicator",
        body: "Methyl orange is yellow in basic solutions (pH > 4.4). It will change to permanent onion-pink / light orange-red at the acid-base equivalence point (pH 3.1–4.4).",
      },
      post: {
        title: "Straw-Yellow Colour",
        body: "In basic sodium carbonate medium, methyl orange gives a distinct straw-yellow colour.",
      },
    },
    {
      tutor: "Add given HCl solution dropwise to titrate the basic solution.",
      x: "titrate with HCl",
      item: "hcl",
      tube: 0,
      pour: "hcl",
      zoom: true,
      pre: {
        title: "Neutralization with CO₂ Evolution",
        body: "Add HCl dropwise with steady swirling. Sodium carbonate reacts with HCl producing salt, water, and carbon dioxide effervescence: Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑.",
      },
      post: {
        title: "CO₂ Effervescence & Neutralization",
        body: "1 mole of sodium carbonate neutralizes 2 moles of hydrochloric acid (n₁ = 1, n₂ = 2).",
        eq: "Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑",
      },
    },
    {
      tutor: "Add the final drop — stop when permanent onion-pink colour persists!",
      x: "reach the endpoint",
      item: "hcl",
      tube: 0,
      pour: "hcl",
      zoom: true,
      post: {
        title: "Onion-Pink Endpoint Reached!",
        body: "All carbonate is neutralized. The endpoint turns permanently onion-pink / light red at 10.10 cm³ of HCl consumed.",
        eq: "Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑",
      },
    },
    {
      tutor: "Take a fresh test tube from the stand for concordant Trial 2.",
      x: "pick up test tube",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Add 10 mL Na₂CO₃ and 2 drops Methyl Orange to Tube 1.",
      x: "add base & indicator",
      item: "na2co3",
      tube: 1,
      pour: "na2co3",
    },
    {
      tutor: "Titrate with HCl until permanent onion-pink colour persists.",
      x: "titrate to endpoint",
      item: "hcl",
      tube: 1,
      pour: "hcl",
      zoom: true,
      post: {
        title: "Concordant Reading = 10.10 cm³",
        body: "Trial 2 confirms endpoint at 10.10 cm³ of HCl. Molarity of HCl is calculated to be 0.198 M (Strength = 7.23 g/dm³).",
        eq: "M_HCl = (2 × M₁ × V₁) / V₂ = (2 × 0.10 × 10.0) / 10.10 = 0.198 M",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = sol(NA2CO3_CLEAR, 0.55, 0.7);
    else if (step === 2) t[0] = sol(STRAW_YELLOW, 0.58, 0.85);
    else if (step === 3) t[0] = { ...sol(ORANGE_INTERMEDIATE, 0.68, 0.85), fizz: true };
    else if (step >= 4) t[0] = sol(ONION_PINK, 0.76, 0.88);

    if (step >= 5) {
      if (step === 5) t[1] = sol(NA2CO3_CLEAR, 0.55, 0.7);
      else if (step === 6) t[1] = sol(STRAW_YELLOW, 0.58, 0.85);
      else if (step >= 7) t[1] = sol(ONION_PINK, 0.76, 0.88);
    }
    return t;
  },
  summary: [
    {
      test: "10 cm³ 0.1 M Na₂CO₃ + 2 drops Methyl Orange",
      obs: "Straw-yellow colour",
      inf: "Basic medium (pH > 4.4)",
      eq: "",
      liquid: STRAW_YELLOW,
      ppt: STRAW_YELLOW,
    },
    {
      test: "Titration with HCl (dropwise with swirling)",
      obs: "CO₂ effervescence, yellow → orange",
      inf: "Neutralization in progress",
      eq: "Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑",
      liquid: ORANGE_INTERMEDIATE,
      ppt: ORANGE_INTERMEDIATE,
    },
    {
      test: "Endpoint with HCl (at 10.10 cm³)",
      obs: "Permanent onion-pink colour",
      inf: "Complete neutralization (pH 3.1–4.4)",
      eq: "Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑",
      liquid: ONION_PINK,
      ppt: ONION_PINK,
    },
    {
      test: "Concordant Volumetric Calculation",
      obs: "Concordant V₂ = 10.10 cm³ HCl",
      inf: "Molarity of HCl = 0.198 M | Strength = 7.23 g/dm³",
      eq: "M_HCl = (2 × 0.10 × 10.0) / 10.10 = 0.198 M",
      liquid: ONION_PINK,
      ppt: ONION_PINK,
    },
  ],
  procedure: [
    "Take 10.0 cm³ of standard 0.1 M Na₂CO₃ solution in a clean reaction tube.",
    "Add 2 drops of methyl orange indicator (solution turns straw-yellow).",
    "Titrate with given HCl solution dropwise with continuous swirling.",
    "Stop when the solution turns permanently onion-pink / light red (V₂ = 10.10 cm³).",
    "Repeat the titration to obtain concordant readings and calculate the exact molarity of HCl.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
