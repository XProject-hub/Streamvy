import { Router } from "express";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { pool } from "../db";

export const router = Router();

const execPromise = promisify(exec);

/**
 * Route to generate database backup
 * POST /api/admin/generate-backup
 */
router.post("/admin/generate-backup", async (req, res) => {
  try {
    // Ensure user is authenticated and an admin
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Create backups directory if it doesn't exist
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFilePath = path.join(backupDir, "streamvy_backup.sql");
    
    // Get database connection info from environment variables
    const { PGDATABASE, PGUSER, PGHOST, PGPORT, PGPASSWORD } = process.env;
    
    // Generate backup using pg_dump command
    const pgDumpCommand = `PGPASSWORD="${PGPASSWORD}" pg_dump -h ${PGHOST} -p ${PGPORT} -U ${PGUSER} -d ${PGDATABASE} -f "${backupFilePath}" --format=p --no-owner --no-acl`;
    
    await execPromise(pgDumpCommand);
    
    res.status(200).json({ message: "Backup generated successfully" });
  } catch (error) {
    console.error("Error generating backup:", error);
    res.status(500).json({ message: "Failed to generate backup file" });
  }
});

/**
 * Route to download database backup
 * GET /api/admin/download-backup
 */
router.get("/admin/download-backup", async (req, res) => {
  try {
    // Ensure user is authenticated and an admin
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const backupFilePath = path.join(process.cwd(), "backups", "streamvy_backup.sql");
    
    // Check if file exists
    if (!fs.existsSync(backupFilePath)) {
      return res.status(404).json({ message: "Backup file not found. Please generate a backup first." });
    }

    // Set headers for file download
    res.setHeader("Content-Type", "application/sql");
    res.setHeader("Content-Disposition", "attachment; filename=streamvy_backup.sql");
    
    // Create readable stream and pipe to response
    const fileStream = fs.createReadStream(backupFilePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error providing backup download:", error);
    res.status(500).json({ message: "Failed to provide backup file" });
  }
});