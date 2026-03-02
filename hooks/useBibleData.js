'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Store initial props in refs so they don't cause re-renders
  const initialVersesRef = useRef(initialVerses);
  const initialThemesRef = useRef(initialThemes);
  const initialChaptersRef = useRef(initialChapters);

  // Keep refs up to date when server props change
  useEffect(() => {
    initialVersesRef.current = initialVerses;
    initialThemesRef.current = initialThemes;
    initialChaptersRef.current = initialChapters;
  }, [initialVerses, initialThemes, initialChapters]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const isSyncComplete = await isSynced();
      if (cancelled) return;
      setSyncedState(isSyncComplete);

      if (isSyncComplete) {
        try {
          const [dbVerses, dbThemes, dbChapters] = await Promise.all([
            getVersesFromDB(activeBook, activeChapter),
            getThemesFromDB(activeBook),
            getChaptersFromDB(activeBook),
          ]);
          if (cancelled) return;
          setVerses(dbVerses);
          setThemes(dbThemes);
          setChapters(dbChapters);
        } catch (error) {
          console.error('Failed to fetch from IndexedDB:', error);
        }
      } else {
        if (cancelled) return;
        setVerses(initialVersesRef.current);
        setThemes(initialThemesRef.current);
        setChapters(initialChaptersRef.current);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [activeBook, activeChapter]); // Only depend on book/chapter, not array props

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
