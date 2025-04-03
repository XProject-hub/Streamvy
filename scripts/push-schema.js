import { neon } from '@neondatabase/serverless';

async function main() {
  console.log('Connecting to database...');

  const sql = neon(process.env.DATABASE_URL);
  // No need for drizzle here
  
  console.log('Creating tables from schema...');
  
  // Create the enum types first
  await sql`CREATE TYPE IF NOT EXISTS crypto_payment_status AS ENUM ('pending', 'completed', 'expired', 'failed')`;
  await sql`CREATE TYPE IF NOT EXISTS crypto_currency AS ENUM ('BTC', 'USDT', 'LTC')`;

  // Create crypto_payments table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS crypto_payments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      plan_name TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      currency crypto_currency NOT NULL,
      wallet_address TEXT NOT NULL,
      reference_id TEXT NOT NULL UNIQUE,
      status crypto_payment_status NOT NULL DEFAULT 'pending',
      transaction_id TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP,
      expires_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  // Create crypto_wallet_addresses table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS crypto_wallet_addresses (
      id SERIAL PRIMARY KEY,
      address TEXT NOT NULL UNIQUE,
      currency crypto_currency NOT NULL,
      label TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  // Add premium columns to users table if they don't exist
  await sql`
    DO $$
    BEGIN
      BEGIN
        ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      
      BEGIN
        ALTER TABLE users ADD COLUMN premium_plan TEXT;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      
      BEGIN
        ALTER TABLE users ADD COLUMN premium_expiry TIMESTAMP;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
    END $$;
  `;

  console.log('Schema pushed successfully!');
}

main()
  .catch((err) => {
    console.error('Error pushing schema:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });