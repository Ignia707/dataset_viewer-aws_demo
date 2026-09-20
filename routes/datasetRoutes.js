// routes/datasetRoutes.js
const express = require("express");
const multer = require("multer");
const pool = require("../config/db");
const { uploadFile } = require("../services/storageService");
const { parseAndAnalyzeCSV } = require("../services/analyticsService");

const router = express.Router();

// Configure Multer to keep files in memory as Buffers (10MB file limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only CSV files are allowed."));
    }
  },
});

/**
 * POST /api/datasets/upload
 * Receives CSV upload, processes analytics, saves file, and inserts record into MySQL.
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const { originalname, buffer, size, mimetype } = req.file;
    const uniqueFilename = `${Date.now()}-${originalname.replace(/\s+/g, "_")}`;

    // 1. Run analytics on the CSV buffer line-by-line
    const analytics = await parseAndAnalyzeCSV(buffer);

    // 2. Persist the file (Local /uploads folder or S3 bucket)
    const storagePath = await uploadFile(buffer, uniqueFilename, mimetype);

    // 3. Store record in MySQL DB
    const sql = `
      INSERT INTO datasets 
      (original_name, storage_path, file_size_bytes, row_count, column_count, headers, summary_stats)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      originalname,
      storagePath,
      size,
      analytics.rowCount,
      analytics.columnCount,
      JSON.stringify(analytics.headers),
      JSON.stringify(analytics.summaryStats),
    ];

    const [result] = await pool.query(sql, values);

    res.status(201).json({
      message: "Dataset uploaded and processed successfully!",
      datasetId: result.insertId,
      originalName: originalname,
      storagePath,
      rowCount: analytics.rowCount,
      columnCount: analytics.columnCount,
    });
  } catch (error) {
    console.error("Upload Processing Error:", error);
    res
      .status(500)
      .json({
        error: "Failed to process dataset upload",
        details: error.message,
      });
  }
});

/**
 * GET /api/datasets
 * Retrieves all uploaded dataset records sorted by most recent.
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, original_name, storage_path, file_size_bytes, row_count, column_count, created_at 
      FROM datasets 
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch datasets", details: error.message });
  }
});

/**
 * GET /api/datasets/:id
 * Retrieves full dataset details including headers and summary statistics JSON.
 */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM datasets WHERE id = ?", [
      req.params.id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Dataset not found." });
    }

    res.json(rows[0]);
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Failed to fetch dataset details",
        details: error.message,
      });
  }
});

module.exports = router;
