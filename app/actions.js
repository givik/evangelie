'use server';
import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getBooks() {
  try {
    const res = await query('SELECT DISTINCT წიგნი FROM მუხლები ORDER BY წიგნი');
    return res.rows;
  } catch (e) {
    console.log(e);
    return [];
  }
}

export async function getChapters(book) {
  try {
    const res = await query('SELECT DISTINCT თავი FROM მუხლები WHERE წიგნი = $1 ORDER BY თავი', [
      book,
    ]);
    return res.rows;
  } catch (e) {
    console.log(e);
    return [];
  }
}

export async function getVerses(book, chapter) {
  try {
    const res = await query(
      'SELECT ტექსტი FROM მუხლები WHERE წიგნი = $1 AND თავი = $2 ORDER BY მუხლი',
      [book, chapter]
    );
    return res.rows;
  } catch (e) {
    console.log(e);
    return [];
  }
}

export async function getVerseID(book, chapter, verse) {
  try {
    const res = await query(
      'SELECT id FROM მუხლები WHERE წიგნი = $1 AND თავი = $2 AND მუხლი = $3',
      [book, chapter, verse]
    );
    return res.rows[0]?.id || null;
  } catch (e) {
    console.log(e);
    return null;
  }
}

export async function getOptions() {
  try {
    const res = await query('SELECT id, წიგნი, თავი, მუხლი FROM მუხლები ORDER BY id');
    return res.rows;
  } catch (e) {
    console.log(e);
    return [];
  }
}

export async function getData() {
  try {
    const res1 = await query('SELECT * FROM განმარტებები ORDER BY id DESC LIMIT 1');
    const res2 = await query('SELECT id, წიგნი, თავი, მუხლი FROM მუხლები WHERE id = $1', [
      res1.rows[0]?.mukhli_id || 0,
    ]);
    // Merge data
    const data = [[...res1.rows], ...res2.rows];
    return data;
  } catch (e) {
    console.log(e);
    return [];
  }
}

export async function addDefinition(formData) {
  // Extract values using the "name" attribute from the form inputs

  const verseID = formData.get('verseID');
  const author = formData.get('author');
  const text = formData.get('text');

  try {
    await query('INSERT INTO განმარტებები (mukhli_id, ავტორი, ტექსტი) VALUES ($1, $2, $3)', [
      verseID,
      author,
      text,
    ]);

    // Refresh the page data automatically
    revalidatePath('/');
    return { message: 'Success!' };
  } catch (e) {
    console.log(e);
    return { message: 'Database Error' };
  }
}
