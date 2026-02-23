'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import localFont from 'next/font/local';
import Placeholder from '@/components/Placeholder';
import VersePopup from '@/components/VersePopup';
import { getbookSlug, scrollToElement } from '@/lib/utils';
import { HASH_SCROLL_DELAY_MS } from '@/lib/constants';
import { useTheme } from '@/components/ThemeProvider';

const bookFontBold = localFont({
  src: '../app/fonts/gl-lortkipanidze-bold.ttf',
});

const textFont = localFont({
  src: '../app/fonts/bpg_nino_elite_round.otf',
});

export default function BibleContent({
  activeBook,
  activeChapter,
  activeVerse,
  verses = [],
  loading = false,
  chaptersLength = 0,
  setControlsVisible,
  startTransition,
}) {
  const router = useRouter();
  const { fontSize, language } = useTheme();
  const [selectedVerse, setSelectedVerse] = useState(null);

  // Auto-open popup when URL contains a verse number
  useEffect(() => {
    if (activeVerse && verses.length > 0) {
      const verseNum = parseInt(activeVerse, 10);
      if (!isNaN(verseNum) && verseNum >= 1 && verseNum <= verses.length) {
        const verse = verses[verseNum - 1];
        setSelectedVerse({ id: verse.id, index: verseNum });
      }
    }
  }, [activeVerse, verses]);

  const handleVerseClick = useCallback(
    (verseId, verseIndex) => {
      setSelectedVerse({ id: verseId, index: verseIndex });
      // Update URL to include verse number (shallow — no page reload)
      const bookSlug = getbookSlug(activeBook);
      window.history.pushState(null, '', `/${bookSlug}/${activeChapter}/${verseIndex}`);
    },
    [activeBook, activeChapter],
  );

  const handlePopupClose = useCallback(() => {
    setSelectedVerse(null);
    // Revert URL back to chapter level
    const bookSlug = getbookSlug(activeBook);
    window.history.pushState(null, '', `/${bookSlug}/${activeChapter}`);
  }, [activeBook, activeChapter]);

  // Scroll to hash on mount and hash change
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash) {
        const elementId = hash.substring(1);
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollToElement(elementId, setControlsVisible);
          }, HASH_SCROLL_DELAY_MS);
        });
      }
    };

    handleHashScroll();
    window.addEventListener('hashchange', handleHashScroll);
    return () => window.removeEventListener('hashchange', handleHashScroll);
  }, [verses, setControlsVisible]);

  // Topic grouping logic
  const versesWithTopics = [];
  const seenTopics = new Set();
  verses.forEach((verse) => {
    const showTopic = !seenTopics.has(verse.თემა);
    seenTopics.add(verse.თემა);
    versesWithTopics.push({ ...verse, showTopic });
  });

  const nextChapter = () => {
    const curr = parseInt(activeChapter);
    if (chaptersLength > 0 && curr >= chaptersLength) return;

    const short = getbookSlug(activeBook);
    startTransition(() => {
      router.push(`/${short}/${curr + 1}`);
    });
  };

  return (
    <article
      className={`content ${loading ? 'content--loading' : ''}`}
      style={{ '--font-scale': fontSize }}
    >
      {!loading && (
        <header>
          <h1 className={`header ${bookFontBold.className}`}>
            <span className="book-name">{activeBook}</span>
            <span className="book-chapter">თავი {activeChapter}</span>
          </h1>
        </header>
      )}
      {loading && (
        <div className="loading-overlay">
          <Placeholder />
          <Placeholder />
        </div>
      )}

      <section className={`verses ${loading ? 'verses--hidden' : ''}`}>
        {verses.length === 0 && !loading ? (
          <div
            style={{
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Placeholder />
            <p className={textFont.className} style={{ marginTop: '1rem', fontSize: '1.5rem' }}>
              {/* იტვირთება... */}
            </p>
            <Placeholder />
          </div>
        ) : (
          versesWithTopics.map((verse, index) => (
            <div key={verse.id} id={verse.id.toString()} className={textFont.className}>
              {verse.showTopic && <h2 className="topic">{verse.თემა && `- ${verse.თემა} -`}</h2>}
              <p
                className="verse verse--clickable"
                onClick={() => handleVerseClick(verse.id, index + 1)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleVerseClick(verse.id, index + 1);
                  }
                }}
              >
                <span className="index">{index + 1}. </span>
                {language === 'new' ? verse.ტექსტი : verse.ძველი_ტექსტი}
              </p>
            </div>
          ))
        )}
      </section>

      {!loading &&
        verses.length > 0 &&
        chaptersLength > 0 &&
        parseInt(activeChapter) < chaptersLength && (
          <button
            className={`btn bottom-next-page ${textFont.className}`}
            onClick={nextChapter}
            disabled={chaptersLength > 0 && parseInt(activeChapter) >= chaptersLength}
            aria-label="შემდეგი თავი"
          >
            შემდეგი თავი {'>'}
          </button>
        )}
      {selectedVerse && (
        <VersePopup
          verseId={selectedVerse.id}
          verseIndex={selectedVerse.index}
          onClose={handlePopupClose}
        />
      )}
    </article>
  );
}
