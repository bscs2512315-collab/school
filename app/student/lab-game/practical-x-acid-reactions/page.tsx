"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol, ppt } from "../_practical/helpers";

const CLEAR_ACID = "#e2e8f0";
const MG_SOLUTION = "#dbeafe";
const LIME_CLEAR = "#f8fafc";
const LIME_MILKY = "#ffffff";
const SALT_NEUTRAL = "#ecfdf5";

const config: PracticalConfig = {
  title: "Characteristic Reactions of Acids",
  kicker: "Acid Properties",
  ionLabel: "Acids",
  radical: "Reactions of Dilute Acids",
  group: "Class X Practical 5",
  grade: "X",
  reagents: [
    { id: "hcl", color: "#e0f2fe", label: "Diluted HCl" },
    { id: "mg", color: "#94a3b8", label: "Magnesium Ribbon" },
    { id: "caco3", color: "#f8fafc", label: "CaCO₃ Solid" },
    { id: "limewater", color: "#f8fafc", label: "Lime Water" },
    { id: "naoh", color: "#e0f2fe", label: "0.1 M NaOH" },
  ],
  steps: [
    {
      tutor: "Pick up Test Tube 1 from the stand.",
      x: "pick up Tube 1",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Add Magnesium ribbon and Diluted HCl to Tube 1.",
      x: "add Mg + Diluted HCl",
      item: "mg",
      tube: 0,
      pour: "hcl",
      zoom: true,
      pre: {
        title: "Reaction with Reactive Metal (Mg)",
        body: "Reactive metals displace hydrogen from dilute acids, producing hydrogen gas that burns with a characteristic 'pop' sound.",
      },
      post: {
        title: "Hydrogen Gas Evolution (Pop Sound!)",
        body: "Magnesium reacts vigorously with HCl liberating hydrogen gas: Mg + 2HCl → MgCl₂ + H₂↑.",
        eq: "Mg + 2HCl → MgCl₂ + H₂↑",
      },
    },
    {
      tutor: "Pick up Test Tube 2 from the stand.",
      x: "pick up Tube 2",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Add solid CaCO₃ and Diluted HCl to Tube 2.",
      x: "add CaCO₃ + Diluted HCl",
      item: "caco3",
      tube: 1,
      pour: "hcl",
      zoom: true,
      pre: {
        title: "Reaction with Metal Carbonate (CaCO₃)",
        body: "Acids decompose carbonates liberating carbon dioxide gas with brisk effervescence.",
      },
      post: {
        title: "Brisk Effervescence of CO₂ Gas",
        body: "Reaction produces calcium chloride, water, and carbon dioxide gas: CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑.",
        eq: "CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑",
      },
    },
    {
      tutor: "Pass the evolved CO₂ gas into fresh Lime Water in Tube 3.",
      x: "pass CO₂ into Lime Water",
      item: "limewater",
      tube: 2,
      pour: "limewater",
      deliver: { from: 1, to: 2 },
      zoom: true,
      pre: {
        title: "Confirmatory Test for Carbon Dioxide",
        body: "CO₂ reacts with calcium hydroxide (lime water) forming insoluble white calcium carbonate, turning lime water milky.",
      },
      post: {
        title: "Lime Water Turns Milky (CaCO₃↓)",
        body: "Lime water turns milky white confirming carbon dioxide gas: Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O.",
        eq: "Ca(OH)₂ + CO₂ → CaCO₃↓ (milky) + H₂O",
      },
    },
    {
      tutor: "Pick up Test Tube 4 from the stand for Neutralization.",
      x: "pick up Tube 4",
      item: "tube",
      tube: 3,
    },
    {
      tutor: "Mix equal volumes of 0.1 M HCl and 0.1 M NaOH in Tube 4.",
      x: "mix HCl + NaOH",
      item: "naoh",
      tube: 3,
      pour: "naoh",
      zoom: true,
      pre: {
        title: "Neutralization Reaction with Base",
        body: "Acids react with bases (alkalis) in an exothermic neutralization reaction to form neutral salt and water.",
      },
      post: {
        title: "Neutral Salt & Water Formed",
        body: "Hydrochloric acid completely neutralizes sodium hydroxide forming sodium chloride and water: HCl + NaOH → NaCl + H₂O.",
        eq: "HCl + NaOH → NaCl + H₂O (exothermic)",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    // Tube 0 (Mg + HCl -> H2 fizz)
    if (step >= 1) t[0] = { ...sol(MG_SOLUTION, 0.65, 0.8), fizz: step === 1 };
    // Tube 1 (CaCO3 + HCl -> CO2 fizz)
    if (step >= 3) t[1] = { ...sol(CLEAR_ACID, 0.65, 0.8), fizz: step >= 3 && step <= 4 };
    // Tube 2 (Lime water milky)
    if (step >= 4) t[2] = ppt(LIME_MILKY, "#f1f5f9", 0.68, 0.85);
    // Tube 3 (HCl + NaOH neutralization)
    if (step >= 6) t[3] = sol(SALT_NEUTRAL, 0.72, 0.85);
    return t;
  },
  summary: [
    {
      test: "Dilute HCl + Magnesium ribbon",
      obs: "Brisk effervescence, gas burns with 'pop' sound",
      inf: "Evolution of Hydrogen gas (H₂)",
      eq: "Mg + 2HCl → MgCl₂ + H₂↑",
      liquid: MG_SOLUTION,
      ppt: MG_SOLUTION,
    },
    {
      test: "Dilute HCl + Solid CaCO₃",
      obs: "Brisk effervescence of colourless CO₂ gas",
      inf: "Decomposition of carbonate",
      eq: "CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑",
      liquid: CLEAR_ACID,
      ppt: CLEAR_ACID,
    },
    {
      test: "Evolved gas passed into Lime Water",
      obs: "Lime water turns milky white",
      inf: "CO₂ gas confirmed via CaCO₃ precipitation",
      eq: "Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O",
      liquid: "#f1f5f9",
      ppt: LIME_MILKY,
    },
    {
      test: "Dilute HCl + 0.1 M NaOH",
      obs: "Temperature rises, neutral pH formed",
      inf: "Neutralization reaction (Salt + Water)",
      eq: "HCl + NaOH → NaCl + H₂O",
      liquid: SALT_NEUTRAL,
      ppt: SALT_NEUTRAL,
    },
  ],
  procedure: [
    "Add 2 mL dilute HCl to magnesium ribbon in Tube 1; test escaping gas with burning splint (pop sound).",
    "Add 2 mL dilute HCl to solid CaCO₃ in Tube 2; observe effervescence.",
    "Pass evolved gas through delivery tube into lime water in Tube 3; observe milky turbidity.",
    "Mix equal volumes of dilute HCl and 0.1 M NaOH in Tube 4 to demonstrate neutralization.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
