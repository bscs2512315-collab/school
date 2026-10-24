"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol, ppt } from "../_practical/helpers";

const CRUDE_BLUE = "#3b82f6";
const DEEP_BLUE_SOL = "#1d4ed8";
const PURE_CRYSTAL_BLUE = "#2563eb";
const INSOLUBLE_DIRT = "#78350f";

const config: PracticalConfig = {
  title: "Purification of Impure Copper Sulfate by Crystallization",
  kicker: "Purification Techniques & Crystal Growth",
  ionLabel: "CuSO₄·5H₂O",
  radical: "Hydrated Copper(II) Sulfate",
  group: "Class IX Practical 6",
  grade: "IX",
  reagents: [
    { id: "crudeCu", color: CRUDE_BLUE, label: "Crude Impure CuSO₄" },
    { id: "water", color: "#dbe9f4", label: "Distilled Water + dil. H₂SO₄" },
    { id: "burner", color: "#f59e0b", label: "Bunsen Burner" },
    { id: "filter", color: "#f8fafc", label: "Fluted Filter Paper" },
  ],
  steps: [
    {
      tutor: "Pick up the reaction beaker (Tube 1) on the stand.",
      x: "pick up beaker",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Add 15 g of crude impure copper sulfate solid into the beaker.",
      x: "add 15 g crude CuSO₄",
      item: "crudeCu",
      tube: 0,
      pour: "crudeCu",
      pre: {
        title: "Crude Copper Sulfate Composition",
        body: "Crude copper sulfate contains blue vitriol (CuSO₄·5H₂O) contaminated with insoluble gritty sand/dust particles and soluble traces.",
      },
      post: {
        title: "Crude Sample Charged in Beaker",
        body: "15 g of impure blue copper sulfate crystals charged in the beaker.",
      },
    },
    {
      tutor: "Add 50 mL distilled water and 2–3 drops of dil. H₂SO₄, then heat to dissolve.",
      x: "add water & heat to dissolve",
      item: "water",
      tube: 0,
      pour: "water",
      heat: true,
      zoom: true,
      pre: {
        title: "Acidified Hot Dissolution",
        body: "Heating increases solubility significantly (solubility of CuSO₄ is 75 g/100 mL at 100 °C vs 20 g/100 mL at 20 °C). Dilute H₂SO₄ prevents hydrolysis of Cu²⁺ ions.",
      },
      post: {
        title: "Hot Saturated Blue Solution Formed",
        body: "Copper sulfate dissolves completely into a deep blue solution containing suspended insoluble impurities.",
        eq: "CuSO₄·5H₂O(s) → Cu²⁺(aq) + SO₄²⁻(aq) + 5H₂O",
      },
    },
    {
      tutor: "Pick up the receiving conical flask with glass funnel (Tube 2).",
      x: "pick up filter funnel",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Filter the hot solution through fluted filter paper to remove insoluble impurities.",
      x: "filter hot solution",
      item: "filter",
      tube: 1,
      pour: "water",
      zoom: true,
      pre: {
        title: "Hot Gravity Filtration",
        body: "Filtration while hot separates insoluble suspended particles on the filter paper while retaining the concentrated solute in the filtrate.",
      },
      post: {
        title: "Clear Deep Blue Filtrate Collected",
        body: "Insoluble dirt remains on filter paper; sparkling clear deep blue copper sulfate solution is collected.",
      },
    },
    {
      tutor: "Evaporate the filtrate to crystallization point (crust forms on glass rod).",
      x: "concentrate to crystal point",
      item: "burner",
      tube: 1,
      heat: true,
      zoom: true,
      pre: {
        title: "Testing Crystallization Point",
        body: "Dip a glass rod into the boiling solution and blow on it. If a thin crystalline crust forms immediately on the glass rod, crystallization point is reached.",
      },
      post: {
        title: "Crystallization Point Reached",
        body: "Solution is supersaturated with respect to room temperature.",
      },
    },
    {
      tutor: "Cover and allow to cool undisturbed overnight to grow large, pure blue crystals.",
      x: "cool to grow pure crystals",
      item: "tube",
      tube: 1,
      zoom: true,
      post: {
        title: "Pure Deep Blue CuSO₄·5H₂O Crystals Obtained!",
        body: "Slow, undisturbed cooling allows pure copper sulfate pentahydrate molecules to arrange into beautiful, transparent, deep-blue triclinic crystals.",
        eq: "Cu²⁺(aq) + SO₄²⁻(aq) + 5H₂O(l) → CuSO₄·5H₂O(s)↓ (Pure Blue Crystals)",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    // Tube 0 (Dissolution Beaker):
    if (step === 1) t[0] = { ...sol(CRUDE_BLUE, 0.35, 0.8), powder: true };
    else if (step === 2) t[0] = { ...ppt(INSOLUBLE_DIRT, DEEP_BLUE_SOL, 0.7, 0.9), fizz: true };
    else if (step >= 3 && step < 5) t[0] = ppt(INSOLUBLE_DIRT, DEEP_BLUE_SOL, 0.7, 0.9);
    else if (step >= 5) t[0] = sol("#00000000", 0, 0);

    // Tube 1 (Filtrate & Crystallization Dish):
    if (step === 4) t[1] = sol(DEEP_BLUE_SOL, 0.55, 0.85);
    else if (step === 5) t[1] = sol(DEEP_BLUE_SOL, 0.45, 0.9);
    else if (step >= 6) {
      t[1] = {
        fill: 0.65,
        color: DEEP_BLUE_SOL,
        opacity: 0.8,
        powder: true,
        precip: PURE_CRYSTAL_BLUE,
        precipAmt: 0.85,
        ring: PURE_CRYSTAL_BLUE,
      };
    }

    return t;
  },
  summary: [
    {
      test: "Dissolution of 15 g crude CuSO₄ in hot acidified water",
      obs: "Deep blue solution with insoluble suspended dirt",
      inf: "High thermal solubility of copper sulfate",
      eq: "CuSO₄·5H₂O + H₂O + H₂SO₄",
      liquid: DEEP_BLUE_SOL,
      ppt: INSOLUBLE_DIRT,
    },
    {
      test: "Hot filtration through fluted filter paper",
      obs: "Brown grit on paper; sparkling clear blue filtrate",
      inf: "Complete removal of insoluble impurities",
      eq: "Filtration separates SiO₂ / dirt residue",
      liquid: DEEP_BLUE_SOL,
      ppt: DEEP_BLUE_SOL,
    },
    {
      test: "Evaporation to crystallization point",
      obs: "Thin crystalline film on cold glass rod test",
      inf: "Solution reaches supersaturation threshold",
      eq: "Concentrated hot solution ready for cooling",
      liquid: DEEP_BLUE_SOL,
      ppt: DEEP_BLUE_SOL,
    },
    {
      test: "Slow undisturbed cooling & crystal harvesting",
      obs: "Well-defined, deep blue triclinic crystals",
      inf: "Pure crystalline blue vitriol (CuSO₄·5H₂O)",
      eq: "CuSO₄(aq) + 5H₂O(l) → CuSO₄·5H₂O(s) (Pure)",
      liquid: PURE_CRYSTAL_BLUE,
      ppt: PURE_CRYSTAL_BLUE,
    },
  ],
  procedure: [
    "Take about 15 g of crude, impure copper sulfate crystals in a 250 cm³ beaker.",
    "Add 50 cm³ of distilled water and 2–3 drops of dilute sulfuric acid (to prevent hydrolysis of copper ions).",
    "Heat the mixture gently with stirring until all soluble copper sulfate dissolves into a hot concentrated solution.",
    "Filter the hot solution through a fluted filter paper placed in a glass funnel into a clean china dish to remove insoluble dirt.",
    "Heat the clear blue filtrate in the china dish gently on wire gauze until it is concentrated to the crystallization point (a drop on a cold glass rod forms a crust).",
    "Remove the dish from heat, cover with a watch glass or filter paper, and allow it to cool slowly and undisturbed overnight.",
    "Decant the mother liquor, harvest the pure, glittering deep blue CuSO₄·5H₂O crystals, and dry them between folds of filter paper.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
