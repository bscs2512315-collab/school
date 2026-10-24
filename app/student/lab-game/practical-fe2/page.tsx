"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, powder, withWater, sol, ppt } from "../_practical/helpers";

const SALT = "#86efac"; // pale sea-green Fe²⁺ salt solution

const config: PracticalConfig = {
  title: "Detect Fe²⁺",
  ionLabel: "Fe²⁺",
  radical: "iron(II)",
  group: "Group III",
  reagents: [
    { id: "water", color: "#dbe9f4", label: "Dist. Water" },
    { id: "hcl", color: "#e4eef4", label: "Diluted HCl" },
    { id: "h2s", color: "#eceee0", label: "H₂S" },
    { id: "nh4oh", color: "#e7e2f0", label: "NH₄OH" },
    { id: "naoh", color: "#eef0f2", label: "NaOH" },
    { id: "na2co3", color: "#eef0f2", label: "Na₂CO₃" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Add the salt sample to the test tube.", x: "add the salt", item: "salt", tube: 0 },
    { tutor: "Add distilled water to the test tube.", x: "pour distilled water", item: "water", tube: 0, pour: "water" },
    { tutor: "Shake to dissolve — this is your Salt Solution.", x: "shake the tube", item: "tube", tube: 0, anim: "shake", post: { title: "Salt Solution ready ", body: "The salt dissolves into a pale sea-green Fe²⁺ salt solution." } },
    { tutor: "Add Diluted HCl to the Salt Solution.", x: "add Diluted HCl", item: "hcl", tube: 0, pour: "hcl", zoom: true, pre: { title: "Group I test", body: "Add Diluted HCl. No precipitate means the first group is absent." }, post: { title: "No precipitate", body: "No precipitate → Group I absent." } },
    { tutor: "Pass H₂S through the acidified solution.", x: "pass H₂S", item: "h2s", tube: 0, pour: "h2s", zoom: true, post: { title: "No precipitate", body: "No precipitate → Group II absent." } },
    { tutor: "Add NH₄Cl, boil & cool, then NH₄OH in excess.", x: "add NH₄OH", item: "nh4oh", tube: 0, pour: "nh4oh", zoom: true, post: { title: "Reddish-brown precipitate", body: "Reddish-brown ppt → Group III present; Fe²⁺ is indicated." } },
    { tutor: "C.T: add NaOH to a fresh Salt Solution.", x: "add NaOH", item: "naoh", tube: 1, pour: "naoh", zoom: true, pre: { title: "Confirmatory tests", body: "Two fresh salt-solution portions are ready. Confirm Fe²⁺ with NaOH and with Na₂CO₃." }, post: { title: "Dirty-green ppt → Fe²⁺ confirmed", body: "Dirty-green ppt of Fe(OH)₂ confirms Fe²⁺.", eq: "FeSO₄ + 2NaOH → Fe(OH)₂↓ + Na₂SO₄" } },
    { tutor: "C.T: add Na₂CO₃ to a fresh Salt Solution.", x: "add Na₂CO₃", item: "na2co3", tube: 2, pour: "na2co3", zoom: true, post: { title: "White ppt → Fe²⁺ confirmed", body: "White ppt of FeCO₃ confirms Fe²⁺.", eq: "FeSO₄ + Na₂CO₃ → FeCO₃↓ + Na₂SO₄" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = powder;
    else if (step === 2) t[0] = withWater("#bbf7d0");
    else if (step >= 3 && step <= 5) t[0] = sol(SALT);
    else if (step >= 6) t[0] = ppt("#9a3412", "#b45309", 0.72, 0.7);
    if (step >= 6) {
      t[1] = step >= 7 ? ppt("#4d7c0f", "#86efac") : sol(SALT);
      t[2] = step >= 8 ? ppt("#f8fafc", "#e2e8f0") : sol(SALT);
    }
    return t;
  },
  summary: [
    { test: "Salt solution + Diluted HCl", obs: "No precipitate", inf: "Group I absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "Salt solution + Diluted HCl + H₂S", obs: "No precipitate", inf: "Group II absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "Salt solution + NH₄Cl, boil, + NH₄OH (excess)", obs: "Reddish-brown ppt", inf: "Group III present; Fe²⁺ indicated", eq: "", liquid: "#b45309", ppt: "#9a3412" },
    { test: "C.T: Salt solution + NaOH", obs: "Dirty-green ppt", inf: "Fe²⁺ confirmed", eq: "FeSO₄ + 2NaOH → Fe(OH)₂↓ + Na₂SO₄", liquid: "#86efac", ppt: "#4d7c0f" },
    { test: "C.T: Salt solution + Na₂CO₃", obs: "White ppt", inf: "Fe²⁺ confirmed", eq: "FeSO₄ + Na₂CO₃ → FeCO₃↓ + Na₂SO₄", liquid: "#e2e8f0", ppt: "#f8fafc" },
  ],
  procedure: [
    "Dissolve the salt in distilled water to prepare the Salt Solution (pale-green Fe²⁺).",
    "Salt solution + Diluted HCl → no precipitate → Group I absent.",
    "Pass H₂S → no precipitate → Group II absent.",
    "Add NH₄Cl, boil & cool, then NH₄OH in excess → reddish-brown ppt → Group III; Fe²⁺ indicated.",
    "Confirm with fresh salt solution: + NaOH (green ppt) and + Na₂CO₃ (white ppt).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
