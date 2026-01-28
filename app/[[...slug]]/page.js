'use client';
import { useState, useEffect, use, Suspense } from 'react';
import { getChapters, getThemes, getVerses, getBooks } from '../actions';
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
  const [themes, setThemes] = useState([]);

  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('1');

  const { slug } = use(params);
  const decodedSlug = slug
    ? slug.map((s) => {
        let decoded = s;
        let prevDecoded;

        // Keep decoding until nothing changes
        do {
          prevDecoded = decoded;
          try {
            decoded = decodeURIComponent(decoded);
          } catch (e) {
            break;
          }
        } while (decoded !== prevDecoded && decoded.includes('%'));

        return decoded;
      })
    : [];

  console.log('DECODED_SLUG', decodedSlug);
  const router = useRouter();

  useEffect(() => {
    console.log('useEffect[]');
    let book = decodedSlug[0]; // This is already decoded: "ლუკა"
    let chapter = decodedSlug[1];
    let verse = decodedSlug[2];

    if (book) {
      // Store the decoded Georgian text
      if (book) localStorage.setItem('selectedBook', book);
      if (chapter) localStorage.setItem('selectedChapter', chapter);
      if (verse) localStorage.setItem('selectedVerse', verse);

      // Find the full book name
      const bookObj = books.find((b) => b.short === book);
      setSelectedBook(bookObj ? bookObj.name : book);
      setSelectedChapter(chapter || '1');
    } else {
      const savedBook = localStorage.getItem('selectedBook') || 'მათე';
      const savedChapter = localStorage.getItem('selectedChapter') || '1';

      // Make sure we're using decoded values
      console.log('Redirecting to:', `/${savedBook}/${savedChapter}`);
      router.push(`/${savedBook}/${savedChapter}`);
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

      getThemes(selectedBook).then((data) => {
        setThemes(data);
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
    const book = shortBook(newBook);
    const url = '/' + book + '/1';

    console.log('=== BOOK CHANGE ===');
    console.log('URL to navigate:', url);

    localStorage.setItem('selectedBook', book);
    if (book) router.push(url); // Use push instead of replace
  };

  const handleChapterChange = (e) => {
    const newChapter = e.target.value;
    localStorage.setItem('selectedChapter', newChapter);
    const book = shortBook(selectedBook);
    if (book) router.push('/' + book + '/' + newChapter);
  };

  const prevChapter = () => {
    const newChapter = parseInt(selectedChapter) - 1;
    // check if newChapter is valid and chapter exists
    if (newChapter < 1) return;
    localStorage.setItem('selectedChapter', newChapter);
    const book = shortBook(selectedBook);
    if (book) router.push('/' + book + '/' + newChapter);
  };

  const nextChapter = () => {
    const newChapter = parseInt(selectedChapter) + 1;
    if (newChapter < 1 || newChapter > chapters.length) return;

    const book = shortBook(selectedBook);
    const url = '/' + book + '/' + newChapter;

    // console.log('=== NEXT CHAPTER ===');
    // console.log('Selected book (full):', selectedBook);
    // console.log('Short book:', book);
    // console.log('New chapter:', newChapter);
    // console.log('URL to navigate:', url);

    localStorage.setItem('selectedChapter', newChapter);
    if (book) router.push(url);
  };

  const shortBook = (bookName) => {
    return books.find((b) => b.name === bookName).short;
  };

  let topics = [];
  let chaptersForThemes = [];

  return (
    <Suspense>
      <div className="container">
        {loaded && (
          <div className="controls">
            <nav role="navigation">
              <div id="menuToggle">
                <input type="checkbox" id="menuCheckbox" />

                <span></span>
                <span></span>
                <span></span>

                <ul id="menu">
                  {themes.map((theme) => {
                    let chap = '';
                    if (!chaptersForThemes.includes(theme.თავი)) {
                      chap = theme.თავი;
                      chaptersForThemes.push(theme.თავი);
                    }

                    const book = shortBook(selectedBook);
                    return (
                      <li className={textFont.className} key={theme.id}>
                        {chap && <div className="menu-chapter">{chap}</div>}
                        <a
                          onClick={() => {
                            router.push(`/${book}/${theme.თავი}/#${theme.id}`);
                          }}
                        >
                          <label
                            htmlFor="menuCheckbox"
                            onClick={(e) => e.target.parentNode.click()}
                          >
                            {theme.თემა}
                          </label>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>
            <div className="book-selector">
              {
                <select
                  name="books"
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
              {/* {
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
            } */}
              {
                <select
                  name="chapters"
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
                {'<'}{' '}
                <span>
                  წინა <span>თავი</span>
                </span>
              </button>
              <button className={`btn ` + textFont.className} onClick={nextChapter}>
                <span>
                  შემდეგი <span>თავი</span>
                </span>{' '}
                {'>'}
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
                  <Image src="/cross-orthodox.svg" width={42} height={42} alt="ჯვარი" /> წმინდა
                  წერილი
                </div>
                <Placeholder />
              </>
            )}
            {loaded &&
              verses.map((verse, index) => {
                let topic;
                if (!topics.includes(verse.თემა)) {
                  // topics.push(verse.თემა);
                  topics[verse.id] = verse.თემა;
                  topic = verse.თემა;
                }
                return (
                  <div key={verse.id} className={textFont.className}>
                    {topic && (
                      <div id={verse.id} className={'topic'}>
                        {topic}
                      </div>
                    )}
                    <p className="verse">
                      <span className="index">{index + 1}</span>. {verse.ძველი_ტექსტი}
                    </p>
                  </div>
                );
              })}
          </div>
          {verses.length > 0 && (
            <button className={`btn bottom-next-page ` + textFont.className} onClick={nextChapter}>
              შემდეგი თავი {'>'}
            </button>
          )}
        </div>
      </div>
    </Suspense>
  );
};

export default Page;
