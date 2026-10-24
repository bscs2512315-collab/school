import "dotenv/config";
import { cleanFinishedElectionImages } from "../lib/services/election-cleanup-service";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  console.log(`\n🗳️  Starting Election Images Cleanup`);
  console.log(`   Mode: ${dryRun ? "DRY RUN (simulation only)" : "LIVE PURGE (deleting from Cloudinary)"}\n`);

  const result = await cleanFinishedElectionImages({ dryRun });

  console.log("-----------------------------------------");
  console.log(`Finished elections scanned: ${result.electionsScanned}`);
  console.log(`Elections cleaned: ${result.electionsCleaned}`);
  console.log(`Voter selfies found: ${result.voterSelfiesFound}`);
  console.log(`Voter selfies deleted from Cloudinary: ${result.voterSelfiesDeleted}`);
  console.log(`Candidate images found: ${result.candidateImagesFound}`);
  console.log(`Candidate images deleted from Cloudinary: ${result.candidateImagesDeleted}`);
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
