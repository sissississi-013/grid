import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function query(sql: string, params?: unknown[]) {
  const result = await pool.query(sql, params);
  return result.rows;
}

export default pool;
