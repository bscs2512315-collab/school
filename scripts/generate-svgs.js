const fs = require("fs");
const path = require("path");

const ranks = [
  "Apprentice",
  "Scholar",
  "Warrior",
  "Knight",
  "Hero",
  "Champion",
  "Master",
  "Grandmaster",
  "Elite",
  "Legend",
  "Mythic",
];

const svgDir = path.join(__dirname, "public", "svgs");
const novicePath = path.join(svgDir, "Novice.tsx");

try {
  const noviceContent = fs.readFileSync(novicePath, "utf8");

  ranks.forEach((rank) => {
    const rankPath = path.join(svgDir, `${rank}.tsx`);
    // Replace the component name and export name
    const newContent = noviceContent.replace(/Novice/g, rank);
    fs.writeFileSync(rankPath, newContent, "utf8");
    console.log(`Created ${rank}.tsx`);
  });

  console.log("Successfully created all rank SVGs.");
} catch (error) {
  console.error("Error generating SVGs:", error);
}
