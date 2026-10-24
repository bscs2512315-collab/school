"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol } from "../_practical/helpers";

const CLEAR_WATER = "#dbe9f4";
const COOL_DISSOLVED = "#bfdbfe";

const config: PracticalConfig = {
  title: "Determination of Enthalpy of Solution of NH₄Cl",
  kicker: "Thermochemistry & Calorimetry",
  ionLabel: "ΔH_sol",
  radical: "Enthalpy of Solution",
  group: "Class XI Practical 6",
  grade: "XI",
  reagents: [
    { id: "water", color: "#dbe9f4", label: "Distilled Water" },
    { id: "nh4cl", color: "#f8fafc", label: "Pure NH₄Cl Powder" },
    { id: "thermometer", color: "#ef4444", label: "Precision Thermometer" },
    { id: "stirrer", color: "#94a3b8", label: "Calorimeter Stirrer" },
  ],
  steps: [
    {
      tutor: "Pick up the polystyrene calorimeter (Tube 1) from the stand.",
      x: "pick up calorimeter",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Measure 100 mL of distilled water into the calorimeter and record initial temperature.",
      x: "add 100 mL Distilled Water",
      item: "water",
      tube: 0,
      pour: "water",
      pre: {
        title: "Calorimeter Solvent Charge",
        body: "100 cm³ of pure distilled water (mass = 100 g) serves as the dissolution medium.",
      },
      post: {
        title: "Initial Water Temperature Recorded (T₁ = 25.0 °C)",
        body: "Initial steady temperature of water recorded at T₁ = 25.0 °C.",
        eq: "T₁ = 25.0 °C | m_water = 100.0 g",
      },
    },
    {
      tutor: "Weigh and add 5.35 g (0.10 mol) of dry NH₄Cl powder into the calorimeter.",
      x: "add 5.35 g NH₄Cl powder",
      item: "nh4cl",
      tube: 0,
      pour: "nh4cl",
      pre: {
        title: "Endothermic Salt Dissolution",
        body: "Solid ammonium chloride absorbs thermal energy as it dissolves because its crystal lattice energy exceeds the hydration enthalpy: NH₄Cl(s) → NH₄⁺(aq) + Cl⁻(aq).",
      },
      post: {
        title: "5.35 g NH₄Cl Charged (0.100 mol)",
        body: "0.100 mol of pure NH₄Cl powder added into the calorimeter.",
        eq: "n = 5.35 g / 53.49 g/mol = 0.100 mol",
      },
    },
    {
      tutor: "Stir the mixture continuously until all NH₄Cl crystals dissolve completely.",
      x: "stir to dissolve",
      item: "tube",
      tube: 0,
      anim: "shake",
      post: {
        title: "Endothermic Cooling in Progress",
        body: "Thermal energy is absorbed from the water to break the ionic lattice, causing a rapid temperature drop.",
      },
    },
    {
      tutor: "Record the lowest minimum temperature reached (T_min).",
      x: "record lowest temperature",
      item: "thermometer",
      tube: 0,
      zoom: true,
      post: {
        title: "Minimum Temperature: T_min = 21.4 °C (ΔT = −3.6 °C)",
        body: "Lowest steady temperature reached is 21.4 °C. Temperature drop ΔT = 25.0 − 21.4 = 3.6 °C.",
        eq: "ΔT = 25.0 °C − 21.4 °C = 3.6 °C (cooling)",
      },
    },
    {
      tutor: "Calculate heat absorbed (q) and determine molar enthalpy of solution (ΔH_sol).",
      x: "compute ΔH_sol",
      item: "tube",
      tube: 0,
      post: {
        title: "Molar Enthalpy of Solution = +15.1 kJ/mol (Endothermic)",
        body: "Heat absorbed q = m × c × ΔT = 100 × 4.184 × 3.6 = 1.506 kJ. ΔH_sol = +(1.506 kJ / 0.100 mol) = +15.1 kJ/mol.",
        eq: "ΔH_sol = + (100 g × 4.184 J/g·K × 3.6 K) / (0.100 mol × 1000) = +15.1 kJ/mol",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = sol(CLEAR_WATER, 0.45, 0.7);
    else if (step === 2) t[0] = { ...sol(CLEAR_WATER, 0.52, 0.7), powder: true };
    else if (step >= 3) t[0] = sol(COOL_DISSOLVED, 0.62, 0.8);
    return t;
  },
  summary: [
    {
      test: "100 cm³ distilled water in calorimeter",
      obs: "Initial temperature T₁ = 25.0 °C",
      inf: "Mass of solvent = 100 g",
      eq: "T₁ = 25.0 °C",
      liquid: CLEAR_WATER,
      ppt: CLEAR_WATER,
    },
    {
      test: "Addition of 5.35 g dry NH₄Cl powder",
      obs: "White crystalline powder added",
      inf: "n = 5.35 / 53.49 = 0.100 mol solute",
      eq: "NH₄Cl(s) (M = 53.49 g/mol)",
      liquid: CLEAR_WATER,
      ppt: CLEAR_WATER,
    },
    {
      test: "Dissolution with continuous stirring",
      obs: "Endothermic cooling to T_min = 21.4 °C",
      inf: "Temperature drop ΔT = 3.6 °C (3.6 K)",
      eq: "NH₄Cl(s) + Heat → NH₄⁺(aq) + Cl⁻(aq)",
      liquid: COOL_DISSOLVED,
      ppt: COOL_DISSOLVED,
    },
    {
      test: "Enthalpy of Solution Calculation",
      obs: "q = 100 × 4.184 × 3.6 = 1.506 kJ",
      inf: "ΔH_sol = +15.1 kJ/mol (Endothermic process)",
      eq: "ΔH_sol = + (1.506 kJ / 0.100 mol) = +15.1 kJ/mol",
      liquid: COOL_DISSOLVED,
      ppt: COOL_DISSOLVED,
    },
  ],
  procedure: [
    "Measure 100.0 cm³ of distilled water into the calorimeter.",
    "Insert the precision thermometer and record the constant initial water temperature T₁.",
    "Accurately weigh 5.35 g (0.100 mol) of dry, pure ammonium chloride powder on an analytical balance.",
    "Add the NH₄Cl powder quickly to the water in the calorimeter.",
    "Replace the lid and stir continuously with the wire stirrer until the solid is completely dissolved.",
    "Observe and record the lowest steady temperature (T_min) reached on the thermometer.",
    "Calculate the temperature drop ΔT and determine the molar heat of solution: ΔH_sol = +15.1 kJ/mol.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
