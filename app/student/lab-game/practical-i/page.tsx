"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, powder, sol, ppt, gas } from "../_practical/helpers";

const SALT = "#dfe3e0";

const config: PracticalConfig = {
  title: "Detect I⁻",
  ionLabel: "I⁻",
  radical: "iodide",
  group: "Conc.-acid group",
  reagents: [
    { id: "dsa", color: "#e4eef4", label: "Diluted H₂SO₄" },
    { id: "csa", color: "#dfe6ea", label: "Conc. H₂SO₄" },
    { id: "kmno4", color: "#4a044e", label: "CS₂ + KMnO₄" },
    { id: "agno3", color: "#eef0f2", label: "AgNO₃" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Add the salt sample to the test tube.", x: "add the salt", item: "salt", tube: 0 },
    { tutor: "Add Diluted H₂SO₄ to the salt.", x: "add Diluted H₂SO₄", item: "dsa", tube: 0, pour: "dsa", zoom: true, pre: { title: "Dilute-acid group test", body: "Add Diluted H₂SO₄. No reaction means the dilute-acid group is absent." }, post: { title: "No reaction", body: "No reaction → dilute-acid group absent." } },
    { tutor: "Add Conc. H₂SO₄ and warm.", x: "add Conc. H₂SO₄", item: "csa", tube: 0, pour: "csa", zoom: true, post: { title: "Violet fumes + black sublimate", body: "Violet fumes with a black sublimate on the cooler part → conc.-acid group present; I⁻ is indicated." } },
    { tutor: "Pass the violet fumes over the starch paper.", x: "pass the fumes over starch paper", item: "tube", tube: 1, zoom: true, deliver: { from: 0, to: 1 }, pre: { title: "Starch test", body: "Pass the fumes over starch — a blue colour indicates an iodide." }, post: { title: "Starch turns blue", body: "The starch turns blue → I⁻ is indicated." } },
    { tutor: "C.T: add CS₂ + KMnO₄ + Diluted H₂SO₄ to a fresh Salt Solution.", x: "add CS₂ + KMnO₄", item: "kmno4", tube: 2, pour: "kmno4", zoom: true, pre: { title: "Confirmatory tests", body: "Fresh salt-solution portions are ready. Confirm I⁻ with the CS₂/KMnO₄ test and with AgNO₃." }, post: { title: "Violet in CS₂ → I⁻ confirmed", body: "The CS₂ layer turns violet with violet fumes → I⁻ confirmed.", eq: "10KI + 2KMnO₄ + 8H₂SO₄ → 6K₂SO₄ + 2MnSO₄ + 8H₂O + 5I₂" } },
    { tutor: "C.T: add AgNO₃ to a fresh Salt Solution.", x: "add AgNO₃", item: "agno3", tube: 3, pour: "agno3", zoom: true, post: { title: "Deep-yellow ppt → I⁻ confirmed", body: "Deep-yellow ppt of AgI, insoluble in excess NH₄OH → I⁻ confirmed.", eq: "KI + AgNO₃ → AgI↓ + KNO₃" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = powder;
    else if (step === 2) t[0] = sol("#e8eef2", 0.6);
    else if (step === 3 || step === 4) t[0] = gas("#7e22ce");
    else if (step >= 5) t[0] = sol("#eef1f2", 0.5);
    if (step >= 2) t[1] = step >= 4 ? sol("#1e3a8a", 0.75, 0.9) : sol("#f8fafc"); // starch → deep navy blue
    if (step >= 4) {
      t[2] = step >= 5 ? { ...sol("#eef2f2", 0.66), layer: "#7e22ce" } : sol(SALT); // CS₂ violet layer
      t[3] = step >= 6 ? ppt("#facc15", "#fef08a", 0.8, 0.85) : sol(SALT);
    }
    return t;
  },
  summary: [
    { test: "Salt + Diluted H₂SO₄", obs: "No reaction", inf: "Dilute-acid group absent", eq: "", liquid: "#e8eef2", ppt: "#e8eef2" },
    { test: "Salt + Conc. H₂SO₄, warm", obs: "Violet fumes + black sublimate", inf: "Conc.-acid group present; I⁻ indicated", eq: "", liquid: "#7e22ce", ppt: "#7e22ce" },
    { test: "Pass the fumes over starch paper", obs: "Starch turns blue", inf: "I⁻ indicated", eq: "", liquid: "#1e3a8a", ppt: "#1e3a8a" },
    { test: "C.T: CS₂ + KMnO₄ + Diluted H₂SO₄", obs: "Violet colour in CS₂", inf: "I⁻ confirmed", eq: "10KI + 2KMnO₄ + 8H₂SO₄ → 6K₂SO₄ + 2MnSO₄ + 8H₂O + 5I₂", liquid: "#7e22ce", ppt: "#7e22ce" },
    { test: "C.T: Salt solution + AgNO₃", obs: "Deep-yellow ppt, insoluble in excess NH₄OH", inf: "I⁻ confirmed", eq: "KI + AgNO₃ → AgI↓ + KNO₃", liquid: "#fef08a", ppt: "#facc15" },
  ],
  procedure: [
    "Salt + Diluted H₂SO₄ → no reaction → dilute-acid group absent.",
    "Salt + Conc. H₂SO₄, warm → violet fumes + black sublimate → conc.-acid group; I⁻ indicated.",
    "Pass the fumes over starch → blue → I⁻ indicated.",
    "Confirm with fresh salt solution: CS₂/KMnO₄ (violet in CS₂) and + AgNO₃ (deep-yellow AgI).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
