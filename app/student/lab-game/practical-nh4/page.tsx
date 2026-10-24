"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, powder, withWater, sol, ppt } from "../_practical/helpers";

const SALT = "#dfe3e0"; // colourless NH₄⁺ salt solution

const config: PracticalConfig = {
  title: "Detect NH₄⁺",
  ionLabel: "NH₄⁺",
  radical: "ammonium",
  group: "Group VI",
  reagents: [
    { id: "water", color: "#dbe9f4", label: "Dist. Water" },
    { id: "hcl", color: "#e4eef4", label: "Diluted HCl" },
    { id: "h2s", color: "#eceee0", label: "H₂S" },
    { id: "nh4oh", color: "#e7e2f0", label: "NH₄OH" },
    { id: "amcarb", color: "#eef0f2", label: "(NH₄)₂CO₃" },
    { id: "nessler", color: "#fef08a", label: "Nessler's" },
    { id: "na2co3", color: "#eef0f2", label: "Na₂CO₃" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Add the salt sample to the test tube.", x: "add the salt", item: "salt", tube: 0 },
    { tutor: "Add distilled water to the test tube.", x: "pour distilled water", item: "water", tube: 0, pour: "water" },
    { tutor: "Shake to dissolve — this is your Salt Solution.", x: "shake the tube", item: "tube", tube: 0, anim: "shake", post: { title: "Salt Solution ready ", body: "The salt dissolves into a colourless salt solution." } },
    { tutor: "Add Diluted HCl to the Salt Solution.", x: "add Diluted HCl", item: "hcl", tube: 0, pour: "hcl", zoom: true, pre: { title: "Group I test", body: "Add Diluted HCl. No precipitate means Group I is absent." }, post: { title: "No precipitate", body: "No precipitate → Group I absent." } },
    { tutor: "Pass H₂S through the acidified solution.", x: "pass H₂S", item: "h2s", tube: 0, pour: "h2s", zoom: true, post: { title: "No precipitate", body: "No precipitate → Group II absent." } },
    { tutor: "Add NH₄Cl, boil & cool, then NH₄OH in excess.", x: "add NH₄OH", item: "nh4oh", tube: 0, pour: "nh4oh", zoom: true, post: { title: "No precipitate", body: "No precipitate → Group III absent." } },
    { tutor: "Now pass H₂S through the ammoniacal solution.", x: "pass H₂S", item: "h2s", tube: 0, pour: "h2s", zoom: true, post: { title: "No precipitate", body: "No precipitate → Group IV absent." } },
    { tutor: "Add NH₄Cl, NH₄OH, then (NH₄)₂CO₃.", x: "add (NH₄)₂CO₃", item: "amcarb", tube: 0, pour: "amcarb", zoom: true, post: { title: "Smell of ammonia", body: "No ppt, but ammonia is given out (white fumes with a rod dipped in conc. HCl) → Group VI; NH₄⁺ is indicated." } },
    { tutor: "C.T: add Nessler's reagent to a fresh Salt Solution.", x: "add Nessler's reagent", item: "nessler", tube: 1, pour: "nessler", zoom: true, pre: { title: "Confirmatory tests", body: "Two fresh salt-solution portions are ready. Confirm NH₄⁺ with Nessler's reagent and with Na₂CO₃ (heat)." }, post: { title: "Brown ppt → NH₄⁺ confirmed", body: "Brown ppt with Nessler's reagent confirms NH₄⁺.", eq: "NH₄OH + 2K₂HgI₄ + 3NaOH → NH₂Hg₂I₃↓ + 4KI + 3NaI + 3H₂O" } },
    { tutor: "C.T: add Na₂CO₃ to a fresh Salt Solution and heat.", x: "add Na₂CO₃ + heat", item: "na2co3", tube: 2, pour: "na2co3", zoom: true, post: { title: "Ammonia evolved → NH₄⁺ confirmed", body: "On heating, ammonia gas is evolved (pungent smell) → NH₄⁺ confirmed.", eq: "2NH₄Cl + Na₂CO₃ → 2NaCl + 2NH₃↑ + CO₂ + H₂O" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = powder;
    else if (step === 2) t[0] = withWater("#e6ebe8");
    else if (step >= 3) t[0] = sol(SALT); // NH₄⁺ gives no group precipitate
    if (step >= 8) {
      t[1] = step >= 9 ? ppt("#78350f", "#fef3c7", 0.75, 0.85) : sol(SALT); // Nessler brown
      t[2] = step >= 10 ? sol(SALT) : sol(SALT); // gas evolved, no ppt
    }
    return t;
  },
  summary: [
    { test: "Salt solution + Diluted HCl", obs: "No precipitate", inf: "Group I absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "Salt solution + Diluted HCl + H₂S", obs: "No precipitate", inf: "Group II absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "+ NH₄Cl, boil, + NH₄OH (excess)", obs: "No precipitate", inf: "Group III absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "+ NH₄Cl, NH₄OH (excess) + H₂S", obs: "No precipitate", inf: "Group IV absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "+ NH₄Cl, NH₄OH + (NH₄)₂CO₃", obs: "No ppt; smell of ammonia (white fumes with conc. HCl)", inf: "Group VI; NH₄⁺ indicated", eq: "", liquid: SALT, ppt: SALT },
    { test: "C.T: Salt solution + Nessler's reagent", obs: "Brown ppt", inf: "NH₄⁺ confirmed", eq: "NH₄OH + 2K₂HgI₄ + 3NaOH → NH₂Hg₂I₃↓ + 4KI + 3NaI + 3H₂O", liquid: "#fef3c7", ppt: "#78350f" },
    { test: "C.T: Salt solution + Na₂CO₃, heat", obs: "Ammonia gas evolved", inf: "NH₄⁺ confirmed", eq: "2NH₄Cl + Na₂CO₃ → 2NaCl + 2NH₃↑ + CO₂ + H₂O", liquid: SALT, ppt: SALT },
  ],
  procedure: [
    "Dissolve the salt in distilled water to prepare the Salt Solution.",
    "Groups I–V tests → no precipitate → Group VI; smell of ammonia indicates NH₄⁺.",
    "Confirm with fresh salt solution: + Nessler's reagent (brown ppt) and + Na₂CO₃ on heating (NH₃ gas).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
