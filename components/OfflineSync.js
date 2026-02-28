'use client';

import { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar';
import { isSynced, setSynced, saveToStore } from '@/lib/bibleDB';
import { getSyncData } from '@/app/actions';

export default function OfflineSync() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function checkAndSync() {
      const synced = await isSynced();
      if (synced) return;

      setVisible(true);
      setProgress(10); // Initial progress

      try {
        const data = await getSyncData();
        if (data.error) throw new Error(data.error);

        setProgress(50);

        // Save data in chunks to avoid blocking the main thread
        await saveToStore('verses', data.verses);
        setProgress(75);

        await saveToStore('commentaries', data.commentaries);
        setProgress(85);

        await saveToStore('themes', data.themes);
        setProgress(95);

        await setSynced(true);
        setProgress(100);

        // Hide progress bar after a short delay
        setTimeout(() => {
          setVisible(false);
        }, 1000);
      } catch (error) {
        console.error('Offline sync failed:', error);
        setVisible(false);
      }
    }

    checkAndSync();
  }, []);

  return <ProgressBar progress={progress} visible={visible} />;
}
