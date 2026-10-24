"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol, ppt } from "../_practical/helpers";

const CPD = "#e6dcc4"; // pale organic compound solution

const config: PracticalConfig = {
  title: "Identify Aldehyde",
  ionLabel: "Aldehyde",
  radical: "aldehyde —CHO",
  group: "Functional group",
  reagents: [
    { id: "cpd", color: "#e6dcc4", label: "Organic cpd" },
    { id: "na2co3", color: "#eef0f2", label: "Na₂CO₃" },
    { id: "tollens", color: "#eef2f4", label: "Tollens'" },
    { id: "fehling", color: "#1d4ed8", label: "Fehling's" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Pour the organic compound into the test tube.", x: "pour the organic compound", item: "cpd", tube: 0, pour: "cpd" },
    { tutor: "Add 10% Na₂CO₃ (or NaHCO₃) to the compound.", x: "add Na₂CO₃", item: "na2co3", tube: 0, pour: "na2co3", zoom: true, pre: { title: "Test for —COOH", body: "Add Na₂CO₃. No CO₂ means —COOH is absent — an aldehyde or ketone may be present." }, post: { title: "No CO₂ evolved", body: "No CO₂ is liberated (—COOH absent) → an aldehyde or ketone may be present." } },
    { tutor: "C.T: add Tollens' reagent to a fresh portion and warm.", x: "add Tollens' reagent", item: "tollens", tube: 1, pour: "tollens", zoom: true, pre: { title: "Confirmatory tests", body: "Fresh compound portions are ready. Confirm an aldehyde with Tollens' (silver mirror) and Fehling's (brick-red ppt)." }, post: { title: "Silver mirror → aldehyde confirmed", body: "On warming with Tollens' reagent a silver mirror forms → the aldehyde group is confirmed.", eq: "RCHO + 2[Ag(NH₃)₂]OH → RCOONH₄ + 2Ag↓ + 3NH₃ + H₂O" } },
    { tutor: "C.T: add Fehling's solution (A + B) to a fresh portion and warm.", x: "add Fehling's solution", item: "fehling", tube: 2, pour: "fehling", zoom: true, post: { title: "Brick-red ppt → aldehyde confirmed", body: "A brick-red ppt of Cu₂O forms with Fehling's (or Benedict's) solution → the aldehyde group is confirmed.", eq: "RCHO + 2Cu²⁺ + 4OH⁻ → RCOOH + Cu₂O↓ + 2H₂O" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = sol(CPD, 0.55);
    else if (step >= 2) t[0] = sol(CPD, 0.6); // + Na₂CO₃, no CO₂ (COOH absent)
    if (step >= 2) {
      t[1] = step >= 3 ? { ...sol("#dfe3e6", 0.45), mirror: true } : sol(CPD, 0.55);
      t[2] = step >= 4 ? ppt("#b91c1c", "#ea580c", 0.75, 0.85) : sol("#1d4ed8", 0.7, 0.85);
    }
    return t;
  },
  summary: [
    { test: "Compound + 10% Na₂CO₃ (or NaHCO₃)", obs: "No CO₂ liberated", inf: "—COOH absent; aldehyde/ketone may be present", eq: "", liquid: CPD, ppt: CPD },
    { test: "C.T: Compound + Tollens' reagent, warm", obs: "Silver mirror forms", inf: "Aldehyde confirmed", eq: "RCHO + 2[Ag(NH₃)₂]OH → RCOONH₄ + 2Ag↓ + 3NH₃ + H₂O", liquid: "#dfe3e6", ppt: "#e8eaec" },
    { test: "C.T: Compound + Fehling's solution, warm", obs: "Brick-red ppt (Cu₂O)", inf: "Aldehyde confirmed", eq: "RCHO + 2Cu²⁺ + 4OH⁻ → RCOOH + Cu₂O↓ + 2H₂O", liquid: "#ea580c", ppt: "#b91c1c" },
  ],
  procedure: [
    "Compound + 10% Na₂CO₃ → no CO₂ → —COOH absent; aldehyde/ketone may be present.",
    "Confirm: + Tollens' reagent, warm → silver mirror.",
    "Confirm: + Fehling's (or Benedict's) solution, warm → brick-red Cu₂O.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
