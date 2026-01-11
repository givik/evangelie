'use client';

import { useState, useMemo, useEffect } from 'react';
import styles from './page.module.css';
import { addDefinition, getVerseID } from './actions';

export default function Form({ options, defaults }) {
  // --- HELPER FUNCTIONS (to calculate lists) ---

  // 1. Get all unique books
  const allBooks = useMemo(() => {
    return [...new Set(options.map((item) => item['წიგნი']))];
  }, [options]);

  // 2. Helper to get chapters for a specific book
  const getChapters = (bookName) => {
    if (!bookName) return [];
    const chapters = options
      .filter((item) => item['წიგნი'] === bookName)
      .map((item) => item['თავი']);
    return [...new Set(chapters)].sort((a, b) => a - b);
  };

  // 3. Helper to get verses for a specific book and chapter
  const getVerses = (bookName, chapterNum) => {
    if (!bookName || !chapterNum) return [];
    const verses = options
      .filter((item) => item['წიგნი'] === bookName && item['თავი'] == chapterNum)
      .map((item) => item['მუხლი']);
    return [...new Set(verses)].sort((a, b) => a - b);
  };

  // --- INITIALIZE STATE WITH DEFAULTS ---
  // We calculate the very first valid combination (Book -> Chapter -> Verse)
  const defaultBook = defaults.წიგნი || '';
  const defaultChapters = getChapters(defaultBook);
  const defaultChapter = defaults.თავი || '';
  const defaultVerses = getVerses(defaultBook, defaultChapter);
  const defaultVerse = defaults.მუხლი || '';

  const [selectedBook, setSelectedBook] = useState(defaultBook);
  const [selectedChapter, setSelectedChapter] = useState(defaultChapter);
  const [selectedVerse, setSelectedVerse] = useState(defaultVerse);
  const [verseID, setVerseID] = useState('');

  // --- HANDLERS ---

  const handleChange = async (book, chapter, verse) => {
    const vID = await getVerseID(book, chapter, verse);
    setVerseID(vID);
  };

  const handleBookChange = async (e) => {
    const newBook = e.target.value;
    setSelectedBook(newBook);

    // Auto-select the first chapter of the NEW book
    const newChapters = getChapters(newBook);
    const firstChapter = newChapters[0] || '';
    setSelectedChapter(firstChapter);

    // Auto-select the first verse of that NEW chapter
    const newVerses = getVerses(newBook, firstChapter);
    setSelectedVerse(newVerses[0] || '');

    handleChange(newBook, firstChapter, newVerses[0] || '');
  };

  const handleChapterChange = async (e) => {
    const newChapter = e.target.value;
    setSelectedChapter(newChapter);

    // Auto-select the first verse of the NEW chapter
    const newVerses = getVerses(selectedBook, newChapter);
    setSelectedVerse(newVerses[0] || '');

    handleChange(selectedBook, newChapter, newVerses[0] || '');
  };

  const handleVerseChange = async (e) => {
    setSelectedVerse(e.target.value);
    handleChange(selectedBook, selectedChapter, e.target.value);
  };

  // Re-calculate lists for the UI based on current state
  const currentChapters = useMemo(() => getChapters(selectedBook), [options, selectedBook]);
  const currentVerses = useMemo(
    () => getVerses(selectedBook, selectedChapter),
    [options, selectedBook, selectedChapter]
  );

  return (
    <form action={addDefinition} className={styles.form}>
      <div className={styles.dropdowncontainer}>
        {/* BOOK SELECT */}
        <select
          name="book"
          className={styles.dropdown}
          required
          value={selectedBook}
          onChange={handleBookChange}
        >
          {allBooks.map((book) => (
            <option key={book} value={book}>
              {book}
            </option>
          ))}
        </select>

        {/* CHAPTER SELECT */}
        <select
          name="chapter"
          className={styles.dropdown}
          required
          value={selectedChapter}
          onChange={handleChapterChange}
        >
          {currentChapters.map((chap) => (
            <option key={chap} value={chap}>
              თავი {chap}
            </option>
          ))}
        </select>

        {/* VERSE SELECT */}
        <select
          name="verse"
          className={styles.dropdown}
          required
          value={selectedVerse}
          onChange={handleVerseChange}
        >
          {currentVerses.map((verse) => (
            <option key={verse} value={verse}>
              მუხლი {verse}
            </option>
          ))}
        </select>

        <input type="hidden" id="verseID" name="verseID" value={verseID} />
      </div>

      <input name="author" className={styles.input} type="text" placeholder="ავტორი..." required />
      <textarea
        name="text"
        className={styles.textarea}
        placeholder="შეიყვანეთ ტექსტი..."
        required
      />
      <button type="submit" className={styles.button}>
        დამახსოვრება
      </button>
    </form>
  );
}
