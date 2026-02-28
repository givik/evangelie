'use client';

import { useState, useEffect, useCallback } from 'react';
import { isSynced, getVersesFromDB, getThemesFromDB, searchBibleInDB } from '@/lib/bibleDB';
import { searchBible } from '@/app/actions';

export function useBibleData(activeBook, activeChapter, initialVerses, initialThemes) {
  const [verses, setVerses] = useState(initialVerses);
  const [themes, setThemes] = useState(initialThemes);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const synced = await isSynced();
      setIsOffline(synced);

      if (synced) {
        try {
          const [dbVerses, dbThemes] = await Promise.all([
            getVersesFromDB(activeBook, activeChapter),
            getThemesFromDB(activeBook),
          ]);
          setVerses(dbVerses);
          setThemes(dbThemes);
        } catch (error) {
          console.error('Failed to fetch from IndexedDB:', error);
          // Fallback to initial props already set
        }
      } else {
        setVerses(initialVerses);
        setThemes(initialThemes);
      }
    }

    fetchData();
  }, [activeBook, activeChapter, initialVerses, initialThemes]);

  const search = useCallback(async (query) => {
    const synced = await isSynced();
    if (synced) {
      return await searchBibleInDB(query);
    } else {
      return await searchBible(query);
    }
  }, []);

  return { verses, themes, isOffline, search };
}
