import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

/**
 * Build database configuration from environment variables.
 * Falls back to sensible defaults for local development.
 */
export function buildDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'edu_planner',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
    ...(process.env.DB_SSL === 'true' && { ssl: { rejectUnauthorized: false } }),
  };
}

/**
 * PostgreSQL connection pool singleton.
 * Provides efficient connection reuse for concurrent requests.
 */
const pool = new Pool(buildDatabaseConfig());

// Log pool errors to prevent unhandled rejections
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err);
});

/**
 * Execute a parameterized SQL query against the pool.
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

/**
 * Get a dedicated client from the pool for transaction support.
 * Caller MUST call client.release() when done.
 */
export async function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}

/**
 * Gracefully shut down the pool (for clean server shutdown).
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

export { pool };
export default pool;
