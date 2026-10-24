"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, powder, withWater, sol, ppt } from "../_practical/helpers";

const SALT = "#22c55e"; // emerald-green Ni²⁺ salt solution

const config: PracticalConfig = {
  title: "Detect Ni²⁺",
  ionLabel: "Ni²⁺",
  radical: "nickel",
  group: "Group IV",
  reagents: [
    { id: "water", color: "#dbe9f4", label: "Dist. Water" },
    { id: "hcl", color: "#e4eef4", label: "Diluted HCl" },
    { id: "h2s", color: "#eceee0", label: "H₂S" },
    { id: "nh4oh", color: "#e7e2f0", label: "NH₄OH" },
    { id: "naoh", color: "#eef0f2", label: "NaOH" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Add the salt sample to the test tube.", x: "add the salt", item: "salt", tube: 0 },
    { tutor: "Add distilled water to the test tube.", x: "pour distilled water", item: "water", tube: 0, pour: "water" },
    { tutor: "Shake to dissolve — this is your Salt Solution.", x: "shake the tube", item: "tube", tube: 0, anim: "shake", post: { title: "Salt Solution ready ", body: "The salt dissolves into an emerald-green Ni²⁺ salt solution." } },
    { tutor: "Add Diluted HCl to the Salt Solution.", x: "add Diluted HCl", item: "hcl", tube: 0, pour: "hcl", zoom: true, pre: { title: "Group I test", body: "Add Diluted HCl. No precipitate means Group I is absent." }, post: { title: "No precipitate", body: "No precipitate → Group I absent." } },
    { tutor: "Pass H₂S through the acidified solution.", x: "pass H₂S", item: "h2s", tube: 0, pour: "h2s", zoom: true, post: { title: "No precipitate", body: "No precipitate → Group II absent." } },
    { tutor: "Add NH₄Cl, boil & cool, then NH₄OH in excess.", x: "add NH₄OH", item: "nh4oh", tube: 0, pour: "nh4oh", zoom: true, post: { title: "No precipitate", body: "No precipitate → Group III absent." } },
    { tutor: "Now pass H₂S through the ammoniacal solution.", x: "pass H₂S", item: "h2s", tube: 0, pour: "h2s", zoom: true, post: { title: "Black precipitate", body: "Black ppt (salt is green) → Group IV present (Co²⁺, Ni²⁺, Mn²⁺, Zn²⁺); Ni²⁺ may be present." } },
    { tutor: "C.T: add NaOH to a fresh Salt Solution.", x: "add NaOH", item: "naoh", tube: 1, pour: "naoh", zoom: true, pre: { title: "Confirmatory test", body: "A fresh salt-solution portion is ready. Confirm Ni²⁺ with NaOH." }, post: { title: "Apple-green ppt → Ni²⁺ confirmed", body: "Apple-green ppt of Ni(OH)₂ confirms Ni²⁺.", eq: "NiCl₂ + 2NaOH → Ni(OH)₂↓ + 2NaCl" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = powder;
    else if (step === 2) t[0] = withWater("#86efac");
    else if (step >= 3 && step <= 6) t[0] = sol(SALT);
    else if (step >= 7) t[0] = ppt("#171717", "#16a34a", 0.75, 0.85); // black NiS
    if (step >= 7) t[1] = step >= 8 ? ppt("#4ade80", "#22c55e") : sol(SALT);
    return t;
  },
  summary: [
    { test: "Salt solution + Diluted HCl", obs: "No precipitate", inf: "Group I absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "Salt solution + Diluted HCl + H₂S", obs: "No precipitate", inf: "Group II absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "Salt solution + NH₄Cl, boil, + NH₄OH (excess)", obs: "No precipitate", inf: "Group III absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "+ NH₄Cl, NH₄OH (excess) + H₂S", obs: "Black ppt; salt is green", inf: "Group IV present; Ni²⁺ may be present", eq: "", liquid: "#16a34a", ppt: "#171717" },
    { test: "C.T: Salt solution + NaOH", obs: "Apple-green ppt", inf: "Ni²⁺ confirmed", eq: "NiCl₂ + 2NaOH → Ni(OH)₂↓ + 2NaCl", liquid: "#22c55e", ppt: "#4ade80" },
  ],
  procedure: [
    "Dissolve the salt in distilled water to prepare the Salt Solution (green Ni²⁺).",
    "Groups I, II & III tests → no precipitate (absent).",
    "Pass H₂S in the ammoniacal solution → black ppt → Group IV; Ni²⁺ may be present.",
    "Confirm: fresh salt solution + NaOH → light-green ppt.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
