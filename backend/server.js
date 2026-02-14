// backend/index.js
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();


const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend

app.use(express.json());
app.use(cors());

// PostgreSQL pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT
});

// Simple endpoint to check server
app.get("/", (req, res) => {
  res.send("Backend API is running ✅");
});

// Endpoint to get construction projects within a bounding box
app.get("/api/projects", async (req, res) => {
  try {
    const { xmin, ymin, xmax, ymax } = req.query;

    // Query construction_project with PostGIS envelope
    const query = `
      SELECT id, canonical_name, category, status, start_date,
             ST_Y(location) AS lat, ST_X(location) AS lng
      FROM construction_project
      WHERE location IS NOT NULL
        AND location && ST_MakeEnvelope($1, $2, $3, $4, 4326)
      LIMIT 1000;
    `;

    const result = await pool.query(query, [xmin, ymin, xmax, ymax]);
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
});
