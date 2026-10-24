"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol, ppt, gas, milky } from "../_practical/helpers";

const CPD = "#e6dcc4"; // pale organic compound solution

const config: PracticalConfig = {
  title: "Identify —COOH",
  ionLabel: "—COOH",
  radical: "carboxylic acid",
  group: "Functional group",
  reagents: [
    { id: "cpd", color: "#e6dcc4", label: "Organic cpd" },
    { id: "na2co3", color: "#eef0f2", label: "Na₂CO₃" },
    { id: "fecl3", color: "#d97706", label: "Neutral FeCl₃" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Pour the organic compound into the test tube.", x: "pour the organic compound", item: "cpd", tube: 0, pour: "cpd" },
    { tutor: "Add 10% Na₂CO₃ (or NaHCO₃) to the compound.", x: "add Na₂CO₃", item: "na2co3", tube: 0, pour: "na2co3", zoom: true, pre: { title: "Test for —COOH", body: "Add Na₂CO₃. CO₂ with effervescence means a —COOH group may be present." }, post: { title: "CO₂ with effervescence", body: "CO₂ is liberated with effervescence → a —COOH group may be present." } },
    { tutor: "Pass the evolved gas through the lime water.", x: "pass the gas through lime water", item: "tube", tube: 1, zoom: true, deliver: { from: 0, to: 1 }, pre: { title: "Lime-water test", body: "Pass the gas through lime water — milkiness confirms the —COOH group." }, post: { title: "Lime water turns milky", body: "The lime water turns milky → the —COOH group is present.", eq: "CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O" } },
    { tutor: "C.T: add neutral FeCl₃ to a fresh compound portion.", x: "add neutral FeCl₃", item: "fecl3", tube: 2, pour: "fecl3", zoom: true, pre: { title: "Confirmatory test", body: "A fresh compound portion is ready. A buff-coloured ppt with neutral FeCl₃ confirms —COOH (benzoic acid)." }, post: { title: "Buff ppt → —COOH confirmed", body: "A buff-coloured ppt forms → the —COOH group is confirmed (benzoic acid indicated).", eq: "3C₆H₅COOH + FeCl₃ → (C₆H₅COO)₃Fe + 3HCl" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = sol(CPD, 0.55);
    else if (step === 2 || step === 3) t[0] = gas("#e6dcc4");
    else if (step >= 4) t[0] = sol(CPD, 0.5);
    if (step >= 2) t[1] = step === 3 ? { ...milky(), fizz: true } : step > 3 ? milky() : sol("#e7f0ea", 0.55);
    if (step >= 3) t[2] = step >= 4 ? ppt("#d4a373", "#fef3c7", 0.75, 0.85) : sol(CPD, 0.55);
    return t;
  },
  summary: [
    { test: "Compound + 10% Na₂CO₃ (or NaHCO₃)", obs: "CO₂ with effervescence", inf: "—COOH may be present", eq: "", liquid: "#e6dcc4", ppt: "#e6dcc4" },
    { test: "Pass the gas through lime water", obs: "Turns milky", inf: "—COOH group present", eq: "CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O", liquid: "#e6eaec", ppt: "#eef1f4" },
    { test: "C.T: Compound + neutral FeCl₃", obs: "Buff-coloured ppt", inf: "—COOH confirmed (benzoic acid)", eq: "3C₆H₅COOH + FeCl₃ → (C₆H₅COO)₃Fe + 3HCl", liquid: "#fef3c7", ppt: "#d4a373" },
  ],
  procedure: [
    "Compound + 10% Na₂CO₃ → CO₂ with effervescence → —COOH may be present.",
    "Pass the gas through lime water → milky → —COOH present.",
    "Confirm: compound + neutral FeCl₃ → buff-coloured ppt (benzoic acid).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
