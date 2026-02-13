'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import localFont from 'next/font/local';
import {
  BOOKS,
  MENU_OPEN_DELAY_MS,
  TOP_THRESHOLD_PX,
  SCROLL_UP_THRESHOLD_PX,
  SCROLL_DOWN_THRESHOLD_PX,
} from '@/lib/constants';
import { scrollToElement, getShortBook } from '@/lib/utils';

// Fonts configuration
// Adjust paths relative to this file (components/BibleNavigation.js -> ../app/fonts/...)
const bookFontBold = localFont({
  src: '../app/fonts/gl-lortkipanidze-bold.ttf',
});

const textFont = localFont({
  src: '../app/fonts/bpg_nino_elite_round.otf',
});

export default function BibleNavigation({
  activeBook,
  activeChapter,
  chapters = [],
  themes = [],
  controlsVisible,
  setControlsVisible,
  startTransition,
}) {
  const router = useRouter();
  const [currentHash, setCurrentHash] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollYRef = useRef(0);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const disableAutoHideRef = useRef(false);

  // Update currentHash on mount and hashchange
  useEffect(() => {
    const updateHash = () => setCurrentHash(window.location.hash);
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  // -- Handlers --

  const handleBookChange = (e) => {
    const newBook = e.target.value;
    const short = getShortBook(newBook);
    // Navigate to chapter 1 of new book
    startTransition(() => {
      router.push(`/${short}/1`);
    });
  };

  const handleChapterChange = (e) => {
    const newChapter = e.target.value;
    const short = getShortBook(activeBook);
    startTransition(() => {
      router.push(`/${short}/${newChapter}`);
    });
  };

  const prevChapter = () => {
    const curr = parseInt(activeChapter);
    if (curr <= 1) return;
    const short = getShortBook(activeBook);
    startTransition(() => {
      router.push(`/${short}/${curr - 1}`);
    });
  };

  const nextChapter = () => {
    const curr = parseInt(activeChapter);
    // Safe check if chapters array is populated, otherwise just assume unlimited?
    // Usually chapters array is passed.
    if (chapters.length > 0 && curr >= chapters.length) return;

    const short = getShortBook(activeBook);
    startTransition(() => {
      router.push(`/${short}/${curr + 1}`);
    });
  };

  // -- Effects --

  // Scroll visibility logic
  useEffect(() => {
    lastScrollYRef.current = window.scrollY || document.documentElement.scrollTop;

    const handleScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      const lastY = lastScrollYRef.current;

      // Skip auto-hide if user clicked a Link or visited with hash
      if (disableAutoHideRef.current) {
        return;
      }

      if (y <= TOP_THRESHOLD_PX) {
        setControlsVisible(true);
      } else if (y > lastY + SCROLL_DOWN_THRESHOLD_PX) {
        setControlsVisible(false);
      } else if (y < lastY - SCROLL_UP_THRESHOLD_PX) {
        setControlsVisible(true);
      }

      lastScrollYRef.current = y;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if page was loaded with hash parameter
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      // Disable auto-hide for 3 seconds when page loads with hash
      disableAutoHideRef.current = true;
      setControlsVisible(true);

      setTimeout(() => {
        disableAutoHideRef.current = false;
      }, 3000);
    }
  }, [setControlsVisible]);

  // Menu auto-scroll logic
  useEffect(() => {
    if (!menuOpen) return;

    const handleMenuScroll = () => {
      setTimeout(() => {
        const menu = menuRef.current;
        if (!menu) return;

        // Prioritize scrolling to the active theme if hash exists
        const hash = window.location.hash;
        if (hash) {
          const elementId = hash.substring(1);
          // Search for a link that has this hash as href or contains the theme ID
          const activeThemeElement = Array.from(menu.querySelectorAll('a')).find((el) =>
            el.getAttribute('href')?.includes(`#${elementId}`),
          );
          if (activeThemeElement) {
            activeThemeElement.scrollIntoView({ behavior: 'instant', block: 'center' });
            return; // Found theme, no need to scroll to chapter
          }
        }

        // Fallback: Find active chapter
        const activeChapterElement = Array.from(menu.querySelectorAll('.menu-chapter')).find(
          (el) => {
            const match = el.textContent.match(/თავი (\d+)/);
            return match && match[1] === activeChapter.toString();
          },
        );
        if (activeChapterElement) {
          activeChapterElement.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      }, MENU_OPEN_DELAY_MS);
    };

    handleMenuScroll();
  }, [menuOpen, activeChapter]);

  // Click outside menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuOpen) return;
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  // Prepare themes grouping
  // (Logic from page.js)
  const chaptersForThemes = themes.map((theme, i, arr) => {
    // Logic for showing chapter header
    // We need to know if this is the first item of this chapter in the list.
    // The original code was: const seen = new Set(); map...
    // But we can't do that easily inside map unless we pre-calc.
    return theme;
  });

  // We need to pre-process themes to add showChapter
  const processedThemes = [];
  const seenChapters = new Set();
  themes.forEach((theme) => {
    const showChapter = !seenChapters.has(theme.თავი);
    seenChapters.add(theme.თავი);
    processedThemes.push({ ...theme, showChapter });
  });

  return (
    <>
      <div className={`controls-cover${controlsVisible ? '' : ' cover--hidden'}`}></div>
      <div className={`controls${controlsVisible ? '' : ' controls--hidden'}`}>
        <nav role="navigation">
          <div id="menuToggle" className={menuOpen ? 'open' : ''}>
            <button
              ref={menuButtonRef}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'მენიუს დახურვა' : 'მენიუს გახსნა'}
              aria-expanded={menuOpen}
              aria-controls="menu"
              className="menu-button"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            <ul id="menu" ref={menuRef} aria-hidden={!menuOpen} className={menuOpen ? 'open' : ''}>
              <div className={'book-name ' + bookFontBold.className}>{activeBook} (თემები)</div>
              {processedThemes.map((theme) => {
                const shortBookName = getShortBook(activeBook);
                const isSameChapter = parseInt(theme.თავი) === parseInt(activeChapter);
                const isActiveTheme = currentHash === `#${theme.id}`;
                const href = isSameChapter
                  ? `#${theme.id}`
                  : `/${shortBookName}/${theme.თავი}#${theme.id}`;

                return (
                  <li
                    className={`${textFont.className} ${isActiveTheme ? 'active-theme' : ''}`}
                    key={theme.id}
                  >
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
                          // Disable auto-hide when clicking Link
                          disableAutoHideRef.current = true;
                          scrollToElement(theme.id.toString(), setControlsVisible);

                          // Re-enable auto-hide after 3 seconds
                          setTimeout(() => {
                            disableAutoHideRef.current = false;
                          }, 3000);
                        } else {
                          e.preventDefault();
                          // Disable auto-hide when clicking Link
                          disableAutoHideRef.current = true;
                          setControlsVisible(true);

                          startTransition(() => {
                            const shortBookName = getShortBook(activeBook);
                            router.push(`/${shortBookName}/${theme.თავი}#${theme.id}`);
                          });

                          // Re-enable auto-hide after 3 seconds
                          setTimeout(() => {
                            disableAutoHideRef.current = false;
                          }, 3000);
                        }
                        setMenuOpen(false);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <span>- {theme.თემა}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="search-container">
          <input
            type="text"
            placeholder="ბიბლიაში ძებნა"
            className={textFont.className}
            aria-label="ბიბლიაში ძებნა"
          />
          <div className="search-icon-circle"></div>
        </div>

        <div className="book-selector">
          <select
            name="books"
            value={activeBook}
            className={`short-book-name ${bookFontBold.className}`}
            onChange={handleBookChange}
            aria-label="აირჩიეთ წიგნი"
          >
            {BOOKS.map((book) => (
              <option key={book.short} value={book.name}>
                {book.short}
              </option>
            ))}
          </select>

          <select
            name="chapters"
            value={activeChapter}
            className={`chapter-selector ${bookFontBold.className}`}
            onChange={handleChapterChange}
            aria-label="აირჩიეთ თავი"
          >
            {chapters.length === 0 ? (
              <option value={activeChapter}>თავი {activeChapter}</option>
            ) : (
              chapters.map((chapter) => (
                <option key={chapter.თავი} value={chapter.თავი}>
                  {chapter.თავი}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="btn-container">
          <button
            className={`btn ${textFont.className}`}
            onClick={prevChapter}
            disabled={parseInt(activeChapter) <= 1}
            aria-label="წინა თავი"
          >
            {'<'}{' '}
            <span aria-hidden="true">
              წინა <span>თავი</span>
            </span>
          </button>
          <button
            className={`btn ${textFont.className}`}
            onClick={nextChapter}
            disabled={chapters.length > 0 && parseInt(activeChapter) >= chapters.length}
            aria-label="შემდეგი თავი"
          >
            <span aria-hidden="true">
              შემდეგი <span>თავი</span>
            </span>{' '}
            {'>'}
          </button>
        </div>
      </div>
    </>
  );
}
