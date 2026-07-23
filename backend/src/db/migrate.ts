import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query, closePool } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Run all SQL migration files in order.
 * Files are sorted alphabetically (prefix with 001_, 002_, etc.)
 */
async function runMigrations(): Promise<void> {
  console.log('Running database migrations...');

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`  Executing: ${file}`);
    await query(sql);
    console.log(`  ✓ ${file} completed`);
  }

  console.log('All migrations completed successfully.');
}

// Run migrations when invoked directly
runMigrations()
  .then(() => closePool())
  .catch((err) => {
    console.error('Migration failed:', err);
    closePool().finally(() => process.exit(1));
  });
