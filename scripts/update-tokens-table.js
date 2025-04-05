// Script to update the active_stream_tokens table structure
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Updating active_stream_tokens table structure...');
  
  // Create SQL client
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  // Create database client
  const client = postgres(connectionString);
  
  try {
    // Check if the table exists
    const tableExists = await client.unsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'active_stream_tokens'
      );
    `);
    
    if (!tableExists[0].exists) {
      console.error('Table active_stream_tokens does not exist');
      process.exit(1);
    }

    // Check if column 'token' exists (from our push-schema.js script)
    const tokenColumnExists = await client.unsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'active_stream_tokens' AND column_name = 'token'
      );
    `);

    // Check if column 'token_id' exists (from our schema.ts)
    const tokenIdColumnExists = await client.unsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'active_stream_tokens' AND column_name = 'token_id'
      );
    `);
    
    // If 'token' exists but 'token_id' doesn't, rename the column
    if (tokenColumnExists[0].exists && !tokenIdColumnExists[0].exists) {
      await client.unsafe(`
        ALTER TABLE active_stream_tokens 
        RENAME COLUMN token TO token_id;
      `);
      console.log('Renamed column "token" to "token_id"');
    } 
    // If both don't exist, add token_id
    else if (!tokenColumnExists[0].exists && !tokenIdColumnExists[0].exists) {
      await client.unsafe(`
        ALTER TABLE active_stream_tokens 
        ADD COLUMN token_id TEXT UNIQUE NOT NULL DEFAULT 'placeholder';
      `);
      console.log('Added column "token_id"');
    } 
    // If both exist, we have a problem
    else if (tokenColumnExists[0].exists && tokenIdColumnExists[0].exists) {
      console.log('Both "token" and "token_id" columns exist - this is unexpected');
    } else {
      console.log('Column "token_id" already exists, no changes needed');
    }

    // Check for last_accessed vs last_rotated_at column
    const lastAccessedExists = await client.unsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'active_stream_tokens' AND column_name = 'last_accessed'
      );
    `);

    const lastRotatedAtExists = await client.unsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'active_stream_tokens' AND column_name = 'last_rotated_at'
      );
    `);

    // If last_accessed exists but last_rotated_at doesn't, rename the column
    if (lastAccessedExists[0].exists && !lastRotatedAtExists[0].exists) {
      await client.unsafe(`
        ALTER TABLE active_stream_tokens 
        RENAME COLUMN last_accessed TO last_rotated_at;
      `);
      console.log('Renamed column "last_accessed" to "last_rotated_at"');
    } 
    // If both don't exist, add last_rotated_at 
    else if (!lastAccessedExists[0].exists && !lastRotatedAtExists[0].exists) {
      await client.unsafe(`
        ALTER TABLE active_stream_tokens 
        ADD COLUMN last_rotated_at TIMESTAMP;
      `);
      console.log('Added column "last_rotated_at"');
    }

    // Check for ip_address and user_agent columns
    const ipAddressExists = await client.unsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'active_stream_tokens' AND column_name = 'ip_address'
      );
    `);

    const userAgentExists = await client.unsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'active_stream_tokens' AND column_name = 'user_agent'
      );
    `);

    // Add ip_address if it doesn't exist
    if (!ipAddressExists[0].exists) {
      await client.unsafe(`
        ALTER TABLE active_stream_tokens 
        ADD COLUMN ip_address TEXT;
      `);
      console.log('Added column "ip_address"');
    }

    // Add user_agent if it doesn't exist
    if (!userAgentExists[0].exists) {
      await client.unsafe(`
        ALTER TABLE active_stream_tokens 
        ADD COLUMN user_agent TEXT;
      `);
      console.log('Added column "user_agent"');
    }

    console.log('Table structure update completed successfully!');
  } catch (error) {
    console.error('Error updating table structure:', error);
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});