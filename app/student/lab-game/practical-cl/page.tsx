"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, powder, sol, ppt, gas } from "../_practical/helpers";

const SALT = "#dfe3e0"; // colourless chloride salt solution

const config: PracticalConfig = {
  title: "Detect Cl⁻",
  ionLabel: "Cl⁻",
  radical: "chloride",
  group: "Conc.-acid group",
  reagents: [
    { id: "dsa", color: "#e4eef4", label: "Diluted H₂SO₄" },
    { id: "csa", color: "#dfe6ea", label: "Conc. H₂SO₄" },
    { id: "agno3", color: "#eef0f2", label: "AgNO₃" },
    { id: "naoh", color: "#eef0f2", label: "NaOH" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Add the salt sample to the test tube.", x: "add the salt", item: "salt", tube: 0 },
    { tutor: "Add Diluted H₂SO₄ to the salt.", x: "add Diluted H₂SO₄", item: "dsa", tube: 0, pour: "dsa", zoom: true, pre: { title: "Dilute-acid group test", body: "Add Diluted H₂SO₄. No reaction means the dilute-acid group is absent." }, post: { title: "No reaction", body: "No reaction → dilute-acid group absent." } },
    { tutor: "Add Conc. H₂SO₄ to the salt.", x: "add Conc. H₂SO₄", item: "csa", tube: 0, pour: "csa", zoom: true, post: { title: "Pungent gas evolved", body: "A colourless gas with a pungent smell evolves → conc.-acid group present (Cl⁻, Br⁻, I⁻, CH₃COO⁻, NO₃⁻, C₂O₄²⁻)." } },
    { tutor: "Bring a NH₄OH-dipped rod near the gas.", x: "bring the NH₄OH rod near", item: "tube", tube: 0, zoom: true, post: { title: "Dense white fumes", body: "Dense white fumes form with the NH₄OH rod → Cl⁻ is indicated." } },
    { tutor: "C.T: add AgNO₃ to a fresh Salt Solution.", x: "add AgNO₃", item: "agno3", tube: 1, pour: "agno3", zoom: true, pre: { title: "Confirmatory tests", body: "Fresh salt-solution portions are ready. Confirm Cl⁻ with AgNO₃ and with the chromyl-chloride test." }, post: { title: "White ppt → Cl⁻ confirmed", body: "White ppt of AgCl, soluble in excess NH₄OH → Cl⁻ confirmed.", eq: "NaCl + AgNO₃ → AgCl↓ + NaNO₃" } },
    { tutor: "C.T: chromyl-chloride test — pass CrO₂Cl₂ into NaOH.", x: "add NaOH (chromyl test)", item: "naoh", tube: 2, pour: "naoh", zoom: true, post: { title: "Bright-yellow ppt → Cl⁻ confirmed", body: "Chromyl chloride passed into NaOH gives a bright-yellow chromate → Cl⁻ confirmed.", eq: "CrO₂Cl₂ + 4NaOH → Na₂CrO₄ + 2NaCl + 2H₂O" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = powder;
    else if (step === 2) t[0] = sol("#e8eef2", 0.6); // + dil. H₂SO₄, no reaction
    else if (step === 3) t[0] = gas("#eef1f2"); // + conc. H₂SO₄, pungent gas
    else if (step === 4) t[0] = { ...gas("#eef1f2"), fumes: true }; // NH₄OH rod → dense white fumes
    else if (step >= 5) t[0] = sol("#eef1f2", 0.5);
    if (step >= 4) {
      t[1] = step >= 5 ? ppt("#dfe4e8", "#e7ecee") : sol(SALT);
      t[2] = step >= 6 ? sol("#ecd63a", 0.7) : sol(SALT);
    }
    return t;
  },
  summary: [
    { test: "Salt + Diluted H₂SO₄", obs: "No reaction", inf: "Dilute-acid group absent", eq: "", liquid: "#e8eef2", ppt: "#e8eef2" },
    { test: "Salt + Conc. H₂SO₄", obs: "Colourless, pungent gas", inf: "Conc.-acid group present", eq: "", liquid: "#eef1f2", ppt: "#eef1f2" },
    { test: "NH₄OH-dipped rod near the gas", obs: "Dense white fumes", inf: "Cl⁻ indicated", eq: "", liquid: SALT, ppt: SALT },
    { test: "C.T: Salt solution + AgNO₃", obs: "White ppt, soluble in excess NH₄OH", inf: "Cl⁻ confirmed", eq: "NaCl + AgNO₃ → AgCl↓ + NaNO₃", liquid: "#e7ecee", ppt: "#dfe4e8" },
    { test: "C.T: Chromyl-chloride test (CrO₂Cl₂ + NaOH)", obs: "Bright-yellow chromate", inf: "Cl⁻ confirmed", eq: "CrO₂Cl₂ + 4NaOH → Na₂CrO₄ + 2NaCl + 2H₂O", liquid: "#ecd63a", ppt: "#ecd63a" },
  ],
  procedure: [
    "Salt + Diluted H₂SO₄ → no reaction → dilute-acid group absent.",
    "Salt + Conc. H₂SO₄ → pungent gas → conc.-acid group present.",
    "NH₄OH rod near the gas → dense white fumes → Cl⁻ indicated.",
    "Confirm with fresh salt solution: + AgNO₃ (white AgCl) and the chromyl-chloride test (bright yellow).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
