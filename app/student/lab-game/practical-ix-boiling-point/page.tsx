"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol } from "../_practical/helpers";

const CLEAR_LIQUID = "#e0f2fe";
const CLEAR_OIL = "#fef08a";
const BOILING_LIQUID = "#bae6fd";

const config: PracticalConfig = {
  title: "Determination of Boiling Point of a Liquid",
  kicker: "Physical Chemistry & Volatility Analysis",
  ionLabel: "B.P. = 78.2 °C",
  radical: "Ethanol (Ethyl Alcohol)",
  group: "Class IX Practical 2",
  grade: "IX",
  reagents: [
    { id: "ethanol", color: CLEAR_LIQUID, label: "Pure Ethanol (Liquid)" },
    { id: "oil", color: CLEAR_OIL, label: "Liquid Paraffin Oil Bath" },
    { id: "capillary", color: "#f8fafc", label: "Inverted Capillary Tube" },
    { id: "burner", color: "#f59e0b", label: "Bunsen Burner" },
  ],
  steps: [
    {
      tutor: "Pick up the micro-ignition tube (Tube 1).",
      x: "pick up ignition tube",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Add 0.5 mL (4–5 drops) of pure Ethanol into the ignition tube.",
      x: "add Ethanol liquid",
      item: "ethanol",
      tube: 0,
      pour: "ethanol",
      pre: {
        title: "Siwoloboff's Micro-Method",
        body: "The micro-method uses an ignition tube and an inverted capillary tube sealed at the upper end to measure boiling point accurately with less than 1 mL sample.",
      },
      post: {
        title: "Ethanol Sample Loaded",
        body: "0.5 mL of clear, volatile ethyl alcohol placed in the micro-ignition tube.",
        eq: "Sample = C₂H₅OH (Ethanol)",
      },
    },
    {
      tutor: "Insert an inverted capillary tube (open end downwards) into the liquid.",
      x: "insert inverted capillary",
      item: "capillary",
      tube: 0,
      pre: {
        title: "Inverted Capillary Function",
        body: "The trapped air column inside the inverted capillary expands on heating, acting as a nucleation source for steady bubble evolution.",
      },
      post: {
        title: "Inverted Capillary Positioned",
        body: "Capillary rests open-end down inside the ethanol column.",
      },
    },
    {
      tutor: "Pick up the liquid paraffin oil bath (Tube 2).",
      x: "pick up oil bath",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Attach ignition tube to thermometer and immerse into the oil bath.",
      x: "mount in oil bath",
      item: "oil",
      tube: 1,
      pour: "oil",
      zoom: true,
      pre: {
        title: "Thermal Immersion",
        body: "The ignition tube liquid level is aligned directly alongside the thermometer bulb in the paraffin bath.",
      },
      post: {
        title: "Apparatus Immersed in Oil Bath",
        body: "Thermometer and sample tube secured in the uniform heating bath.",
      },
    },
    {
      tutor: "Heat gently until a rapid continuous stream of bubbles escapes from the capillary tip.",
      x: "heat to rapid bubbling",
      item: "burner",
      tube: 1,
      heat: true,
      zoom: true,
      pre: {
        title: "Vapour Pressure Equilibrium",
        body: "When the vapour pressure inside the capillary exceeds atmospheric pressure, a continuous rapid stream of vapour bubbles issues from the capillary mouth.",
      },
      post: {
        title: "Rapid Stream of Bubbles Escaping",
        body: "Continuous rapid stream of ethanol vapour bubbles escapes at ~79.0 °C.",
      },
    },
    {
      tutor: "Remove flame and record the exact temperature when bubbling ceases and liquid rushes into the capillary.",
      x: "record boiling point",
      item: "tube",
      tube: 1,
      zoom: true,
      post: {
        title: "Boiling Point Recorded: 78.2 °C (Ethanol)",
        body: "At the exact instant the last bubble stops and liquid rushes up into the capillary tube, vapour pressure equals atmospheric pressure: B.P. = 78.2 °C.",
        eq: "Boiling Point of Ethanol = 78.2 °C (Vapour Pressure = 1.0 atm)",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    // Tube 0 (Ignition Tube):
    if (step === 1) t[0] = sol(CLEAR_LIQUID, 0.4, 0.7);
    else if (step >= 2 && step < 5) t[0] = sol(CLEAR_LIQUID, 0.45, 0.75);

    // Tube 1 (Oil Bath & Boiling Reaction):
    if (step === 4) t[1] = sol(CLEAR_OIL, 0.65, 0.75);
    else if (step === 5) t[1] = { ...sol(BOILING_LIQUID, 0.75, 0.8), fizz: true };
    else if (step >= 6) t[1] = sol(CLEAR_LIQUID, 0.75, 0.8);

    return t;
  },
  summary: [
    {
      test: "Sample loading in micro ignition tube",
      obs: "0.5 mL clear volatile liquid",
      inf: "Ethanol sample (C₂H₅OH)",
      eq: "Pure liquid sample",
      liquid: CLEAR_LIQUID,
      ppt: CLEAR_LIQUID,
    },
    {
      test: "Inverted capillary insertion",
      obs: "Air pocket trapped at top of capillary",
      inf: "Nucleation point for vapour bubbles",
      eq: "Siwoloboff assembly",
      liquid: CLEAR_LIQUID,
      ppt: CLEAR_LIQUID,
    },
    {
      test: "Heating in liquid paraffin bath",
      obs: "Continuous rapid train of bubbles",
      inf: "Vapour pressure ≈ Atmospheric pressure",
      eq: "P_vapour ≥ P_atm",
      liquid: BOILING_LIQUID,
      ppt: BOILING_LIQUID,
    },
    {
      test: "Cooling & Liquid Inrush Endpoint",
      obs: "Liquid rushes into capillary at 78.2 °C",
      inf: "Exact thermodynamic Boiling Point",
      eq: "B.P. = 78.2 °C (Ethanol)",
      liquid: CLEAR_LIQUID,
      ppt: CLEAR_LIQUID,
    },
  ],
  procedure: [
    "Take a small, clean ignition/fusion tube and add 0.5 mL (4–5 drops) of pure ethanol liquid.",
    "Take a thin capillary tube (5 cm long), seal one end in a flame, and invert it (open end down) into the liquid in the ignition tube.",
    "Fasten the ignition tube to a 0–100 °C thermometer using a rubber band so the sample is level with the mercury bulb.",
    "Immerse the assembly into a beaker or Thiele tube containing liquid paraffin oil.",
    "Heat the oil bath gently with a small Bunsen flame while stirring the bath slowly.",
    "As the liquid warms, bubbles of air escape slowly, followed by a rapid, continuous string of vapour bubbles.",
    "Extinguish the flame; watch the bubbling slow down.",
    "Note the exact temperature the instant the last bubble escapes and liquid rushes up into the capillary tube: Boiling Point = 78.2 °C.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
