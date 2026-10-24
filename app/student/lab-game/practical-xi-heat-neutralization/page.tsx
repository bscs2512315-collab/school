"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol } from "../_practical/helpers";

const CLEAR_HCL = "#e0f2fe";
const MIXED_WARM = "#ecfdf5";

const config: PracticalConfig = {
  title: "Determination of Heat of Neutralization (HCl + NaOH)",
  kicker: "Thermochemistry & Calorimetry",
  ionLabel: "ΔH_neut",
  radical: "Enthalpy of Neutralization",
  group: "Class XI Practical 5",
  grade: "XI",
  reagents: [
    { id: "hcl", color: "#e0f2fe", label: "1.0 M HCl" },
    { id: "naoh", color: "#e0f2fe", label: "1.0 M NaOH" },
    { id: "thermometer", color: "#ef4444", label: "Precision Thermometer" },
    { id: "stirrer", color: "#94a3b8", label: "Calorimeter Stirrer" },
  ],
  steps: [
    {
      tutor: "Pick up the insulated polystyrene calorimeter (Tube 1) from the stand.",
      x: "pick up calorimeter",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Measure and pour 50 mL of 1.0 M HCl into the calorimeter.",
      x: "add 50 mL 1.0 M HCl",
      item: "hcl",
      tube: 0,
      pour: "hcl",
      pre: {
        title: "Calorimeter Acid Charge",
        body: "The polystyrene calorimeter provides high thermal insulation with negligible heat capacity, preventing heat exchange with surroundings.",
      },
      post: {
        title: "50 mL 1.0 M HCl Added (T₁ = 25.0 °C)",
        body: "Initial acid temperature recorded steady at T₁ = 25.0 °C (0.050 mol H⁺).",
        eq: "T₁ = 25.0 °C | n(H⁺) = 1.0 × 0.050 = 0.050 mol",
      },
    },
    {
      tutor: "Measure initial temperature of 50 mL 1.0 M NaOH in beaker.",
      x: "measure NaOH temperature",
      item: "thermometer",
      tube: 0,
      pre: {
        title: "Initial Thermal Equilibrium",
        body: "Both acid and base solutions must be at the same initial room temperature before mixing to ensure accurate enthalpy measurement.",
      },
      post: {
        title: "T(initial) Recorded = 25.0 °C",
        body: "Initial temperature of both reactants confirmed at T_initial = 25.0 °C.",
        eq: "T_initial = 25.0 °C",
      },
    },
    {
      tutor: "Quickly pour 50 mL of 1.0 M NaOH into the calorimeter and replace the lid.",
      x: "add 50 mL 1.0 M NaOH",
      item: "naoh",
      tube: 0,
      pour: "naoh",
      zoom: true,
      pre: {
        title: "Instant Neutralization Reaction",
        body: "Strong acid and base react exothermically: H⁺(aq) + OH⁻(aq) → H₂O(l) + Heat.",
      },
      post: {
        title: "Reactants Mixed Inside Calorimeter",
        body: "Exothermic neutralization begins immediately as H⁺ and OH⁻ ions combine to form water.",
        eq: "HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l) + Heat",
      },
    },
    {
      tutor: "Stir the mixture continuously using the calorimeter stirrer.",
      x: "stir continuously",
      item: "tube",
      tube: 0,
      anim: "shake",
      post: {
        title: "Temperature Rising Exothermically",
        body: "Continuous stirring distributes evolved heat evenly throughout the 100 g aqueous solution.",
      },
    },
    {
      tutor: "Insert thermometer and record the maximum peak temperature reached (T_max).",
      x: "record maximum temperature",
      item: "thermometer",
      tube: 0,
      zoom: true,
      post: {
        title: "Peak Temperature Reached: T_max = 31.8 °C (ΔT = 6.8 °C)",
        body: "The highest steady temperature reached is 31.8 °C. Temperature rise ΔT = 31.8 − 25.0 = 6.8 °C.",
        eq: "ΔT = T_max − T_initial = 31.8 − 25.0 = 6.8 °C",
      },
    },
    {
      tutor: "Calculate heat evolved (q) and determine molar enthalpy of neutralization (ΔH_neut).",
      x: "compute ΔH_neut",
      item: "tube",
      tube: 0,
      post: {
        title: "Enthalpy of Neutralization = −56.9 kJ/mol",
        body: "Heat evolved q = m × c × ΔT = 100 × 4.184 × 6.8 = 2.845 kJ. ΔH_neut = −(2.845 kJ / 0.050 mol) = −56.9 kJ/mol (Theoretical: −57.3 kJ/mol).",
        eq: "ΔH_neut = − (100 g × 4.184 J/g·K × 6.8 K) / 0.050 mol = −56.9 kJ/mol",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1 || step === 2) t[0] = sol(CLEAR_HCL, 0.45, 0.7);
    else if (step >= 3) t[0] = sol(MIXED_WARM, 0.75, 0.8);
    return t;
  },
  summary: [
    {
      test: "50 mL 1.0 M HCl in calorimeter",
      obs: "Initial temperature T₁ = 25.0 °C",
      inf: "n(H⁺) = 1.0 × 0.050 = 0.050 mol",
      eq: "T₁ = 25.0 °C",
      liquid: CLEAR_HCL,
      ppt: CLEAR_HCL,
    },
    {
      test: "50 mL 1.0 M NaOH in separate beaker",
      obs: "Initial temperature T₂ = 25.0 °C",
      inf: "n(OH⁻) = 1.0 × 0.050 = 0.050 mol",
      eq: "T_initial = 25.0 °C",
      liquid: CLEAR_HCL,
      ppt: CLEAR_HCL,
    },
    {
      test: "Rapid mixing + continuous stirring",
      obs: "Exothermic temperature surge to T_max = 31.8 °C",
      inf: "Temperature rise ΔT = 6.8 °C (6.8 K)",
      eq: "H⁺(aq) + OH⁻(aq) → H₂O(l) + Heat",
      liquid: MIXED_WARM,
      ppt: MIXED_WARM,
    },
    {
      test: "Enthalpy Calculation",
      obs: "Total mass = 100 g, c = 4.184 J/g·K",
      inf: "ΔH_neut = −56.9 kJ/mol (Theoretical = −57.3 kJ/mol)",
      eq: "ΔH_neut = − (100 × 4.184 × 6.8) / (0.050 × 1000) = −56.9 kJ/mol",
      liquid: MIXED_WARM,
      ppt: MIXED_WARM,
    },
  ],
  procedure: [
    "Measure 50.0 cm³ of 1.0 M HCl solution into a clean polystyrene calorimeter.",
    "Place the thermometer through the lid hole and record the steady initial temperature T₁.",
    "Measure 50.0 cm³ of 1.0 M NaOH solution into a separate beaker and confirm temperature T₂ (ensure T₁ = T₂).",
    "Quickly and carefully pour the NaOH solution into the calorimeter.",
    "Immediately replace the calorimeter lid and stir the solution continuously using the wire stirrer.",
    "Record the temperature every 15 seconds until it reaches a maximum peak (T_max) and begins to fall.",
    "Calculate the temperature rise ΔT and compute the molar enthalpy of neutralization: ΔH_neut = −56.9 kJ/mol.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
