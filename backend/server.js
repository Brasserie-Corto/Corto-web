import express from "express";
import cors from "cors";
import env from "dotenv";
import pg from "pg";

env.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_, response) =>
  response.json({ info: "Express app with Supabase" })
);

app.get("/beers", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM detailed_recipes");
    const beers = rows.map((beer) => ({
      ...beer,
      imageUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/beers/images/main/${beer.id}.png`,
      total_quantity: beer.total_quantity || 0,
      inStock: (beer.total_quantity || 0) > 0,
    }));
    res.json(beers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(process.env.PORT, () =>
  console.log(
    new Date().toLocaleTimeString() +
      `: Server is running on port ${process.env.PORT}...`
  )
);
