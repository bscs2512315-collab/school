"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol, ppt } from "../_practical/helpers";

const CLEAR_SOL = "#f1f5f9";
const CURDY_WHITE_AGCL = "#ffffff";
const DENSE_WHITE_BASO4 = "#f8fafc";
const LIME_MILKY = "#ffffff";

const config: PracticalConfig = {
  title: "Qualitative Identification of Anions",
  kicker: "Acid Radicals",
  ionLabel: "Anions",
  radical: "Anions (Cl⁻, SO₄²⁻, CO₃²⁻)",
  group: "Class X Practical 6",
  grade: "X",
  reagents: [
    { id: "sampleCl", color: "#f8fafc", label: "Salt A (Cl⁻)" },
    { id: "sampleSO4", color: "#f1f5f9", label: "Salt B (SO₄²⁻)" },
    { id: "sampleCO3", color: "#f8fafc", label: "Salt C (CO₃²⁻)" },
    { id: "agno3", color: "#f8fafc", label: "AgNO₃ Solution" },
    { id: "nh4oh", color: "#f1f5f9", label: "NH₄OH Solution" },
    { id: "bacl2", color: "#f8fafc", label: "BaCl₂ Solution" },
    { id: "hcl", color: "#e0f2fe", label: "Diluted HCl" },
  ],
  steps: [
    {
      tutor: "Pick up Test Tube 1 from the stand.",
      x: "pick up Tube 1",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Add Salt A solution (Cl⁻) and AgNO₃ solution to Tube 1.",
      x: "add Salt A + AgNO₃",
      item: "agno3",
      tube: 0,
      pour: "agno3",
      zoom: true,
      pre: {
        title: "Test for Chloride Radical (Cl⁻)",
        body: "Chloride ions react with silver nitrate in acidic medium forming an insoluble curdy white precipitate of silver chloride (AgCl).",
      },
      post: {
        title: "Curdy White Precipitate (AgCl↓)",
        body: "Silver nitrate precipitates chloride ions as insoluble silver chloride: Cl⁻ + AgNO₃ → AgCl↓ + NO₃⁻.",
        eq: "NaCl + AgNO₃ → AgCl↓ (curdy white) + NaNO₃",
      },
    },
    {
      tutor: "Add NH₄OH solution to the precipitate in Tube 1.",
      x: "add NH₄OH solution",
      item: "nh4oh",
      tube: 0,
      pour: "nh4oh",
      zoom: true,
      post: {
        title: "Precipitate Dissolves → Cl⁻ Confirmed",
        body: "AgCl dissolves completely forming the soluble diamminesilver(I) complex [Ag(NH₃)₂]⁺, confirming Cl⁻.",
        eq: "AgCl + 2NH₄OH → [Ag(NH₃)₂]Cl (soluble) + 2H₂O",
      },
    },
    {
      tutor: "Pick up Test Tube 2 from the stand.",
      x: "pick up Tube 2",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Add Salt B solution (SO₄²⁻) and BaCl₂ solution to Tube 2.",
      x: "add Salt B + BaCl₂",
      item: "bacl2",
      tube: 1,
      pour: "bacl2",
      zoom: true,
      pre: {
        title: "Test for Sulphate Radical (SO₄²⁻)",
        body: "Sulphate ions react with barium chloride forming a heavy, dense white precipitate of barium sulphate (BaSO₄) that is insoluble in mineral acids.",
      },
      post: {
        title: "Dense White Precipitate (BaSO₄↓) → SO₄²⁻ Confirmed",
        body: "Barium chloride precipitates sulphate as barium sulphate: Na₂SO₄ + BaCl₂ → BaSO₄↓ + 2NaCl.",
        eq: "Na₂SO₄ + BaCl₂ → BaSO₄↓ (thick white) + 2NaCl",
      },
    },
    {
      tutor: "Pick up Test Tube 3 from the stand.",
      x: "pick up Tube 3",
      item: "tube",
      tube: 2,
    },
    {
      tutor: "Add Salt C (CO₃²⁻) and Diluted HCl to Tube 3.",
      x: "add Salt C + Diluted HCl",
      item: "hcl",
      tube: 2,
      pour: "hcl",
      zoom: true,
      pre: {
        title: "Test for Carbonate Radical (CO₃²⁻)",
        body: "Carbonates react with dilute acids with brisk effervescence liberating carbon dioxide gas which turns lime water milky.",
      },
      post: {
        title: "CO₂ Effervescence → CO₃²⁻ Confirmed",
        body: "Reaction liberates CO₂ gas turning lime water milky, confirming the carbonate radical (CO₃²⁻).",
        eq: "Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    // Tube 0 (Cl- -> AgCl ppt -> dissolves in NH4OH)
    if (step === 1) t[0] = ppt(CURDY_WHITE_AGCL, CLEAR_SOL, 0.65, 0.85);
    else if (step >= 2) t[0] = sol(CLEAR_SOL, 0.75, 0.8);
    // Tube 1 (SO4 2- -> BaSO4 ppt)
    if (step >= 4) t[1] = ppt(DENSE_WHITE_BASO4, CLEAR_SOL, 0.7, 0.9);
    // Tube 2 (CO3 2- -> CO2 fizz)
    if (step >= 6) t[2] = { ...sol(CLEAR_SOL, 0.65, 0.8), fizz: true };
    return t;
  },
  summary: [
    {
      test: "Salt A (Cl⁻) + AgNO₃ solution",
      obs: "Curdy white precipitate",
      inf: "Chloride radical indicated (AgCl↓)",
      eq: "NaCl + AgNO₃ → AgCl↓ + NaNO₃",
      liquid: CLEAR_SOL,
      ppt: CURDY_WHITE_AGCL,
    },
    {
      test: "Precipitate + NH₄OH (excess)",
      obs: "Precipitate dissolves completely",
      inf: "Chloride (Cl⁻) confirmed",
      eq: "AgCl + 2NH₄OH → [Ag(NH₃)₂]Cl + 2H₂O",
      liquid: CLEAR_SOL,
      ppt: CLEAR_SOL,
    },
    {
      test: "Salt B (SO₄²⁻) + BaCl₂ + dil. HCl",
      obs: "Dense white precipitate insoluble in HCl",
      inf: "Sulphate (SO₄²⁻) confirmed (BaSO₄↓)",
      eq: "Na₂SO₄ + BaCl₂ → BaSO₄↓ + 2NaCl",
      liquid: CLEAR_SOL,
      ppt: DENSE_WHITE_BASO4,
    },
    {
      test: "Salt C (CO₃²⁻) + Dilute HCl",
      obs: "Brisk effervescence of CO₂ gas",
      inf: "Carbonate (CO₃²⁻) confirmed",
      eq: "Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑",
      liquid: CLEAR_SOL,
      ppt: CLEAR_SOL,
    },
  ],
  procedure: [
    "Test Chloride (Cl⁻): Add AgNO₃ to salt solution A → curdy white AgCl precipitate dissolves in NH₄OH.",
    "Test Sulphate (SO₄²⁻): Add BaCl₂ to salt solution B → dense white BaSO₄ precipitate insoluble in dilute acid.",
    "Test Carbonate (CO₃²⁻): Add dilute HCl to solid salt C → brisk effervescence of CO₂ gas turning lime water milky.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
