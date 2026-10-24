"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol, ppt } from "../_practical/helpers";

const MIXTURE_GREY = "#94a3b8";
const WHITE_SUBLIMATE = "#f8fafc";
const SAND_BROWN = "#d97706";

const config: PracticalConfig = {
  title: "Separation of Ammonium Chloride from Sand by Sublimation",
  kicker: "Physical Separation & Phase Transition",
  ionLabel: "NH₄Cl Sublimation",
  radical: "Ammonium Chloride & Silica Sand",
  group: "Class IX Practical 3",
  grade: "IX",
  reagents: [
    { id: "mixture", color: MIXTURE_GREY, label: "NH₄Cl + Sand Mixture" },
    { id: "funnel", color: "#e2e8f0", label: "Inverted Funnel + Cotton" },
    { id: "burner", color: "#f59e0b", label: "Bunsen Burner" },
  ],
  steps: [
    {
      tutor: "Pick up the porcelain China Dish (Tube 1) on the tripod stand.",
      x: "pick up China Dish",
      item: "tube",
      tube: 0,
    },
    {
      tutor: "Add 5 g of dry NH₄Cl and silica sand mixture into the china dish.",
      x: "add NH₄Cl + sand mixture",
      item: "mixture",
      tube: 0,
      pour: "mixture",
      pre: {
        title: "Heterogeneous Mixture Properties",
        body: "Ammonium chloride (NH₄Cl) is a volatile sublimable solid, whereas silica sand (SiO₂) has an extremely high melting point (>1700 °C) and does not sublime.",
      },
      post: {
        title: "Dry Mixture Charged in China Dish",
        body: "5 g of greyish-white homogeneous mixture of sand and ammonium chloride placed in the dish.",
      },
    },
    {
      tutor: "Invert a clean glass funnel over the dish and plug the stem with moist cotton.",
      x: "place inverted funnel & plug",
      item: "funnel",
      tube: 0,
      pre: {
        title: "Sublimation Apparatus Setup",
        body: "The inverted funnel provides a cool condensing surface for rising NH₄Cl vapours. The moist cotton plug prevents the escape of sublimed vapours into the air.",
      },
      post: {
        title: "Apparatus Sealed with Inverted Funnel",
        body: "Glass funnel inverted over dish with stem plugged with moist cotton.",
      },
    },
    {
      tutor: "Heat the china dish gently on wire gauze using the Bunsen burner.",
      x: "heat gently with burner",
      item: "burner",
      tube: 0,
      heat: true,
      zoom: true,
      pre: {
        title: "Thermal Dissociation and Sublimation",
        body: "On heating at ~340 °C, solid NH₄Cl directly converts into dense white vapours of NH₃ and HCl: NH₄Cl(s) ⇌ NH₃(g) + HCl(g).",
      },
      post: {
        title: "Dense White Vapours Rising",
        body: "Thick white vapours of NH₄Cl fill the funnel and condense on the cooler upper walls.",
        eq: "NH₄Cl(s) ⇌ NH₃(g) + HCl(g) (Thermal Sublimation)",
      },
    },
    {
      tutor: "Allow the apparatus to cool and inspect the pure sublimate on the funnel walls.",
      x: "inspect separated components",
      item: "tube",
      tube: 0,
      zoom: true,
      post: {
        title: "Complete Separation Achieved!",
        body: "Pure, white crystalline NH₄Cl sublimate is collected from the inner funnel walls, leaving behind clean, non-volatile sand residue in the china dish.",
        eq: "NH₃(g) + HCl(g) → NH₄Cl(s) (Pure Sublimate Deposited)",
      },
    },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = { ...sol(MIXTURE_GREY, 0.35, 0.9), powder: true };
    else if (step === 2) t[0] = { ...sol(MIXTURE_GREY, 0.45, 0.9), powder: true };
    else if (step === 3) t[0] = { ...ppt(WHITE_SUBLIMATE, MIXTURE_GREY, 0.7, 0.95), fizz: true };
    else if (step >= 4) {
      t[0] = {
        fill: 0.8,
        color: SAND_BROWN,
        opacity: 0.85,
        powder: true,
        precip: WHITE_SUBLIMATE,
        precipAmt: 0.6,
        ring: WHITE_SUBLIMATE,
      };
    }
    return t;
  },
  summary: [
    {
      test: "Sample: 5 g NH₄Cl + Sand mixture in China dish",
      obs: "Greyish-white heterogeneous solid mixture",
      inf: "Sublimable + Non-sublimable pair",
      eq: "NH₄Cl(s) + SiO₂(s)",
      liquid: MIXTURE_GREY,
      ppt: MIXTURE_GREY,
    },
    {
      test: "Inverted funnel with moist cotton plug",
      obs: "Sealed chamber for vapour condensation",
      inf: "Prevents escape of volatile fumes",
      eq: "Condensation chamber setup",
      liquid: MIXTURE_GREY,
      ppt: MIXTURE_GREY,
    },
    {
      test: "Gentle heating on wire gauze (340 °C)",
      obs: "Dense white fumes rise into funnel",
      inf: "NH₄Cl sublimes directly to vapour phase",
      eq: "NH₄Cl(s) ⇌ NH₃(g) + HCl(g)",
      liquid: WHITE_SUBLIMATE,
      ppt: WHITE_SUBLIMATE,
    },
    {
      test: "Cooling and Sublimate Collection",
      obs: "Pure white crystalline crust on funnel; sand in dish",
      inf: "100% quantitative physical separation",
      eq: "Pure NH₄Cl collected on glass walls",
      liquid: SAND_BROWN,
      ppt: WHITE_SUBLIMATE,
    },
  ],
  procedure: [
    "Take about 5 g of a dry mixture containing ammonium chloride (NH₄Cl) and fine silica sand in a porcelain china dish.",
    "Place the china dish on a wire gauze supported on a tripod stand.",
    "Invert a clean, dry glass funnel over the china dish.",
    "Plug the top stem of the funnel loosely with a small piece of moist cotton wool to prevent escape of vapours.",
    "Heat the china dish slowly and uniformly using a low Bunsen flame.",
    "Observe dense white fumes rising from the mixture and condensing as a pure white crust on the cool inner walls of the funnel.",
    "When no more white fumes evolve, turn off the flame and let the entire apparatus cool to room temperature.",
    "Carefully lift the funnel and scrape off the pure white ammonium chloride sublimate onto a clean watch glass, leaving sand in the dish.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
