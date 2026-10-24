"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, powder, sol, ppt, gas } from "../_practical/helpers";

const SALT = "#dfe3e0";

const config: PracticalConfig = {
  title: "Detect NO₃⁻",
  ionLabel: "NO₃⁻",
  radical: "nitrate",
  group: "Conc.-acid group",
  reagents: [
    { id: "dsa", color: "#e4eef4", label: "Diluted H₂SO₄" },
    { id: "csa", color: "#dfe6ea", label: "Conc. H₂SO₄" },
    { id: "feso4", color: "#86efac", label: "FeSO₄" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Add the salt sample to the test tube.", x: "add the salt", item: "salt", tube: 0 },
    { tutor: "Add Diluted H₂SO₄ to the salt.", x: "add Diluted H₂SO₄", item: "dsa", tube: 0, pour: "dsa", zoom: true, pre: { title: "Dilute-acid group test", body: "Add Diluted H₂SO₄. No reaction means the dilute-acid group is absent." }, post: { title: "No reaction", body: "No reaction → dilute-acid group absent." } },
    { tutor: "Add Conc. H₂SO₄ and warm.", x: "add Conc. H₂SO₄", item: "csa", tube: 0, pour: "csa", zoom: true, post: { title: "Colourless gas (like HNO₃)", body: "A colourless gas smelling like HNO₃ evolves → conc.-acid group present; NO₃⁻ is indicated." } },
    { tutor: "Pass the evolved gas through the FeSO₄ solution.", x: "pass the gas through FeSO₄", item: "tube", tube: 1, zoom: true, deliver: { from: 0, to: 1 }, pre: { title: "FeSO₄ test", body: "Pass the NO₂ gas through FeSO₄ — blackening indicates a nitrate." }, post: { title: "FeSO₄ turns black", body: "The FeSO₄ solution turns black (NO₂ gas) → NO₃⁻ is indicated." } },
    { tutor: "C.T (brown-ring): add fresh FeSO₄, then run Conc. H₂SO₄ down the wall.", x: "add FeSO₄ (brown-ring test)", item: "feso4", tube: 2, pour: "feso4", zoom: true, pre: { title: "Confirmatory test", body: "Brown-ring test: add freshly prepared FeSO₄ and let Conc. H₂SO₄ slide down the wall of the tube." }, post: { title: "Brown ring → NO₃⁻ confirmed", body: "A dark-brown ring forms at the junction of the acid and the mixture → NO₃⁻ confirmed.", eq: "FeSO₄ + NO → [Fe(NO)]SO₄ (brown ring)" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = powder;
    else if (step === 2) t[0] = sol("#e8eef2", 0.6);
    else if (step === 3 || step === 4) t[0] = gas("#eef1f2");
    else if (step >= 5) t[0] = sol("#eef1f2", 0.5);
    if (step >= 2) t[1] = step >= 3 ? sol("#451a03", 0.75, 0.9) : sol("#86efac");
    if (step >= 4) t[2] = step >= 5 ? { ...sol("#86efac", 0.62), ring: "#451a03" } : sol("#86efac");
    return t;
  },
  summary: [
    { test: "Salt + Diluted H₂SO₄", obs: "No reaction", inf: "Dilute-acid group absent", eq: "", liquid: "#e8eef2", ppt: "#e8eef2" },
    { test: "Salt + Conc. H₂SO₄, warm", obs: "Colourless gas smelling like HNO₃", inf: "Conc.-acid group present; NO₃⁻ indicated", eq: "NaNO₃ + H₂SO₄ → HNO₃ + NaHSO₄", liquid: "#eef1f2", ppt: "#eef1f2" },
    { test: "Pass the gas through FeSO₄", obs: "FeSO₄ turns black (NO₂)", inf: "NO₃⁻ indicated", eq: "", liquid: "#451a03", ppt: "#451a03" },
    { test: "C.T: Brown-ring test (FeSO₄ + Conc. H₂SO₄)", obs: "Dark-brown ring at the junction", inf: "NO₃⁻ confirmed", eq: "FeSO₄ + NO → [Fe(NO)]SO₄ (brown ring)", liquid: "#86efac", ppt: "#451a03" },
  ],
  procedure: [
    "Salt + Diluted H₂SO₄ → no reaction → dilute-acid group absent.",
    "Salt + Conc. H₂SO₄, warm → colourless gas (like HNO₃) → conc.-acid group; NO₃⁻ indicated.",
    "Pass the gas through FeSO₄ → turns black → NO₃⁻ indicated.",
    "Confirm with the brown-ring test → a dark-brown ring at the junction.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
