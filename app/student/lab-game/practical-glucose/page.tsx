"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol, ppt } from "../_practical/helpers";

const GLUCOSE = "#f2f4ef"; // nearly colourless glucose solution
const BENEDICT = "#2563eb"; // copper-blue (Cu²⁺)
const FEHLING = "#1d4ed8"; // deep royal blue mixture (Fehling A + B)
const CU2O = "#b91c1c"; // brick-red cuprous oxide precipitate
const SUPER = "#ea580c"; // orange supernatant after heating

const config: PracticalConfig = {
  title: "Glucose — reducing sugar",
  kicker: "Biochemistry",
  ionLabel: "Glucose",
  radical: "reducing sugar (glucose)",
  group: "Biochemistry",
  reagents: [
    { id: "glucose", color: "#f2f4ef", label: "Glucose" },
    { id: "benedict", color: BENEDICT, label: "Benedict's" },
    { id: "fehlingA", color: "#2563eb", label: "Fehling A" },
    { id: "fehlingB", color: "#eef1f2", label: "Fehling B" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Pour 1 mL of the glucose sample solution into the tube.", x: "pour the glucose solution", item: "glucose", tube: 0, pour: "glucose" },
    { tutor: "Add 2 mL Benedict's reagent to this tube.", x: "add Benedict's reagent", item: "benedict", tube: 0, pour: "benedict", pre: { title: "Benedict's test", body: "Glucose has a free aldehyde group that reduces Cu²⁺ in alkaline solution. Add Benedict's reagent and we will then heat the mixture in a water bath." } },
    { tutor: "Heat the mixture over the burner for 3 minutes.", x: "heat the tube", item: "tube", tube: 0, zoom: true, heat: true, post: { title: "Brick-red precipitate", body: "Blue → green → yellow → orange → heavy brick-red precipitate of Cu₂O. This confirms glucose as a reducing sugar.", eq: "R-CHO + 2Cu²⁺ + 5OH⁻ → Cu₂O↓ (brick-red) + R-COO⁻ + 3H₂O" } },
    { tutor: "Take a fresh test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 1 },
    { tutor: "Add equal volumes of Fehling's A into the fresh tube.", x: "add Fehling's A", item: "fehlingA", tube: 1, pour: "fehlingA" },
    { tutor: "Add equal volumes of Fehling's B into the same tube.", x: "add Fehling's B", item: "fehlingB", tube: 1, pour: "fehlingB" },
    { tutor: "Add the glucose sample solution to the Fehling's mixture.", x: "add the glucose solution", item: "glucose", tube: 1, pour: "glucose", pre: { title: "Fehling's test", body: "Fehling's solution is fresh Cu²⁺ in an alkaline tartrate medium. Adding glucose and boiling will reduce it to cuprous oxide." } },
    { tutor: "Boil the mixture until the colour changes.", x: "boil the tube", item: "tube", tube: 1, zoom: true, heat: true, post: { title: "Brick-red Cu₂O", body: "A brick-red precipitate of cuprous oxide (Cu₂O) forms on boiling — glucose is confirmed as a reducing sugar.", eq: "R-CHO + 2Cu²⁺ + 5OH⁻ → Cu₂O↓ (brick-red) + R-COO⁻ + 3H₂O" } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = sol(GLUCOSE, 0.55, 0.7);
    else if (step >= 2) t[0] = step >= 4 ? ppt(CU2O, SUPER, 0.75, 0.85) : sol(BENEDICT, 0.75, 0.85);
    if (step === 5) t[1] = sol("#2563eb", 0.65, 0.75);
    else if (step >= 6) t[1] = step >= 9 ? ppt(CU2O, SUPER, 0.75, 0.85) : (step === 6 ? sol("#2563eb", 0.75, 0.85) : sol(FEHLING, 0.75, 0.85));
    return t;
  },
  summary: [
    { test: "Benedict's test", obs: "Blue → green → yellow → orange → brick-red ppt of Cu₂O", inf: "Reducing sugar present", eq: "R-CHO + 2Cu²⁺ + 5OH⁻ → Cu₂O↓ + R-COO⁻ + 3H₂O", liquid: "#ea580c", ppt: "#b91c1c" },
    { test: "Fehling's test", obs: "Brick-red ppt of Cu₂O on boiling", inf: "Glucose confirmed (reducing sugar)", eq: "R-CHO + Cu²⁺ → Cu₂O↓ (brick-red)", liquid: "#ea580c", ppt: "#b91c1c" },
  ],
  procedure: [
    "Benedict's test: add 2 mL Benedict's reagent to 1 mL glucose, heat 3 min in a boiling water bath → brick-red ppt of Cu₂O confirms reducing sugar.",
    "Fehling's test: mix equal volumes of Fehling's A & B, add the glucose sample, boil → heavy brick-red ppt of Cu₂O confirms glucose.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}