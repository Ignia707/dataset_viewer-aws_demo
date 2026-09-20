// server.js
const express = require("express");
const cors = require("cors");

const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const pool = require("./config/db");
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health & Connection Test Endpoint
app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    res.json({
      status: "OK",
      message: "Database connection active and responding!",
      queryResult: rows[0].result,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Database query failed",
      error: error.message,
    });
  }
});

// Test connection on server boot
async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Successfully connected to local MySQL Database!");
    connection.release(); // release connection back to pool

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
}

startServer();
