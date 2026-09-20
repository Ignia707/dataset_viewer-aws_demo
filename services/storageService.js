// services/storageService.js
const fs = require("fs");
const path = require("path");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const STORAGE_TYPE = process.env.STORAGE_TYPE || "local";
const UPLOADS_DIR = path.join(__dirname, "../uploads");

// Initialize S3 Client lazily when running in production/s3 mode
let s3Client = null;
if (STORAGE_TYPE === "s3") {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || "ap-south-1",
  });
}

/**
 * Uploads a file buffer to either local disk or AWS S3 based on STORAGE_TYPE.
 *
 * @param {Buffer} fileBuffer - The binary buffer from Multer (memoryStorage)
 * @param {string} filename - Generated unique filename (e.g. 1726830000000-dataset.csv)
 * @param {string} mimeType - File content type (e.g. 'text/csv')
 * @returns {Promise<string>} Universal storage path or S3 URL for database insertion
 */
async function uploadFile(fileBuffer, filename, mimeType = "text/csv") {
  if (STORAGE_TYPE === "s3") {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);
    return `https://${bucketName}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${filename}`;
  } else {
    // Ensure local /uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const filePath = path.join(UPLOADS_DIR, filename);
    await fs.promises.writeFile(filePath, fileBuffer);

    // Return relative path string to be saved in MySQL
    return `/uploads/${filename}`;
  }
}

/**
 * Removes a file from either local disk or AWS S3.
 *
 * @param {string} filename - The key or file name to delete
 */
async function deleteFile(filename) {
  if (STORAGE_TYPE === "s3") {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: filename,
    });
    await s3Client.send(command);
  } else {
    const localFilePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(localFilePath)) {
      await fs.promises.unlink(localFilePath);
    }
  }
}

module.exports = {
  uploadFile,
  deleteFile,
  STORAGE_TYPE,
};
