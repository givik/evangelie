'use client';
import { useState, useEffect } from 'react';
import { getChapters, getVerses } from './actions';
import localFont from 'next/font/local';
import './page.css';

const bookFontBold = localFont({
  src: './fonts/gl-lortkipanidze-bold.ttf',
});

const textFont = localFont({
  src: './fonts/bpg_nino_elite_round.otf',
});

const Page = () => {
  const [loaded, setLoaded] = useState(false);
  const [books, setBooks] = useState([
    'მათეს სახარება',
    'მარკოზის სახარება',
    'ლუკას სახარება',
    'იოანეს სახარება',
  ]);
  const [chapters, setChapters] = useState([]);
  const [verses, setVerses] = useState([]);

  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('1');

  useEffect(() => {
    // get selected book & chapter from local storage
    const storedBook = localStorage.getItem('selectedBook');
    const storedChapter = localStorage.getItem('selectedChapter');

    setSelectedBook(storedBook || 'მათეს სახარება');
    setSelectedChapter(storedChapter || '1');

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (selectedBook) {
      getChapters(selectedBook).then((data) => {
        setChapters(data);
        // console.log('selectedBook:', selectedBook);
        // console.log('data:', data);
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
    setSelectedBook(newBook);
    localStorage.setItem('selectedBook', newBook);
  };

  const handleChapterChange = (e) => {
    const newChapter = e.target.value;
    setSelectedChapter(newChapter);
    localStorage.setItem('selectedChapter', newChapter);
  };

  return (
    <div className="container">
      <div className="controls">
        <div className="book-selector">
          <div className="themes">
            {loaded &&
              books.map((book, index) => (
                <div className={bookFontBold.className} key={index}>
                  {book}
                </div>
              ))}
          </div>
          {loaded ? (
            <select
              value={selectedBook}
              className={bookFontBold.className}
              onChange={handleBookChange}
            >
              {books.map((book, index) => (
                <option key={index}>{book}</option>
              ))}
            </select>
          ) : (
            <div style={{ height: '40px' }} />
          )}
          {loaded ? (
            <select
              value={selectedChapter}
              className={bookFontBold.className}
              onChange={handleChapterChange}
            >
              {chapters.map((chapter, index) => (
                <option key={index} value={chapter.თავი}>
                  თავი {chapter.თავი}
                </option>
              ))}
            </select>
          ) : (
            <div style={{ height: '40px' }} />
          )}
        </div>
        <button className="btn">წინა თავი</button>
        <button className="btn">შემდეგი თავი</button>
      </div>
      <div className="content">
        <h1 className={bookFontBold.className}>{loaded ? selectedBook : ''}</h1>
        <div className="verses">
          {loaded
            ? verses.map((verse, index) => (
                <p key={index} className={textFont.className}>
                  <span className="index">{index + 1}</span> .{verse.ტექსტი}
                </p>
              ))
            : ''}
        </div>
      </div>
    </div>
  );
};

export default Page;
