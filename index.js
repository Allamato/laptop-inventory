const express = require("express");
const { Client } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
const cors = require("cors");
app.use(cors());

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ✅ Connect to Database & Create Table if Not Exists
client
  .connect()
  .then(async () => {
    console.log("✅ Connected to database");

    await client.query(`
      CREATE TABLE IF NOT EXISTS laptops (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255) NOT NULL,
        available BOOLEAN DEFAULT true
      );
    `);
    console.log("✅ Table 'laptops' is ready");
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
    process.exit(1); // Exit if connection fails
  });

// ✅ Root Route
app.get("/", (req, res) => {
  res.send("API is running! Use GET /laptops, POST /laptops, PUT /laptops/:id");
});

// ✅ Get all laptops
app.get("/laptops", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM laptops ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching laptops:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Add a new laptop
app.post("/laptops", async (req, res) => {
  const { name, brand } = req.body;
  if (!name || !brand) {
    return res.status(400).json({ error: "Name and brand are required" });
  }

  try {
    const result = await client.query(
      "INSERT INTO laptops (name, brand) VALUES ($1, $2) RETURNING *",
      [name, brand]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error adding laptop:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Edit laptop name and brand
app.patch("/laptops/:id", async (req, res) => {
  const { id } = req.params;
  const { name, brand } = req.body;

  try {
    const result = await client.query(
      "UPDATE laptops SET name = $1, brand = $2 WHERE id = $3 RETURNING *",
      [name, brand, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Laptop not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error updating laptop details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Update laptop availability
app.put("/laptops/:id", async (req, res) => {
  const { id } = req.params;
  const { available } = req.body;

  try {
    const result = await client.query(
      "UPDATE laptops SET available = $1 WHERE id = $2 RETURNING *",
      [available, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Laptop not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error updating laptop availability:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
