'use client';
import { useState, useEffect, use, Suspense, useMemo, useCallback, useRef } from 'react';
import { getChapters, getThemes, getVerses, getBooks } from '../actions';
import Placeholder from '@/components/Placeholder';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import localFont from 'next/font/local';
import Image from 'next/image';

import './page.css';

const VERSE_LOAD_TIMEOUT_MS = 15000;

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
  const [verseLoadError, setVerseLoadError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const verseRequestIdRef = useRef(0);
  const lastScrollYRef = useRef(0);

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

  // Scroll to element with offset (slower duration on mobile)
  const scrollToElement = useCallback((elementId, showControls = false) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (showControls) setControlsVisible(true);

    const controlsPanel = document.querySelector('.controls');
    let offset = controlsPanel ? controlsPanel.offsetHeight + 20 : 80;
    if (showControls) offset = 0;
    const elementPosition = element.getBoundingClientRect().top;
    const targetPosition = elementPosition + window.pageYOffset - offset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    //? scroll with animation
    // const duration = isMobile ? 1000 : 450;

    // const startTime = performance.now();

    // const animateScroll = (currentTime) => {
    //   const elapsed = currentTime - startTime;
    //   const progress = Math.min(elapsed / duration, 1);
    //   const ease =
    //     progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    //   window.scrollTo(0, startPosition + distance * ease);

    //   if (progress < 1) {
    //     requestAnimationFrame(animateScroll);
    //   }
    // };

    const animateScroll = (currentTime) => {
      window.scrollTo(0, startPosition + distance);
    };

    requestAnimationFrame(animateScroll);
  }, []);

  console.log('Page render');

  // Sync state from URL whenever the route (slug) changes (e.g. theme click to another chapter)
  useEffect(() => {
    let book = decodedSlug[0];
    let chapter = decodedSlug[1];

    if (book) {
      const bookObj = BOOKS.find((b) => b.short === book);
      book = bookObj ? bookObj.name : book;
      const resolvedBook = book;
      const resolvedChapter = chapter || '1';

      // Store in localStorage first to reflect sync
      if (resolvedBook) localStorage.setItem('selectedBook', resolvedBook);
      if (resolvedChapter) localStorage.setItem('selectedChapter', resolvedChapter);

      // Schedule state update for next microtask to avoid cascading render
      Promise.resolve().then(() => {
        setSelectedBook(resolvedBook);
        setSelectedChapter(resolvedChapter);
      });
    } else {
      const storedBook = localStorage.getItem('selectedBook') || 'მათეს სახარება';
      const storedChapter = localStorage.getItem('selectedChapter') || '1';

      Promise.resolve().then(() => {
        setSelectedBook(storedBook);
        setSelectedChapter(storedChapter);
      });

      const shortBookName = BOOKS.find((b) => b.name === storedBook)?.short || 'მათე';
      router.replace(`/${shortBookName}/${storedChapter}`);
    }

    // Schedule setLoaded to avoid cascading renders inside effect (see React lint warning)
    Promise.resolve().then(() => {
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Hide controls when scrolling down, show when scrolling up or near top
  useEffect(() => {
    const SCROLL_THRESHOLD = 2;
    const TOP_THRESHOLD = 80;

    const handleScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      const lastY = lastScrollYRef.current;

      if (y <= TOP_THRESHOLD) {
        setControlsVisible(true);
      } else if (y > lastY + SCROLL_THRESHOLD) {
        setControlsVisible(false);
      } else if (y < lastY - SCROLL_THRESHOLD) {
        setControlsVisible(true);
      }

      lastScrollYRef.current = y;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to active chapter when menu opens
  useEffect(() => {
    const menuCheckbox = document.getElementById('menuCheckbox');
    if (!menuCheckbox) return;

    const handleMenuToggle = () => {
      if (menuCheckbox.checked) {
        // Menu is opening, scroll to active chapter
        setTimeout(() => {
          const menu = document.getElementById('menu');
          if (!menu) return;

          // Find the first theme item that matches the current chapter
          const activeChapterElement = Array.from(menu.querySelectorAll('.menu-chapter')).find(
            (el) => {
              const chapterText = el.textContent;
              const match = chapterText.match(/თავი (\d+)/);
              return match && match[1] === selectedChapter;
            }
          );

          if (activeChapterElement) {
            activeChapterElement.scrollIntoView({
              behavior: 'instant',
              block: 'start',
            });
          }
        }, 100); // Small delay to ensure menu animation has started
      }
    };

    menuCheckbox.addEventListener('change', handleMenuToggle);
    return () => menuCheckbox.removeEventListener('change', handleMenuToggle);
  }, [selectedChapter]);

  // Close menu when clicking outside
  useEffect(() => {
    const menuCheckbox = document.getElementById('menuCheckbox');
    const menuToggle = document.getElementById('menuToggle');
    if (!menuCheckbox || !menuToggle) return;

    const handleClickOutside = (event) => {
      // Only handle clicks when menu is open
      if (!menuCheckbox.checked) return;

      // Check if click is outside the menu toggle area
      if (!menuToggle.contains(event.target)) {
        menuCheckbox.checked = false;
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch chapters and themes when book changes
  useEffect(() => {
    console.log('useEffect [selectedBook]');
    if (!selectedBook) return;

    // console.log('Fetching chapters and themes for:', selectedBook);

    Promise.all([getChapters(selectedBook), getThemes(selectedBook)]).then(
      ([chaptersData, themesData]) => {
        setChapters(chaptersData);
        setThemes(themesData);
      }
    );
  }, [selectedBook]);

  // Fetch verses when book or chapter changes
  useEffect(() => {
    if (!selectedBook || !selectedChapter) return;

    const thisRequestId = ++verseRequestIdRef.current;

    // Defer setState calls to avoid cascading renders in effect
    Promise.resolve().then(() => {
      setVerseLoadError(null);
      setLoadingVerses(true);
    });

    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('timeout')), VERSE_LOAD_TIMEOUT_MS);
    });

    const finish = (data, isError = false) => {
      if (timeoutId) clearTimeout(timeoutId);
      if (thisRequestId !== verseRequestIdRef.current) return;
      setLoadingVerses(false);
      if (isError) {
        setVerseLoadError(true);
        setVerses([]);
      } else {
        setVerseLoadError(null);
        setVerses(data ?? []);
      }
    };

    Promise.race([getVerses(selectedBook, selectedChapter), timeoutPromise])
      .then((data) => finish(data, false))
      .catch(() => finish(null, true));

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [selectedBook, selectedChapter, retryKey]);

  // Scroll to hash anchor after verses are loaded
  useEffect(() => {
    if (!loaded || loadingVerses || verses.length === 0) return;

    const hash = window.location.hash;
    if (hash) {
      const elementId = hash.substring(1);
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToElement(elementId, true);
        }, 100);
      });
    }
  }, [loaded, loadingVerses, verses.length, scrollToElement]);

  // Handle hash changes separately (for same-page navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && !loadingVerses && verses.length > 0) {
        const elementId = hash.substring(1);
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollToElement(elementId, true);
          }, 50);
        });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [loadingVerses, verses.length, scrollToElement]);

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
    [router, shortBook]
  );

  const handleChapterChange = useCallback(
    (e) => {
      const newChapter = e.target.value;
      const shortBookName = shortBook(selectedBook);

      localStorage.setItem('selectedChapter', newChapter);
      setSelectedChapter(newChapter);
      router.push(`/${shortBookName}/${newChapter}`);
    },
    [selectedBook, router, shortBook]
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
        <div className={`controls${controlsVisible ? '' : ' controls--hidden'}`}>
          <nav role="navigation">
            <div id="menuToggle">
              <input type="checkbox" id="menuCheckbox" />
              <span></span>
              <span></span>
              <span></span>

              <ul id="menu">
                <div className={'book-name ' + bookFontBold.className}>{selectedBook} (თემები)</div>
                {chaptersForThemes.map((theme) => {
                  const shortBookName = shortBook(selectedBook);
                  const isSameChapter = parseInt(theme.თავი) === parseInt(selectedChapter);
                  const href = isSameChapter
                    ? `#${theme.id}`
                    : `/${shortBookName}/${theme.თავი}#${theme.id}`;
                  return (
                    <li className={textFont.className} key={theme.id}>
                      {theme.showChapter && (
                        <div className={'menu-chapter ' + bookFontBold.className}>
                          •- თავი {theme.თავი} -•
                        </div>
                      )}
                      <Link
                        href={href}
                        onClick={(e) => {
                          if (isSameChapter) {
                            e.preventDefault();
                            scrollToElement(theme.id.toString(), true);
                          }
                          const menuCheckbox = document.getElementById('menuCheckbox');
                          if (menuCheckbox) menuCheckbox.checked = false;
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <label htmlFor="menuCheckbox" style={{ cursor: 'pointer' }}>
                          {theme.თემა}
                        </label>
                      </Link>
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

        <div className="content">
          <h1 className={`header ${bookFontBold.className}`}>
            {loaded && !loadingVerses && (
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

            {/* Timeout or load error — show retry */}
            {loaded && !loadingVerses && verseLoadError && (
              <div
                className={`loading-text ${textFont.className}`}
                style={{ flexDirection: 'column', gap: '1rem' }}
              >
                <span>ვერ ჩაიტვირთა. სცადეთ თავიდან.</span>
                <button
                  type="button"
                  className={`btn ${textFont.className}`}
                  onClick={() => setRetryKey((k) => k + 1)}
                >
                  თავიდან ცდა
                </button>
              </div>
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
                    <span className="index">{index + 1}</span>. {verse.ტექსტი}
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
