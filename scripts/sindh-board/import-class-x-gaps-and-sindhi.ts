import "dotenv/config";
import { importSubject } from "./import-all-class-x-subjects";

async function main() {
  console.log("🚀 Starting targeted backfill for incomplete Class X papers and Sindhi...");

  // 1. Ingest Sindhi
  console.log("\n==================================================");
  console.log("📖 Ingesting Sindhi Class X (2025, 2024)...");
  console.log("==================================================");
  await importSubject("Sindhi", { force: true });

  // 2. Backfill incomplete papers with force=true
  console.log("\n==================================================");
  console.log("🔧 Fixing Chemistry 2024...");
  console.log("==================================================");
  await importSubject("Chemistry", { force: true, yearFilter: 2024 });

  console.log("\n==================================================");
  console.log("🔧 Fixing Computer Science 2024...");
  console.log("==================================================");
  await importSubject("Computer Science", { force: true, yearFilter: 2024 });

  console.log("\n==================================================");
  console.log("🔧 Fixing Pakistan Studies 2024...");
  console.log("==================================================");
  await importSubject("Pakistan Studies", { force: true, yearFilter: 2024 });

  console.log("\n==================================================");
  console.log("🔧 Fixing Islamiat 2019 & 2015...");
  console.log("==================================================");
  await importSubject("Islamiat", { force: true, yearFilter: 2019 });
  await importSubject("Islamiat", { force: true, yearFilter: 2015 });

  console.log("\n==================================================");
  console.log("🔧 Fixing Physics 2016...");
  console.log("==================================================");
  await importSubject("Physics", { force: true, yearFilter: 2016 });

  console.log("\n✨ Backfill and Sindhi ingestion completed!");
}

main().catch((err) => {
  console.error("Fatal backfill error:", err);
  process.exit(1);
});
