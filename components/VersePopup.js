'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import localFont from 'next/font/local';
import { getVerseCommentary } from '@/app/actions';

const textFont = localFont({
  src: '../app/fonts/bpg_nino_elite_round.otf',
});

export default function VersePopup({
  verseId,
  verseIndex,
  verseText,
  activeBook,
  activeChapter,
  onClose,
}) {
  const [commentaries, setCommentaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCommentary() {
      setLoading(true);
      const data = await getVerseCommentary(verseId);
      if (!cancelled) {
        setCommentaries(data);
        setLoading(false);
      }
    }

    fetchCommentary();
    return () => {
      cancelled = true;
    };
  }, [verseId]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll while popup is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return createPortal(
    <div
      className="verse-popup-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="განმარტება"
    >
      <div className={`verse-popup ${textFont.className}`}>
        <div className="verse-popup-header">
          <button className="verse-popup-close" onClick={onClose} aria-label="დახურვა">
            ✕
          </button>
          <span className="verse-popup-title">{verseText}</span>
        </div>

        <div className="verse-popup-body">
          <div
            className="verse-popup-title"
            style={{ textAlign: 'center', fontSize: '1.4rem', marginBottom: '1rem' }}
          >
            განმარტებანი ({activeBook} {activeChapter}:{verseIndex})
          </div>
          {loading ? (
            <div className="verse-popup-loading">
              <div className="search-loading-spinner" />
            </div>
          ) : commentaries.length === 0 ? (
            <p className="verse-popup-empty">განმარტება არ მოიძებნა</p>
          ) : (
            commentaries.map((item) => (
              <div key={item.id} className="verse-popup-entry">
                {item.ავტორი && <p className="verse-popup-author">{item.ავტორი}</p>}
                <p className="verse-popup-text">{item.ტექსტი}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
