"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, powder, sol, ppt } from "../_practical/helpers";

const SALT = "#dfe3e0";

const config: PracticalConfig = {
  title: "Detect SO₄²⁻",
  ionLabel: "SO₄²⁻",
  radical: "sulphate",
  group: "Special group",
  reagents: [
    { id: "dsa", color: "#e4eef4", label: "Diluted H₂SO₄" },
    { id: "csa", color: "#dfe6ea", label: "Conc. H₂SO₄" },
    { id: "bacl2", color: "#eef0f2", label: "BaCl₂" },
    { id: "pbac", color: "#eef0f2", label: "Lead acetate" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Add the salt sample to the test tube.", x: "add the salt", item: "salt", tube: 0 },
    { tutor: "Add Diluted H₂SO₄ to the salt.", x: "add Diluted H₂SO₄", item: "dsa", tube: 0, pour: "dsa", zoom: true, pre: { title: "Dilute-acid group test", body: "Add Diluted H₂SO₄. No reaction means the dilute-acid group is absent." }, post: { title: "No reaction", body: "No reaction → dilute-acid group absent." } },
    { tutor: "Add Conc. H₂SO₄ to the salt.", x: "add Conc. H₂SO₄", item: "csa", tube: 0, pour: "csa", zoom: true, post: { title: "No reaction", body: "No reaction → conc.-acid group absent (so the special group is present)." } },
    { tutor: "Add BaCl₂ to a fresh Salt Solution.", x: "add BaCl₂", item: "bacl2", tube: 1, pour: "bacl2", zoom: true, pre: { title: "Special-group test", body: "Both dilute and conc. acids had no effect. Add BaCl₂ — a white ppt insoluble in conc. HNO₃ indicates a sulphate." }, post: { title: "White ppt → SO₄²⁻ indicated", body: "White ppt of BaSO₄, insoluble in conc. HNO₃ → special group present; SO₄²⁻ is indicated.", eq: "Na₂SO₄ + BaCl₂ → BaSO₄↓ + 2NaCl" } },
    { tutor: "C.T: add lead acetate to a fresh Salt Solution.", x: "add lead acetate", item: "pbac", tube: 2, pour: "pbac", zoom: true, post: { title: "White ppt → SO₄²⁻ confirmed", body: "White ppt of PbSO₄, soluble in dil. HNO₃ → SO₄²⁻ confirmed.", eq: "Na₂SO₄ + Pb(CH₃COO)₂ → PbSO₄↓ + 2CH₃COONa" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = powder;
    else if (step === 2) t[0] = sol("#e8eef2", 0.6);
    else if (step >= 3) t[0] = sol("#eef1f2", 0.5);
    if (step >= 3) {
      t[1] = step >= 4 ? ppt("#dfe4e8", "#e7ecee") : sol(SALT);
      t[2] = step >= 5 ? ppt("#dfe4e8", "#e7ecee") : sol(SALT);
    }
    return t;
  },
  summary: [
    { test: "Salt + Diluted H₂SO₄", obs: "No reaction", inf: "Dilute-acid group absent", eq: "", liquid: "#e8eef2", ppt: "#e8eef2" },
    { test: "Salt + Conc. H₂SO₄", obs: "No reaction", inf: "Conc.-acid group absent", eq: "", liquid: "#eef1f2", ppt: "#eef1f2" },
    { test: "Salt solution + BaCl₂", obs: "White ppt, insoluble in conc. HNO₃", inf: "Special group; SO₄²⁻ indicated", eq: "Na₂SO₄ + BaCl₂ → BaSO₄↓ + 2NaCl", liquid: "#e7ecee", ppt: "#dfe4e8" },
    { test: "C.T: Salt solution + lead acetate", obs: "White ppt, soluble in dil. HNO₃", inf: "SO₄²⁻ confirmed", eq: "Na₂SO₄ + Pb(CH₃COO)₂ → PbSO₄↓ + 2CH₃COONa", liquid: "#e7ecee", ppt: "#dfe4e8" },
  ],
  procedure: [
    "Salt + Diluted H₂SO₄ → no reaction → dilute-acid group absent.",
    "Salt + Conc. H₂SO₄ → no reaction → conc.-acid group absent (special group present).",
    "Salt solution + BaCl₂ → white ppt insoluble in conc. HNO₃ → SO₄²⁻ indicated.",
    "Confirm: Salt solution + lead acetate → white PbSO₄ soluble in dil. HNO₃.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
