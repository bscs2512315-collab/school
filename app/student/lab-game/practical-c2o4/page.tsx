"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, powder, sol, ppt, gas, milky } from "../_practical/helpers";

const SALT = "#dfe3e0";

const config: PracticalConfig = {
  title: "Detect C₂O₄²⁻",
  ionLabel: "C₂O₄²⁻",
  radical: "oxalate",
  group: "Conc.-acid group",
  reagents: [
    { id: "dsa", color: "#e4eef4", label: "Diluted H₂SO₄" },
    { id: "csa", color: "#dfe6ea", label: "Conc. H₂SO₄" },
    { id: "agno3", color: "#eef0f2", label: "AgNO₃" },
    { id: "bacl2", color: "#eef0f2", label: "BaCl₂" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Add the salt sample to the test tube.", x: "add the salt", item: "salt", tube: 0 },
    { tutor: "Add Diluted H₂SO₄ to the salt.", x: "add Diluted H₂SO₄", item: "dsa", tube: 0, pour: "dsa", zoom: true, pre: { title: "Dilute-acid group test", body: "Add Diluted H₂SO₄. No reaction means the dilute-acid group is absent." }, post: { title: "No reaction", body: "No reaction → dilute-acid group absent." } },
    { tutor: "Add Conc. H₂SO₄ and warm.", x: "add Conc. H₂SO₄", item: "csa", tube: 0, pour: "csa", zoom: true, post: { title: "Colourless, odourless gas", body: "A colourless, odourless gas is given out → conc.-acid group present." } },
    { tutor: "Pass the evolved gas through the lime water.", x: "pass the gas through lime water", item: "tube", tube: 1, zoom: true, deliver: { from: 0, to: 1 }, pre: { title: "Lime-water test", body: "Pass the gas through lime water — milkiness supports an oxalate." }, post: { title: "Lime water turns milky", body: "The lime water turns milky → C₂O₄²⁻ is indicated.", eq: "CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O" } },
    { tutor: "C.T: add AgNO₃ to a fresh Salt Solution.", x: "add AgNO₃", item: "agno3", tube: 2, pour: "agno3", zoom: true, pre: { title: "Confirmatory tests", body: "Fresh salt-solution portions are ready. Confirm C₂O₄²⁻ with AgNO₃ and with BaCl₂." }, post: { title: "White ppt → C₂O₄²⁻ confirmed", body: "White ppt of Ag₂C₂O₄, soluble in dil. HNO₃ → C₂O₄²⁻ confirmed.", eq: "Na₂C₂O₄ + 2AgNO₃ → Ag₂C₂O₄↓ + 2NaNO₃" } },
    { tutor: "C.T: add BaCl₂ to a fresh Salt Solution.", x: "add BaCl₂", item: "bacl2", tube: 3, pour: "bacl2", zoom: true, post: { title: "White ppt → C₂O₄²⁻ confirmed", body: "White ppt of BaC₂O₄, soluble in CH₃COOH on boiling → C₂O₄²⁻ confirmed.", eq: "Na₂C₂O₄ + BaCl₂ → BaC₂O₄↓ + 2NaCl" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = powder;
    else if (step === 2) t[0] = sol("#e8eef2", 0.6);
    else if (step === 3 || step === 4) t[0] = gas("#eef1f2");
    else if (step >= 5) t[0] = sol("#eef1f2", 0.5);
    if (step >= 2) t[1] = step === 4 ? { ...milky(), fizz: true } : step > 4 ? milky() : sol("#e7f0ea", 0.55);
    if (step >= 4) {
      t[2] = step >= 5 ? ppt("#dfe4e8", "#e7ecee") : sol(SALT);
      t[3] = step >= 6 ? ppt("#dfe4e8", "#e7ecee") : sol(SALT);
    }
    return t;
  },
  summary: [
    { test: "Salt + Diluted H₂SO₄", obs: "No reaction", inf: "Dilute-acid group absent", eq: "", liquid: "#e8eef2", ppt: "#e8eef2" },
    { test: "Salt + Conc. H₂SO₄, warm", obs: "Colourless, odourless gas", inf: "Conc.-acid group present", eq: "", liquid: "#eef1f2", ppt: "#eef1f2" },
    { test: "Pass the gas through lime water", obs: "Turns milky", inf: "C₂O₄²⁻ indicated", eq: "CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O", liquid: "#e6eaec", ppt: "#eef1f4" },
    { test: "C.T: Salt solution + AgNO₃", obs: "White ppt, soluble in dil. HNO₃", inf: "C₂O₄²⁻ confirmed", eq: "Na₂C₂O₄ + 2AgNO₃ → Ag₂C₂O₄↓ + 2NaNO₃", liquid: "#e7ecee", ppt: "#dfe4e8" },
    { test: "C.T: Salt solution + BaCl₂", obs: "White ppt, soluble in CH₃COOH on boiling", inf: "C₂O₄²⁻ confirmed", eq: "Na₂C₂O₄ + BaCl₂ → BaC₂O₄↓ + 2NaCl", liquid: "#e7ecee", ppt: "#dfe4e8" },
  ],
  procedure: [
    "Salt + Diluted H₂SO₄ → no reaction → dilute-acid group absent.",
    "Salt + Conc. H₂SO₄, warm → colourless, odourless gas → conc.-acid group.",
    "Pass the gas through lime water → milky → C₂O₄²⁻ indicated.",
    "Confirm with fresh salt solution: + AgNO₃ and + BaCl₂ (white ppts).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
