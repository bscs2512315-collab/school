"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, powder, sol, ppt, gas } from "../_practical/helpers";

const SALT = "#dfe3e0"; // colourless nitrite salt solution

const config: PracticalConfig = {
  title: "Detect NO₂⁻",
  ionLabel: "NO₂⁻",
  radical: "nitrite",
  group: "Dilute-acid group",
  reagents: [
    { id: "h2so4", color: "#e4eef4", label: "Diluted H₂SO₄" },
    { id: "ki", color: "#e9dfcf", label: "KI + H₂SO₄" },
    { id: "agno3", color: "#eef0f2", label: "AgNO₃" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Add the salt sample to the test tube.", x: "add the salt", item: "salt", tube: 0 },
    { tutor: "Add Diluted H₂SO₄ to the salt.", x: "add Diluted H₂SO₄", item: "h2so4", tube: 0, pour: "h2so4", zoom: true, pre: { title: "Dilute-acid group test", body: "Add Diluted H₂SO₄. Brown fumes indicate the dilute-acid group with a nitrite." }, post: { title: "Brown fumes evolved", body: "Brown fumes evolve → dilute-acid group present; NO₂⁻ is indicated." } },
    { tutor: "Pass the evolved gas through the FeSO₄ solution.", x: "pass the gas through FeSO₄", item: "tube", tube: 1, zoom: true, deliver: { from: 0, to: 1 }, pre: { title: "FeSO₄ test", body: "A tube of FeSO₄ is connected. If it turns black, a nitrite is indicated." }, post: { title: "FeSO₄ turns black", body: "The FeSO₄ solution turns black → NO₂⁻ is indicated." } },
    { tutor: "C.T: add KI + H₂SO₄ to a fresh Salt Solution.", x: "add KI + H₂SO₄", item: "ki", tube: 2, pour: "ki", zoom: true, pre: { title: "Confirmatory tests", body: "Fresh salt-solution portions are ready. Confirm NO₂⁻ with KI + H₂SO₄ and with AgNO₃." }, post: { title: "Brown (I₂) → NO₂⁻ confirmed", body: "Iodine is liberated giving a brown colour → NO₂⁻ confirmed.", eq: "2NaNO₂ + 2KI + 2H₂SO₄ → Na₂SO₄ + K₂SO₄ + 2NO + I₂ + 2H₂O" } },
    { tutor: "C.T: add AgNO₃ to a fresh Salt Solution.", x: "add AgNO₃", item: "agno3", tube: 3, pour: "agno3", zoom: true, post: { title: "White ppt → NO₂⁻ confirmed", body: "White ppt of AgNO₂ → NO₂⁻ confirmed.", eq: "NaNO₂ + AgNO₃ → AgNO₂↓ + NaNO₃" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = powder;
    else if (step === 2 || step === 3) t[0] = gas("#ea580c");
    else if (step >= 4) t[0] = sol("#eef1f2", 0.5);
    // tube 1: FeSO₄ (pale green) → black/dark brown
    if (step >= 2) t[1] = step >= 3 ? sol("#451a03", 0.75, 0.9) : sol("#86efac");
    // confirmatory: KI+H₂SO₄ (brown I₂) and AgNO₃ (white ppt)
    if (step >= 3) {
      t[2] = step >= 4 ? sol("#78350f", 0.75, 0.85) : sol(SALT);
      t[3] = step >= 5 ? ppt("#f8fafc", "#e7ecee") : sol(SALT);
    }
    return t;
  },
  summary: [
    { test: "Salt + Diluted H₂SO₄", obs: "Brown fumes evolved", inf: "Dilute-acid group present; NO₂⁻ indicated", eq: "", liquid: "#ea580c", ppt: "#ea580c" },
    { test: "Pass the gas through FeSO₄", obs: "FeSO₄ turns black", inf: "NO₂⁻ indicated", eq: "", liquid: "#451a03", ppt: "#451a03" },
    { test: "C.T: Salt solution + KI + H₂SO₄", obs: "Brown colour of I₂", inf: "NO₂⁻ confirmed", eq: "2NaNO₂ + 2KI + 2H₂SO₄ → Na₂SO₄ + K₂SO₄ + 2NO + I₂ + 2H₂O", liquid: "#78350f", ppt: "#78350f" },
    { test: "C.T: Salt solution + AgNO₃", obs: "White ppt", inf: "NO₂⁻ confirmed", eq: "NaNO₂ + AgNO₃ → AgNO₂↓ + NaNO₃", liquid: "#e7ecee", ppt: "#f8fafc" },
  ],
  procedure: [
    "Salt + Diluted H₂SO₄ → brown fumes → dilute-acid group; NO₂⁻ indicated.",
    "Pass the gas through FeSO₄ → turns black → NO₂⁻ indicated.",
    "Confirm with fresh salt solution: + KI/H₂SO₄ (brown I₂) and + AgNO₃ (white ppt).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
