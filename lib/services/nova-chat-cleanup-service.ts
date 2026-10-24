import { db } from "@/lib/db";
import { deleteManyFromCloudinary } from "@/lib/storage/cloudinary";
import { extractCloudinaryPublicId } from "@/lib/storage/file-upload";

export interface NovaChatCleanupResult {
  success: boolean;
  dryRun: boolean;
  retentionDays: number;
  sessionsScanned: number;
  sessionsDeleted: number;
  attachmentsFound: number;
  attachmentsDeleted: number;
  durationMs: number;
  samplePublicIds?: string[];
  errors?: string[];
}

function isRawFileUrl(url: string, type?: string): boolean {
  if (type === "file") return true;
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".pdf") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".csv")
  );
}

/**
 * Sweeps Nova chat sessions and uploaded files older than the retention period (default: 7 days).
 *
 * 1. Finds expired chat sessions (updated_at <= NOW() - 7 days).
 * 2. Extracts all uploaded attachments (images, PDFs, documents) from Cloudinary and deletes them.
 * 3. Deletes the chat_sessions rows (which automatically cascade deletes chat_messages).
 * 4. Also sweeps any individual attachments in active sessions that are older than 7 days.
 */
export async function cleanExpiredNovaChats(options?: {
  retentionDays?: number;
  limit?: number;
  dryRun?: boolean;
}): Promise<NovaChatCleanupResult> {
  const startTime = Date.now();
  const retentionDays = options?.retentionDays ?? 7;
  const limit = options?.limit ?? 100;
  const dryRun = Boolean(options?.dryRun);

  const errors: string[] = [];
  let sessionsDeleted = 0;
  let totalAttachmentsFound = 0;
  let totalAttachmentsDeleted = 0;
  const samplePublicIds: string[] = [];

  try {
    // 1. Fetch chat sessions that haven't been active in retentionDays
    const { rows: expiredSessions } = await db.query<{ id: string; title: string; updated_at: Date }>(
      `SELECT id, title, updated_at
       FROM chat_sessions
       WHERE updated_at <= NOW() - make_interval(days => $1)
       ORDER BY updated_at ASC
       LIMIT $2`,
      [retentionDays, limit],
    );

    for (const session of expiredSessions) {
      // Find all messages in this session with attachments
      const { rows: messageRows } = await db.query<{ attachments: unknown }>(
        `SELECT attachments
         FROM chat_messages
         WHERE session_id = $1 AND attachments IS NOT NULL AND attachments::text LIKE '%cloudinary%'`,
        [session.id],
      );

      const imagePids: string[] = [];
      const rawPids: string[] = [];

      for (const row of messageRows) {
        let attList: any[] = [];
        if (Array.isArray(row.attachments)) {
          attList = row.attachments;
        } else if (typeof row.attachments === "string") {
          try {
            attList = JSON.parse(row.attachments);
          } catch {}
        }

        for (const att of attList) {
          if (!att?.url || typeof att.url !== "string") continue;
          const pid = extractCloudinaryPublicId(att.url);
          if (!pid) continue;

          totalAttachmentsFound++;
          if (samplePublicIds.length < 10) samplePublicIds.push(pid);

          if (isRawFileUrl(att.url, att.type)) {
            rawPids.push(pid);
          } else {
            imagePids.push(pid);
          }
        }
      }

      if (!dryRun) {
        // Delete image attachments from Cloudinary
        if (imagePids.length > 0) {
          const { deletedCount, errors: imgErrors } = await deleteManyFromCloudinary(
            imagePids,
            "image",
          );
          totalAttachmentsDeleted += deletedCount;
          if (imgErrors.length) errors.push(...imgErrors);
        }

        // Delete raw document/PDF attachments from Cloudinary
        if (rawPids.length > 0) {
          const { deletedCount, errors: rawErrors } = await deleteManyFromCloudinary(
            rawPids,
            "raw",
          );
          totalAttachmentsDeleted += deletedCount;
          if (rawErrors.length) errors.push(...rawErrors);
        }

        // Delete the chat session from PostgreSQL (cascades to chat_messages)
        await db.query(`DELETE FROM chat_sessions WHERE id = $1`, [session.id]);
        sessionsDeleted++;
      } else {
        sessionsDeleted++;
      }
    }

    // 2. Also check for old attachments in active chat sessions where messages are older than 7 days
    if (!dryRun) {
      try {
        const { rows: oldMessages } = await db.query<{ id: string; attachments: unknown }>(
          `SELECT id, attachments
           FROM chat_messages
           WHERE created_at <= NOW() - make_interval(days => $1)
             AND attachments IS NOT NULL
             AND attachments::text LIKE '%cloudinary%'
           LIMIT 50`,
          [retentionDays],
        );

        for (const msg of oldMessages) {
          let list: any[] = [];
          if (Array.isArray(msg.attachments)) list = msg.attachments;
          else if (typeof msg.attachments === "string") {
            try { list = JSON.parse(msg.attachments); } catch {}
          }

          const msgImagePids: string[] = [];
          const msgRawPids: string[] = [];
          let modified = false;

          const updatedList = list.map((att: any) => {
            if (att?.url && typeof att.url === "string") {
              const pid = extractCloudinaryPublicId(att.url);
              if (pid) {
                if (isRawFileUrl(att.url, att.type)) msgRawPids.push(pid);
                else msgImagePids.push(pid);
                modified = true;
                return {
                  ...att,
                  url: null,
                  expired: true,
                  fileName: att.fileName ? `${att.fileName} (expired)` : "Attachment expired",
                };
              }
            }
            return att;
          });

          if (modified) {
            if (msgImagePids.length > 0) {
              await deleteManyFromCloudinary(msgImagePids, "image");
              totalAttachmentsDeleted += msgImagePids.length;
            }
            if (msgRawPids.length > 0) {
              await deleteManyFromCloudinary(msgRawPids, "raw");
              totalAttachmentsDeleted += msgRawPids.length;
            }
            await db.query(
              `UPDATE chat_messages SET attachments = $1 WHERE id = $2`,
              [JSON.stringify(updatedList), msg.id],
            );
          }
        }
      } catch (indivErr: any) {
        console.warn("Notice: individual old message attachments cleanup:", indivErr?.message || indivErr);
      }
    }

    return {
      success: true,
      dryRun,
      retentionDays,
      sessionsScanned: expiredSessions.length,
      sessionsDeleted,
      attachmentsFound: totalAttachmentsFound,
      attachmentsDeleted: dryRun ? 0 : totalAttachmentsDeleted,
      durationMs: Date.now() - startTime,
      samplePublicIds,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    console.error("cleanExpiredNovaChats error:", error);
    return {
      success: false,
      dryRun,
      retentionDays,
      sessionsScanned: 0,
      sessionsDeleted: 0,
      attachmentsFound: 0,
      attachmentsDeleted: 0,
      durationMs: Date.now() - startTime,
      errors: [error?.message || String(error)],
    };
  }
}
