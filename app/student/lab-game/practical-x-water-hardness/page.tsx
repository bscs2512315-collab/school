"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol, ppt } from "../_practical/helpers";

const CLEAR_WATER = "#e2e8f0";
const WHITE_SCUM = "#cbd5e1"; // insoluble curdy scum (no lather)
const CA_PPT = "#e2e8f0"; // precipitated CaCO3
const LATHER_CLEAR = "#38bdf8"; // clear softened water with rich surface lather

const config: PracticalConfig = {
  title: "Identification & Removal of Water Hardness",
  kicker: "Water Hardness",
  ionLabel: "Hard Water",
  radical: "Hardness of Water",
  group: "Class X Practical 4",
  grade: "X",
  reagents: [
    { id: "hardTemp", color: "#e2e8f0", label: "Ca(HCO₃)₂ (Temp Hard)" },
    { id: "hardPerm", color: "#e0f2fe", label: "CaSO₄ (Perm Hard)" },
    { id: "soap", color: "#e2e8f0", label: "Soap Solution" },
    { id: "soda", color: "#f8fafc", label: "Washing Soda" },
  ],
  steps: [
    {
      tutor: "Pick up Test Tube 1 from the stand.",
      x: "pick up Tube 1",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Add Temporary Hard Water and Soap Solution to Tube 1.",
      x: "add Temp Hard Water + Soap",
      item: "hardTemp",
      tube: 0,
      pour: "hardTemp",
      pre: {
        title: "Testing Temporary Hardness",
        body: "Temporary hard water contains dissolved calcium hydrogencarbonate Ca(HCO₃)₂. Soap reacts with Ca²⁺ to form insoluble scum instead of lather.",
      },
      post: {
        title: "Curdy Scum Formed (No Lather)",
        body: "Calcium ions precipitate soap as insoluble scum (calcium stearate). No lather is produced.",
        eq: "Ca²⁺ + 2C₁₇H₃₅COO⁻ → (C₁₇H₃₅COO)₂Ca↓ (scum)",
      },
    },
    {
      tutor: "Boil Tube 1 over the Bunsen burner to remove temporary hardness.",
      x: "boil the tube",
      item: "tube",
      tube: 0,
      zoom: true,
      heat: true,
      pre: {
        title: "Thermal Decomposition of Bicarbonates",
        body: "Boiling decomposes soluble Ca(HCO₃)₂ into insoluble CaCO₃ precipitate, effectively removing all dissolved calcium ions.",
      },
      post: {
        title: "CaCO₃ Precipitated → Water Softened",
        body: "Soluble Ca(HCO₃)₂ is decomposed: Ca(HCO₃)₂ → CaCO₃↓ + H₂O + CO₂↑.",
        eq: "Ca(HCO₃)₂ → CaCO₃↓ + H₂O + CO₂↑",
      },
    },
    {
      tutor: "Add Soap Solution to the boiled water in Tube 1.",
      x: "retest with Soap Solution",
      item: "soap",
      tube: 0,
      pour: "soap",
      zoom: true,
      post: {
        title: "Rich Lather Formed!",
        body: "With Ca²⁺ removed, soap readily dissolves and produces copious rich foam/lather. Temporary hardness is completely removed by boiling.",
      },
    },
    {
      tutor: "Pick up Test Tube 2 from the stand.",
      x: "pick up Tube 2",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Add Permanent Hard Water and Soap Solution to Tube 2.",
      x: "add Perm Hard Water + Soap",
      item: "hardPerm",
      tube: 1,
      pour: "hardPerm",
      pre: {
        title: "Testing Permanent Hardness",
        body: "Permanent hard water contains dissolved calcium sulphate (CaSO₄). Boiling does not remove permanent hardness.",
      },
      post: {
        title: "Heavy Scum Formed (No Lather)",
        body: "Dissolved CaSO₄ precipitates soap as insoluble scum. Boiling fails to soften permanent hard water.",
        eq: "CaSO₄ + 2Na-Soap → Ca-Soap↓ (scum) + Na₂SO₄",
      },
    },
    {
      tutor: "Add Washing Soda (Na₂CO₃) to Tube 2 to soften the permanent hard water.",
      x: "add Washing Soda",
      item: "soda",
      tube: 1,
      pour: "soda",
      zoom: true,
      pre: {
        title: "Chemical Softening with Na₂CO₃",
        body: "Adding sodium carbonate precipitates calcium ions as insoluble CaCO₃: CaSO₄ + Na₂CO₃ → CaCO₃↓ + Na₂SO₄.",
      },
      post: {
        title: "CaCO₃ Precipitated → Permanent Hardness Removed",
        body: "Calcium ions are precipitated out as CaCO₃, removing permanent hardness chemically.",
        eq: "CaSO₄ + Na₂CO₃ → CaCO₃↓ + Na₂SO₄",
      },
    },
    {
      tutor: "Add Soap Solution to Tube 2 to test lathering ability.",
      x: "test with Soap Solution",
      item: "soap",
      tube: 1,
      pour: "soap",
      zoom: true,
      post: {
        title: "Instant Copious Lather!",
        body: "After treatment with washing soda, permanent hard water readily produces abundant lather with soap.",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = ppt(WHITE_SCUM, CLEAR_WATER, 0.65, 0.75);
    else if (step === 2) t[0] = ppt(CA_PPT, CLEAR_WATER, 0.65, 0.8);
    else if (step >= 3) t[0] = sol(LATHER_CLEAR, 0.72, 0.85);

    if (step === 5) t[1] = ppt(WHITE_SCUM, CLEAR_WATER, 0.65, 0.75);
    else if (step === 6) t[1] = ppt(CA_PPT, CLEAR_WATER, 0.65, 0.8);
    else if (step >= 7) t[1] = sol(LATHER_CLEAR, 0.72, 0.85);
    return t;
  },
  summary: [
    {
      test: "Temp. Hard Water + Soap",
      obs: "White scum formed, no lather",
      inf: "Temporary hardness due to Ca(HCO₃)₂",
      eq: "Ca²⁺ + 2C₁₇H₃₅COO⁻ → (C₁₇H₃₅COO)₂Ca↓",
      liquid: CLEAR_WATER,
      ppt: WHITE_SCUM,
    },
    {
      test: "Temp. Hard Water + Boiling + Soap",
      obs: "White CaCO₃ ppt, rich lather forms",
      inf: "Temporary hardness removed by boiling",
      eq: "Ca(HCO₃)₂ → CaCO₃↓ + H₂O + CO₂↑",
      liquid: LATHER_CLEAR,
      ppt: LATHER_CLEAR,
    },
    {
      test: "Perm. Hard Water + Soap",
      obs: "Curdy scum, no lather upon boiling",
      inf: "Permanent hardness due to CaSO₄",
      eq: "CaSO₄ + 2Na-Soap → Ca-Soap↓ + Na₂SO₄",
      liquid: CLEAR_WATER,
      ppt: WHITE_SCUM,
    },
    {
      test: "Perm. Hard Water + Na₂CO₃ + Soap",
      obs: "White CaCO₃ ppt, copious lather forms",
      inf: "Permanent hardness removed by washing soda",
      eq: "CaSO₄ + Na₂CO₃ → CaCO₃↓ + Na₂SO₄",
      liquid: LATHER_CLEAR,
      ppt: LATHER_CLEAR,
    },
  ],
  procedure: [
    "Test temporary hard water (Ca(HCO₃)₂) with soap solution; observe scum formation.",
    "Boil temporary hard water for 3 minutes to precipitate insoluble CaCO₃.",
    "Retest boiled temporary water with soap; observe instant rich lather formation.",
    "Test permanent hard water (CaSO₄) with soap; note that boiling fails to soften it.",
    "Add washing soda (Na₂CO₃) to permanent hard water to precipitate CaCO₃; retest with soap to confirm softening.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
