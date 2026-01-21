'use client';
import { useState, useEffect, use } from 'react';
import { getChapters, getVerses } from '../actions';
import Placeholder from '@/components/Placeholder';
import { useRouter } from 'next/navigation';
import localFont from 'next/font/local';
import Image from 'next/image';

import './page.css';

const bookFontBold = localFont({
  src: '../fonts/gl-lortkipanidze-bold.ttf',
});

const textFont = localFont({
  src: '../fonts/bpg_nino_elite_round.otf',
});

const Page = ({ params }) => {
  const [loaded, setLoaded] = useState(false);
  const [books, setBooks] = useState([
    { short: 'მათე', name: 'მათეს სახარება' },
    { short: 'მარკოზი', name: 'მარკოზის სახარება' },
    { short: 'ლუკა', name: 'ლუკას სახარება' },
    { short: 'იოანე', name: 'იოანეს სახარება' },
  ]);
  const [chapters, setChapters] = useState([]);
  const [verses, setVerses] = useState([]);

  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('1');

  const { slug } = use(params);
  const decodedSlug = slug ? slug.map((s) => decodeURIComponent(s)) : [];
  const router = useRouter();

  useEffect(() => {
    let book = decodedSlug[0];
    let chapter = decodedSlug[1];
    let verse = decodedSlug[2];

    if (book) {
      console.log('YES');
      book = books.find((b) => b.short === book).short;
      // console.log('book', book);
      // console.log('chapter', chapter);
      // console.log('verse', verse);

      if (book) localStorage.setItem('selectedBook', book);
      if (chapter) localStorage.setItem('selectedChapter', chapter);
      if (verse) localStorage.setItem('selectedVerse', verse);

      setSelectedBook(book || 'მათე');
      setSelectedChapter(chapter || '1');
    } else {
      console.log('No');
      const book = localStorage.getItem('selectedBook') || 'მათე';
      const chapter = localStorage.getItem('selectedChapter') || '1';
      const verse = localStorage.getItem('selectedVerse');

      // console.log('book', book);
      // console.log('chapter', chapter);
      // console.log('verse', verse);
      router.push(`/${book}/${chapter}`);
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (decodedSlug.length > 0) {
      // compare books.short and decodedSlug[0]
      const book = books.find((b) => b.short === decodedSlug[0]);
      if (book) {
        setSelectedBook(book.name);
      }

      const chapter = decodedSlug[1] || '1';
      setSelectedChapter(chapter);
    }
    setLoaded(true);
  }, [decodedSlug]);

  useEffect(() => {
    if (selectedBook) {
      getChapters(selectedBook).then((data) => {
        setChapters(data);
      });
    }
  }, [selectedBook]);

  useEffect(() => {
    if (selectedBook && selectedChapter) {
      getVerses(selectedBook, selectedChapter).then(setVerses);
    }
  }, [selectedBook, selectedChapter]);

  const handleBookChange = (e) => {
    const newBook = e.target.value;
    localStorage.setItem('selectedBook', newBook);
    const book = books.find((b) => b.name === newBook);
    if (book) router.push('/' + book.short + '/1');
  };

  const handleChapterChange = (e) => {
    const newChapter = e.target.value;
    localStorage.setItem('selectedChapter', newChapter);
    const book = books.find((b) => b.name === selectedBook);
    if (book) router.push('/' + book.short + '/' + newChapter);
  };

  const prevChapter = () => {
    const newChapter = parseInt(selectedChapter) - 1;
    // check if newChapter is valid and chapter exists
    if (newChapter < 1) return;
    localStorage.setItem('selectedChapter', newChapter);
    const book = books.find((b) => b.name === selectedBook);
    if (book) router.push('/' + book.short + '/' + newChapter);
  };

  const nextChapter = () => {
    const newChapter = parseInt(selectedChapter) + 1;
    // check if newChapter is valid and chapter exists
    if (newChapter > chapters.length) return;
    localStorage.setItem('selectedChapter', newChapter);
    const book = books.find((b) => b.name === selectedBook);
    if (book) router.push('/' + book.short + '/' + newChapter);
  };

  return (
    <div className="container">
      {loaded && (
        <div className="controls">
          <div className="book-selector">
            <div className="themes">
              {books.map((book, index) => (
                <div className={bookFontBold.className} key={index}>
                  {book.name}
                </div>
              ))}
            </div>
            {
              <select
                value={selectedBook}
                className={`short-book-name ` + bookFontBold.className}
                onChange={handleBookChange}
              >
                {books.map((book, index) => (
                  <option key={index} value={book.name}>
                    {book.short}
                  </option>
                ))}
              </select>
            }
            {
              <select
                defaultValue={selectedBook}
                className={`long-book-name ` + bookFontBold.className}
                onChange={handleBookChange}
              >
                {books.map((book, index) => (
                  <option key={index} value={book.name}>
                    {book.name}
                  </option>
                ))}
              </select>
            }
            {
              <select
                value={selectedChapter}
                className={'chapter-selector ' + bookFontBold.className}
                onChange={handleChapterChange}
              >
                {chapters.length === 0 ? (
                  <option value={selectedChapter}>თავი {selectedChapter}</option>
                ) : (
                  chapters.map((chapter, index) => (
                    <option key={index} value={chapter.თავი}>
                      თავი {chapter.თავი}
                    </option>
                  ))
                )}
              </select>
            }
          </div>
          <div className="btn-container">
            <button className={`btn ` + textFont.className} onClick={prevChapter}>
              {'<'} წინა თავი
            </button>
            <button
              className={`btn paper paper-curl-right ` + textFont.className}
              onClick={nextChapter}
            >
              შემდეგი თავი {'>'}
            </button>
          </div>
        </div>
      )}
      <div className="content">
        <h1 className={'header ' + bookFontBold.className}>
          {loaded && (
            <>
              <span className="book-name">{selectedBook}</span>
              <span className="book-chapter">თავი {selectedChapter} </span>
            </>
          )}
        </h1>
        <div className="verses">
          {!loaded && verses.length === 0 && (
            <>
              <Placeholder />
              <div className={`loading-text ` + textFont.className}>
                წმინდა
                <Image src="/cross-orthodox.svg" width={42} height={42} alt="ჯვარი" /> სახარება
              </div>
              <Placeholder />
            </>
          )}
          {loaded &&
            verses.map((verse, index) => (
              <p key={index} className={textFont.className}>
                <span className="index">{index + 1}</span> .{verse.ტექსტი}
              </p>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
