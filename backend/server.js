import express from "express";
import cors from "cors";
import env from "dotenv";
import pg from "pg";
import { WebSocketServer } from "ws";
import http from "http";

env.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Broadcast function
const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
};

// Helper to get stats
const getStats = async () => {
  const recipesRes = await pool.query("SELECT COUNT(*) as count, SUM(total_quantity) as volume FROM detailed_recipes");
  const ordersRes = await pool.query("SELECT COUNT(*) as count FROM command");
  
  return {
    recipes_count: parseInt(recipesRes.rows[0].count) || 0,
    liters_brewed: parseInt(recipesRes.rows[0].volume) || 0,
    orders_count: parseInt(ordersRes.rows[0].count) || 0,
  };
};

app.get("/", (_, response) =>
  response.json({ info: "Express app with Supabase" })
);

app.get("/dashboard-stats", async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

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

app.get("/beer-colors", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT DISTINCT color FROM detailed_recipes WHERE color IS NOT NULL");
    const colors = rows.map((row) => row.color);
    res.json(colors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/max-price", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT MAX(price) as max_price FROM detailed_recipes");
    res.json({ maxPrice: rows[0].max_price || 20 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to simulate adding a recipe or updating data
app.post("/beers", async (req, res) => {
  // For now, we just simulate an update and broadcast the new stats
  // In a real app, you would insert into the DB here
  try {
    // Simulate DB change (optional, or just broadcast)
    // const { name, ... } = req.body;
    // await pool.query("INSERT INTO ...")
    
    // Broadcast new stats
    const stats = await getStats();
    broadcast({ type: "STATS_UPDATE", data: stats });
    
    res.json({ message: "Beer added (simulated)", stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

server.listen(process.env.PORT, () =>
  console.log(
    new Date().toLocaleTimeString() +
      `: Server is running on port ${process.env.PORT}...`
  )
);
