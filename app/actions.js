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

  const chapterInt = parseInt(chapter, 10);
  if (isNaN(chapterInt)) {
    return [];
  }

  try {
    const res = await query(
      'SELECT id, თემა, მუხლი, ტექსტი, ძველი_ტექსტი FROM public.მუხლები WHERE წიგნი = $1 AND თავი = $2 ORDER BY მუხლი',
      [book, chapterInt],
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
  const chapterInt = parseInt(chapter, 10);
  const verseInt = parseInt(verse, 10);

  if (isNaN(chapterInt) || isNaN(verseInt)) {
    return null;
  }

  try {
    const res = await query(
      'SELECT id FROM public.მუხლები WHERE წიგნი = $1 AND თავი = $2 AND მუხლი = $3',
      [book, chapterInt, verseInt],
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
  const verseID = parseInt(formData.get('verseID'), 10);
  const author = formData.get('author');
  const text = formData.get('text');

  // Input validation
  if (isNaN(verseID) || !author || !text) {
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

export async function getVerseCommentary(verseId) {
  'use cache';
  cacheTag('bible-data', 'commentary');
  const id = parseInt(verseId, 10);
  if (isNaN(id)) {
    return [];
  }

  try {
    const res = await query(
      'SELECT id, ავტორი, ტექსტი FROM public.განმარტებები WHERE mukhli_id = $1 ORDER BY id',
      [id],
    );
    return res.rows;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('getVerseCommentary error:', e);
    }
    return [];
  }
}

export async function searchBible(queryText) {
  if (!queryText || queryText.trim().length < 2) {
    return [];
  }

  try {
    const res = await query(
      'SELECT id, წიგნი, თავი, მუხლი, ტექსტი FROM public.მუხლები WHERE ტექსტი ILIKE $1 LIMIT 50',
      [`%${queryText}%`],
    );
    return res.rows;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('searchBible error:', e);
    }
    return [];
  }
}
