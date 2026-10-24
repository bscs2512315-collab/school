"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, powder, withWater, sol, ppt } from "../_practical/helpers";

const SALT = "#dfe3e0"; // colourless Zn²⁺ salt solution

const config: PracticalConfig = {
  title: "Detect Zn²⁺",
  ionLabel: "Zn²⁺",
  radical: "zinc",
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
    { tutor: "Shake to dissolve — this is your Salt Solution.", x: "shake the tube", item: "tube", tube: 0, anim: "shake", post: { title: "Salt Solution ready ", body: "The salt dissolves into a colourless Zn²⁺ salt solution." } },
    { tutor: "Add Diluted HCl to the Salt Solution.", x: "add Diluted HCl", item: "hcl", tube: 0, pour: "hcl", zoom: true, pre: { title: "Group I test", body: "Add Diluted HCl. No precipitate means Group I is absent." }, post: { title: "No precipitate", body: "No precipitate → Group I absent." } },
    { tutor: "Pass H₂S through the acidified solution.", x: "pass H₂S", item: "h2s", tube: 0, pour: "h2s", zoom: true, post: { title: "No precipitate", body: "No precipitate → Group II absent." } },
    { tutor: "Add NH₄Cl, boil & cool, then NH₄OH in excess.", x: "add NH₄OH", item: "nh4oh", tube: 0, pour: "nh4oh", zoom: true, post: { title: "No precipitate", body: "No precipitate → Group III absent." } },
    { tutor: "Now pass H₂S through the ammoniacal solution.", x: "pass H₂S", item: "h2s", tube: 0, pour: "h2s", zoom: true, post: { title: "Greyish-white precipitate", body: "Greyish-white ppt → Group IV present (Co²⁺, Ni²⁺, Mn²⁺, Zn²⁺); Zn²⁺ may be present." } },
    { tutor: "C.T: add NaOH to a fresh Salt Solution.", x: "add NaOH", item: "naoh", tube: 1, pour: "naoh", zoom: true, pre: { title: "Confirmatory tests", body: "Two fresh salt-solution portions are ready. Confirm Zn²⁺ with NaOH and with NH₄OH." }, post: { title: "White gelatinous ppt → Zn²⁺ confirmed", body: "White gelatinous ppt of Zn(OH)₂, soluble in excess NaOH, confirms Zn²⁺.", eq: "ZnCl₂ + 2NaOH → Zn(OH)₂↓ + 2NaCl" } },
    { tutor: "C.T: add NH₄OH to a fresh Salt Solution.", x: "add NH₄OH", item: "nh4oh", tube: 2, pour: "nh4oh", zoom: true, post: { title: "White ppt → Zn²⁺ confirmed", body: "White ppt of Zn(OH)₂, soluble in excess NH₄OH, confirms Zn²⁺.", eq: "ZnCl₂ + 2NH₄OH → Zn(OH)₂↓ + 2NH₄Cl" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = powder;
    else if (step === 2) t[0] = withWater("#e6ebe8");
    else if (step >= 3 && step <= 6) t[0] = sol(SALT);
    else if (step >= 7) t[0] = ppt("#9aa0a4", "#d5dadd", 0.66, 0.68); // greyish-white ZnS
    if (step >= 7) {
      t[1] = step >= 8 ? ppt("#dfe4e8", "#e7ecee") : sol(SALT);
      t[2] = step >= 9 ? ppt("#dfe4e8", "#e7ecee") : sol(SALT);
    }
    return t;
  },
  summary: [
    { test: "Salt solution + Diluted HCl", obs: "No precipitate", inf: "Group I absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "Salt solution + Diluted HCl + H₂S", obs: "No precipitate", inf: "Group II absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "Salt solution + NH₄Cl, boil, + NH₄OH (excess)", obs: "No precipitate", inf: "Group III absent", eq: "", liquid: SALT, ppt: SALT },
    { test: "+ NH₄Cl, NH₄OH (excess) + H₂S", obs: "Greyish-white ppt", inf: "Group IV present; Zn²⁺ may be present", eq: "", liquid: "#d5dadd", ppt: "#9aa0a4" },
    { test: "C.T: Salt solution + NaOH", obs: "White gelatinous ppt, soluble in excess NaOH", inf: "Zn²⁺ confirmed", eq: "ZnCl₂ + 2NaOH → Zn(OH)₂↓ + 2NaCl", liquid: "#e7ecee", ppt: "#dfe4e8" },
    { test: "C.T: Salt solution + NH₄OH", obs: "White ppt, soluble in excess NH₄OH", inf: "Zn²⁺ confirmed", eq: "ZnCl₂ + 2NH₄OH → Zn(OH)₂↓ + 2NH₄Cl", liquid: "#e7ecee", ppt: "#dfe4e8" },
  ],
  procedure: [
    "Dissolve the salt in distilled water to prepare the Salt Solution.",
    "Groups I, II & III tests → no precipitate (absent).",
    "Pass H₂S in the ammoniacal solution → greyish-white ppt → Group IV; Zn²⁺ may be present.",
    "Confirm with fresh salt solution: + NaOH and + NH₄OH (white ppt soluble in excess).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
