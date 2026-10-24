"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, powder, withWater, sol, ppt } from "../_practical/helpers";

const SALT = "#dfe3e0"; // colourless Al³⁺ salt solution

const config: PracticalConfig = {
  title: "Detect Al³⁺",
  ionLabel: "Al³⁺",
  radical: "aluminium",
  group: "Group III",
  reagents: [
    { id: "water", color: "#dbe9f4", label: "Dist. Water" },
    { id: "hcl", color: "#e4eef4", label: "Diluted HCl" },
    { id: "h2s", color: "#eceee0", label: "H₂S" },
    { id: "nh4oh", color: "#e7e2f0", label: "NH₄OH" },
    { id: "litmus", color: "#2563eb", label: "Litmus" },
    { id: "na3po4", color: "#eef0f2", label: "Na₃PO₄" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Add the salt sample to the test tube.", x: "add the salt", item: "salt", tube: 0 },
    { tutor: "Add distilled water to the test tube.", x: "pour distilled water", item: "water", tube: 0, pour: "water" },
    { tutor: "Shake to dissolve — this is your Salt Solution.", x: "shake the tube", item: "tube", tube: 0, anim: "shake", post: { title: "Salt Solution ready", body: "The salt dissolves into a colourless Al³⁺ salt solution." } },
    { tutor: "Add Diluted HCl to the Salt Solution.", x: "add Diluted HCl", item: "hcl", tube: 0, pour: "hcl", zoom: true, pre: { title: "Group I test", body: "Add Diluted HCl. No precipitate means the first group is absent." }, post: { title: "No precipitate", body: "No precipitate → Group I absent." } },
    { tutor: "Pass H₂S through the acidified solution.", x: "pass H₂S", item: "h2s", tube: 0, pour: "h2s", zoom: true, post: { title: "No precipitate", body: "No precipitate → Group II absent." } },
    { tutor: "Add NH₄Cl, boil & cool, then NH₄OH in excess.", x: "add NH₄OH", item: "nh4oh", tube: 0, pour: "nh4oh", zoom: true, post: { title: "White gelatinous precipitate", body: "White gelatinous ppt → Group III present; Al³⁺ is indicated." } },
    { tutor: "C.T (lake test): add litmus, then NH₄OH; let it stand.", x: "add litmus + NH₄OH", item: "litmus", tube: 1, pour: "litmus", zoom: true, pre: { title: "Confirmatory tests", body: "Two fresh salt-solution portions are ready. Confirm Al³⁺ with the blue-lake test and with Na₃PO₄." }, post: { title: "Blue lake → Al³⁺ confirmed", body: "The Al(OH)₃ adsorbs the dye to give a blue lake, confirming Al³⁺.", eq: "AlCl₃ + 3NH₄OH → Al(OH)₃↓ + 3NH₄Cl" } },
    { tutor: "C.T: add Na₃PO₄ to a fresh Salt Solution.", x: "add Na₃PO₄", item: "na3po4", tube: 2, pour: "na3po4", zoom: true, post: { title: "White ppt → Al³⁺ confirmed", body: "White ppt of AlPO₄ (soluble in HCl) confirms Al³⁺.", eq: "AlCl₃ + Na₃PO₄ → AlPO₄↓ + 3NaCl" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = powder;
    else if (step === 2) t[0] = withWater("#e6ebe8");
    else if (step >= 3 && step <= 5) t[0] = sol(SALT);
    else if (step >= 6) t[0] = ppt("#f8fafc", "#e7ecee", 0.7, 0.7); // white gelatinous
    if (step >= 6) {
      t[1] = step >= 7 ? ppt("#1e40af", "#93c5fd") : sol(SALT); // blue lake
      t[2] = step >= 8 ? ppt("#f8fafc", "#e7ecee") : sol(SALT); // white
    }
    return t;
  },
  summary: [
    { test: "Salt solution + Diluted HCl", obs: "No precipitate", inf: "Group I absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "Salt solution + Diluted HCl + H₂S", obs: "No precipitate", inf: "Group II absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "Salt solution + NH₄Cl, boil, + NH₄OH (excess)", obs: "White gelatinous ppt", inf: "Group III present; Al³⁺ indicated", eq: "", liquid: "#e7ecee", ppt: "#f8fafc" },
    { test: "C.T: Lake test (litmus + NH₄OH, stand)", obs: "Blue lake", inf: "Al³⁺ confirmed", eq: "AlCl₃ + 3NH₄OH → Al(OH)₃↓ + 3NH₄Cl", liquid: "#93c5fd", ppt: "#1e40af" },
    { test: "C.T: Salt solution + Na₃PO₄", obs: "White ppt, soluble in HCl", inf: "Al³⁺ confirmed", eq: "AlCl₃ + Na₃PO₄ → AlPO₄↓ + 3NaCl", liquid: "#e7ecee", ppt: "#f8fafc" },
  ],
  procedure: [
    "Dissolve the salt in distilled water to prepare the Salt Solution.",
    "Salt solution + Diluted HCl → no precipitate → Group I absent.",
    "Pass H₂S → no precipitate → Group II absent.",
    "Add NH₄Cl, boil & cool, then NH₄OH in excess → white gelatinous ppt → Group III; Al³⁺ indicated.",
    "Confirm with fresh salt solution: blue-lake test and + Na₃PO₄ (white ppt, soluble in HCl).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
