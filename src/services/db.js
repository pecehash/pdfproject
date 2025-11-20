import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: {
    // rejectUnauthorized: false
  // }
});

export async function getHistoryForUser(user_id) {
  const res = await pool.query(
    `SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [user_id]
  );
  return res.rows;
}

export async function saveJob({ user_id, filename, pages, size_bytes }) {
  const res = await pool.query(
    `INSERT INTO jobs (user_id, filename, pages, size_bytes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [user_id, filename, pages, size_bytes]
  );
  return res.rows[0];
}

export async function getHistory(limit = 10) {
  const res = await pool.query(
    `SELECT id, filename, pages, size_bytes, created_at
     FROM jobs
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows;
}
