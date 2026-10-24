import "dotenv/config";
import { cleanExpiredStudentAnswers } from "../lib/services/answer-cleanup-service";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const daysArg = args.find((a) => a.startsWith("--days="));
  const retentionDays = daysArg ? Number(daysArg.split("=")[1]) : 2;

  console.log(`\n🧹 Starting Student Answer Images Cleanup`);
  console.log(`   Retention period: ${retentionDays} days`);
  console.log(`   Mode: ${dryRun ? "DRY RUN (simulation only)" : "LIVE PURGE (deleting from Cloudinary)"}\n`);

  const result = await cleanExpiredStudentAnswers({
    retentionDays,
    limit: 200,
    dryRun,
  });

  console.log("-----------------------------------------");
  console.log(`Scanned attempts: ${result.attemptsScanned}`);
  console.log(`Eligible attempts cleaned: ${result.attemptsCleaned}`);
  console.log(`Images found: ${result.imagesFound}`);
  console.log(`Images deleted from Cloudinary: ${result.imagesDeleted}`);
  console.log(`Abandoned drafts cleaned: ${result.draftsCleaned}`);
  console.log(`Execution time: ${result.durationMs}ms`);

  if (result.errors && result.errors.length > 0) {
    console.error("\nErrors encountered:");
    result.errors.forEach((e) => console.error(" -", e));
  }

  if (result.samplePublicIds && result.samplePublicIds.length > 0) {
    console.log("\nSample public IDs processed:");
    result.samplePublicIds.forEach((id) => console.log(" -", id));
  }

  console.log("\n✅ Done!\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
