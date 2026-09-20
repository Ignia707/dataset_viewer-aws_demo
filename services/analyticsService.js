// services/analyticsService.js
const { Readable } = require("stream");
const csvParser = require("csv-parser");

/**
 * Parses a CSV file buffer, extracts dynamic headers, and calculates column statistics.
 *
 * @param {Buffer} fileBuffer - Binary buffer of the CSV file from Multer
 * @returns {Promise<Object>} Object containing row count, headers array, and column statistics
 */
async function parseAndAnalyzeCSV(fileBuffer) {
  return new Promise((resolve, reject) => {
    const stream = Readable.from(fileBuffer);

    let rowCount = 0;
    let headers = [];
    const colAccumulators = {};

    stream
      .pipe(csvParser())
      .on("headers", (headerList) => {
        // Normalize headers by trimming whitespace
        headers = headerList.map((h) => h.trim());

        headers.forEach((header) => {
          colAccumulators[header] = {
            numericCount: 0,
            sum: 0,
            min: Infinity,
            max: -Infinity,
            isNumericColumn: true,
          };
        });
      })
      .on("data", (row) => {
        rowCount++;

        headers.forEach((header) => {
          const rawValue = row[header] !== undefined ? row[header].trim() : "";
          const stats = colAccumulators[header];

          if (rawValue === "" || rawValue === null) {
            return; // Skip empty cells
          }

          const num = Number(rawValue);

          if (!isNaN(num)) {
            stats.numericCount++;
            stats.sum += num;
            if (num < stats.min) stats.min = num;
            if (num > stats.max) stats.max = num;
          } else {
            // If non-numeric data is encountered, mark column as non-numeric
            stats.isNumericColumn = false;
          }
        });
      })
      .on("end", () => {
        const summaryStats = {};

        headers.forEach((header) => {
          const stats = colAccumulators[header];

          // Compute summary stats only if the column contains numeric data
          if (stats.numericCount > 0 && stats.isNumericColumn) {
            summaryStats[header] = {
              avg: parseFloat((stats.sum / stats.numericCount).toFixed(2)),
              min: stats.min,
              max: stats.max,
              totalEntries: stats.numericCount,
            };
          } else {
            summaryStats[header] = {
              type: "string/categorical",
              totalEntries: rowCount,
            };
          }
        });

        resolve({
          rowCount,
          columnCount: headers.length,
          headers,
          summaryStats,
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

module.exports = {
  parseAndAnalyzeCSV,
};
