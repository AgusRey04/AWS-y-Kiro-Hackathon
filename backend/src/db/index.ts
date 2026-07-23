/**
 * Database module public API.
 * Provides pool, query helpers, and lifecycle management.
 */
export { pool, query, getClient, closePool, buildDatabaseConfig } from './connection.js';
export type { DatabaseConfig } from './connection.js';
