"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol, ppt } from "../_practical/helpers";

const WHITE_CRYSTAL = "#f8fafc";
const CLEAR_OIL = "#fef08a";
const MELTED_CLEAR = "#e0f2fe";

const config: PracticalConfig = {
  title: "Determination of Melting Point of an Organic Solid",
  kicker: "Physical Chemistry & Purity Analysis",
  ionLabel: "M.P. = 80.5 °C",
  radical: "Naphthalene / Organic Solid",
  group: "Class IX Practical 1",
  grade: "IX",
  reagents: [
    { id: "solid", color: WHITE_CRYSTAL, label: "Dry Naphthalene Powder" },
    { id: "oil", color: CLEAR_OIL, label: "Liquid Paraffin Oil Bath" },
    { id: "burner", color: "#f59e0b", label: "Bunsen Burner" },
    { id: "thermometer", color: "#ef4444", label: "0–200°C Thermometer" },
  ],
  steps: [
    {
      tutor: "Pick up the capillary tube (Tube 1) sealed at one end.",
      x: "pick up capillary tube",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Pack finely powdered dry Naphthalene crystals into the capillary tube up to 2–3 mm height.",
      x: "pack Naphthalene powder",
      item: "solid",
      tube: 0,
      pour: "solid",
      pre: {
        title: "Capillary Packing Technique",
        body: "Dry, finely ground organic solid is gently tapped into a sealed capillary tube. Uniform packing ensures rapid and uniform heat conduction.",
      },
      post: {
        title: "Capillary Tube Loaded with Organic Solid",
        body: "Solid Naphthalene column of 2.5 mm height is packed at the closed bottom tip.",
      },
    },
    {
      tutor: "Attach the capillary tube to the thermometer bulb with a rubber ring.",
      x: "mount to thermometer",
      item: "thermometer",
      tube: 0,
      pre: {
        title: "Thermometer Attachment",
        body: "The solid column must be positioned precisely alongside the middle of the thermometer bulb for accurate temperature measurement.",
      },
      post: {
        title: "Capillary Mounted to Thermometer Bulb",
        body: "Capillary securely fastened with the sample level with the mercury reservoir.",
      },
    },
    {
      tutor: "Pick up the Thiele tube oil bath (Tube 2) filled with liquid paraffin.",
      x: "pick up Thiele tube",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Immerse thermometer and capillary into the liquid paraffin oil bath.",
      x: "immerse in oil bath",
      item: "oil",
      tube: 1,
      pour: "oil",
      zoom: true,
      pre: {
        title: "Liquid Paraffin Oil Bath",
        body: "Liquid paraffin (heavy mineral oil) has a high boiling point (>300 °C) and non-volatile properties, making it an ideal heating medium.",
      },
      post: {
        title: "Apparatus Positioned in Oil Bath",
        body: "Thermometer and capillary immersed with open end well above the oil level.",
      },
    },
    {
      tutor: "Heat the side-arm of the Thiele tube gently with the Bunsen burner.",
      x: "heat side arm gently",
      item: "burner",
      tube: 1,
      heat: true,
      zoom: true,
      pre: {
        title: "Convection Heating in Thiele Tube",
        body: "Heating the bent side-arm sets up smooth convective circulation currents in the oil, ensuring uniform temperature without direct flame contact.",
      },
      post: {
        title: "Naphthalene Melts Sharply: M.P. = 80.5 °C",
        body: "Solid starts melting at T₁ = 80.0 °C and completely turns into clear transparent liquid at T₂ = 81.0 °C (Mean Melting Point = 80.5 °C).",
        eq: "Melting Point = (80.0 + 81.0) / 2 = 80.5 °C (Naphthalene)",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    // Tube 0 (Capillary Tube):
    if (step === 1) t[0] = { ...sol(WHITE_CRYSTAL, 0.25, 0.9), powder: true };
    else if (step >= 2 && step < 5) t[0] = { ...sol(WHITE_CRYSTAL, 0.3, 0.9), powder: true };

    // Tube 1 (Thiele Tube Oil Bath):
    if (step === 4) t[1] = sol(CLEAR_OIL, 0.65, 0.75);
    else if (step >= 5) t[1] = sol(MELTED_CLEAR, 0.75, 0.8);

    return t;
  },
  summary: [
    {
      test: "Sample preparation in capillary tube",
      obs: "2–3 mm compacted dry white solid",
      inf: "Naphthalene (pure sample)",
      eq: "C₁₀H₈(s)",
      liquid: WHITE_CRYSTAL,
      ppt: WHITE_CRYSTAL,
    },
    {
      test: "Attachment to precision thermometer",
      obs: "Capillary aligned with mercury bulb",
      inf: "Direct thermal equilibrium",
      eq: "Bulb alignment verified",
      liquid: WHITE_CRYSTAL,
      ppt: WHITE_CRYSTAL,
    },
    {
      test: "Convective heating in Thiele oil bath",
      obs: "Uniform oil temperature rise",
      inf: "Steady convection current established",
      eq: "Rate = 2 °C/min",
      liquid: CLEAR_OIL,
      ppt: CLEAR_OIL,
    },
    {
      test: "Phase Transition (Solid → Liquid)",
      obs: "Sharp liquefaction: T₁ = 80.0 °C, T₂ = 81.0 °C",
      inf: "Pure compound (sharp melting range <1 °C)",
      eq: "Melting Point = 80.5 °C",
      liquid: MELTED_CLEAR,
      ppt: MELTED_CLEAR,
    },
  ],
  procedure: [
    "Take a clean, dry glass capillary tube (5–6 cm long) and seal one end by rotating gently in a Bunsen flame.",
    "Crush pure dry Naphthalene crystals on a clean watch glass into a fine uniform powder.",
    "Fill the capillary tube by tapping the open end into the powder and gently dropping it through a glass tube to compact a 2–3 mm solid column.",
    "Moisten a rubber ring and attach the capillary to a 0–200 °C thermometer so the sample aligns with the middle of the mercury bulb.",
    "Immerse the thermometer and capillary assembly into a Thiele tube filled with liquid paraffin oil.",
    "Heat the side-arm of the Thiele tube gently with a small Bunsen flame to establish steady convective circulation.",
    "Observe the sample closely; record the temperature T₁ at the first appearance of liquid and T₂ when all crystals completely melt.",
    "Calculate the mean melting point: M.P. = (T₁ + T₂) / 2 = 80.5 °C.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
