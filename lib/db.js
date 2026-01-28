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
    ssl: {
      rejectUnauthorized: false, // For Neon, this is usually needed
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPg.pool = pool;

// Helper function to run queries
// export const query = (text, params) => pool.query(text, params);

pool.on('connect', (client) => {
  console.log('✅ Database connected successfully');
  client.query('SET search_path TO public');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

export const query = async (text, params) => {
  console.log('🔍 Executing query:', text);
  console.log('📝 With params:', params);
  try {
    const result = await pool.query(text, params);
    console.log('✅ Query successful, rows:', result.rows.length);
    return result;
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    throw error;
  }
};
