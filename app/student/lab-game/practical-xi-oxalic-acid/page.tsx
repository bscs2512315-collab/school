"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol } from "../_practical/helpers";

const CLEAR_SOL = "#e2e8f0";
const STANDARD_SOL = "#e0f2fe";

const config: PracticalConfig = {
  title: "Preparation of 0.1 M Standard Oxalic Acid",
  kicker: "Primary Standard Preparation",
  ionLabel: "H₂C₂O₄·2H₂O",
  radical: "0.1 M Standard Oxalic Acid",
  group: "Class XI Practical 1",
  grade: "XI",
  reagents: [
    { id: "oxalic", color: "#f8fafc", label: "Hydrated Oxalic Acid" },
    { id: "water", color: "#dbe9f4", label: "Distilled Water" },
    { id: "flask", color: "#e2e8f0", label: "250 mL Vol. Flask" },
    { id: "washBottle", color: "#93c5fd", label: "Wash Bottle" },
  ],
  steps: [
    {
      tutor: "Pick up the reaction beaker (Tube 1) from the stand.",
      x: "pick up beaker",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Weigh and transfer 3.152 g of pure hydrated oxalic acid crystals into the beaker.",
      x: "add 3.152 g Oxalic Acid",
      item: "salt",
      tube: 0,
      pre: {
        title: "Primary Standard Mass Calculation",
        body: "Mass = Molarity × Molar Mass × Volume(dm³) = 0.1 × 126.07 × 0.250 = 3.152 g of H₂C₂O₄·2H₂O crystals.",
      },
      post: {
        title: "3.152 g Oxalic Acid Crystals Weighed",
        body: "Accurately weighed 3.152 g of dry, pure hydrated oxalic acid crystals in the beaker.",
        eq: "Mass = 0.10 mol/dm³ × 126.07 g/mol × 0.250 dm³ = 3.152 g",
      },
    },
    {
      tutor: "Add 100 mL of distilled water to dissolve the oxalic acid crystals.",
      x: "add 100 mL distilled water",
      item: "water",
      tube: 0,
      pour: "water",
      pre: {
        title: "Dissolution in Solvent",
        body: "Dissolve the weighed solid completely in about 100 cm³ of distilled water using a clean glass stirring rod.",
      },
      post: {
        title: "Distilled Water Added",
        body: "Crystals are suspended in 100 mL distilled water ready for complete dissolution.",
      },
    },
    {
      tutor: "Swirl the beaker to completely dissolve all oxalic acid crystals.",
      x: "swirl to dissolve",
      item: "tube",
      tube: 0,
      anim: "shake",
      post: {
        title: "Crystals Completely Dissolved",
        body: "Clear, transparent aqueous oxalic acid solution is formed without any remaining solid particles.",
      },
    },
    {
      tutor: "Pick up the 250 mL Volumetric Measuring Flask (Tube 2) from the stand.",
      x: "pick up Volumetric Flask",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Quantitatively transfer the solution into the 250 mL volumetric flask using a glass funnel.",
      x: "transfer to Volumetric Flask",
      item: "flask",
      tube: 1,
      pour: "water",
      zoom: true,
      pre: {
        title: "Quantitative Transfer",
        body: "Pour the solution through a glass funnel into the 250 cm³ flask, rinsing the beaker with distilled water to ensure zero solute loss.",
      },
      post: {
        title: "Solution Transferred into Measuring Flask",
        body: "The concentrated oxalic acid solution and beaker washings are transferred into the volumetric flask.",
      },
    },
    {
      tutor: "Add distilled water using wash bottle until the lower meniscus touches the 250 mL calibration mark.",
      x: "make up to 250 mL mark",
      item: "washBottle",
      tube: 1,
      pour: "water",
      zoom: true,
      pre: {
        title: "Dilution to Calibration Mark",
        body: "Add distilled water carefully until the bottom of the curved meniscus aligns exactly with the 250 cm³ circular calibration mark at eye level.",
      },
      post: {
        title: "Meniscus Aligned at 250 mL Ring Mark",
        body: "The solution has reached exactly 250.0 cm³ volume.",
        eq: "V = 250.0 cm³ = 0.250 dm³",
      },
    },
    {
      tutor: "Stopper the flask and invert 10 times to thoroughly homogenize the standard solution.",
      x: "invert & homogenize",
      item: "tube",
      tube: 1,
      anim: "shake",
      post: {
        title: "0.100 M Standard Oxalic Acid Solution Ready!",
        body: "The standard primary solution is perfectly uniform and ready for volumetric redox titrations.",
        eq: "M = (3.152 g) / (126.07 g/mol × 0.250 dm³) = 0.100 M",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    // Tube 0 (Beaker):
    if (step === 1) t[0] = { ...sol("#00000000", 0, 0), powder: true };
    else if (step === 2) t[0] = { ...sol(CLEAR_SOL, 0.5, 0.7), powder: true };
    else if (step >= 3 && step < 5) t[0] = sol(CLEAR_SOL, 0.55, 0.7);
    else if (step >= 5) t[0] = sol("#00000000", 0, 0);

    // Tube 1 (250 mL Volumetric Flask):
    if (step === 5) t[1] = sol(CLEAR_SOL, 0.45, 0.7);
    else if (step >= 6) t[1] = sol(STANDARD_SOL, 0.85, 0.75);

    return t;
  },
  summary: [
    {
      test: "Weighing pure H₂C₂O₄·2H₂O crystals",
      obs: "White crystalline solid (3.152 g)",
      inf: "Primary standard mass for 250 cm³",
      eq: "Mass = 0.10 × 126.07 × 0.250 = 3.152 g",
      liquid: CLEAR_SOL,
      ppt: CLEAR_SOL,
    },
    {
      test: "Dissolution in 100 cm³ distilled water",
      obs: "Crystals dissolve completely into clear liquid",
      inf: "High water solubility of oxalic acid",
      eq: "H₂C₂O₄·2H₂O(s) → H₂C₂O₄(aq) + 2H₂O",
      liquid: CLEAR_SOL,
      ppt: CLEAR_SOL,
    },
    {
      test: "Transfer to 250 cm³ volumetric flask & make up to mark",
      obs: "Lower meniscus touches etched calibration line",
      inf: "Exact volume = 250.0 cm³",
      eq: "V = 250.0 cm³",
      liquid: STANDARD_SOL,
      ppt: STANDARD_SOL,
    },
    {
      test: "Homogenization by inversion",
      obs: "Uniform transparent solution",
      inf: "Exact Molarity = 0.100 M | Strength = 12.61 g/dm³",
      eq: "M = 3.152 / (126.07 × 0.250) = 0.100 M",
      liquid: STANDARD_SOL,
      ppt: STANDARD_SOL,
    },
  ],
  procedure: [
    "Calculate the mass of hydrated oxalic acid crystals needed: Mass = 0.1 × 126.07 × 0.250 = 3.152 g.",
    "Weigh accurately 3.152 g of dry, pure oxalic acid crystals on an analytical balance.",
    "Dissolve the crystals in about 100 cm³ of distilled water in a clean beaker using a glass rod.",
    "Quantitatively transfer the solution into a 250 cm³ volumetric flask using a glass funnel.",
    "Rinse the beaker and funnel with distilled water and transfer washings into the flask.",
    "Add distilled water dropwise until the lower meniscus touches the etched circular mark at eye level.",
    "Stopper the flask and invert 10 times to ensure a completely homogeneous 0.100 M standard solution.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
