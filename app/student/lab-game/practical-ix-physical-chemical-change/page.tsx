"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol, ppt } from "../_practical/helpers";

const BLUE_VITRIOL = "#3b82f6";
const WHITE_ANHYDROUS = "#f8fafc";
const MG_SILVER = "#cbd5e1";
const MGO_WHITE = "#fef9c3";

const config: PracticalConfig = {
  title: "Differentiating Physical and Chemical Changes",
  kicker: "Fundamental Concepts & Chemical Transformation",
  ionLabel: "Reversible vs Irreversible",
  radical: "CuSO₄ Hydration vs Mg Combustion",
  group: "Class IX Practical 8",
  grade: "IX",
  reagents: [
    { id: "cuso4", color: BLUE_VITRIOL, label: "Hydrated CuSO₄·5H₂O" },
    { id: "water", color: "#dbe9f4", label: "Water Dropper" },
    { id: "mgRibbon", color: MG_SILVER, label: "Magnesium Ribbon" },
    { id: "burner", color: "#f59e0b", label: "Bunsen Burner" },
  ],
  steps: [
    // Part A: Physical Change (CuSO4 dehydration & rehydration)
    {
      tutor: "Pick up Test Tube 1 containing blue hydrated CuSO₄·5H₂O crystals.",
      x: "pick up Tube 1 (CuSO₄)",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Heat Tube 1 gently over the Bunsen flame.",
      x: "heat blue crystals",
      item: "burner",
      tube: 0,
      heat: true,
      zoom: true,
      pre: {
        title: "Part A: Thermal Dehydration of Copper Sulfate",
        body: "Heating hydrated blue copper sulfate crystals causes the loss of water of crystallization: CuSO₄·5H₂O(s) ⇌ CuSO₄(s) + 5H₂O(g).",
      },
      post: {
        title: "White Anhydrous Powder Formed",
        body: "Water droplets condense on the cooler upper tube walls; blue crystals turn into white anhydrous CuSO₄ powder.",
        eq: "CuSO₄·5H₂O(s) [Blue] ⇌ CuSO₄(s) [White] + 5H₂O(g)",
      },
    },
    {
      tutor: "Add 2–3 drops of water to the white anhydrous powder using the dropper.",
      x: "add water drops",
      item: "water",
      tube: 0,
      pour: "water",
      zoom: true,
      pre: {
        title: "Rehydration Test for Physical Change",
        body: "Adding water restores the coordinate covalent hydration sphere around Cu²⁺ ions, regenerating the characteristic blue colour with heat evolution.",
      },
      post: {
        title: "Deep Blue Colour Restored (Reversible Physical Change!)",
        body: "The original blue colour returns instantly upon rehydration, confirming that dehydration is a completely reversible physical change with no new chemical substance formed.",
        eq: "CuSO₄(s) [White] + 5H₂O(l) → CuSO₄·5H₂O(s) [Blue] (Reversible)",
      },
    },

    // Part B: Chemical Change (Magnesium combustion)
    {
      tutor: "Pick up the Magnesium Ribbon held in crucible tongs (Tube 2).",
      x: "pick up Magnesium Ribbon",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Ignite the magnesium ribbon in the hottest zone of the Bunsen flame.",
      x: "ignite Magnesium ribbon",
      item: "burner",
      tube: 1,
      heat: true,
      zoom: true,
      pre: {
        title: "Part B: Combustion of Magnesium Ribbon",
        body: "Magnesium reacts vigorously and exothermically with atmospheric oxygen: 2Mg(s) + O₂(g) → 2MgO(s) + Light + Heat.",
      },
      post: {
        title: "Dazzling Blinding White Incandescence!",
        body: "Magnesium burns with an intense, dazzling white blinding flame, producing dense white smoke of magnesium oxide.",
        eq: "2Mg(s) + O₂(g) → 2MgO(s) + 1204 kJ (Exothermic Chemical Change)",
      },
    },
    {
      tutor: "Collect the white ash in a watch glass and observe its properties.",
      x: "inspect MgO white ash",
      item: "tube",
      tube: 1,
      zoom: true,
      post: {
        title: "New Substance Formed: MgO (Irreversible Chemical Change!)",
        body: "Brittle white powder of magnesium oxide (MgO) is produced. It possesses entirely different chemical properties and cannot be converted back to metallic magnesium by cooling or physical means.",
        eq: "Magnesium (Metal) + Oxygen (Gas) → Magnesium Oxide (Ionic Solid)",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    // Tube 0 (CuSO4 dehydration/rehydration):
    if (step === 0) t[0] = { ...sol(BLUE_VITRIOL, 0.45, 0.85), powder: true };
    else if (step === 1) t[0] = { ...sol(WHITE_ANHYDROUS, 0.45, 0.9), powder: true };
    else if (step >= 2) t[0] = sol(BLUE_VITRIOL, 0.55, 0.9);

    // Tube 1 (Mg ribbon burning):
    if (step === 3) t[1] = { ...sol(MG_SILVER, 0.35, 0.95), powder: true };
    else if (step === 4) t[1] = { ...ppt(MGO_WHITE, "#ffffff", 0.7, 0.98), fizz: true };
    else if (step >= 5) t[1] = { ...sol(MGO_WHITE, 0.45, 0.95), powder: true };

    return t;
  },
  summary: [
    {
      test: "Heating hydrated blue CuSO₄·5H₂O crystals",
      obs: "Water vapor evolves; blue crystals turn white",
      inf: "Loss of water of crystallization (Dehydration)",
      eq: "CuSO₄·5H₂O(s) ⇌ CuSO₄(s) + 5H₂O(g)",
      liquid: WHITE_ANHYDROUS,
      ppt: WHITE_ANHYDROUS,
    },
    {
      test: "Addition of water drops to white anhydrous CuSO₄",
      obs: "Instant restoration of deep blue colour with heat",
      inf: "Reversible Physical Change (No new chemical bonds)",
      eq: "CuSO₄(s) + 5H₂O(l) → CuSO₄·5H₂O(s)",
      liquid: BLUE_VITRIOL,
      ppt: BLUE_VITRIOL,
    },
    {
      test: "Ignition of Magnesium Ribbon in Bunsen flame",
      obs: "Intense, dazzling blinding white flame & smoke",
      inf: "Rapid oxidation / combustion of magnesium metal",
      eq: "2Mg(s) + O₂(g) → 2MgO(s) + Heat + Light",
      liquid: MGO_WHITE,
      ppt: MGO_WHITE,
    },
    {
      test: "Examination of Magnesium Oxide product ash",
      obs: "White brittle ionic powder (MgO)",
      inf: "Irreversible Chemical Change (New chemical substance formed)",
      eq: "Chemical Change: Permanent & Irreversible",
      liquid: MGO_WHITE,
      ppt: MGO_WHITE,
    },
  ],
  procedure: [
    "Part A (Physical Change): Take a few blue crystals of hydrated copper sulfate (CuSO₄·5H₂O) in a clean dry test tube.",
    "Hold the test tube with a test tube holder and heat it gently over a Bunsen burner flame.",
    "Notice water droplets condensing on the upper cooler walls of the test tube and the blue crystals turning into a white anhydrous powder.",
    "Allow the tube to cool, then add 2–3 drops of water with a dropper; observe the immediate reappearance of the blue colour (Reversible Physical Change).",
    "Part B (Chemical Change): Take a 3–4 cm strip of magnesium ribbon and clean its surface by rubbing with sandpaper to remove the oxide coating.",
    "Hold one end of the magnesium ribbon securely with a pair of crucible tongs.",
    "Introduce the other end into the hottest oxidizing zone of a Bunsen flame.",
    "The magnesium ribbon ignites and burns with a dazzling, blinding white incandescent light, forming dense white smoke.",
    "Collect the white ash of magnesium oxide (MgO) in a watch glass. Observe that the ash cannot be converted back to magnesium metal (Irreversible Chemical Change).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
