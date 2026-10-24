"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, powder, sol, ppt, gas } from "../_practical/helpers";

const SALT = "#dfe3e0";

const config: PracticalConfig = {
  title: "Detect Br⁻",
  ionLabel: "Br⁻",
  radical: "bromide",
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
    { tutor: "Add Conc. H₂SO₄ and warm.", x: "add Conc. H₂SO₄", item: "csa", tube: 0, pour: "csa", zoom: true, post: { title: "Reddish-brown gas", body: "Reddish-brown gas with a pungent odour → conc.-acid group present; Br⁻ is indicated." } },
    { tutor: "Pass the evolved gas through the FeSO₄ solution.", x: "pass the gas through FeSO₄", item: "tube", tube: 1, zoom: true, deliver: { from: 0, to: 1 }, pre: { title: "FeSO₄ test", body: "Pass the gas through FeSO₄ — no blackening (unlike nitrite/nitrate) supports a bromide." }, post: { title: "No blackening of FeSO₄", body: "The FeSO₄ solution is not blackened → Br⁻ is indicated." } },
    { tutor: "C.T: add CS₂ + KMnO₄ + Diluted H₂SO₄ to a fresh Salt Solution.", x: "add CS₂ + KMnO₄", item: "kmno4", tube: 2, pour: "kmno4", zoom: true, pre: { title: "Confirmatory tests", body: "Fresh salt-solution portions are ready. Confirm Br⁻ with the CS₂/KMnO₄ test and with AgNO₃." }, post: { title: "Orange-red in CS₂ → Br⁻ confirmed", body: "KMnO₄ is decolourised and an orange-red colour appears in the CS₂ layer → Br⁻ confirmed.", eq: "10KBr + 2KMnO₄ + 8H₂SO₄ → 6K₂SO₄ + 2MnSO₄ + 8H₂O + 5Br₂" } },
    { tutor: "C.T: add AgNO₃ to a fresh Salt Solution.", x: "add AgNO₃", item: "agno3", tube: 3, pour: "agno3", zoom: true, post: { title: "Light-yellow ppt → Br⁻ confirmed", body: "Light-yellow ppt of AgBr, partially soluble in excess NH₄OH → Br⁻ confirmed.", eq: "KBr + AgNO₃ → AgBr↓ + KNO₃" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = powder;
    else if (step === 2) t[0] = sol("#e8eef2", 0.6);
    else if (step === 3 || step === 4) t[0] = gas("#c2410c");
    else if (step >= 5) t[0] = sol("#eef1f2", 0.5);
    if (step >= 2) t[1] = sol("#86efac"); // FeSO₄ stays pale green (no blackening)
    if (step >= 4) {
      t[2] = step >= 5 ? { ...sol("#eef2f2", 0.66), layer: "#ea580c" } : sol(SALT); // CS₂ orange-red layer
      t[3] = step >= 6 ? ppt("#fef08a", "#fef9c3", 0.75, 0.85) : sol(SALT);
    }
    return t;
  },
  summary: [
    { test: "Salt + Diluted H₂SO₄", obs: "No reaction", inf: "Dilute-acid group absent", eq: "", liquid: "#e8eef2", ppt: "#e8eef2" },
    { test: "Salt + Conc. H₂SO₄, warm", obs: "Reddish-brown gas", inf: "Conc.-acid group present; Br⁻ indicated", eq: "", liquid: "#c2410c", ppt: "#c2410c" },
    { test: "Pass the gas through FeSO₄", obs: "No blackening", inf: "Br⁻ indicated", eq: "", liquid: "#86efac", ppt: "#86efac" },
    { test: "C.T: CS₂ + KMnO₄ + Diluted H₂SO₄", obs: "Orange-red in CS₂; KMnO₄ decolourised", inf: "Br⁻ confirmed", eq: "10KBr + 2KMnO₄ + 8H₂SO₄ → 6K₂SO₄ + 2MnSO₄ + 8H₂O + 5Br₂", liquid: "#ea580c", ppt: "#ea580c" },
    { test: "C.T: Salt solution + AgNO₃", obs: "Light-yellow ppt, partially soluble in excess NH₄OH", inf: "Br⁻ confirmed", eq: "KBr + AgNO₃ → AgBr↓ + KNO₃", liquid: "#fef9c3", ppt: "#fef08a" },
  ],
  procedure: [
    "Salt + Diluted H₂SO₄ → no reaction → dilute-acid group absent.",
    "Salt + Conc. H₂SO₄, warm → reddish-brown gas → conc.-acid group; Br⁻ indicated.",
    "Pass the gas through FeSO₄ → no blackening → Br⁻ indicated.",
    "Confirm with fresh salt solution: CS₂/KMnO₄ (orange-red in CS₂) and + AgNO₃ (light-yellow AgBr).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
