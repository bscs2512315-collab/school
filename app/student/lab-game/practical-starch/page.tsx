"use client";

import PracticalRunner, { type PracticalConfig } from "../_practical/PracticalRunner";
import { five, sol } from "../_practical/helpers";

const STARCH = "#eef0e6"; // freshly prepared starch solution

const config: PracticalConfig = {
  title: "Starch digestion",
  ionLabel: "Amylase",
  radical: "salivary amylase",
  group: "Enzyme digestion",
  reagents: [
    { id: "starch", color: "#f1f5f9", label: "Starch sol." },
    { id: "iodine", color: "#78350f", label: "Iodine sol." },
    { id: "amylase", color: "#eef2f4", label: "Amylase" },
  ],
  steps: [
    { tutor: "Pick up a test tube from the stand.", x: "pick up the test tube", item: "tube", tube: 0 },
    { tutor: "Pour freshly prepared starch solution into the tube.", x: "pour the starch solution", item: "starch", tube: 0, pour: "starch" },
    { tutor: "Add iodine solution to this tube.", x: "add iodine solution", item: "iodine", tube: 0, pour: "iodine", zoom: true, pre: { title: "Iodine test (no enzyme)", body: "Add iodine to plain starch. A blue-black colour means starch is present (not digested)." }, post: { title: "Blue-black colour", body: "Iodine turns the starch deep blue-black → starch is present (not digested)." } },
    { tutor: "Take a fresh tube and pour starch solution into it.", x: "pour the starch solution", item: "starch", tube: 1, pour: "starch" },
    { tutor: "Add salivary amylase and let it digest the starch.", x: "add salivary amylase", item: "amylase", tube: 1, pour: "amylase", zoom: true, pre: { title: "Enzyme digestion", body: "Add salivary amylase and wait ~10 minutes — the enzyme digests the starch." }, post: { title: "Starch being digested…", body: "The salivary amylase digests the starch over a few minutes." } },
    { tutor: "Now add iodine solution to this tube.", x: "add iodine solution", item: "iodine", tube: 1, pour: "iodine", zoom: true, post: { title: "No blue colour → digestion confirmed", body: "No blue/black colour is obtained → the starch has been digested by amylase; digestion is confirmed." } },
  ],
  tubeVis: (step) => {
    const t = five();
    if (step === 1) t[0] = sol(STARCH, 0.58);
    else if (step >= 2) t[0] = sol("#1e3a8a", 0.85, 0.95); // starch + iodine → deep navy blue-black
    if (step >= 3) t[1] = step >= 5 ? sol("#fef08a", 0.65, 0.75) : sol(STARCH, 0.58); // digested → iodine gives no blue (stays straw yellow)
    return t;
  },
  summary: [
    { test: "Starch solution + iodine (no enzyme)", obs: "Deep navy blue-black colour", inf: "Starch present (not digested)", eq: "", liquid: "#1e3a8a", ppt: "#1e3a8a" },
    { test: "Starch + amylase, then iodine", obs: "No blue/black colour (straw-yellow)", inf: "Digestion of starch confirmed", eq: "", liquid: "#fef08a", ppt: "#fef08a" },
  ],
  procedure: [
    "Put starch solution in two tubes; add amylase to one and wait ~10 minutes.",
    "Plain starch + iodine → blue-black → starch present (not digested).",
    "Digested starch + iodine → no blue → digestion confirmed.",
  ],
};

export default function Page() {
  return <PracticalRunner config={config} />;
}
