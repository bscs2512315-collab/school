"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol } from "../_practical/helpers";

const CPD = "#e6dcc4"; // pale organic compound solution

const config: PracticalConfig = {
  title: "Identify Phenol",
  ionLabel: "Phenol",
  radical: "phenolic —OH",
  group: "Functional group",
  reagents: [
    { id: "cpd", color: "#e6dcc4", label: "Organic cpd" },
    { id: "na2co3", color: "#eef0f2", label: "Na₂CO₃" },
    { id: "fecl3", color: "#d97706", label: "Neutral FeCl₃" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Pour the organic compound into the test tube.", x: "pour the organic compound", item: "cpd", tube: 0, pour: "cpd" },
    { tutor: "Add 10% Na₂CO₃ (or NaHCO₃) to the compound.", x: "add Na₂CO₃", item: "na2co3", tube: 0, pour: "na2co3", zoom: true, pre: { title: "Test for —COOH", body: "Add Na₂CO₃. No CO₂ (no effervescence) means —COOH is absent; blackening suggests a phenolic group." }, post: { title: "No CO₂ — blackening", body: "No CO₂ is liberated (—COOH absent); blackening without effervescence occurs → a phenolic group may be present." } },
    { tutor: "C.T: add neutral FeCl₃ to a fresh compound + water portion.", x: "add neutral FeCl₃", item: "fecl3", tube: 1, pour: "fecl3", zoom: true, pre: { title: "Confirmatory test", body: "A fresh compound + water portion is ready. A green/blue/violet colour with neutral FeCl₃ confirms a phenol." }, post: { title: "Violet colour → phenol confirmed", body: "A deep violet-purple colour develops with neutral FeCl₃ → the phenolic group is confirmed.", eq: "3ArOH + FeCl₃ → Fe(OAr)₃ + 3HCl" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = sol(CPD, 0.55);
    else if (step >= 2) t[0] = sol("#2c2c2c", 0.6, 0.85); // blackening without effervescence
    if (step >= 2) t[1] = step >= 3 ? sol("#6b21a8", 0.75, 0.9) : sol(CPD, 0.55);
    return t;
  },
  summary: [
    { test: "Compound + 10% Na₂CO₃ (or NaHCO₃)", obs: "No CO₂; blackening without effervescence", inf: "—COOH absent; phenolic group may be present", eq: "", liquid: "#2c2c2c", ppt: "#2c2c2c" },
    { test: "C.T: Compound + H₂O + neutral FeCl₃", obs: "Deep violet colour", inf: "Phenolic group confirmed", eq: "3ArOH + FeCl₃ → Fe(OAr)₃ + 3HCl", liquid: "#6b21a8", ppt: "#6b21a8" },
  ],
  procedure: [
    "Compound + 10% Na₂CO₃ → no CO₂, blackening → —COOH absent; phenolic group may be present.",
    "Confirm: compound + H₂O + neutral FeCl₃ → green/blue/violet colour.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
