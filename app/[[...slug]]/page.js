'use client';
import { useState, useEffect, use, Suspense, useMemo, useCallback } from 'react';
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
  const [selectedChapter, setSelectedChapter] = useState('1');
  const [loadingVerses, setLoadingVerses] = useState(false);

  const { slug } = use(params);
  const router = useRouter();

  // Memoize decoded slug to prevent recalculation
  const decodedSlug = useMemo(() => {
    if (!slug) return [];
    return slug.map((s) => {
      let decoded = s;
      let prevDecoded;
      do {
        prevDecoded = decoded;
        try {
          decoded = decodeURIComponent(decoded);
        } catch (e) {
          break;
        }
      } while (decoded !== prevDecoded && decoded.includes('%'));
      return decoded;
    });
  }, [slug]);

  // Memoize book lookup function
  const shortBook = useCallback((bookName) => {
    return BOOKS.find((b) => b.name === bookName)?.short || '';
  }, []);

  // Scroll to element with offset
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

  // Initialize from URL or localStorage only once
  useEffect(() => {
    // console.log('Initialization useEffect');
    let book = decodedSlug[0];
    let chapter = decodedSlug[1];

    if (book) {
      const bookObj = BOOKS.find((b) => b.short === book);
      book = bookObj ? bookObj.name : book;

      setSelectedBook(book);
      setSelectedChapter(chapter || '1');

      if (book) localStorage.setItem('selectedBook', book);
      if (chapter) localStorage.setItem('selectedChapter', chapter);
    } else {
      const storedBook = localStorage.getItem('selectedBook') || 'მათეს სახარება';
      const storedChapter = localStorage.getItem('selectedChapter') || '1';

      setSelectedBook(storedBook);
      setSelectedChapter(storedChapter);

      const shortBookName = BOOKS.find((b) => b.name === storedBook)?.short || 'მათე';
      router.replace(`/${shortBookName}/${storedChapter}`);
    }

    setLoaded(true);
  }, []); // Only run once on mount

  // Fetch chapters and themes when book changes
  useEffect(() => {
    if (!selectedBook) return;

    // console.log('Fetching chapters and themes for:', selectedBook);

    Promise.all([getChapters(selectedBook), getThemes(selectedBook)]).then(
      ([chaptersData, themesData]) => {
        setChapters(chaptersData);
        setThemes(themesData);
      },
    );
  }, [selectedBook]);

  // Fetch verses when book or chapter changes
  useEffect(() => {
    if (!selectedBook || !selectedChapter) return;

    // console.log('Fetching verses for:', selectedBook, selectedChapter);

    // Show loading state
    setLoadingVerses(true);

    getVerses(selectedBook, selectedChapter)
      .then((data) => {
        setVerses(data);
      })
      .finally(() => {
        setLoadingVerses(false);
      });
  }, [selectedBook, selectedChapter]);

  // Scroll to hash anchor after verses are loaded
  useEffect(() => {
    if (!loaded || loadingVerses || verses.length === 0) return;

    const scrollToHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const elementId = hash.substring(1);
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollToElement(elementId);
          }, 50);
        });
      }
    };

    // Scroll when verses finish loading
    scrollToHash();

    // Also listen for hash changes (when clicking menu items on same page)
    const handleHashChange = () => {
      scrollToHash();
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [loaded, loadingVerses, verses, scrollToElement]);

  const handleBookChange = useCallback(
    (e) => {
      const newBook = e.target.value;
      const shortBookName = shortBook(newBook);

      localStorage.setItem('selectedBook', newBook);
      localStorage.setItem('selectedChapter', '1');

      setSelectedBook(newBook);
      setSelectedChapter('1');
      router.push(`/${shortBookName}/1`);
    },
    [router, shortBook],
  );

  const handleChapterChange = useCallback(
    (e) => {
      const newChapter = e.target.value;
      const shortBookName = shortBook(selectedBook);

      localStorage.setItem('selectedChapter', newChapter);
      setSelectedChapter(newChapter);
      router.push(`/${shortBookName}/${newChapter}`);
    },
    [selectedBook, router, shortBook],
  );

  const prevChapter = useCallback(() => {
    const newChapter = parseInt(selectedChapter) - 1;
    if (newChapter < 1) return;

    const shortBookName = shortBook(selectedBook);
    localStorage.setItem('selectedChapter', newChapter.toString());
    setSelectedChapter(newChapter.toString());
    router.push(`/${shortBookName}/${newChapter}`);
  }, [selectedChapter, selectedBook, router, shortBook]);

  const nextChapter = useCallback(() => {
    const newChapter = parseInt(selectedChapter) + 1;
    if (newChapter > chapters.length) return;

    const shortBookName = shortBook(selectedBook);
    localStorage.setItem('selectedChapter', newChapter.toString());
    setSelectedChapter(newChapter.toString());
    router.push(`/${shortBookName}/${newChapter}`);
  }, [selectedChapter, selectedBook, chapters.length, router, shortBook]);

  // Handle theme navigation from menu
  const handleThemeClick = useCallback(
    (themeChapter, themeId) => {
      const shortBookName = shortBook(selectedBook);

      // If navigating to same chapter, just scroll
      if (parseInt(themeChapter) === parseInt(selectedChapter)) {
        scrollToElement(themeId.toString());
        // Close the menu
        const menuCheckbox = document.getElementById('menuCheckbox');
        if (menuCheckbox) menuCheckbox.checked = false;
        return;
      }

      // Navigate to different chapter: update state + localStorage, then navigate with hash
      const chapterStr = themeChapter.toString();
      localStorage.setItem('selectedChapter', chapterStr);
      setSelectedChapter(chapterStr);

      // Use router.push so history behaves naturally (push vs replace is optional)
      router.push(`/${shortBookName}/${chapterStr}#${themeId}`);

      // Close the menu after navigation
      const menuCheckbox = document.getElementById('menuCheckbox');
      if (menuCheckbox) menuCheckbox.checked = false;
    },
    [selectedBook, selectedChapter, router, shortBook, scrollToElement],
  );

  // Memoize chapter grouping for themes
  const chaptersForThemes = useMemo(() => {
    const seen = new Set();
    return themes.map((theme) => {
      const shouldShow = !seen.has(theme.თავი);
      seen.add(theme.თავი);
      return { ...theme, showChapter: shouldShow };
    });
  }, [themes]);

  // Memoize topics tracking
  const versesWithTopics = useMemo(() => {
    const topics = new Set();
    return verses.map((verse) => {
      const shouldShowTopic = !topics.has(verse.თემა);
      topics.add(verse.თემა);
      return { ...verse, showTopic: shouldShowTopic };
    });
  }, [verses]);

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
                  <div className={'book-name ' + bookFontBold.className}>
                    {selectedBook} (თემები)
                  </div>
                  {chaptersForThemes.map((theme) => {
                    return (
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
                    );
                  })}
                </ul>
              </div>
            </nav>

            <div className="book-selector">
              <select
                name="books"
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
                name="chapters"
                value={selectedChapter}
                className={`chapter-selector ${bookFontBold.className}`}
                onChange={handleChapterChange}
              >
                {chapters.length === 0 ? (
                  <option value={selectedChapter}>თავი {selectedChapter}</option>
                ) : (
                  chapters.map((chapter) => (
                    <option key={chapter.თავი} value={chapter.თავი}>
                      თავი {chapter.თავი}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="btn-container">
              <button
                className={`btn ${textFont.className}`}
                onClick={() => {
                  if (!loaded) return;
                  if (loadingVerses) return;
                  if (verses.length < 1) return;

                  prevChapter();
                }}
              >
                {'<'}{' '}
                <span>
                  წინა <span>თავი</span>
                </span>
              </button>
              <button
                className={`btn ${textFont.className}`}
                onClick={() => {
                  if (!loaded) return;
                  if (loadingVerses) return;
                  if (verses.length < 1) return;

                  nextChapter();
                }}
              >
                <span>
                  შემდეგი <span>თავი</span>
                </span>{' '}
                {'>'}
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
            {/* Initial page load */}
            {!loaded && (
              <>
                <Placeholder />
                <div className={`loading-text ${textFont.className}`}>
                  <Image
                    src="/cross-orthodox.svg"
                    width={42}
                    height={42}
                    alt="ჯვარი"
                    loading="eager"
                    priority
                  />
                  წმინდა წერილი
                </div>
                <Placeholder />
              </>
            )}

            {/* Loading verses after navigation */}
            {loaded && loadingVerses && (
              <>
                <Placeholder />
                <div className={`loading-text ${textFont.className}`}>
                  <Image
                    src="/cross-orthodox.svg"
                    width={42}
                    height={42}
                    alt="ჯვარი"
                    loading="eager"
                  />
                  იტვირთება...
                </div>
                <Placeholder />
              </>
            )}

            {/* Display verses */}
            {loaded &&
              !loadingVerses &&
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
              ))}
          </div>

          {verses.length > 0 && !loadingVerses && (
            <button
              className={`btn bottom-next-page ${textFont.className}`}
              onClick={() => {
                if (!loaded) return;
                if (loadingVerses) return;
                if (verses.length < 1) return;

                nextChapter();
              }}
            >
              შემდეგი თავი {'>'}
            </button>
          )}
        </div>
      </div>
    </Suspense>
  );
};

export default Page;
