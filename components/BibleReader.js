'use client';

import BibleNavigation from './BibleNavigation';
import ReaderSettings from './ReaderSettings';
import BibleContent from './BibleContent';
import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getShortBook } from '@/lib/utils';
import { BOOKS } from '@/lib/constants';

export default function BibleReader({ activeBook, activeChapter, chapters, themes, verses, isRoot }) {
    const router = useRouter();
    const [controlsVisible, setControlsVisible] = useState(true);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (isRoot) {
            const storedBook = typeof window !== 'undefined' ? localStorage.getItem('selectedBook') : null;
            const storedChapter = typeof window !== 'undefined' ? localStorage.getItem('selectedChapter') : null;

            if (storedBook && storedChapter) {
                const short = getShortBook(storedBook);
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
            />
            <ReaderSettings />
            <BibleContent
                activeBook={activeBook}
                activeChapter={activeChapter}
                verses={verses}
                chaptersLength={chapters?.length || 0}
                setControlsVisible={setControlsVisible}
                loading={isPending}
                startTransition={startTransition}
            />
        </div>
    );
}
