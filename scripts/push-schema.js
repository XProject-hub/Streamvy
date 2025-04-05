// Script to push the Drizzle schema to the database
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Pushing schema to database...');
  
  // Create SQL client
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  // Create database client
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  try {
    // Create enums (these may exist, so we'll handle errors)
    async function createEnum(enumName, values) {
      const valuesString = values.map(v => `'${v}'`).join(', ');
      try {
        await client.unsafe(`CREATE TYPE ${enumName} AS ENUM (${valuesString})`);
        console.log(`Created enum ${enumName}`);
      } catch (err) {
        if (err.code === '42710') { // duplicate_object
          console.log(`Enum ${enumName} already exists. Skipping.`);
        } else {
          throw err;
        }
      }
    }
    
    // Create enums first
    await createEnum('crypto_payment_status', ['pending', 'completed', 'failed', 'expired']);
    await createEnum('crypto_currency', ['BTC', 'USDT', 'LTC']);
    
    // Create stream_analytics table explicitly
    try {
      await client.unsafe(`
        CREATE TABLE IF NOT EXISTS stream_analytics (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          content_type TEXT NOT NULL,
          content_id INTEGER NOT NULL,
          event TEXT NOT NULL,
          timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
          duration INTEGER,
          quality TEXT,
          bandwidth INTEGER,
          location TEXT,
          ip_address TEXT,
          user_agent TEXT,
          error TEXT,
          buffering_duration INTEGER,
          custom_data JSONB DEFAULT '{}'
        )
      `);
      console.log('Created stream_analytics table');
    } catch (err) {
      console.error('Error creating stream_analytics table:', err);
      throw err;
    }
    
    // Create active_stream_tokens table explicitly
    try {
      await client.unsafe(`
        CREATE TABLE IF NOT EXISTS active_stream_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          content_type TEXT NOT NULL,
          content_id INTEGER NOT NULL,
          token TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMP NOT NULL,
          last_accessed TIMESTAMP,
          is_revoked BOOLEAN NOT NULL DEFAULT FALSE
        )
      `);
      console.log('Created active_stream_tokens table');
    } catch (err) {
      console.error('Error creating active_stream_tokens table:', err);
      throw err;
    }
    
    // Add premium fields to users table if they don't exist
    try {
      // Check if columns exist before adding them
      const result = await client.unsafe(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name IN ('is_premium', 'premium_plan', 'premium_expiry', 'stripe_customer_id', 'stripe_subscription_id')
      `);
      
      const existingColumns = result.map(r => r.column_name);
      
      if (!existingColumns.includes('is_premium')) {
        await client.unsafe(`ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE NOT NULL`);
        console.log('Added is_premium column to users table');
      }
      
      if (!existingColumns.includes('premium_plan')) {
        await client.unsafe(`ALTER TABLE users ADD COLUMN premium_plan TEXT`);
        console.log('Added premium_plan column to users table');
      }
      
      if (!existingColumns.includes('premium_expiry')) {
        await client.unsafe(`ALTER TABLE users ADD COLUMN premium_expiry TIMESTAMP`);
        console.log('Added premium_expiry column to users table');
      }
      
      if (!existingColumns.includes('stripe_customer_id')) {
        await client.unsafe(`ALTER TABLE users ADD COLUMN stripe_customer_id TEXT`);
        console.log('Added stripe_customer_id column to users table');
      }
      
      if (!existingColumns.includes('stripe_subscription_id')) {
        await client.unsafe(`ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT`);
        console.log('Added stripe_subscription_id column to users table');
      }
    } catch (err) {
      console.error('Error updating users table:', err);
      throw err;
    }
    
    console.log('Schema push completed successfully!');
  } catch (error) {
    console.error('Error pushing schema:', error);
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});