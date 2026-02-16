'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import localFont from 'next/font/local';
import Placeholder from '@/components/Placeholder';
import { getShortBook, scrollToElement } from '@/lib/utils';
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
  verses = [],
  loading = false,
  chaptersLength = 0,
  setControlsVisible,
  startTransition,
}) {
  const router = useRouter();
  const { fontSize, language } = useTheme();

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

    const short = getShortBook(activeBook);
    startTransition(() => {
      router.push(`/${short}/${curr + 1}`);
    });
  };

  return (
    <div
      className={`content ${loading ? 'content--loading' : ''}`}
      style={{ '--font-scale': fontSize }}
    >
      {!loading && (
        <h1 className={`header ${bookFontBold.className}`}>
          <span className="book-name">{activeBook}</span>
          <span className="book-chapter">თავი {activeChapter}</span>
        </h1>
      )}
      {loading && (
        <div className="loading-overlay">
          <Placeholder />
          <Placeholder />
        </div>
      )}

      <div className={`verses ${loading ? 'verses--hidden' : ''}`}>
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
            <p className={textFont.className} style={{ marginTop: '1rem' }}>
              იტვირთება...
            </p>
            <Placeholder />
          </div>
        ) : (
          versesWithTopics.map((verse, index) => (
            <div key={verse.id} id={verse.id.toString()} className={textFont.className}>
              {verse.showTopic && <div className="topic">{verse.თემა && `- ${verse.თემა}`}</div>}
              <p className="verse">
                <span className="index">{index + 1}.</span>
                {language === 'new' ? verse.ტექსტი : verse.ძველი_ტექსტი}
              </p>
            </div>
          ))
        )}
      </div>

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
    </div>
  );
}
