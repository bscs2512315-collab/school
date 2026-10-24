import "dotenv/config";
import { cleanExpiredNovaChats } from "../lib/services/nova-chat-cleanup-service";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const daysArg = args.find((a) => a.startsWith("--days="));
  const retentionDays = daysArg ? Number(daysArg.split("=")[1]) : 7;

  console.log(`\n💬 Starting Nova Chat & Files Cleanup`);
  console.log(`   Retention period: ${retentionDays} days`);
  console.log(`   Mode: ${dryRun ? "DRY RUN (simulation only)" : "LIVE PURGE (deleting from Cloudinary & DB)"}\n`);

  const result = await cleanExpiredNovaChats({
    retentionDays,
    limit: 200,
    dryRun,
  });

  console.log("-----------------------------------------");
  console.log(`Expired chat sessions scanned: ${result.sessionsScanned}`);
  console.log(`Chat sessions deleted: ${result.sessionsDeleted}`);
  console.log(`Uploaded attachments found: ${result.attachmentsFound}`);
  console.log(`Attachments deleted from Cloudinary: ${result.attachmentsDeleted}`);
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
