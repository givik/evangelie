'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import localFont from 'next/font/local';
import Image from 'next/image';
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
    setControlsVisible
}) {
    const router = useRouter();
    const { fontSize } = useTheme();

    // Scroll to hash on mount
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const elementId = hash.substring(1);
            // Wait for render
            requestAnimationFrame(() => {
                setTimeout(() => {
                    scrollToElement(elementId, setControlsVisible);
                }, HASH_SCROLL_DELAY_MS);
            });
        }
    }, [verses]);

    // Topic grouping logic
    const versesWithTopics = [];
    const seenTopics = new Set();
    verses.forEach(verse => {
        const showTopic = !seenTopics.has(verse.თემა);
        seenTopics.add(verse.თემა);
        versesWithTopics.push({ ...verse, showTopic });
    });

    const nextChapter = () => {
        const curr = parseInt(activeChapter);
        if (chaptersLength > 0 && curr >= chaptersLength) return;

        const short = getShortBook(activeBook);
        router.push(`/${short}/${curr + 1}`);
    };

    return (
        <div className="content" style={{ '--font-scale': fontSize }}>
            <h1 className={`header ${bookFontBold.className}`}>
                <span className="book-name">{activeBook}</span>
                <span className="book-chapter">თავი {activeChapter}</span>
            </h1>

            <div className="verses">
                {verses.length === 0 && !loading ? (
                    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Placeholder />
                        <p className={textFont.className} style={{ marginTop: '1rem' }}>იტვირთება...</p>
                        <Placeholder />
                    </div>
                ) : (
                    versesWithTopics.map((verse, index) => (
                        <div key={verse.id} className={textFont.className}>
                            {verse.showTopic && (
                                <div id={verse.id} className="topic">
                                    {verse.თემა && `- ${verse.თემა} -`}
                                </div>
                            )}
                            <p className="verse">
                                <span className="index">{index + 1}.</span> {verse.ტექსტი}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {verses.length > 0 && (
                <button
                    className={`btn bottom-next-page ${textFont.className}`}
                    onClick={nextChapter}
                    disabled={chaptersLength > 0 && parseInt(activeChapter) >= chaptersLength}
                >
                    შემდეგი თავი {'>'}
                </button>
            )}
        </div>
    );
}
