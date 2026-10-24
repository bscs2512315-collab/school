"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol } from "../_practical/helpers";

const STOCK_SOL = "#e0f2fe";
const DILUTE_SOL = "#f0f9ff";

const config: PracticalConfig = {
  title: "Preparation of 0.01 M Dilute Solution from Stock",
  kicker: "Volumetric Dilution & Dilution Law",
  ionLabel: "0.010 M Dilute",
  radical: "Sodium Carbonate Dilution",
  group: "Class IX Practical 5",
  grade: "IX",
  reagents: [
    { id: "stock", color: STOCK_SOL, label: "0.10 M Na₂CO₃ Stock" },
    { id: "pipette", color: "#e2e8f0", label: "10 mL Pipette" },
    { id: "washBottle", color: "#93c5fd", label: "Wash Bottle (Water)" },
  ],
  steps: [
    {
      tutor: "Pick up the 10 mL graduated pipette.",
      x: "pick up pipette",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Pipette out accurately 10.0 mL of the 0.10 M Na₂CO₃ stock solution.",
      x: "pipette 10.0 mL stock",
      item: "stock",
      tube: 0,
      pour: "stock",
      pre: {
        title: "Dilution Law Calculation (M₁V₁ = M₂V₂)",
        body: "To prepare 100 cm³ of 0.01 M solution from 0.1 M stock: V₁ = (M₂ × V₂) / M₁ = (0.01 × 100) / 0.10 = 10.0 cm³ of stock solution.",
      },
      post: {
        title: "10.0 mL Stock Solution Measured",
        body: "Exactly 10.0 cm³ of 0.10 M Na₂CO₃ stock solution measured in the pipette (lower meniscus at mark).",
        eq: "V₁ = (0.01 M × 100.0 cm³) / 0.10 M = 10.0 cm³",
      },
    },
    {
      tutor: "Pick up the clean 100 mL Volumetric Measuring Flask (Tube 1).",
      x: "pick up 100 mL Vol. Flask",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Discharge the 10.0 mL stock solution into the 100 mL volumetric flask.",
      x: "transfer stock to flask",
      item: "pipette",
      tube: 0,
      pour: "stock",
      zoom: true,
      pre: {
        title: "Quantitative Pipetting Technique",
        body: "Hold the pipette vertically with tip touching the inner wall of the volumetric flask and allow liquid to drain under gravity.",
      },
      post: {
        title: "Stock Solution Transferred to Flask",
        body: "10.0 mL of 0.10 M stock solution is charged into the 100 mL volumetric flask.",
      },
    },
    {
      tutor: "Add distilled water using wash bottle until the lower meniscus aligns with the 100 mL mark.",
      x: "dilute to 100 mL mark",
      item: "washBottle",
      tube: 0,
      pour: "washBottle",
      zoom: true,
      pre: {
        title: "Dilution to Calibration Mark",
        body: "Add distilled water carefully until the solution level reaches the 100 cm³ graduation line at eye level.",
      },
      post: {
        title: "Meniscus Aligned at 100 mL Mark",
        body: "Volume diluted exactly to 100.0 cm³ with distilled water.",
        eq: "V₂ = 100.0 cm³ (10-fold dilution factor)",
      },
    },
    {
      tutor: "Stopper the flask and invert 10 times to thoroughly homogenize the dilute solution.",
      x: "invert & mix thoroughly",
      item: "tube",
      tube: 0,
      anim: "shake",
      post: {
        title: "0.010 M Dilute Solution Successfully Prepared!",
        body: "The dilute solution is completely uniform with an exact concentration of 0.010 M (10 times diluted).",
        eq: "M₂ = (M₁ × V₁) / V₂ = (0.10 M × 10.0 cm³) / 100.0 cm³ = 0.010 M",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = sol(STOCK_SOL, 0.25, 0.85);
    else if (step === 2) t[0] = sol(STOCK_SOL, 0.25, 0.85);
    else if (step === 3) t[0] = sol(STOCK_SOL, 0.2, 0.85);
    else if (step >= 4) t[0] = sol(DILUTE_SOL, 0.85, 0.75);
    return t;
  },
  summary: [
    {
      test: "Volume calculation using Dilution Law",
      obs: "V₁ = (0.01 × 100) / 0.10 = 10.0 cm³",
      inf: "Exact volume of 0.10 M stock needed",
      eq: "M₁V₁ = M₂V₂",
      liquid: STOCK_SOL,
      ppt: STOCK_SOL,
    },
    {
      test: "Pipetting 10.0 cm³ stock into 100 cm³ flask",
      obs: "Clear solution transferred without loss",
      inf: "n = 0.10 × 0.010 = 0.0010 mol solute",
      eq: "n(Na₂CO₃) = 0.0010 mol",
      liquid: STOCK_SOL,
      ppt: STOCK_SOL,
    },
    {
      test: "Dilution with distilled water to 100 cm³",
      obs: "Lower meniscus touches etched circular mark",
      inf: "Final volume V₂ = 100.0 cm³",
      eq: "V₂ = 100.0 cm³",
      liquid: DILUTE_SOL,
      ppt: DILUTE_SOL,
    },
    {
      test: "Homogenization by inversion",
      obs: "Uniform transparent dilute solution",
      inf: "Exact Molarity = 0.010 M | Dilution ratio = 1:10",
      eq: "M₂ = (0.10 × 10.0) / 100.0 = 0.010 M",
      liquid: DILUTE_SOL,
      ppt: DILUTE_SOL,
    },
  ],
  procedure: [
    "Calculate the required volume of 0.10 M stock solution using the dilution equation: M₁V₁ = M₂V₂ ⇒ V₁ = (0.01 × 100) / 0.10 = 10.0 cm³.",
    "Rinse a clean 10.0 cm³ pipette with a small volume of the 0.10 M stock solution.",
    "Pipette out exactly 10.0 cm³ of the stock solution, aligning the bottom of the meniscus with the calibration mark at eye level.",
    "Transfer the 10.0 cm³ of stock solution into a clean 100 cm³ volumetric measuring flask.",
    "Add distilled water slowly from a wash bottle until the liquid level approaches near the graduation line on the neck.",
    "Add distilled water dropwise using a dropper until the lower meniscus coincides exactly with the etched 100 cm³ line.",
    "Stopper the volumetric flask tightly and invert 10 times to obtain a thoroughly mixed 0.010 M standard dilute solution.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
