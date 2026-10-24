"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol } from "../_practical/helpers";

const OXALIC_CLEAR = "#dfe7ee"; // colourless standard oxalic acid solution
const TRANSIENT_PINK = "#fbcfe8"; // momentary pink flash before swirling
const FAINT_PINK = "#f472b6"; // permanent faint pink endpoint (pH 8.3–10.0)

const config: PracticalConfig = {
  title: "Standardization of NaOH Solution",
  kicker: "Volumetric Analysis",
  ionLabel: "NaOH",
  radical: "Sodium Hydroxide (NaOH)",
  group: "Class X Practical 1",
  grade: "X",
  reagents: [
    { id: "oxalic", color: "#dfe8ef", label: "0.1 M Oxalic Acid" },
    { id: "phenolphthalein", color: "#fae8ff", label: "Phenolphthalein" },
    { id: "naoh", color: "#e0f2fe", label: "NaOH Solution" },
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
      tutor: "Add 10 mL standard 0.1 M Oxalic Acid into the test tube.",
      x: "add 0.1 M Oxalic Acid",
      item: "oxalic",
      tube: 0,
      pour: "oxalic",
      pre: {
        title: "Standard Primary Solution",
        body: "Oxalic acid (H₂C₂O₄·2H₂O) is a primary standard because it is available in pure crystalline form. Take 10.0 cm³ of 0.1 M standard acid solution.",
      },
      post: {
        title: "Standard Acid Ready",
        body: "10.0 cm³ of 0.1 M standard oxalic acid solution is placed in the tube.",
      },
    },
    {
      tutor: "Add 2 drops of Phenolphthalein indicator.",
      x: "add Phenolphthalein",
      item: "phenolphthalein",
      tube: 0,
      pour: "phenolphthalein",
      pre: {
        title: "Indicator in Acid Medium",
        body: "Phenolphthalein is colourless in acidic medium (pH < 8.3). It will turn faint pink when all acid is neutralized by base.",
      },
      post: {
        title: "Solution remains Colourless",
        body: "In acidic medium, phenolphthalein remains completely colourless.",
      },
    },
    {
      tutor: "Add NaOH solution dropwise with continuous swirling.",
      x: "titrate with NaOH",
      item: "naoh",
      tube: 0,
      pour: "naoh",
      zoom: true,
      pre: {
        title: "Neutralization Reaction",
        body: "Add NaOH solution dropwise with continuous swirling. NaOH neutralizes the oxalic acid: H₂C₂O₄ + 2NaOH → Na₂C₂O₄ + 2H₂O.",
      },
      post: {
        title: "Neutralizing Acid",
        body: "Neutralization proceeds: 1 mole of dibasic oxalic acid neutralizes 2 moles of monobasic sodium hydroxide (n₁ = 1, n₂ = 2).",
        eq: "H₂C₂O₄ + 2NaOH → Na₂C₂O₄ + 2H₂O",
      },
    },
    {
      tutor: "Add the final drop — stop when permanent faint pink colour persists!",
      x: "reach the endpoint",
      item: "naoh",
      tube: 0,
      pour: "naoh",
      zoom: true,
      post: {
        title: "Permanent Faint Pink Endpoint!",
        body: "All oxalic acid is neutralized. A single excess drop of NaOH raises pH > 8.3, turning phenolphthalein permanently faint pink! Exact volume of NaOH consumed = 10.10 cm³.",
        eq: "H₂C₂O₄ + 2NaOH → Na₂C₂O₄ + 2H₂O",
      },
    },
    {
      tutor: "Take a fresh test tube from the stand for concordant Trial 2.",
      x: "pick up test tube",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Add 10 mL Oxalic Acid and 2 drops Phenolphthalein to Tube 1.",
      x: "add acid & indicator",
      item: "oxalic",
      tube: 1,
      pour: "oxalic",
    },
    {
      tutor: "Titrate with NaOH until permanent faint pink colour persists.",
      x: "titrate to endpoint",
      item: "naoh",
      tube: 1,
      pour: "naoh",
      zoom: true,
      post: {
        title: "Concordant Reading = 10.10 cm³",
        body: "Trial 2 confirms endpoint at 10.10 cm³ of NaOH. Molarity of NaOH is calculated to be 0.198 M (Strength = 7.92 g/dm³).",
        eq: "M₂ = (2 × M₁ × V₁) / V₂ = (2 × 0.10 × 10.0) / 10.10 = 0.198 M",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = sol(OXALIC_CLEAR, 0.55, 0.7);
    else if (step === 2) t[0] = sol(OXALIC_CLEAR, 0.58, 0.7);
    else if (step === 3) t[0] = sol(TRANSIENT_PINK, 0.68, 0.75);
    else if (step >= 4) t[0] = sol(FAINT_PINK, 0.76, 0.85);

    if (step >= 5) {
      if (step === 5) t[1] = sol(OXALIC_CLEAR, 0.55, 0.7);
      else if (step === 6) t[1] = sol(OXALIC_CLEAR, 0.58, 0.7);
      else if (step >= 7) t[1] = sol(FAINT_PINK, 0.76, 0.85);
    }
    return t;
  },
  summary: [
    {
      test: "10 cm³ 0.1 M Oxalic Acid + 2 drops Phenolphthalein",
      obs: "Colourless solution",
      inf: "Acidic medium (pH < 8.3)",
      eq: "",
      liquid: OXALIC_CLEAR,
      ppt: OXALIC_CLEAR,
    },
    {
      test: "Titration with NaOH (dropwise with swirling)",
      obs: "Transient pink flashes upon swirling",
      inf: "Neutralization in progress",
      eq: "H₂C₂O₄ + 2NaOH → Na₂C₂O₄ + 2H₂O",
      liquid: TRANSIENT_PINK,
      ppt: TRANSIENT_PINK,
    },
    {
      test: "Endpoint with NaOH (at 10.10 cm³)",
      obs: "Permanent faint pink colour",
      inf: "Complete neutralization (pH 8.3–10.0)",
      eq: "H₂C₂O₄ + 2NaOH → Na₂C₂O₄ + 2H₂O",
      liquid: FAINT_PINK,
      ppt: FAINT_PINK,
    },
    {
      test: "Concordant Volumetric Calculation",
      obs: "Concordant V₂ = 10.10 cm³ NaOH",
      inf: "Molarity of NaOH = 0.198 M | Strength = 7.92 g/dm³",
      eq: "M_NaOH = (2 × 0.10 × 10.0) / 10.10 = 0.198 M",
      liquid: FAINT_PINK,
      ppt: FAINT_PINK,
    },
  ],
  procedure: [
    "Take 10.0 cm³ of standard 0.1 M oxalic acid solution in a clean reaction tube.",
    "Add 2 drops of phenolphthalein indicator (solution remains colourless).",
    "Titrate with given NaOH solution dropwise with continuous swirling.",
    "Stop when a permanent faint pink colour appears throughout the solution (V₂ = 10.10 cm³).",
    "Repeat the titration to obtain concordant readings and calculate the exact molarity of NaOH.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
