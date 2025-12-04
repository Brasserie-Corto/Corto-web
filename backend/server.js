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

// Configuration
const RESERVATION_DURATION_MINUTES = 15;

// Broadcast function
const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
};

// Broadcast stock update to all clients
const broadcastStockUpdate = async () => {
  try {
    const { rows } = await pool.query("SELECT * FROM available_stock");
    broadcast({ type: "STOCK_UPDATE", data: rows });
  } catch (err) {
    console.error("Error broadcasting stock update:", err);
  }
};

// Cleanup expired reservations periodically
const cleanupExpiredReservations = async () => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM reservation WHERE expires_at < NOW()"
    );
    if (rowCount > 0) {
      console.log(`Cleaned up ${rowCount} expired reservations`);
      await broadcastStockUpdate();
    }
  } catch (err) {
    console.error("Error cleaning up reservations:", err);
  }
};

// Run cleanup every minute
setInterval(cleanupExpiredReservations, 60 * 1000);

// Helper to get stats
const getStats = async () => {
  const recipesRes = await pool.query("SELECT COUNT(DISTINCT r.id) as count FROM recipe r INNER JOIN beer b ON b.id_recipe = r.id");
  // Litres brassés = somme des quantités initiales × volume en litres
  const volumeRes = await pool.query(`
    SELECT SUM(s.initial_quantity * c.volume / 1000.0) as total_liters
    FROM stocked s
    INNER JOIN contening c ON c.id = s.id_contening
  `);
  const ordersRes = await pool.query("SELECT COUNT(*) as count FROM command");
  
  return {
    recipes_count: parseInt(recipesRes.rows[0].count) || 0,
    liters_brewed: Math.round(parseFloat(volumeRes.rows[0].total_liters) || 0),
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
    const { rows } = await pool.query("SELECT * FROM available_stock");
    
    // Grouper par recette avec tous les contenants disponibles
    const beersMap = new Map();
    
    for (const row of rows) {
      const beerId = row.id;
      
      if (!beersMap.has(beerId)) {
        beersMap.set(beerId, {
          id: parseInt(beerId),
          name: row.name,
          color: row.color,
          basePrice: parseFloat(row.base_price),
          pricePerLiter: parseFloat(row.base_price), // Le prix en base est pour 1L
          imageUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/${row.image?.replace('beer/', 'beers/') || row.image}`,
          contenants: [],
          inStock: false,
        });
      }
      
      const beer = beersMap.get(beerId);
      const volume = parseInt(row.volume); // volume en ml
      const stock = parseInt(row.available_quantity) || 0;
      
      // Calculer le prix pour ce contenant (prix au litre * volume en litres)
      // volume est en ml, donc on divise par 1000 pour avoir des litres
      const priceForContenant = parseFloat((beer.basePrice * (volume / 1000)).toFixed(2));
      
      beer.contenants.push({
        id: parseInt(row.id_contening),
        volume: volume,
        stock: stock,
        price: priceForContenant,
      });
      
      if (stock > 0) {
        beer.inStock = true;
      }
    }
    
    // Trier les contenants par volume
    const beers = Array.from(beersMap.values()).map(beer => ({
      ...beer,
      contenants: beer.contenants.sort((a, b) => a.volume - b.volume),
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
    const { rows } = await pool.query("SELECT MAX(base_price) as max_price FROM detailed_recipes");
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

// =====================
// RESERVATION ROUTES
// =====================

// Get client's active reservations (cart)
app.get("/cart/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const { rows } = await pool.query(
      `SELECT r.id, r.id_recipe, r.id_contening, r.quantity, r.expires_at, r.created_at,
              rec.name, rec.price as base_price, rec.image, rec.color,
              c.volume
       FROM reservation r
       JOIN recipe rec ON r.id_recipe = rec.id
       JOIN contening c ON c.id = r.id_contening
       WHERE r.id_client = $1 AND r.expires_at > NOW()
       ORDER BY r.created_at DESC`,
      [clientId]
    );
    
    const cart = rows.map(item => {
      const volume = parseInt(item.volume); // volume en ml
      const basePrice = parseFloat(item.base_price);
      // volume en ml, donc diviser par 1000 pour avoir des litres
      const price = parseFloat((basePrice * (volume / 1000)).toFixed(2));
      
      return {
        ...item,
        id_contening: parseInt(item.id_contening),
        volume: volume,
        quantity: parseInt(item.quantity),
        price: price,
        imageUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/${item.image?.replace('beer/', 'beers/') || item.image}`,
      };
    });
    
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add item to cart (create reservation)
app.post("/cart/reserve", async (req, res) => {
  const client = await pool.connect();
  try {
    const { clientId, recipeId, quantity = 1, conteningId = 1 } = req.body;
    
    if (!clientId || !recipeId) {
      return res.status(400).json({ error: "clientId and recipeId are required" });
    }
    
    await client.query("BEGIN");
    
    // Check available stock
    const stockResult = await client.query(
      "SELECT available_quantity FROM available_stock WHERE id = $1 AND id_contening = $2",
      [recipeId, conteningId]
    );
    
    if (stockResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Beer not found" });
    }
    
    const availableQty = stockResult.rows[0].available_quantity;
    
    if (availableQty < quantity) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Not enough stock available", available: availableQty });
    }
    
    // Check if client already has a reservation for this recipe
    const existingRes = await client.query(
      `SELECT id, quantity FROM reservation 
       WHERE id_client = $1 AND id_recipe = $2 AND id_contening = $3 AND expires_at > NOW()`,
      [clientId, recipeId, conteningId]
    );
    
    let reservation;
    const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000);
    
    if (existingRes.rows.length > 0) {
      // Update existing reservation
      const newQuantity = parseInt(existingRes.rows[0].quantity) + parseInt(quantity);
      
      if (availableQty < quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Not enough stock available", available: availableQty });
      }
      
      const updateResult = await client.query(
        `UPDATE reservation SET quantity = $1, expires_at = $2 
         WHERE id = $3 RETURNING *`,
        [newQuantity, expiresAt, existingRes.rows[0].id]
      );
      reservation = updateResult.rows[0];
    } else {
      // Create new reservation
      const insertResult = await client.query(
        `INSERT INTO reservation (id_client, id_recipe, id_contening, quantity, expires_at)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [clientId, recipeId, conteningId, quantity, expiresAt]
      );
      reservation = insertResult.rows[0];
    }
    
    await client.query("COMMIT");
    
    // Broadcast stock update to all clients
    await broadcastStockUpdate();
    
    res.json({ 
      message: "Reservation created", 
      reservation,
      expiresAt 
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
});

// Update reservation quantity
app.patch("/cart/reservation/:reservationId", async (req, res) => {
  const client = await pool.connect();
  try {
    const { reservationId } = req.params;
    const quantity = parseInt(req.body.quantity);
    
    if (isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }
    
    await client.query("BEGIN");
    
    // Get current reservation
    const resResult = await client.query(
      "SELECT * FROM reservation WHERE id = $1 AND expires_at > NOW()",
      [reservationId]
    );
    
    if (resResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Reservation not found or expired" });
    }
    
    const currentRes = resResult.rows[0];
    const quantityDiff = quantity - parseInt(currentRes.quantity);
    
    // If increasing, check available stock
    if (quantityDiff > 0) {
      const stockResult = await client.query(
        "SELECT available_quantity FROM available_stock WHERE id = $1",
        [currentRes.id_recipe]
      );
      
      if (stockResult.rows[0].available_quantity < quantityDiff) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Not enough stock available" });
      }
    }
    
    // Extend expiration time
    const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000);
    
    const updateResult = await client.query(
      "UPDATE reservation SET quantity = $1, expires_at = $2 WHERE id = $3 RETURNING *",
      [quantity, expiresAt, reservationId]
    );
    
    await client.query("COMMIT");
    await broadcastStockUpdate();
    
    res.json({ reservation: updateResult.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
});

// Remove item from cart (delete reservation)
app.delete("/cart/reservation/:reservationId", async (req, res) => {
  try {
    const { reservationId } = req.params;
    
    const { rowCount } = await pool.query(
      "DELETE FROM reservation WHERE id = $1",
      [reservationId]
    );
    
    if (rowCount === 0) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    
    await broadcastStockUpdate();
    
    res.json({ message: "Reservation deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Clear all reservations for a client
app.delete("/cart/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    
    await pool.query(
      "DELETE FROM reservation WHERE id_client = $1",
      [clientId]
    );
    
    await broadcastStockUpdate();
    
    res.json({ message: "Cart cleared" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Extend reservation time (refresh cart)
app.post("/cart/extend/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000);
    
    const { rowCount } = await pool.query(
      "UPDATE reservation SET expires_at = $1 WHERE id_client = $2 AND expires_at > NOW()",
      [expiresAt, clientId]
    );
    
    res.json({ message: "Reservations extended", count: rowCount, expiresAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// =====================
// ORDER ROUTES
// =====================

// Create order from cart (checkout)
app.post("/orders", async (req, res) => {
  const client = await pool.connect();
  try {
    const { clientId } = req.body;
    
    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }
    
    await client.query("BEGIN");
    
    // Get active reservations
    const reservationsResult = await client.query(
      `SELECT r.*, rec.price, rec.name
       FROM reservation r
       JOIN recipe rec ON r.id_recipe = rec.id
       WHERE r.id_client = $1 AND r.expires_at > NOW()`,
      [clientId]
    );
    
    if (reservationsResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cart is empty or reservations expired" });
    }
    
    const reservations = reservationsResult.rows;
    
    // Calculate total amount
    const totalAmount = reservations.reduce(
      (sum, r) => sum + (r.price * r.quantity), 
      0
    );
    
    // Create order
    const orderResult = await client.query(
      `INSERT INTO command (id_client, amount, status)
       VALUES ($1, $2, 'en attente de paiement')
       RETURNING *`,
      [clientId, totalAmount]
    );
    
    const order = orderResult.rows[0];
    
    // For each reservation, find a beer and add to content
    for (const reservation of reservations) {
      // Find beers of this recipe with stock
      const beersResult = await client.query(
        `SELECT b.id, s.quantity as stock_qty
         FROM beer b
         JOIN stocked s ON s.id_beer = b.id
         WHERE b.id_recipe = $1 AND s.id_contening = $2 AND s.quantity > 0
         ORDER BY b.brew_date ASC`,
        [reservation.id_recipe, reservation.id_contening]
      );
      
      let remainingQty = reservation.quantity;
      
      for (const beer of beersResult.rows) {
        if (remainingQty <= 0) break;
        
        const qtyToTake = Math.min(remainingQty, beer.stock_qty);
        
        // Add to order content
        await client.query(
          `INSERT INTO content (id_beer, id_contening, id_comand, quantity)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id_beer, id_contening, id_comand) 
           DO UPDATE SET quantity = content.quantity + $4`,
          [beer.id, reservation.id_contening, order.id, qtyToTake]
        );
        
        // Decrease stock
        await client.query(
          `UPDATE stocked SET quantity = quantity - $1 
           WHERE id_beer = $2 AND id_contening = $3`,
          [qtyToTake, beer.id, reservation.id_contening]
        );
        
        remainingQty -= qtyToTake;
      }
      
      if (remainingQty > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ 
          error: `Not enough stock for ${reservation.name}`,
          missing: remainingQty 
        });
      }
    }
    
    // Delete reservations
    await client.query(
      "DELETE FROM reservation WHERE id_client = $1",
      [clientId]
    );
    
    await client.query("COMMIT");
    
    // Broadcast updates
    await broadcastStockUpdate();
    const stats = await getStats();
    broadcast({ type: "STATS_UPDATE", data: stats });
    
    res.json({ 
      message: "Order created successfully",
      order: {
        ...order,
        items: reservations.map(r => ({
          name: r.name,
          quantity: r.quantity,
          price: r.price,
          subtotal: r.price * r.quantity
        })),
        total: totalAmount
      }
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
});

// Get orders for a client
app.get("/orders/client/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const { rows } = await pool.query(
      `SELECT c.*, 
              json_agg(json_build_object(
                'beer_id', ct.id_beer,
                'quantity', ct.quantity,
                'recipe_name', r.name,
                'price', r.price
              )) as items
       FROM command c
       LEFT JOIN content ct ON ct.id_comand = c.id
       LEFT JOIN beer b ON b.id = ct.id_beer
       LEFT JOIN recipe r ON r.id = b.id_recipe
       WHERE c.id_client = $1
       GROUP BY c.id
       ORDER BY c.order_date DESC`,
      [clientId]
    );
    
    // Parse numeric values
    const orders = rows.map(order => ({
      ...order,
      amount: parseFloat(order.amount),
      items: order.items?.map((item) => ({
        ...item,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price)
      })) || []
    }));
    
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get single order details
app.get("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const orderResult = await pool.query(
      "SELECT * FROM command WHERE id = $1",
      [orderId]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    const itemsResult = await pool.query(
      `SELECT ct.quantity, r.name, r.price, r.image
       FROM content ct
       JOIN beer b ON b.id = ct.id_beer
       JOIN recipe r ON r.id = b.id_recipe
       WHERE ct.id_comand = $1`,
      [orderId]
    );
    
    const order = orderResult.rows[0];
    const items = itemsResult.rows.map(item => ({
      ...item,
      quantity: parseInt(item.quantity),
      price: parseFloat(item.price),
      imageUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/${item.image?.replace('beer/', 'beers/') || item.image}`,
      subtotal: parseFloat(item.price) * parseInt(item.quantity)
    }));
    
    res.json({ 
      ...order, 
      amount: parseFloat(order.amount),
      items 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update order status (admin)
app.patch("/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['en attente de paiement', 'payée', 'en préparation', 'expédiée', 'livrée', 'annulée'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status", validStatuses });
    }
    
    const { rows } = await pool.query(
      "UPDATE command SET status = $1 WHERE id = $2 RETURNING *",
      [status, orderId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Broadcast order update
    broadcast({ type: "ORDER_UPDATE", data: rows[0] });
    
    res.json(rows[0]);
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
