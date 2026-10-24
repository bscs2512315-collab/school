"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, powder, withWater, sol, ppt } from "../_practical/helpers";

const SALT = "#eab308"; // golden-yellow chromate salt solution

const config: PracticalConfig = {
  title: "Detect CrO₄²⁻",
  ionLabel: "CrO₄²⁻",
  radical: "chromate",
  group: "Dilute-acid group",
  reagents: [
    { id: "water", color: "#dbe9f4", label: "Dist. Water" },
    { id: "dsa", color: "#e4eef4", label: "Diluted H₂SO₄" },
    { id: "bacl2", color: "#eef0f2", label: "BaCl₂" },
    { id: "agno3", color: "#eef0f2", label: "AgNO₃" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Add the salt sample to the test tube.", x: "add the salt", item: "salt", tube: 0 },
    { tutor: "Add distilled water to the test tube.", x: "pour distilled water", item: "water", tube: 0, pour: "water" },
    { tutor: "Shake to dissolve — this is your Salt Solution.", x: "shake the tube", item: "tube", tube: 0, anim: "shake", post: { title: "Salt Solution ready ", body: "The salt dissolves into a golden-yellow chromate salt solution." } },
    { tutor: "Add Diluted H₂SO₄ to the Salt Solution.", x: "add Diluted H₂SO₄", item: "dsa", tube: 0, pour: "dsa", zoom: true, pre: { title: "Dilute-acid group test", body: "Add Diluted H₂SO₄. An orange colour (dichromate) indicates a chromate." }, post: { title: "Orange colour appears", body: "The yellow solution turns orange → dilute-acid group; CrO₄²⁻ is indicated.", eq: "2K₂CrO₄ + H₂SO₄ → K₂Cr₂O₇ + K₂SO₄ + H₂O" } },
    { tutor: "C.T: add BaCl₂ to a fresh Salt Solution.", x: "add BaCl₂", item: "bacl2", tube: 1, pour: "bacl2", zoom: true, pre: { title: "Confirmatory tests", body: "Fresh salt-solution portions are ready. Confirm CrO₄²⁻ with BaCl₂ and with AgNO₃." }, post: { title: "Yellow ppt → CrO₄²⁻ confirmed", body: "Yellow ppt of BaCrO₄ → CrO₄²⁻ confirmed.", eq: "K₂CrO₄ + BaCl₂ → BaCrO₄↓ + 2KCl" } },
    { tutor: "C.T: add AgNO₃ to a fresh Salt Solution.", x: "add AgNO₃", item: "agno3", tube: 2, pour: "agno3", zoom: true, post: { title: "Brick-red ppt → CrO₄²⁻ confirmed", body: "Brick-red ppt of Ag₂CrO₄ → CrO₄²⁻ confirmed.", eq: "K₂CrO₄ + 2AgNO₃ → Ag₂CrO₄↓ + 2KNO₃" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = powder;
    else if (step === 2) t[0] = withWater("#fef08a");
    else if (step === 3 || step === 4) t[0] = sol(SALT);
    else if (step >= 5) t[0] = sol("#ea580c", 0.75, 0.85); // orange dichromate
    if (step >= 4) {
      t[1] = step >= 5 ? ppt("#facc15", "#fef08a", 0.75, 0.85) : sol(SALT);
      t[2] = step >= 6 ? ppt("#b91c1c", "#fef08a", 0.75, 0.85) : sol(SALT);
    }
    return t;
  },
  summary: [
    { test: "Salt solution + Diluted H₂SO₄", obs: "Orange colour appears", inf: "Dilute-acid group; CrO₄²⁻ indicated", eq: "2K₂CrO₄ + H₂SO₄ → K₂Cr₂O₇ + K₂SO₄ + H₂O", liquid: "#ea580c", ppt: "#ea580c" },
    { test: "C.T: Salt solution + BaCl₂", obs: "Yellow ppt", inf: "CrO₄²⁻ confirmed", eq: "K₂CrO₄ + BaCl₂ → BaCrO₄↓ + 2KCl", liquid: "#fef08a", ppt: "#facc15" },
    { test: "C.T: Salt solution + AgNO₃", obs: "Brick-red ppt", inf: "CrO₄²⁻ confirmed", eq: "K₂CrO₄ + 2AgNO₃ → Ag₂CrO₄↓ + 2KNO₃", liquid: "#fef08a", ppt: "#b91c1c" },
  ],
  procedure: [
    "Dissolve the salt in water → yellow chromate salt solution.",
    "Salt solution + Diluted H₂SO₄ → orange (dichromate) → CrO₄²⁻ indicated.",
    "Confirm with fresh salt solution: + BaCl₂ (yellow BaCrO₄) and + AgNO₃ (red Ag₂CrO₄).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
