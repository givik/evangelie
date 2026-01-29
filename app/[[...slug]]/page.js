'use client';
import { useState, useEffect, use, Suspense, useMemo, useCallback } from 'react';
import { getChapters, getThemes, getVerses } from '../actions';
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

const BOOKS = [
  { short: 'მათე', name: 'მათეს სახარება' },
  { short: 'მარკოზი', name: 'მარკოზის სახარება' },
  { short: 'ლუკა', name: 'ლუკას სახარება' },
  { short: 'იოანე', name: 'იოანეს სახარება' },
];

const Page = ({ params }) => {
  const [loaded, setLoaded] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [verses, setVerses] = useState([]);
  const [themes, setThemes] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [loadingVerses, setLoadingVerses] = useState(false);

  const { slug } = use(params);
  const router = useRouter();

  const decodedSlug = useMemo(() => {
    if (!slug) return [];
    return slug.map((s) => {
      try {
        return decodeURIComponent(s);
      } catch (e) {
        return s;
      }
    });
  }, [slug]);

  const shortBook = useCallback((bookName) => {
    return BOOKS.find((b) => b.name === bookName)?.short || 'მათე';
  }, []);

  const scrollToElement = useCallback((elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      const controlsPanel = document.querySelector('.controls');
      const offset = controlsPanel ? controlsPanel.offsetHeight + 20 : 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }, []);

  // 1. Handle initial mount
  useEffect(() => {
    setLoaded(true);
  }, []);

  // 2. SYNC STATE WITH URL (This fixes the Chapter 5 to 8 issue)
  useEffect(() => {
    if (!loaded) return;

    let bookShort = decodedSlug[0];
    let chapter = decodedSlug[1] || '1';

    if (bookShort) {
      const bookObj = BOOKS.find((b) => b.short === bookShort);
      const fullName = bookObj ? bookObj.name : bookShort;

      // Only update state if it actually changed to prevent loops
      if (fullName !== selectedBook) setSelectedBook(fullName);
      if (chapter !== selectedChapter) setSelectedChapter(chapter);

      localStorage.setItem('selectedBook', fullName);
      localStorage.setItem('selectedChapter', chapter);
    } else {
      // Default fallback if no slug exists
      const storedBook = localStorage.getItem('selectedBook') || 'მათეს სახარება';
      const storedChapter = localStorage.getItem('selectedChapter') || '1';
      const shortName = BOOKS.find((b) => b.name === storedBook)?.short || 'მათე';
      router.replace(`/${shortName}/${storedChapter}`);
    }
  }, [decodedSlug, loaded, selectedBook, selectedChapter, router]);

  // 3. Fetch chapters and themes
  useEffect(() => {
    if (!selectedBook) return;
    Promise.all([getChapters(selectedBook), getThemes(selectedBook)]).then(
      ([chaptersData, themesData]) => {
        setChapters(chaptersData);
        setThemes(themesData);
      },
    );
  }, [selectedBook]);

  // 4. Fetch verses
  useEffect(() => {
    if (!selectedBook || !selectedChapter) return;
    setLoadingVerses(true);
    getVerses(selectedBook, selectedChapter)
      .then((data) => setVerses(data))
      .finally(() => setLoadingVerses(false));
  }, [selectedBook, selectedChapter]);

  // 5. SMART SCROLL (Triggered after verses are loaded and rendered)
  useEffect(() => {
    if (!loaded || loadingVerses || verses.length === 0) return;

    const hash = window.location.hash;
    if (hash) {
      const elementId = hash.substring(1);
      // Wait for a "paint" cycle to ensure DOM is ready
      const timer = setTimeout(() => {
        scrollToElement(elementId);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [verses, loadingVerses, loaded, scrollToElement]);

  const handleBookChange = (e) => {
    const newBook = e.target.value;
    router.push(`/${shortBook(newBook)}/1`);
  };

  const handleChapterChange = (e) => {
    router.push(`/${shortBook(selectedBook)}/${e.target.value}`);
  };

  const navigateChapter = (direction) => {
    const current = parseInt(selectedChapter);
    const next = direction === 'next' ? current + 1 : current - 1;
    if (next < 1 || (direction === 'next' && next > chapters.length)) return;
    router.push(`/${shortBook(selectedBook)}/${next}`);
  };

  const handleThemeClick = (themeChapter, themeId) => {
    const isSameChapter = parseInt(themeChapter) === parseInt(selectedChapter);

    if (isSameChapter) {
      scrollToElement(themeId.toString());
      // Explicitly update hash in URL without refreshing
      window.history.pushState(null, '', `#${themeId}`);
    } else {
      router.push(`/${shortBook(selectedBook)}/${themeChapter}#${themeId}`);
    }

    const menuCheckbox = document.getElementById('menuCheckbox');
    if (menuCheckbox) menuCheckbox.checked = false;
  };

  const chaptersForThemes = useMemo(() => {
    const seen = new Set();
    return themes.map((theme) => {
      const shouldShow = !seen.has(theme.თავი);
      seen.add(theme.თავი);
      return { ...theme, showChapter: shouldShow };
    });
  }, [themes]);

  const versesWithTopics = useMemo(() => {
    const topics = new Set();
    return verses.map((verse) => {
      const shouldShowTopic = !topics.has(verse.თემა);
      topics.add(verse.თემა);
      return { ...verse, showTopic: shouldShowTopic };
    });
  }, [verses]);

  return (
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
                <div className={'book-name ' + bookFontBold.className}>{selectedBook} (თემები)</div>
                {chaptersForThemes.map((theme) => (
                  <li className={textFont.className} key={theme.id}>
                    {theme.showChapter && (
                      <div className={'menu-chapter ' + bookFontBold.className}>
                        •- თავი {theme.თავი} -•
                      </div>
                    )}
                    <a
                      onClick={() => handleThemeClick(theme.თავი, theme.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <label htmlFor="menuCheckbox" style={{ cursor: 'pointer' }}>
                        {theme.თემა}
                      </label>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="book-selector">
            <select
              value={selectedBook}
              className={`short-book-name ${bookFontBold.className}`}
              onChange={handleBookChange}
            >
              {BOOKS.map((book) => (
                <option key={book.short} value={book.name}>
                  {book.short}
                </option>
              ))}
            </select>

            <select
              value={selectedChapter}
              className={`chapter-selector ${bookFontBold.className}`}
              onChange={handleChapterChange}
            >
              {chapters.length === 0 ? (
                <option value={selectedChapter}>თავი {selectedChapter}</option>
              ) : (
                chapters.map((ch) => (
                  <option key={ch.თავი} value={ch.თავი}>
                    თავი {ch.თავი}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="btn-container">
            <button className={`btn ${textFont.className}`} onClick={() => navigateChapter('prev')}>
              {'<'} <span>წინა თავი</span>
            </button>
            <button className={`btn ${textFont.className}`} onClick={() => navigateChapter('next')}>
              <span>შემდეგი თავი</span> {'>'}
            </button>
          </div>
        </div>
      )}

      <div className="content">
        <h1 className={`header ${bookFontBold.className}`}>
          {loaded && (
            <>
              <span className="book-name">{selectedBook}</span>
              <span className="book-chapter">თავი {selectedChapter}</span>
            </>
          )}
        </h1>

        <div className="verses">
          {!loaded || loadingVerses ? (
            <>
              <Placeholder />
              <div className={`loading-text ${textFont.className}`}>
                <Image src="/cross-orthodox.svg" width={42} height={42} alt="ჯვარი" priority />
                {loaded ? 'იტვირთება...' : 'წმინდა წერილი'}
              </div>
              <Placeholder />
            </>
          ) : (
            versesWithTopics.map((verse, index) => (
              <div key={verse.id} className={textFont.className}>
                {verse.showTopic && (
                  <div id={verse.id} className="topic">
                    {verse.თემა}
                  </div>
                )}
                <p className="verse">
                  <span className="index">{index + 1}</span>. {verse.ძველი_ტექსტი}
                </p>
              </div>
            ))
          )}
        </div>

        {verses.length > 0 && !loadingVerses && (
          <button
            className={`btn bottom-next-page ${textFont.className}`}
            onClick={() => navigateChapter('next')}
          >
            შემდეგი თავი {'>'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Page;
