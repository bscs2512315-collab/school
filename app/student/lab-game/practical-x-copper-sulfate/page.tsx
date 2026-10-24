"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol, ppt } from "../_practical/helpers";

const CLEAR_ACID = "#e0f2fe";
const BLUE_CUSO4 = "#2563eb";
const DEEP_BLUE_CUSO4 = "#1d4ed8";
const CRYSTAL_BLUE = "#1e40af";
const BLACK_CUO = "#0f172a";

const config: PracticalConfig = {
  title: "Preparation of Copper Sulfate Crystals",
  kicker: "Salt Synthesis & Crystallization",
  ionLabel: "CuSO₄·5H₂O",
  radical: "Copper(II) Sulfate",
  group: "Class X Practical 7",
  grade: "X",
  reagents: [
    { id: "h2so4", color: "#e0f2fe", label: "Dilute H₂SO₄" },
    { id: "cuo", color: "#0f172a", label: "Black CuO Powder" },
    { id: "burner", color: "#f59e0b", label: "Bunsen Burner" },
    { id: "filter", color: "#94a3b8", label: "Filter Funnel" },
    { id: "crystallize", color: "#38bdf8", label: "Cooling Tray" },
  ],
  steps: [
    {
      tutor: "Pick up the reaction Beaker (Tube 1) from the stand.",
      x: "pick up reaction beaker",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Add dilute sulfuric acid (H₂SO₄) to the beaker.",
      x: "add dilute H₂SO₄",
      item: "h2so4",
      tube: 0,
      pour: "h2so4",
      zoom: true,
      pre: {
        title: "Acid Reactant Charge",
        body: "Dilute sulfuric acid provides the sulfate ions and acidic medium necessary to react with insoluble basic copper(II) oxide.",
      },
      post: {
        title: "Acid Added",
        body: "Beaker contains clear dilute sulfuric acid solution (H₂SO₄).",
      },
    },
    {
      tutor: "Add black copper(II) oxide powder (CuO) in small portions.",
      x: "add CuO powder",
      item: "cuo",
      tube: 0,
      pour: "cuo",
      zoom: true,
      pre: {
        title: "Neutralization of Insoluble Base",
        body: "Copper(II) oxide is a basic oxide that reacts with sulfuric acid to produce copper(II) sulfate and water: CuO + H₂SO₄ → CuSO₄ + H₂O.",
      },
      post: {
        title: "Solution Turns Blue with Excess CuO",
        body: "The solution turns a rich blue color as copper sulfate forms, with slight excess black CuO settling at the bottom to ensure complete acid neutralization.",
        eq: "CuO(s) + H₂SO₄(aq) → CuSO₄(aq) + H₂O(l)",
      },
    },
    {
      tutor: "Warm the beaker gently using the Bunsen burner.",
      x: "warm reaction mixture",
      item: "tube",
      tube: 0,
      heat: true,
      zoom: true,
      pre: {
        title: "Thermal Activation",
        body: "Heating speeds up the rate of reaction between solid CuO and dilute H₂SO₄, driving it to completion.",
      },
      post: {
        title: "Reaction Complete",
        body: "The solution turns an intense royal blue, indicating complete conversion of acid to copper(II) sulfate.",
        eq: "CuO + H₂SO₄ → CuSO₄ + H₂O (hot saturated solution)",
      },
    },
    {
      tutor: "Pick up Receiver Flask (Tube 2) and filter the hot solution through filter paper.",
      x: "filter hot solution",
      item: "filter",
      tube: 1,
      zoom: true,
      pre: {
        title: "Filtration of Excess CuO",
        body: "Filtering removes the unreacted solid black CuO powder, leaving a pure, sparkling clear aqueous copper(II) sulfate filtrate.",
      },
      post: {
        title: "Clear Blue Filtrate Collected",
        body: "The black solid remains on the filter paper as residue while clear blue CuSO₄ solution collects in the flask as filtrate.",
      },
    },
    {
      tutor: "Heat the blue filtrate to reduce volume to crystallization point.",
      x: "evaporate to saturation",
      item: "tube",
      tube: 1,
      heat: true,
      zoom: true,
      pre: {
        title: "Evaporation to Crystallization Point",
        body: "Water is driven off until a saturated solution is reached (when crust of crystals forms on a cold glass rod dipped into the hot liquid).",
      },
      post: {
        title: "Crystallization Point Reached",
        body: "Hot concentrated CuSO₄ solution is ready for slow cooling.",
      },
    },
    {
      tutor: "Cool slowly to allow blue CuSO₄·5H₂O crystals to grow.",
      x: "cool & crystallize",
      item: "crystallize",
      tube: 1,
      zoom: true,
      pre: {
        title: "Crystal Nucleation & Growth",
        body: "Slow, undisturbed cooling allows copper and sulfate ions to lock with water molecules into large, pure triclinic crystals.",
      },
      post: {
        title: "Pure Copper Sulfate Crystals (Blue Vitriol)",
        body: "Beautiful translucent deep blue hydrated copper(II) sulfate pentahydrate crystals have separated out.",
        eq: "CuSO₄(aq) + 5H₂O(l) → CuSO₄·5H₂O(s) (Blue Vitriol Crystals)",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    // Tube 0 (Reaction beaker):
    if (step === 1) t[0] = sol(CLEAR_ACID, 0.45, 0.85);
    else if (step === 2) t[0] = ppt(BLACK_CUO, BLUE_CUSO4, 0.65, 0.75);
    else if (step >= 3) t[0] = ppt(BLACK_CUO, DEEP_BLUE_CUSO4, 0.65, 0.8);

    // Tube 1 (Receiver flask / crystallization dish):
    if (step === 4) t[1] = sol(BLUE_CUSO4, 0.55, 0.85);
    else if (step === 5) t[1] = sol(DEEP_BLUE_CUSO4, 0.4, 0.9);
    else if (step >= 6) t[1] = ppt(CRYSTAL_BLUE, BLUE_CUSO4, 0.7, 0.9);
    return t;
  },
  summary: [
    {
      test: "Dilute H₂SO₄ in reaction beaker",
      obs: "Colorless transparent liquid",
      inf: "Acidic reactant charged",
      eq: "",
      liquid: CLEAR_ACID,
      ppt: CLEAR_ACID,
    },
    {
      test: "Add excess black CuO powder & warm gently",
      obs: "Black powder dissolves; solution turns vibrant blue; excess CuO at base",
      inf: "Base neutralized: CuO + H₂SO₄ → CuSO₄ + H₂O",
      eq: "CuO(s) + H₂SO₄(aq) → CuSO₄(aq) + H₂O(l)",
      liquid: BLUE_CUSO4,
      ppt: BLACK_CUO,
    },
    {
      test: "Filter hot reaction mixture through filter paper",
      obs: "Black CuO residue on paper; sparkling clear blue filtrate collected",
      inf: "Excess unreacted base separated",
      eq: "",
      liquid: BLUE_CUSO4,
      ppt: BLUE_CUSO4,
    },
    {
      test: "Evaporate filtrate to saturation & cool slowly",
      obs: "Deep blue triclinic crystals separate out",
      inf: "Pure hydrated Copper(II) Sulfate crystallized",
      eq: "CuSO₄(aq) + 5H₂O(l) → CuSO₄·5H₂O(s)",
      liquid: DEEP_BLUE_CUSO4,
      ppt: CRYSTAL_BLUE,
    },
  ],
  procedure: [
    "Measure 40 cm³ dilute sulfuric acid (H₂SO₄) into a beaker and warm gently on wire gauze.",
    "Add black copper(II) oxide (CuO) powder in small portions with continuous stirring until in excess.",
    "Filter the hot blue mixture through filter paper into a flask to remove excess unreacted CuO.",
    "Evaporate the clear blue filtrate in an evaporating dish until crystallization point is reached.",
    "Allow the saturated solution to cool undisturbed to grow large, pure blue CuSO₄·5H₂O crystals.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
