"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol } from "../_practical/helpers";

const MOHRS_GREEN = "#86efac";
const FE3_YELLOW = "#fef08a";
const PINK_ENDPOINT = "#f472b6";
const DEEP_PURPLE_KMNO4 = "#4a044e";

const config: PracticalConfig = {
  title: "Determination of Percentage of Iron in Mohr's Salt",
  kicker: "Permanganometry & Quantitative Redox",
  ionLabel: "Fe²⁺",
  radical: "Iron(II) in Mohr's Salt",
  group: "Class XI Practical 3",
  grade: "XI",
  reagents: [
    { id: "mohrs", color: MOHRS_GREEN, label: "Mohr's Salt Solution" },
    { id: "h2so4", color: "#e0f2fe", label: "Dilute H₂SO₄" },
    { id: "kmno4", color: DEEP_PURPLE_KMNO4, label: "0.02 M KMnO₄" },
  ],
  steps: [
    {
      tutor: "Pick up the reaction conical flask (Tube 1) from the stand.",
      x: "pick up conical flask",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Add 10 mL of Mohr's salt solution into the conical flask.",
      x: "add 10 mL Mohr's Salt",
      item: "mohrs",
      tube: 0,
      pour: "mohrs",
      pre: {
        title: "Mohr's Salt Sample (Fe²⁺)",
        body: "Mohr's salt (FeSO₄·(NH₄)₂SO₄·6H₂O, M = 392.14 g/mol) contains ferrous ions (Fe²⁺) that act as the reducing agent.",
      },
      post: {
        title: "Pale Green Fe²⁺ Solution Charged",
        body: "10.0 cm³ of pale greenish Mohr's salt solution is ready in the flask.",
      },
    },
    {
      tutor: "Add 10 mL of 1 M dilute H₂SO₄ to acidify the solution.",
      x: "add dilute H₂SO₄",
      item: "h2so4",
      tube: 0,
      pour: "h2so4",
      pre: {
        title: "Acidification without Heating",
        body: "Dilute H₂SO₄ prevents atmospheric oxidation and hydrolysis of Fe²⁺ to Fe³⁺. Unlike oxalic acid, Fe²⁺ reacts rapidly in cold solution without heating.",
      },
      post: {
        title: "Acidified Fe²⁺ Solution Ready",
        body: "Acid medium ready for cold redox titration against KMnO₄.",
      },
    },
    {
      tutor: "Titrate cold solution with 0.02 M KMnO₄ dropwise with steady swirling.",
      x: "titrate with 0.02 M KMnO₄",
      item: "kmno4",
      tube: 0,
      pour: "kmno4",
      zoom: true,
      pre: {
        title: "Direct Redox Oxidation (Fe²⁺ → Fe³⁺)",
        body: "KMnO₄ oxidizes Fe²⁺ to Fe³⁺ quantitatively: MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O. Initial purple drops turn pale yellow as Fe³⁺ forms.",
      },
      post: {
        title: "Decolorization & Fe³⁺ Formation",
        body: "Purple permanganate is instantaneously reduced by ferrous ions in cold solution: MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O.",
        eq: "MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O",
      },
    },
    {
      tutor: "Continue dropwise addition to reach the permanent pale pink endpoint.",
      x: "reach permanent pale pink endpoint",
      item: "kmno4",
      tube: 0,
      pour: "kmno4",
      zoom: true,
      post: {
        title: "Permanent Pale Pink Endpoint (V₁ = 18.00 cm³)",
        body: "All Fe²⁺ has been oxidized to Fe³⁺. The first excess drop of KMnO₄ imparts a permanent faint pink tint.",
        eq: "Burette Reading V₁ = 18.00 cm³",
      },
    },
    {
      tutor: "Pick up Conical Flask 2 (Tube 2) for Trial 2.",
      x: "pick up Flask 2",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Titrate Trial 2 (10 mL Mohr's Salt + 10 mL H₂SO₄) with 0.02 M KMnO₄ to concordant endpoint.",
      x: "titrate Trial 2",
      item: "kmno4",
      tube: 1,
      pour: "kmno4",
      zoom: true,
      post: {
        title: "Concordant Reading = 18.00 cm³ → % Iron Calculated",
        body: "Trial 2 confirms concordant volume V = 18.00 cm³. Percentage of iron in Mohr's salt is determined to be 14.18% (Theoretical = 14.24%).",
        eq: "% Fe = (Mass of Fe / Sample Mass) × 100 = 14.18%",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    // Tube 0 (Trial 1):
    if (step === 1) t[0] = sol(MOHRS_GREEN, 0.45, 0.7);
    else if (step === 2) t[0] = sol(MOHRS_GREEN, 0.58, 0.7);
    else if (step === 3) t[0] = sol(FE3_YELLOW, 0.68, 0.8);
    else if (step >= 4) t[0] = sol(PINK_ENDPOINT, 0.76, 0.85);

    // Tube 1 (Trial 2):
    if (step === 5) t[1] = sol(MOHRS_GREEN, 0.58, 0.7);
    else if (step >= 6) t[1] = sol(PINK_ENDPOINT, 0.76, 0.85);

    return t;
  },
  summary: [
    {
      test: "10 cm³ Mohr's salt solution + 10 cm³ dil. H₂SO₄",
      obs: "Clear pale green solution",
      inf: "Acidified Fe²⁺ ready for titration (cold)",
      eq: "FeSO₄·(NH₄)₂SO₄·6H₂O(aq)",
      liquid: MOHRS_GREEN,
      ppt: MOHRS_GREEN,
    },
    {
      test: "Dropwise titration with 0.02 M KMnO₄ in cold",
      obs: "Purple drops decolorize instantly; solution turns pale yellow",
      inf: "Fe²⁺ oxidized to Fe³⁺, MnO₄⁻ reduced to Mn²⁺",
      eq: "MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O",
      liquid: FE3_YELLOW,
      ppt: FE3_YELLOW,
    },
    {
      test: "Endpoint with 0.02 M KMnO₄ (at 18.00 cm³)",
      obs: "Permanent faint pink colour persists >30 seconds",
      inf: "All Fe²⁺ completely oxidized to Fe³⁺",
      eq: "V_KMnO₄ = 18.00 cm³",
      liquid: PINK_ENDPOINT,
      ppt: PINK_ENDPOINT,
    },
    {
      test: "Percentage of Iron Calculation",
      obs: "Concordant V = 18.00 cm³ of 0.02 M KMnO₄",
      inf: "Calculated % Fe = 14.18% (Theoretical: 14.24%)",
      eq: "% Fe = (0.02 × 18.00 × 5 × 55.85 × 100) / (Sample Mass × 1000) = 14.18%",
      liquid: PINK_ENDPOINT,
      ppt: PINK_ENDPOINT,
    },
  ],
  procedure: [
    "Fill a clean burette with standardized 0.02 M KMnO₄ solution and adjust to zero mark (upper meniscus).",
    "Pipette 10.0 cm³ of unknown Mohr's salt solution into a 250 cm³ conical flask.",
    "Add 10.0 cm³ of 1 M dilute sulfuric acid (H₂SO₄) to prevent hydrolysis of ferrous ions.",
    "Titrate the cold solution directly by adding KMnO₄ solution dropwise with continuous swirling.",
    "The dark purple color of KMnO₄ will discharge instantly into a pale yellow tint (Fe³⁺).",
    "Stop titration when a single drop of KMnO₄ imparts a permanent pale pink color persisting for 30 seconds.",
    "Record the volume of KMnO₄ used and repeat for concordant readings.",
    "Calculate the percentage of Fe²⁺ in the sample: % Fe = 14.18%.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
