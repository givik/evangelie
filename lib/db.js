// lib/db.ts
import { Pool } from 'pg';

// Using a global variable to preserve the pool across hot-reloads in development
const globalForPg = global;

export const pool =
  globalForPg.pool ||
  new Pool({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    max: 20, // Maximum number of clients in the pool
  });

if (process.env.NODE_ENV !== 'production') globalForPg.pool = pool;

// Helper function to run queries
export const query = (text, params) => pool.query(text, params);
