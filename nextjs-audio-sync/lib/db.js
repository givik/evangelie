import { Pool } from 'pg';

// Create a single pool instance to be reused across the app
let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Optional: configure pool settings
      max: 20, // maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

// Query helper function
export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Get text and timings
export async function getTextWithTimings(textId) {
  const pool = getPool();
  
  try {
    const client = await pool.connect();
    
    try {
      // Use a transaction for consistency
      await client.query('BEGIN');
      
      const textResult = await client.query(
        'SELECT * FROM texts WHERE id = $1',
        [textId]
      );

      if (textResult.rows.length === 0) {
        await client.query('COMMIT');
        return null;
      }

      const timingsResult = await client.query(
        'SELECT word, start_time, end_time, word_index FROM word_timings WHERE text_id = $1 ORDER BY word_index ASC',
        [textId]
      );

      await client.query('COMMIT');

      return {
        text: textResult.rows[0],
        timings: timingsResult.rows,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

// Insert or update text with timings
export async function saveTextWithTimings(textData, timings) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert or update text
    const textResult = await client.query(
      `INSERT INTO texts (title, content, audio_url, updated_at) 
       VALUES ($1, $2, $3, NOW()) 
       ON CONFLICT (id) DO UPDATE 
       SET title = $1, content = $2, audio_url = $3, updated_at = NOW()
       RETURNING id`,
      [textData.title, textData.content, textData.audio_url]
    );

    const textId = textResult.rows[0].id;

    // Delete existing timings
    await client.query('DELETE FROM word_timings WHERE text_id = $1', [textId]);

    // Insert new timings
    if (timings && timings.length > 0) {
      const timingValues = timings.map((t, index) => 
        `(${textId}, '${t.word.replace(/'/g, "''")}', ${t.start_time}, ${t.end_time || 'NULL'}, ${index})`
      ).join(',');

      await client.query(
        `INSERT INTO word_timings (text_id, word, start_time, end_time, word_index) 
         VALUES ${timingValues}`
      );
    }

    await client.query('COMMIT');
    return textId;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving text with timings:', error);
    throw error;
  } finally {
    client.release();
  }
}
