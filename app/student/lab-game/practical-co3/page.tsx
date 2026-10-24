"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, powder, sol, ppt, gas, milky } from "../_practical/helpers";

const SALT = "#dfe3e0"; // colourless carbonate salt solution

const config: PracticalConfig = {
  title: "Detect CO₃²⁻",
  ionLabel: "CO₃²⁻",
  radical: "carbonate",
  group: "Dilute-acid group",
  reagents: [
    { id: "h2so4", color: "#e4eef4", label: "Diluted H₂SO₄" },
    { id: "bacl2", color: "#eef0f2", label: "BaCl₂" },
    { id: "mgso4", color: "#eef0f2", label: "MgSO₄" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Add the salt sample to the test tube.", x: "add the salt", item: "salt", tube: 0 },
    { tutor: "Add Diluted H₂SO₄ to the salt.", x: "add Diluted H₂SO₄", item: "h2so4", tube: 0, pour: "h2so4", zoom: true, pre: { title: "Dilute-acid group test", body: "Add Diluted H₂SO₄ to the salt. A gas with effervescence means the dilute-acid group is present." }, post: { title: "Colourless gas, effervescence", body: "A colourless, odourless gas evolves with effervescence → dilute-acid group present (CO₃²⁻, HCO₃⁻, SO₃²⁻, S²⁻, S₂O₃²⁻, NO₂⁻).", eq: "Na₂CO₃ + H₂SO₄ → Na₂SO₄ + H₂O + CO₂↑" } },
    { tutor: "Pass the evolved gas through the lime water.", x: "pass the gas through lime water", item: "tube", tube: 1, zoom: true, deliver: { from: 0, to: 1 }, pre: { title: "Lime-water test", body: "The source tube is capped with a delivery tube and connected to a tube of lime water. Pass the gas through — milkiness means a carbonate/bicarbonate." }, post: { title: "Lime water turns milky", body: "The gas bubbles through and the lime water turns milky → CO₃²⁻ or HCO₃⁻ may be present.", eq: "CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O" } },
    { tutor: "C.T: add BaCl₂ to a fresh Salt Solution.", x: "add BaCl₂", item: "bacl2", tube: 2, pour: "bacl2", zoom: true, pre: { title: "Confirmatory tests", body: "Two fresh salt-solution portions are ready. Confirm CO₃²⁻ with BaCl₂ and with MgSO₄." }, post: { title: "White ppt → CO₃²⁻ confirmed", body: "White ppt of BaCO₃ confirms CO₃²⁻.", eq: "Na₂CO₃ + BaCl₂ → BaCO₃↓ + 2NaCl" } },
    { tutor: "C.T: add MgSO₄ to a fresh Salt Solution.", x: "add MgSO₄", item: "mgso4", tube: 3, pour: "mgso4", zoom: true, post: { title: "White ppt → CO₃²⁻ confirmed", body: "White ppt of MgCO₃ (formed in the cold) confirms CO₃²⁻.", eq: "Na₂CO₃ + MgSO₄ → MgCO₃↓ + Na₂SO₄" } },
  ],
  tubeVis: (step) => {
    const t = five();
    // tube 0: salt + Diluted H₂SO₄ → effervescence
    if (step === 1) t[0] = powder;
    else if (step === 2 || step === 3) t[0] = gas("#eef1f2");
    else if (step >= 4) t[0] = sol("#eef1f2", 0.5);
    // tube 1: lime water → bubbles + milky as the gas passes through
    if (step >= 2) t[1] = step === 3 ? { ...milky(), fizz: true } : step > 3 ? milky() : sol("#e7f0ea", 0.55);
    // confirmatory fresh salt-solution portions
    if (step >= 3) {
      t[2] = step >= 4 ? ppt("#dfe4e8", "#e7ecee") : sol(SALT);
      t[3] = step >= 5 ? ppt("#dfe4e8", "#e7ecee") : sol(SALT);
    }
    return t;
  },
  summary: [
    { test: "Salt + Diluted H₂SO₄", obs: "Colourless, odourless gas with effervescence", inf: "Dilute-acid group present", eq: "Na₂CO₃ + H₂SO₄ → Na₂SO₄ + H₂O + CO₂↑", liquid: "#eef1f2", ppt: "#eef1f2" },
    { test: "Pass the gas through lime water", obs: "Lime water turns milky", inf: "CO₃²⁻ or HCO₃⁻ may be present", eq: "CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O", liquid: "#e6eaec", ppt: "#eef1f4" },
    { test: "C.T: Salt solution + BaCl₂", obs: "White ppt", inf: "CO₃²⁻ confirmed", eq: "Na₂CO₃ + BaCl₂ → BaCO₃↓ + 2NaCl", liquid: "#e7ecee", ppt: "#dfe4e8" },
    { test: "C.T: Salt solution + MgSO₄", obs: "White ppt (in cold)", inf: "CO₃²⁻ confirmed", eq: "Na₂CO₃ + MgSO₄ → MgCO₃↓ + Na₂SO₄", liquid: "#e7ecee", ppt: "#dfe4e8" },
  ],
  procedure: [
    "Add Diluted H₂SO₄ to the salt → colourless gas with effervescence → dilute-acid group present.",
    "Pass the gas through lime water → turns milky → CO₃²⁻ or HCO₃⁻ may be present.",
    "Confirm with fresh salt solution: + BaCl₂ (white BaCO₃) and + MgSO₄ (white MgCO₃ in cold).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
