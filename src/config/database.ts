import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // max connections in pool
  idleTimeoutMillis: 30000, // close idle clients after 30s
  connectionTimeoutMillis: 10000, // return error after 10s if no connection available
  statement_timeout: 30000, // cancel queries after 30s
});

// Log pool initialization
console.log('[DB] Database pool initialized:', {
  ssl: process.env.NODE_ENV === 'production',
  host: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : 'unknown',
  maxConnections: 20
});

let connectionCount = 0;

pool.on('connect', () => {
  connectionCount++;
  console.log(`[DB] Database connected successfully (connection #${connectionCount})`);
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected database pool error:', {
    message: err.message,
    code: (err as any).code,
    detail: (err as any).detail
  });
  // Don't exit - let Railway health checks handle restart if needed
  // Railway will detect unhealthy state via health endpoint
});

export default pool;
