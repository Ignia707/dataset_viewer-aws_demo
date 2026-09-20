// server.js
const dotenv = require("dotenv");
// Load environment variables (.env.local takes priority over .env)
dotenv.config({ path: [".env.local", ".env"] });

const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./config/db");
const datasetRoutes = require("./routes/datasetRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Serve local upload files statically (Accessible at http://localhost:5000/uploads/<filename>)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Register API Routes
app.use("/api/datasets", datasetRoutes);

// Health & Database Check Endpoint
app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    res.json({
      status: "OK",
      message: "Database connection active!",
      queryResult: rows[0].result,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// Start Server and Verify DB Connection
async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connected to MySQL Database!");
    connection.release();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(
        `📁 Local file uploads accessible at http://localhost:${PORT}/uploads`,
      );
    });
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
}

startServer();
