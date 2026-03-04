import { z } from "zod";
import { query } from "../db.js";

export const getContextSchema = z.object({
  topic: z.string().describe("The project or topic to get discussion context for"),
  limit: z.number().optional().default(50).describe("Maximum messages to return"),
});

export async function getContext(params: z.infer<typeof getContextSchema>) {
  const rows = await query(
    `SELECT id, platform, chat_id, sender_name, content, timestamp
     FROM messages
     WHERE content ILIKE $1
     ORDER BY timestamp DESC
     LIMIT $2`,
    [`%${params.topic}%`, params.limit]
  );

  return rows;
}
