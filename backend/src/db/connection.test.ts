import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildDatabaseConfig } from './connection.js';

describe('Database Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return default configuration when no env vars are set', () => {
    // Clear DB-related env vars
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_POOL_MAX;
    delete process.env.DB_IDLE_TIMEOUT;
    delete process.env.DB_CONNECTION_TIMEOUT;
    delete process.env.DB_SSL;

    const config = buildDatabaseConfig();

    expect(config.host).toBe('localhost');
    expect(config.port).toBe(5432);
    expect(config.database).toBe('edu_planner');
    expect(config.user).toBe('postgres');
    expect(config.password).toBe('');
    expect(config.max).toBe(10);
    expect(config.idleTimeoutMillis).toBe(30000);
    expect(config.connectionTimeoutMillis).toBe(5000);
    expect(config.ssl).toBeUndefined();
  });

  it('should use environment variables when set', () => {
    process.env.DB_HOST = 'db.example.com';
    process.env.DB_PORT = '5433';
    process.env.DB_NAME = 'test_db';
    process.env.DB_USER = 'test_user';
    process.env.DB_PASSWORD = 'secret123';
    process.env.DB_POOL_MAX = '20';
    process.env.DB_IDLE_TIMEOUT = '60000';
    process.env.DB_CONNECTION_TIMEOUT = '10000';

    const config = buildDatabaseConfig();

    expect(config.host).toBe('db.example.com');
    expect(config.port).toBe(5433);
    expect(config.database).toBe('test_db');
    expect(config.user).toBe('test_user');
    expect(config.password).toBe('secret123');
    expect(config.max).toBe(20);
    expect(config.idleTimeoutMillis).toBe(60000);
    expect(config.connectionTimeoutMillis).toBe(10000);
  });

  it('should enable SSL when DB_SSL is "true"', () => {
    process.env.DB_SSL = 'true';

    const config = buildDatabaseConfig();

    expect(config.ssl).toEqual({ rejectUnauthorized: false });
  });

  it('should not include SSL when DB_SSL is not "true"', () => {
    process.env.DB_SSL = 'false';

    const config = buildDatabaseConfig();

    expect(config.ssl).toBeUndefined();
  });

  it('should set pool max connections as a number', () => {
    process.env.DB_POOL_MAX = '5';

    const config = buildDatabaseConfig();

    expect(config.max).toBe(5);
    expect(typeof config.max).toBe('number');
  });
});
