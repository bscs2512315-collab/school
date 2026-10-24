"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol } from "../_practical/helpers";

const CLEAR_SOL = "#e2e8f0";
const STANDARD_SOL = "#e0f2fe";

const config: PracticalConfig = {
  title: "Preparation of 0.1 M Standard Na₂CO₃ Solution",
  kicker: "Volumetric Analysis & Primary Standard",
  ionLabel: "0.100 M Na₂CO₃",
  radical: "Sodium Carbonate (Anhydrous)",
  group: "Class IX Practical 4",
  grade: "IX",
  reagents: [
    { id: "salt", color: "#f8fafc", label: "Pure Anhydrous Na₂CO₃" },
    { id: "water", color: "#dbe9f4", label: "Distilled Water" },
    { id: "flask", color: "#e2e8f0", label: "100 mL Vol. Flask" },
    { id: "washBottle", color: "#93c5fd", label: "Wash Bottle" },
  ],
  steps: [
    {
      tutor: "Pick up the clean reaction beaker (Tube 1).",
      x: "pick up beaker",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Weigh and transfer 1.060 g of pure anhydrous Na₂CO₃ powder into the beaker.",
      x: "add 1.060 g Na₂CO₃",
      item: "salt",
      tube: 0,
      pre: {
        title: "Primary Standard Mass Calculation",
        body: "Mass = Molarity × Molar Mass × Volume(dm³) = 0.10 × 106.0 × 0.100 = 1.060 g of pure anhydrous Na₂CO₃.",
      },
      post: {
        title: "1.060 g Na₂CO₃ Weighed",
        body: "Accurately weighed 1.060 g of dry, pure anhydrous sodium carbonate in the beaker.",
        eq: "Mass = 0.10 mol/dm³ × 106.0 g/mol × 0.100 dm³ = 1.060 g",
      },
    },
    {
      tutor: "Add 40 mL of distilled water to dissolve the sodium carbonate powder.",
      x: "add 40 mL distilled water",
      item: "water",
      tube: 0,
      pour: "water",
      pre: {
        title: "Initial Dissolution",
        body: "Dissolve the weighed solid completely in about 40 cm³ of distilled water using a clean glass stirring rod.",
      },
      post: {
        title: "Distilled Water Added",
        body: "Solid is suspended in 40 mL distilled water ready for complete dissolution.",
      },
    },
    {
      tutor: "Swirl the beaker to completely dissolve all sodium carbonate powder.",
      x: "swirl to dissolve",
      item: "tube",
      tube: 0,
      anim: "shake",
      post: {
        title: "Salt Completely Dissolved",
        body: "Clear, transparent aqueous sodium carbonate solution is formed without any residual particles.",
      },
    },
    {
      tutor: "Pick up the 100 mL Volumetric Measuring Flask (Tube 2) from the stand.",
      x: "pick up 100 mL Vol. Flask",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Quantitatively transfer the solution into the 100 mL volumetric flask using a glass funnel.",
      x: "transfer to 100 mL flask",
      item: "flask",
      tube: 1,
      pour: "water",
      zoom: true,
      pre: {
        title: "Quantitative Transfer Technique",
        body: "Pour the concentrated solution through a glass funnel into the 100 cm³ flask, rinsing the beaker and funnel with distilled water to ensure zero solute loss.",
      },
      post: {
        title: "Solution Transferred to Measuring Flask",
        body: "The solution and beaker rinsings are collected in the volumetric flask.",
      },
    },
    {
      tutor: "Add distilled water using wash bottle until the lower meniscus aligns with the 100 mL mark.",
      x: "make up to 100 mL mark",
      item: "washBottle",
      tube: 1,
      pour: "water",
      zoom: true,
      pre: {
        title: "Meniscus Alignment at Eye Level",
        body: "Add distilled water dropwise until the bottom of the curved meniscus touches the 100 cm³ etched circular graduation line at eye level.",
      },
      post: {
        title: "Meniscus Aligned at 100 mL Calibration Mark",
        body: "The solution has reached exactly 100.0 cm³ volume.",
        eq: "V = 100.0 cm³ = 0.100 dm³",
      },
    },
    {
      tutor: "Stopper the flask and invert 10 times to thoroughly homogenize the standard solution.",
      x: "invert & homogenize",
      item: "tube",
      tube: 1,
      anim: "shake",
      post: {
        title: "0.100 M Standard Na₂CO₃ Solution Ready!",
        body: "The primary standard solution is completely uniform and ready for acid-base titrations.",
        eq: "M = (1.060 g) / (106.0 g/mol × 0.100 dm³) = 0.100 M",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    // Tube 0 (Beaker):
    if (step === 1) t[0] = { ...sol("#00000000", 0, 0), powder: true };
    else if (step === 2) t[0] = { ...sol(CLEAR_SOL, 0.45, 0.7), powder: true };
    else if (step >= 3 && step < 5) t[0] = sol(CLEAR_SOL, 0.5, 0.7);
    else if (step >= 5) t[0] = sol("#00000000", 0, 0);

    // Tube 1 (100 mL Volumetric Flask):
    if (step === 5) t[1] = sol(CLEAR_SOL, 0.45, 0.7);
    else if (step >= 6) t[1] = sol(STANDARD_SOL, 0.85, 0.75);

    return t;
  },
  summary: [
    {
      test: "Weighing pure anhydrous Na₂CO₃",
      obs: "White dry crystalline powder (1.060 g)",
      inf: "Primary standard mass for 100 cm³",
      eq: "Mass = 0.10 × 106.0 × 0.100 = 1.060 g",
      liquid: CLEAR_SOL,
      ppt: CLEAR_SOL,
    },
    {
      test: "Dissolution in 40 cm³ distilled water",
      obs: "Dissolves rapidly into clear colorless liquid",
      inf: "High water solubility of Na₂CO₃",
      eq: "Na₂CO₃(s) → 2Na⁺(aq) + CO₃²⁻(aq)",
      liquid: CLEAR_SOL,
      ppt: CLEAR_SOL,
    },
    {
      test: "Transfer to 100 cm³ volumetric flask & dilution",
      obs: "Lower meniscus touches etched calibration mark",
      inf: "Exact volume = 100.0 cm³",
      eq: "V = 100.0 cm³ = 0.100 dm³",
      liquid: STANDARD_SOL,
      ppt: STANDARD_SOL,
    },
    {
      test: "Homogenization by inversion",
      obs: "Uniform transparent primary solution",
      inf: "Exact Molarity = 0.100 M | Strength = 10.60 g/dm³",
      eq: "M = 1.060 / (106.0 × 0.100) = 0.100 M",
      liquid: STANDARD_SOL,
      ppt: STANDARD_SOL,
    },
  ],
  procedure: [
    "Calculate the exact mass of pure anhydrous sodium carbonate needed: Mass = 0.1 × 106.0 × 0.100 = 1.060 g.",
    "Weigh accurately 1.060 g of dry Na₂CO₃ powder on a watch glass using an analytical chemical balance.",
    "Transfer the powder into a 100 cm³ beaker and dissolve it in about 40 cm³ of distilled water using a glass rod.",
    "Quantitatively transfer the solution into a clean 100 cm³ volumetric flask using a glass funnel.",
    "Rinse the beaker, stirring rod, and funnel with distilled water and pour all washings into the volumetric flask.",
    "Add distilled water carefully until the bottom of the curved meniscus touches the etched circular line on the neck.",
    "Stopper the flask securely and invert it 10 times to ensure a completely homogeneous 0.100 M primary standard solution.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
