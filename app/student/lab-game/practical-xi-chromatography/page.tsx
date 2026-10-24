"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol, ppt } from "../_practical/helpers";

const EXTRACT_GREEN = "#15803d";
const SOLVENT_CLEAR = "#e0f2fe";
const BAND_CAROTENE = "#f97316";
const BAND_XANTHOPHYLL = "#eab308";
const BAND_CHL_A = "#059669";
const BAND_CHL_B = "#65a30d";

const config: PracticalConfig = {
  title: "Paper Chromatography of Plant Pigments",
  kicker: "Chromatography & Analytical Separation",
  ionLabel: "Pigments (Rf)",
  radical: "Chloroplast Leaf Pigments",
  group: "Class XI Practical 8",
  grade: "XI",
  reagents: [
    { id: "spinachExtract", color: EXTRACT_GREEN, label: "Spinach Extract" },
    { id: "solvent", color: SOLVENT_CLEAR, label: "Pet. Ether-Acetone (9:1)" },
    { id: "capillary", color: "#e2e8f0", label: "Capillary Tube" },
  ],
  steps: [
    {
      tutor: "Pick up the Whatman No. 1 Chromatography Strip (Tube 1).",
      x: "pick up chromatography strip",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Dip capillary tube into concentrated spinach leaf extract.",
      x: "load capillary spotter",
      item: "spinachExtract",
      tube: 0,
      pour: "spinachExtract",
      pre: {
        title: "Pigment Extraction in Acetone",
        body: "Grinding fresh spinach leaves with acetone extracts all photosynthetic pigments: Chlorophyll a, Chlorophyll b, Carotenes, and Xanthophylls.",
      },
      post: {
        title: "Capillary Loaded with Dark Green Extract",
        body: "Fine glass capillary is filled with concentrated dark green leaf pigment extract.",
      },
    },
    {
      tutor: "Apply a tiny spot of pigment extract on the baseline (2 cm from bottom) and allow to dry.",
      x: "spot baseline & dry",
      item: "capillary",
      tube: 0,
      zoom: true,
      pre: {
        title: "Spotting Technique",
        body: "Apply repeated microscopic drops on the exact same center spot, allowing solvent to evaporate between applications to ensure a concentrated, non-spreading baseline spot.",
      },
      post: {
        title: "Concentrated Pigment Spot Ready on Baseline",
        body: "Dense dark green spot fixed at the 2 cm baseline.",
      },
    },
    {
      tutor: "Pick up the Developing Chamber (Tube 2) and add Petroleum Ether : Acetone (9:1) solvent.",
      x: "charge developing solvent",
      item: "solvent",
      tube: 1,
      pour: "solvent",
      pre: {
        title: "Mobile Phase Solvent Preparation",
        body: "A 9:1 mixture of petroleum ether (non-polar) and acetone (polar) acts as the mobile phase, providing optimal differential partitioning for plant pigments.",
      },
      post: {
        title: "Developing Chamber Charged with Solvent",
        body: "Developing solvent level filled to 1 cm depth (below the 2 cm baseline spot).",
      },
    },
    {
      tutor: "Suspend chromatography strip into chamber and close lid for ascending development.",
      x: "develop chromatogram",
      item: "tube",
      tube: 1,
      zoom: true,
      pre: {
        title: "Ascending Partition Chromatography",
        body: "Capillary action draws the mobile phase up the cellulose strip. Non-polar carotenes move fastest with the solvent, while polar chlorophylls adsorb strongly to paper fibers.",
      },
      post: {
        title: "Chromatographic Development Complete (10 cm Solvent Front)",
        body: "Solvent front has ascended 10.0 cm, successfully resolving 4 distinct colored pigment bands.",
        eq: "Solvent Front Distance = 10.0 cm",
      },
    },
    {
      tutor: "Measure band distances and calculate Rf values for all four separated pigments.",
      x: "calculate Rf values",
      item: "tube",
      tube: 1,
      post: {
        title: "4 Pigments Resolved: Carotene, Xanthophyll, Chl a, Chl b",
        body: "Calculated Rf values: Carotene = 0.95 (Yellow-Orange), Xanthophyll = 0.71 (Yellow), Chlorophyll a = 0.45 (Blue-Green), Chlorophyll b = 0.28 (Olive-Green).",
        eq: "R_f = (Band Distance) / (Solvent Front Distance)",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    // Tube 0 (Spotting Paper Strip):
    if (step === 1) t[0] = sol(SOLVENT_CLEAR, 0.2, 0.7);
    else if (step >= 2 && step < 4) t[0] = ppt(EXTRACT_GREEN, SOLVENT_CLEAR, 0.35, 0.9);

    // Tube 1 (Chromatography Chamber with 4 distinct bands):
    if (step === 4) t[1] = sol(SOLVENT_CLEAR, 0.3, 0.7);
    else if (step >= 5) {
      t[1] = {
        fill: 0.85,
        color: SOLVENT_CLEAR,
        opacity: 0.6,
        powder: false,
        precip: BAND_CHL_B,
        precipAmt: 0.3,
        ring: BAND_CAROTENE,
        layer: BAND_CHL_A,
      };
    }

    return t;
  },
  summary: [
    {
      test: "Band 1 (Topmost / Fastest migration)",
      obs: "Bright Yellow-Orange band (Distance = 9.5 cm)",
      inf: "Carotene (Highest solubility in non-polar solvent)",
      eq: "R_f = 9.5 / 10.0 = 0.95",
      liquid: BAND_CAROTENE,
      ppt: BAND_CAROTENE,
    },
    {
      test: "Band 2 (Upper zone)",
      obs: "Distinct Yellow band (Distance = 7.1 cm)",
      inf: "Xanthophyll",
      eq: "R_f = 7.1 / 10.0 = 0.71",
      liquid: BAND_XANTHOPHYLL,
      ppt: BAND_XANTHOPHYLL,
    },
    {
      test: "Band 3 (Middle zone)",
      obs: "Vibrant Blue-Green band (Distance = 4.5 cm)",
      inf: "Chlorophyll a (Primary photosynthetic pigment)",
      eq: "R_f = 4.5 / 10.0 = 0.45",
      liquid: BAND_CHL_A,
      ppt: BAND_CHL_A,
    },
    {
      test: "Band 4 (Lowest / Slowest migration)",
      obs: "Yellow-Green / Olive band (Distance = 2.8 cm)",
      inf: "Chlorophyll b (Strongest hydrogen bonding to cellulose)",
      eq: "R_f = 2.8 / 10.0 = 0.28",
      liquid: BAND_CHL_B,
      ppt: BAND_CHL_B,
    },
  ],
  procedure: [
    "Cut a Whatman No. 1 filter paper strip (15 cm × 2 cm) with a pointed tip at one end.",
    "Draw a pencil baseline 2.0 cm above the pointed tip.",
    "Crush fresh spinach leaves in a mortar with 5 cm³ of acetone and a pinch of sand to obtain concentrated chloroplast extract.",
    "Using a fine glass capillary tube, place a tiny drop of the extract at the center of the baseline and let it dry.",
    "Repeat spotting 3–4 times on the exact same point to build a concentrated dark green spot.",
    "Pour petroleum ether : acetone (9:1) developing solvent into the chromatography chamber to a depth of 1.0 cm.",
    "Suspend the paper strip vertically in the chamber ensuring the spot remains 1 cm above the solvent surface.",
    "Cover the chamber and allow the solvent front to ascend until it reaches ~10 cm from the baseline.",
    "Remove strip, immediately mark the solvent front with a pencil, and circle the 4 colored pigment bands.",
    "Measure band distances from the baseline and compute Rf values for Carotene (0.95), Xanthophyll (0.71), Chlorophyll a (0.45), and Chlorophyll b (0.28).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
