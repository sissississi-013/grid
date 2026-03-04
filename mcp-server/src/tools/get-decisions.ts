import { z } from "zod";
import { query } from "../db.js";

export const getDecisionsSchema = z.object({
  chat_id: z.string().optional().describe("Filter by chat ID"),
  limit: z.number().optional().default(50).describe("Maximum messages to search through"),
});

export async function getDecisions(params: z.infer<typeof getDecisionsSchema>) {
  const conditions: string[] = [
    `(content ILIKE '%decided%' OR content ILIKE '%agreed%' OR content ILIKE '%let''s go with%'
      OR content ILIKE '%we should%' OR content ILIKE '%plan is%' OR content ILIKE '%confirmed%')`
  ];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (params.chat_id) {
    conditions.push(`chat_id = $${paramIdx}`);
    values.push(params.chat_id);
    paramIdx++;
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const rows = await query(
    `SELECT id, platform, chat_id, sender_name, content, timestamp
     FROM messages ${where}
     ORDER BY timestamp DESC
     LIMIT $${paramIdx}`,
    [...values, params.limit]
  );

  return rows;
}
