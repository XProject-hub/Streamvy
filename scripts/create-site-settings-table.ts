import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createSiteSettingsTable() {
  console.log("Creating site_settings table...");
  
  try {
    // Check if table exists
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'site_settings'
      );
    `);
    
    const tableExists = result.rows[0].exists;
    
    if (tableExists) {
      console.log("site_settings table already exists");
      return;
    }
    
    // Create the table
    await db.execute(sql`
      CREATE TABLE "site_settings" (
        "id" SERIAL PRIMARY KEY,
        "siteName" TEXT NOT NULL DEFAULT 'StreamHive',
        "logoUrl" TEXT,
        "primaryColor" TEXT NOT NULL DEFAULT '#3b82f6',
        "enableSubscriptions" BOOLEAN NOT NULL DEFAULT true,
        "enablePPV" BOOLEAN NOT NULL DEFAULT false,
        "enableRegistration" BOOLEAN NOT NULL DEFAULT true,
        "defaultUserQuota" INTEGER NOT NULL DEFAULT 5,
        "defaultUserConcurrentStreams" INTEGER NOT NULL DEFAULT 2,
        "lastUpdated" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    
    console.log("site_settings table created successfully");
    
    // Insert default settings
    await db.execute(sql`
      INSERT INTO "site_settings" (
        "siteName", "logoUrl", "primaryColor", "enableSubscriptions", 
        "enablePPV", "enableRegistration", "defaultUserQuota", 
        "defaultUserConcurrentStreams", "lastUpdated"
      ) VALUES (
        'StreamHive', NULL, '#3b82f6', true,
        false, true, 5,
        2, NOW()
      );
    `);
    
    console.log("Default site settings inserted");
    
  } catch (error) {
    console.error("Error creating site_settings table:", error);
  } finally {
    process.exit(0);
  }
}

createSiteSettingsTable();