'use server';

import { revalidatePath } from 'next/cache';
import { getPool } from '@/lib/db';

// Server Action to save text and timings
export async function saveTextAndTimings(formData) {
  try {
    const title = formData.get('title');
    const content = formData.get('content');
    const audioUrl = formData.get('audio_url');
    const timingsJson = formData.get('timings');

    if (!title || !content || !audioUrl) {
      return { 
        success: false, 
        error: 'Missing required fields' 
      };
    }

    const timings = timingsJson ? JSON.parse(timingsJson) : [];
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert text
      const textResult = await client.query(
        `INSERT INTO texts (title, content, audio_url, updated_at) 
         VALUES ($1, $2, $3, NOW()) 
         RETURNING id`,
        [title, content, audioUrl]
      );

      const textId = textResult.rows[0].id;

      // Insert timings if provided
      if (timings.length > 0) {
        const timingValues = timings.map((t, index) => 
          `(${textId}, '${t.word.replace(/'/g, "''")}', ${t.start_time}, ${t.end_time || 'NULL'}, ${index})`
        ).join(',');

        await client.query(
          `INSERT INTO word_timings (text_id, word, start_time, end_time, word_index) 
           VALUES ${timingValues}`
        );
      }

      await client.query('COMMIT');

      // Revalidate the page
      revalidatePath(`/texts/${textId}`);

      return { 
        success: true, 
        textId 
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in saveTextAndTimings:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Server Action to update timings only
export async function updateTimings(textId, timings) {
  try {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

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

      // Revalidate the page
      revalidatePath(`/texts/${textId}`);

      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in updateTimings:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Server Action to delete text
export async function deleteText(textId) {
  try {
    const pool = getPool();
    
    await pool.query('DELETE FROM texts WHERE id = $1', [textId]);
    
    revalidatePath('/texts');
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteText:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}
