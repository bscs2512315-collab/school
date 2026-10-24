"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol } from "../_practical/helpers";

const EGG = "#f0ead0"; // pale egg-white (albumin)

const config: PracticalConfig = {
  title: "Protein denaturation",
  ionLabel: "Albumin",
  radical: "protein (albumin)",
  group: "Denaturation",
  reagents: [
    { id: "egg", color: "#f0ead0", label: "Egg white" },
    { id: "urea", color: "#eef0f2", label: "Urea sol." },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Pour egg white (albumin) into the test tube.", x: "pour the egg white", item: "egg", tube: 0, pour: "egg" },
    { tutor: "Warm the egg white gently.", x: "warm the tube", item: "tube", tube: 0, zoom: true, heat: true, pre: { title: "Denaturation by heat", body: "Warm the egg white. Coagulation shows the protein is denatured by heat." }, post: { title: "Coagulation → protein denatured", body: "The egg white coagulates on heating → the protein (albumin) is denatured." } },
    { tutor: "Take a fresh tube and pour egg white into it.", x: "pour the egg white", item: "egg", tube: 1, pour: "egg" },
    { tutor: "Add concentrated urea solution and shake.", x: "add urea solution", item: "urea", tube: 1, pour: "urea", pre: { title: "Denaturation by urea", body: "Add concentrated urea and shake. Urea denatures the protein without heat — so no coagulation occurs on warming." } },
    { tutor: "Now warm this tube.", x: "warm the tube", item: "tube", tube: 1, zoom: true, heat: true, post: { title: "No coagulation → denatured by urea", body: "No coagulation occurs on warming — the protein was already denatured by the urea (it turns to a translucent solid, losing its solubility)." } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = sol(EGG, 0.55, 0.7);
    else if (step >= 2) t[0] = { fill: 0.6, color: "#f2f2ec", opacity: 0.92, powder: false, precip: "#f6f6f2", precipAmt: 0.92 }; // coagulated solid
    if (step >= 3) t[1] = step >= 4 ? sol("#e9edf0", 0.6, 0.7) : sol(EGG, 0.55, 0.7); // + urea, stays liquid (no coagulation)
    return t;
  },
  summary: [
    { test: "Egg white + heat", obs: "Coagulation of egg white occurs", inf: "Protein denatured by heat", eq: "", liquid: "#f2f2ec", ppt: "#f6f6f2" },
    { test: "Egg white + conc. urea + shake, then heat", obs: "No coagulation on heating", inf: "Protein already denatured by urea", eq: "", liquid: "#e9edf0", ppt: "#e9edf0" },
  ],
  procedure: [
    "Warm egg white → it coagulates → protein denatured by heat.",
    "Egg white + conc. urea, shake, then warm → no coagulation → denatured by urea (translucent solid, insoluble).",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
