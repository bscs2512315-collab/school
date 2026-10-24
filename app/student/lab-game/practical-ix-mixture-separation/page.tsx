"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol } from "../_practical/helpers";

const MIXTURE_COLOR = "#78716c";
const IRON_BLACK = "#1c1917";
const SAND_GOLD = "#d97706";

const config: PracticalConfig = {
  title: "Separation of Iron Filings and Sand Mixture",
  kicker: "Physical Separation & Magnetic Properties",
  ionLabel: "Fe + SiO₂",
  radical: "Iron Filings and Silica Sand",
  group: "Class IX Practical 7",
  grade: "IX",
  reagents: [
    { id: "mixture", color: MIXTURE_COLOR, label: "Fe + Sand Mixture" },
    { id: "magnet", color: "#ef4444", label: "Strong Bar Magnet" },
  ],
  steps: [
    {
      tutor: "Pick up Sample Dish 1 (Tube 1) on the lab bench.",
      x: "pick up Sample Dish 1",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Spread 10 g of heterogeneous iron filings and silica sand mixture into Dish 1.",
      x: "spread dry mixture",
      item: "mixture",
      tube: 0,
      pour: "mixture",
      pre: {
        title: "Heterogeneous Mixture Properties",
        body: "Iron filings (Fe) are strongly ferromagnetic (attracted by magnetic fields), whereas silica sand grains (SiO₂) are non-magnetic and unaffected by magnets.",
      },
      post: {
        title: "Heterogeneous Mixture Spread in Dish 1",
        body: "10 g of grey-brown mixture of fine iron filings and golden silica sand spread in a uniform thin layer.",
      },
    },
    {
      tutor: "Pick up the strong Bar Magnet wrapped in thin protective film.",
      x: "pick up bar magnet",
      item: "magnet",
      tube: 0,
      pre: {
        title: "Magnetic Separation Principle",
        body: "Passing a protected bar magnet over the mixture allows magnetic flux lines to attract only the iron particles, leaving sand behind.",
      },
      post: {
        title: "Bar Magnet Ready for Extraction",
        body: "Bar magnet wrapped in thin plastic sheet to facilitate easy release of collected iron particles.",
      },
    },
    {
      tutor: "Sweep the bar magnet slowly across the mixture to attract all iron filings.",
      x: "sweep magnet over mixture",
      item: "magnet",
      tube: 0,
      anim: "shake",
      zoom: true,
      pre: {
        title: "Magnetic Flux Capture",
        body: "Ferromagnetic iron filings align along magnetic field lines and cling tightly in dense clusters at the magnet's poles.",
      },
      post: {
        title: "Iron Filings Adhering to Magnet Poles",
        body: "All dark iron filings are attracted and held securely against the magnet wrap, while clean golden sand remains in Dish 1.",
      },
    },
    {
      tutor: "Pick up Collection Dish 2 (Tube 2).",
      x: "pick up Collection Dish 2",
      item: "tube",
      tube: 1,
    },
    {
      tutor: "Hold magnet over Dish 2 and slide off the plastic wrap to deposit the pure iron filings.",
      x: "deposit iron filings",
      item: "tube",
      tube: 1,
      zoom: true,
      post: {
        title: "Complete Physical Separation Accomplished!",
        body: "100% of iron filings are collected in Dish 2, leaving 100% pure silica sand in Dish 1 without any chemical transformation.",
        eq: "Mixture [Fe + SiO₂] → Isolated Fe(s) (Dish 2) + Isolated SiO₂(s) (Dish 1)",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    // Dish 1 (Sand + Mixture):
    if (step === 1) t[0] = { ...sol(MIXTURE_COLOR, 0.4, 0.9), powder: true };
    else if (step >= 2 && step < 4) t[0] = { ...sol(MIXTURE_COLOR, 0.45, 0.9), powder: true };
    else if (step >= 4) t[0] = { ...sol(SAND_GOLD, 0.35, 0.9), powder: true };

    // Dish 2 (Deposited Iron Filings):
    if (step >= 5) t[1] = { ...sol(IRON_BLACK, 0.35, 0.95), powder: true };

    return t;
  },
  summary: [
    {
      test: "Sample: 10 g Fe filings + Sand mixture",
      obs: "Heterogeneous dark grey and golden granular solid",
      inf: "Ferromagnetic + Non-magnetic solid mixture",
      eq: "Fe(s) + SiO₂(s)",
      liquid: MIXTURE_COLOR,
      ppt: MIXTURE_COLOR,
    },
    {
      test: "Magnetic Sweep over thin mixture layer",
      obs: "Dark iron filings leap and cluster at magnet poles",
      inf: "Selective magnetic attraction of Iron (Fe)",
      eq: "Magnetic susceptibility: Fe >> SiO₂ ≈ 0",
      liquid: MIXTURE_COLOR,
      ppt: MIXTURE_COLOR,
    },
    {
      test: "Deposit iron filings into Dish 2",
      obs: "Pure black metallic iron filings collected",
      inf: "Isolated ferromagnetic constituent",
      eq: "Pure Iron Filings (Dish 2)",
      liquid: IRON_BLACK,
      ppt: IRON_BLACK,
    },
    {
      test: "Inspection of residual solid in Dish 1",
      obs: "Clean golden silica sand free from black specks",
      inf: "Isolated non-magnetic constituent",
      eq: "Pure Silica Sand SiO₂ (Dish 1)",
      liquid: SAND_GOLD,
      ppt: SAND_GOLD,
    },
  ],
  procedure: [
    "Take about 10 g of a heterogeneous mixture containing iron filings and silica sand.",
    "Spread the mixture evenly into a thin layer on a clean watch glass, petri dish, or sheet of white paper.",
    "Wrap a strong bar magnet with a piece of thin cellophane paper or plastic wrap to ensure easy release of the attracted iron particles.",
    "Move the wrapped magnet slowly across the surface of the mixture without touching the sand directly.",
    "Observe the ferromagnetic iron particles leaping to and clinging tightly to the poles of the magnet.",
    "Hold the magnet over a second clean watch glass (Dish 2) and carefully peel off the plastic wrap to allow all the iron filings to drop into Dish 2.",
    "Repeat the magnetic sweep 2–3 times until no more iron particles are attracted from the residue in Dish 1.",
    "Inspect both dishes to verify clean, complete physical separation of iron filings and sand.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
