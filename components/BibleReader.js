'use client';

import BibleNavigation from './BibleNavigation';
import ReaderSettings from './ReaderSettings';
import BibleContent from './BibleContent';
import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getbookSlug } from '@/lib/utils';
import { BOOKS } from '@/lib/constants';
import { useBibleData } from '@/hooks/useBibleData';

export default function BibleReader({
  activeBook: initialBook,
  activeChapter: initialChapter,
  activeVerse,
  chapters: initialChapters,
  themes: initialThemes,
  verses: initialVerses,
  isRoot,
}) {
  const router = useRouter();
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Client-side state for active book/chapter
  const [activeBook, setActiveBook] = useState(initialBook);
  const [activeChapter, setActiveChapter] = useState(initialChapter);

  // Sync with server-provided props when they change (normal online navigation)
  useEffect(() => {
    setActiveBook(initialBook);
    setActiveChapter(initialChapter);
  }, [initialBook, initialChapter]);

  const { verses, themes, chapters, synced, search, getCommentary } = useBibleData(
    activeBook,
    activeChapter,
    initialVerses,
    initialThemes,
    initialChapters,
  );

  // Client-side navigation function: updates state + URL without server fetch
  const navigate = useCallback(
    (book, chapter, hash = '') => {
      const slug = getbookSlug(book);
      const url = `/${slug}/${chapter}${hash}`;

      if (synced) {
        // Client-side only: update state and URL via pushState
        setActiveBook(book);
        setActiveChapter(chapter.toString());
        window.history.pushState(null, '', url);
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Save position
        localStorage.setItem('selectedBook', book);
        localStorage.setItem('selectedChapter', chapter.toString());
      } else {
        // Online: use Next.js router for server-side navigation
        startTransition(() => {
          router.push(url);
        });
      }
    },
    [synced, router, startTransition],
  );

  useEffect(() => {
    if (isRoot) {
      const storedBook =
        typeof window !== 'undefined' ? localStorage.getItem('selectedBook') : null;
      const storedChapter =
        typeof window !== 'undefined' ? localStorage.getItem('selectedChapter') : null;

      if (storedBook && storedChapter) {
        const short = getbookSlug(storedBook);
        if (short) {
          if (synced) {
            setActiveBook(storedBook);
            setActiveChapter(storedChapter);
            window.history.replaceState(null, '', `/${short}/${storedChapter}`);
          } else {
            router.replace(`/${short}/${storedChapter}`);
          }
        }
      }
    } else {
      // Save current position
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedBook', activeBook);
        localStorage.setItem('selectedChapter', activeChapter);
      }
    }
  }, [isRoot, activeBook, activeChapter, router, synced]);

  return (
    <div className="container">
      <BibleNavigation
        activeBook={activeBook}
        activeChapter={activeChapter}
        chapters={chapters}
        themes={themes}
        controlsVisible={controlsVisible}
        setControlsVisible={setControlsVisible}
        startTransition={startTransition}
        search={search}
        navigate={navigate}
      />
      <ReaderSettings />
      <BibleContent
        activeBook={activeBook}
        activeChapter={activeChapter}
        activeVerse={activeVerse}
        verses={verses}
        chaptersLength={chapters?.length || 0}
        setControlsVisible={setControlsVisible}
        loading={isPending}
        startTransition={startTransition}
        getCommentary={getCommentary}
        navigate={navigate}
      />
    </div>
  );
}
