'use client';

import BibleNavigation from './BibleNavigation';
import ReaderSettings from './ReaderSettings';
import BibleContent from './BibleContent';
import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getbookSlug } from '@/lib/utils';
import { BOOKS } from '@/lib/constants';
import { useBibleData } from '@/hooks/useBibleData';

export default function BibleReader({
  activeBook,
  activeChapter,
  activeVerse,
  chapters,
  themes: initialThemes,
  verses: initialVerses,
  isRoot,
}) {
  const router = useRouter();
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isPending, startTransition] = useTransition();

  const { verses, themes, search } = useBibleData(
    activeBook,
    activeChapter,
    initialVerses,
    initialThemes,
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
          router.replace(`/${short}/${storedChapter}`);
        }
      }
    } else {
      // Save current position
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedBook', activeBook);
        localStorage.setItem('selectedChapter', activeChapter);
      }
    }
  }, [isRoot, activeBook, activeChapter, router]);

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
      />
    </div>
  );
}
