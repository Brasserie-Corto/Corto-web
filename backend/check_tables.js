import pg from "pg";
import dotenv from "dotenv";
dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log(res.rows);
} catch (e) {
  console.error(e);
}
await pool.end();
