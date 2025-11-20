import { pool } from "./db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

export async function createUser(email, password) {
  const password_hash = await bcrypt.hash(password, 10);
  const api_key = crypto.randomBytes(24).toString("hex");

  const res = await pool.query(
    `INSERT INTO users (email, password_hash, api_key)
     VALUES ($1, $2, $3)
     RETURNING id, email, api_key`,
    [email, password_hash, api_key]
  );

  return res.rows[0];
}

export async function findUserByEmail(email) {
  const res = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return res.rows[0];
}

export async function findUserByApiKey(key) {
  const res = await pool.query(
    `SELECT * FROM users WHERE api_key = $1`,
    [key]
  );
  return res.rows[0];
}
