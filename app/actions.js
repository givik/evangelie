'use server';
import { query } from '@/lib/db';
import { revalidatePath, cacheTag, cacheLife, updateTag } from 'next/cache';

export async function getBooks() {
  try {
    const res = await query('SELECT DISTINCT წიგნი FROM public.მუხლები ORDER BY წიგნი');
    return res.rows;
  } catch (e) {
    return e;
  }
}

export async function getChapters(book) {
  'use cache';
  cacheTag('bible-data', 'chapters');
  try {
    const res = await query(
      'SELECT DISTINCT თავი FROM public.მუხლები WHERE წიგნი = $1 ORDER BY თავი',
      [book],
    );
    return res.rows;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('getChapters error:', e);
    }
    return [];
  }
}

export async function getVerses(book, chapter) {
  'use cache';
  // Use a unique tag for this specific chapter
  cacheTag('bible-data', `verses-${book}-${chapter}`);
  try {
    const res = await query(
      'SELECT id, თემა, მუხლი, ტექსტი, ძველი_ტექსტი FROM public.მუხლები WHERE წიგნი = $1 AND თავი = $2 ORDER BY მუხლი',
      [book, chapter],
    );
    return res.rows;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('getVerses error:', e);
    }
    return [];
  }
}

export async function getVerseID(book, chapter, verse) {
  'use cache';
  cacheTag('bible-data', 'verse-id');
  try {
    const res = await query(
      'SELECT id FROM public.მუხლები WHERE წიგნი = $1 AND თავი = $2 AND მუხლი = $3',
      [book, chapter, verse],
    );
    return res.rows[0]?.id || null;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('getVerseID error:', e);
    }
    return null;
  }
}

export async function getOptions() {
  'use cache';
  cacheTag('bible-data', 'options');
  try {
    const res = await query('SELECT id, წიგნი, თავი, მუხლი FROM public.მუხლები ORDER BY id');
    return res.rows;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('getOptions error:', e);
    }
    return [];
  }
}

export async function getData() {
  'use cache';
  cacheTag('bible-data', 'data');
  try {
    const res1 = await query('SELECT * FROM public.განმარტებები ORDER BY id DESC LIMIT 1');
    const res2 = await query('SELECT id, წიგნი, თავი, მუხლი FROM public.მუხლები WHERE id = $1', [
      res1.rows[0]?.mukhli_id || 0,
    ]);
    // Merge data
    const data = [[...res1.rows], ...res2.rows];
    return data;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('getData error:', e);
    }
    return [];
  }
}

export async function getThemes(book) {
  'use cache';
  cacheTag('bible-data', 'themes');
  try {
    const res = await query('SELECT თემა, id, წიგნი, თავი FROM public.თემები WHERE წიგნი = $1', [
      book,
    ]);
    return res.rows;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('getThemes error:', e);
    }
    return [];
  }
}

export async function addDefinition(formData) {
  const verseID = formData.get('verseID');
  const author = formData.get('author');
  const text = formData.get('text');

  // Input validation
  if (!verseID || !author || !text) {
    return { message: 'All fields are required', error: true };
  }

  if (typeof author !== 'string' || author.length > 100) {
    return { message: 'Author name is too long (max 100 characters)', error: true };
  }

  if (typeof text !== 'string' || text.length > 5000) {
    return { message: 'Text is too long (max 5000 characters)', error: true };
  }

  if (typeof text !== 'string' || text.trim().length === 0) {
    return { message: 'Text cannot be empty', error: true };
  }

  try {
    await query('INSERT INTO განმარტებები (mukhli_id, ავტორი, ტექსტი) VALUES ($1, $2, $3)', [
      verseID,
      author.trim(),
      text.trim(),
    ]);

    // updateTag is like revalidateTag but optimized for Server Actions
    // It immediately expires the cache so the next redirect/render is fresh.
    updateTag('bible-data');

    // Refresh the page data automatically
    revalidatePath('/');
    return { message: 'Success!', error: false };
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('addDefinition error:', e);
    }
    return { message: 'Database Error', error: true };
  }
}
