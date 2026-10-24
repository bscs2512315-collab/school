"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, powder, sol, ppt, gas } from "../_practical/helpers";

const SALT = "#dfe3e0"; // colourless sulphite salt solution

const config: PracticalConfig = {
  title: "Detect SO₃²⁻",
  ionLabel: "SO₃²⁻",
  radical: "sulphite",
  group: "Dilute-acid group",
  reagents: [
    { id: "h2so4", color: "#e4eef4", label: "Diluted H₂SO₄" },
    { id: "bromine", color: "#c2410c", label: "Bromine water" },
    { id: "kmno4", color: "#4a044e", label: "KMnO₄" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Add the salt sample to the test tube.", x: "add the salt", item: "salt", tube: 0 },
    { tutor: "Add Diluted H₂SO₄ to the salt and warm.", x: "add Diluted H₂SO₄", item: "h2so4", tube: 0, pour: "h2so4", zoom: true, pre: { title: "Dilute-acid group test", body: "Add Diluted H₂SO₄ and warm. A pungent gas (burning sulphur) means the dilute-acid group with a sulphite." }, post: { title: "Pungent gas evolved", body: "A colourless gas with a pungent smell (burning sulphur) evolves → dilute-acid group present; SO₃²⁻ is indicated." } },
    { tutor: "Pass the evolved gas through the K₂Cr₂O₇ solution.", x: "pass the gas through K₂Cr₂O₇", item: "tube", tube: 1, zoom: true, deliver: { from: 0, to: 1 }, pre: { title: "K₂Cr₂O₇ test", body: "A tube of K₂Cr₂O₇ is connected. If the orange solution turns green, sulphite is present." }, post: { title: "K₂Cr₂O₇ turns green", body: "The orange K₂Cr₂O₇ solution turns green → SO₃²⁻ is present." } },
    { tutor: "C.T: add Bromine water to a fresh Salt Solution.", x: "add Bromine water", item: "bromine", tube: 2, pour: "bromine", zoom: true, pre: { title: "Confirmatory tests", body: "Fresh salt-solution portions are ready. Confirm SO₃²⁻ by discharging Bromine water and KMnO₄." }, post: { title: "Bromine discharged → SO₃²⁻ confirmed", body: "The reddish-brown colour of bromine is discharged → SO₃²⁻ confirmed.", eq: "Na₂SO₃ + Br₂ + H₂O → Na₂SO₄ + 2HBr" } },
    { tutor: "C.T: add Diluted H₂SO₄, warm, then KMnO₄ to a fresh Salt Solution.", x: "add KMnO₄", item: "kmno4", tube: 3, pour: "kmno4", zoom: true, post: { title: "KMnO₄ discharged → SO₃²⁻ confirmed", body: "The pink colour of KMnO₄ is discharged → SO₃²⁻ confirmed.", eq: "5Na₂SO₃ + 2KMnO₄ + 3H₂SO₄ → K₂SO₄ + 2MnSO₄ + 5Na₂SO₄ + 3H₂O" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = powder;
    else if (step === 2 || step === 3) t[0] = gas("#eef1f2");
    else if (step >= 4) t[0] = sol("#eef1f2", 0.5);
    // tube 1: K₂Cr₂O₇ orange → green
    if (step >= 2) t[1] = step >= 3 ? sol("#16a34a", 0.75, 0.85) : sol("#ea580c", 0.75, 0.85);
    // confirmatory: bromine (tube 2) and KMnO₄ (tube 3) get discharged (colourless)
    if (step >= 3) {
      t[2] = step >= 4 ? sol("#f8fafc", 0.55) : sol(SALT);
      t[3] = step >= 5 ? sol("#f8fafc", 0.55) : sol(SALT);
    }
    return t;
  },
  summary: [
    { test: "Salt + Diluted H₂SO₄, warm", obs: "Colourless, pungent gas (burning sulphur)", inf: "Dilute-acid group present; SO₃²⁻ indicated", eq: "", liquid: "#eef1f2", ppt: "#eef1f2" },
    { test: "Pass the gas through K₂Cr₂O₇", obs: "Orange K₂Cr₂O₇ turns green", inf: "SO₃²⁻ present", eq: "", liquid: "#16a34a", ppt: "#16a34a" },
    { test: "C.T: Salt solution + Bromine water", obs: "Reddish-brown bromine discharged", inf: "SO₃²⁻ confirmed", eq: "Na₂SO₃ + Br₂ + H₂O → Na₂SO₄ + 2HBr", liquid: "#f8fafc", ppt: "#f8fafc" },
    { test: "C.T: Salt solution + Diluted H₂SO₄ + KMnO₄", obs: "Pink KMnO₄ discharged", inf: "SO₃²⁻ confirmed", eq: "5Na₂SO₃ + 2KMnO₄ + 3H₂SO₄ → K₂SO₄ + 2MnSO₄ + 5Na₂SO₄ + 3H₂O", liquid: "#f8fafc", ppt: "#f8fafc" },
  ],
  procedure: [
    "Salt + Diluted H₂SO₄, warm → pungent gas (burning sulphur) → dilute-acid group; SO₃²⁻ indicated.",
    "Pass the gas through K₂Cr₂O₇ → turns green → SO₃²⁻ present.",
    "Confirm with fresh salt solution: discharge Bromine water and KMnO₄.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
