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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  1;

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await addDefinition(formData);

      const book = formData.get('book') || '';
      const chapter = formData.get('chapter') || '';
      const verse = formData.get('verse') || '';

      setSelectedBook(book);
      setSelectedChapter(chapter);
      setSelectedVerse(verse);

      //   if (book && chapter && verse) {
      //     await handleChange(book, chapter, verse);
      //   } else {
      //     setVerseID('');
      //   }

      return true;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (isSubmitting) return;
          const formEl = e.target;
          const fd = new FormData(formEl);
          const success = await handleSubmit(fd);
          if (success) {
            // clear author and text (uncontrolled fields) after successful insert
            formEl.reset();
          }
        }}
        className={styles.form}
      >
        <div className={styles.dropdowncontainer}>
          {/* BOOK SELECT */}
          <select
            name="book"
            className={styles.dropdown}
            required
            value={selectedBook}
            onChange={handleBookChange}
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          >
            {currentVerses.map((verse) => (
              <option key={verse} value={verse}>
                მუხლი {verse}
              </option>
            ))}
          </select>

          <input type="hidden" id="verseID" name="verseID" value={verseID} />
        </div>

        <input
          name="author"
          className={styles.input}
          type="text"
          placeholder="ავტორი..."
          required
          disabled={isSubmitting}
        />
        <textarea
          name="text"
          className={styles.textarea}
          placeholder="შეიყვანეთ ტექსტი..."
          required
          disabled={isSubmitting}
        />
        <button type="submit" className={styles.button} disabled={isSubmitting}>
          {isSubmitting ? 'მიმდინარეობს...' : 'დამახსოვრება'}
        </button>
        {/* {submitted && <div className={styles.successMessage}>ტექსტი წარმატებით დამახსოვრდა!</div>} */}
      </form>
    </>
  );
}
