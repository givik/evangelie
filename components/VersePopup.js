'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import localFont from 'next/font/local';

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
  getCommentary,
}) {
  const [commentaries, setCommentaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCommentary() {
      setLoading(true);
      try {
        const data = await getCommentary(verseId);
        if (!cancelled) {
          setCommentaries(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch commentary:', error);
        if (!cancelled) {
          setCommentaries([]);
          setLoading(false);
        }
      }
    }

    fetchCommentary();
    return () => {
      cancelled = true;
    };
  }, [verseId, getCommentary]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body/background scroll while popup is open (iOS-safe)
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
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
          <div className="verse-popup-title" style={{ textAlign: 'center', width: '100%' }}>
            განმარტებანი
            <div style={{ fontSize: '1.5rem', marginTop: '0.5rem', color: 'grey' }}>
              {activeBook} {activeChapter}:{verseIndex}
            </div>
          </div>
        </div>

        <div className="verse-popup-body">
          <div className="verse-popup-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            {verseText}
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
