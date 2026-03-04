import { z } from "zod";
import { query } from "../db.js";

export const getEventsSchema = z.object({
  status: z.string().optional().describe("Filter by status (discovered, interested, registered, passed)"),
  limit: z.number().optional().default(20).describe("Maximum results to return"),
});

export async function getEvents(params: z.infer<typeof getEventsSchema>) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (params.status) {
    conditions.push(`status = $${paramIdx}`);
    values.push(params.status);
    paramIdx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await query(
    `SELECT id, title, description, url, deadline, event_date, status, created_at
     FROM events ${where}
     ORDER BY created_at DESC
     LIMIT $${paramIdx}`,
    [...values, params.limit]
  );

  return rows;
}
