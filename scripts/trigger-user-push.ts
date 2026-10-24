import "dotenv/config";

import { db } from "../lib/db";
import { getUserPushSubscriptions } from "../lib/push/push-subscriptions";
import { createNotification } from "../lib/notifications";
import { getDailyInactivityNotification } from "../lib/push/inactivity-reminders";

async function main() {
  const targetEmail = "mtahatalib110+aliya@gmail.com";

  console.log(`Looking up user by email: ${targetEmail}...`);
  const { rows: userRows } = await db.query<{
    id: string;
    name: string | null;
    email: string;
    role: string;
    points: number | null;
  }>(
    `SELECT id, name, email, role, points FROM users WHERE LOWER(email) = LOWER($1)`,
    [targetEmail]
  );

  if (userRows.length === 0) {
    console.error(`❌ User not found with email: ${targetEmail}`);
    process.exit(1);
  }

  const user = userRows[0];
  console.log(`✅ Found user: ${user.name} (ID: ${user.id}, Role: ${user.role})`);

  const subscriptions = await getUserPushSubscriptions(user.id);
  console.log(`Found ${subscriptions.length} registered push device subscription(s).`);

  const reminder = getDailyInactivityNotification(user.name, "streak_warning");

  console.log("\nTriggering single in-app + web push notification:");
  console.log(`- Title: ${reminder.title}`);
  console.log(`- Body: ${reminder.body}`);
  console.log(`- Link: ${reminder.url}`);

  // createNotification internally handles both DB persistence and single push dispatch
  await createNotification({
    userId: user.id,
    type: "DAILY_REMINDER",
    title: reminder.title,
    message: reminder.body,
    link: reminder.url,
    metadata: {
      tag: reminder.tag,
      sentAt: new Date().toISOString(),
    },
  });

  console.log("\n✅ Dispatched successfully! (Single trigger)");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error executing script:", err);
  process.exit(1);
});
