"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, powder, withWater, sol, ppt } from "../_practical/helpers";

const SALT = "#dfe3e0"; // colourless Mg²⁺ salt solution

const config: PracticalConfig = {
  title: "Detect Mg²⁺",
  ionLabel: "Mg²⁺",
  radical: "magnesium",
  group: "Group VI",
  reagents: [
    { id: "water", color: "#dbe9f4", label: "Dist. Water" },
    { id: "hcl", color: "#e4eef4", label: "Diluted HCl" },
    { id: "h2s", color: "#eceee0", label: "H₂S" },
    { id: "nh4oh", color: "#e7e2f0", label: "NH₄OH" },
    { id: "amcarb", color: "#eef0f2", label: "(NH₄)₂CO₃" },
    { id: "na2co3", color: "#eef0f2", label: "Na₂CO₃" },
    { id: "naoh", color: "#eef0f2", label: "NaOH" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Add the salt sample to the test tube.", x: "add the salt", item: "salt", tube: 0 },
    { tutor: "Add distilled water to the test tube.", x: "pour distilled water", item: "water", tube: 0, pour: "water" },
    { tutor: "Shake to dissolve — this is your Salt Solution.", x: "shake the tube", item: "tube", tube: 0, anim: "shake", post: { title: "Salt Solution ready ", body: "The salt dissolves into a colourless Mg²⁺ salt solution." } },
    { tutor: "Add Diluted HCl to the Salt Solution.", x: "add Diluted HCl", item: "hcl", tube: 0, pour: "hcl", zoom: true, pre: { title: "Group I test", body: "Add Diluted HCl. No precipitate means Group I is absent." }, post: { title: "No precipitate", body: "No precipitate → Group I absent." } },
    { tutor: "Pass H₂S through the acidified solution.", x: "pass H₂S", item: "h2s", tube: 0, pour: "h2s", zoom: true, post: { title: "No precipitate", body: "No precipitate → Group II absent." } },
    { tutor: "Add NH₄Cl, boil & cool, then NH₄OH in excess.", x: "add NH₄OH", item: "nh4oh", tube: 0, pour: "nh4oh", zoom: true, post: { title: "No precipitate", body: "No precipitate → Group III absent." } },
    { tutor: "Now pass H₂S through the ammoniacal solution.", x: "pass H₂S", item: "h2s", tube: 0, pour: "h2s", zoom: true, post: { title: "No precipitate", body: "No precipitate → Group IV absent." } },
    { tutor: "Add NH₄Cl, NH₄OH, then (NH₄)₂CO₃.", x: "add (NH₄)₂CO₃", item: "amcarb", tube: 0, pour: "amcarb", zoom: true, post: { title: "No precipitate", body: "No precipitate → Group V absent, so Group VI is present (Mg²⁺, NH₄⁺, Na⁺, K⁺)." } },
    { tutor: "C.T: add Na₂CO₃ to a fresh Salt Solution.", x: "add Na₂CO₃", item: "na2co3", tube: 1, pour: "na2co3", zoom: true, pre: { title: "Confirmatory tests", body: "Two fresh salt-solution portions are ready. Confirm Mg²⁺ with Na₂CO₃ and with NaOH." }, post: { title: "White ppt → Mg²⁺ confirmed", body: "White ppt of MgCO₃ (soluble in dil. HCl) confirms Mg²⁺.", eq: "MgSO₄ + Na₂CO₃ → MgCO₃↓ + Na₂SO₄" } },
    { tutor: "C.T: add NaOH to a fresh Salt Solution.", x: "add NaOH", item: "naoh", tube: 2, pour: "naoh", zoom: true, post: { title: "White ppt → Mg²⁺ confirmed", body: "White ppt of Mg(OH)₂ confirms Mg²⁺.", eq: "MgSO₄ + 2NaOH → Mg(OH)₂↓ + Na₂SO₄" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = powder;
    else if (step === 2) t[0] = withWater("#e6ebe8");
    else if (step >= 3) t[0] = sol(SALT); // Mg²⁺ gives no group precipitate
    if (step >= 8) {
      t[1] = step >= 9 ? ppt("#dfe4e8", "#e7ecee") : sol(SALT);
      t[2] = step >= 10 ? ppt("#dfe4e8", "#e7ecee") : sol(SALT);
    }
    return t;
  },
  summary: [
    { test: "Salt solution + Diluted HCl", obs: "No precipitate", inf: "Group I absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "Salt solution + Diluted HCl + H₂S", obs: "No precipitate", inf: "Group II absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "+ NH₄Cl, boil, + NH₄OH (excess)", obs: "No precipitate", inf: "Group III absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "+ NH₄Cl, NH₄OH (excess) + H₂S", obs: "No precipitate", inf: "Group IV absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "+ NH₄Cl, NH₄OH + (NH₄)₂CO₃", obs: "No precipitate", inf: "Group V absent → Group VI present", eq: "", liquid: SALT, ppt: SALT },
    { test: "C.T: Salt solution + Na₂CO₃", obs: "White ppt (soluble in dil. HCl)", inf: "Mg²⁺ confirmed", eq: "MgSO₄ + Na₂CO₃ → MgCO₃↓ + Na₂SO₄", liquid: "#e7ecee", ppt: "#dfe4e8" },
    { test: "C.T: Salt solution + NaOH", obs: "White ppt of Mg(OH)₂", inf: "Mg²⁺ confirmed", eq: "MgSO₄ + 2NaOH → Mg(OH)₂↓ + Na₂SO₄", liquid: "#e7ecee", ppt: "#dfe4e8" },
  ],
  procedure: [
    "Dissolve the salt in distilled water to prepare the Salt Solution.",
    "Groups I–V tests → no precipitate → Group VI present (Mg²⁺, NH₄⁺, Na⁺, K⁺).",
    "Confirm with fresh salt solution: + Na₂CO₃ (white, soluble in dil. HCl) and + NaOH (white Mg(OH)₂).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
