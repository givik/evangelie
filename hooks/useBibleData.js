'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isSynced,
  getVersesFromDB,
  getThemesFromDB,
  getChaptersFromDB,
  getCommentaryFromDB,
  searchBibleInDB,
} from '@/lib/bibleDB';
import { searchBible, getVerseCommentary } from '@/app/actions';

export function useBibleData(
  activeBook,
  activeChapter,
  initialVerses,
  initialThemes,
  initialChapters,
) {
  const [verses, setVerses] = useState(initialVerses);
  const [themes, setThemes] = useState(initialThemes);
  const [chapters, setChapters] = useState(initialChapters);
  const [synced, setSyncedState] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const isSyncComplete = await isSynced();
      setSyncedState(isSyncComplete);

      if (isSyncComplete) {
        try {
          const [dbVerses, dbThemes, dbChapters] = await Promise.all([
            getVersesFromDB(activeBook, activeChapter),
            getThemesFromDB(activeBook),
            getChaptersFromDB(activeBook),
          ]);
          setVerses(dbVerses);
          setThemes(dbThemes);
          setChapters(dbChapters);
        } catch (error) {
          console.error('Failed to fetch from IndexedDB:', error);
          // Fallback to initial props already set
        }
      } else {
        setVerses(initialVerses);
        setThemes(initialThemes);
        setChapters(initialChapters);
      }
    }

    fetchData();
  }, [activeBook, activeChapter, initialVerses, initialThemes, initialChapters]);

  const search = useCallback(async (query) => {
    const isSyncComplete = await isSynced();
    if (isSyncComplete) {
      return await searchBibleInDB(query);
    } else {
      return await searchBible(query);
    }
  }, []);

  const getCommentary = useCallback(async (verseId) => {
    const isSyncComplete = await isSynced();
    if (isSyncComplete) {
      return await getCommentaryFromDB(verseId);
    } else {
      return await getVerseCommentary(verseId);
    }
  }, []);

  return { verses, themes, chapters, synced, search, getCommentary };
}
