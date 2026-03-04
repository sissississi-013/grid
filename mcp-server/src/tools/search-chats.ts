import { z } from "zod";
import { query } from "../db.js";

export const searchChatsSchema = z.object({
  query: z.string().describe("Search query to find in chat messages"),
  platform: z.string().optional().describe("Filter by platform (imessage, slack, discord)"),
  limit: z.number().optional().default(20).describe("Maximum results to return"),
});

export async function searchChats(params: z.infer<typeof searchChatsSchema>) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (params.query) {
    conditions.push(`content ILIKE $${paramIdx}`);
    values.push(`%${params.query}%`);
    paramIdx++;
  }

  if (params.platform) {
    conditions.push(`platform = $${paramIdx}`);
    values.push(params.platform);
    paramIdx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await query(
    `SELECT id, platform, chat_id, sender_id, sender_name, content, timestamp
     FROM messages ${where}
     ORDER BY timestamp DESC
     LIMIT $${paramIdx}`,
    [...values, params.limit]
  );

  return rows;
}
