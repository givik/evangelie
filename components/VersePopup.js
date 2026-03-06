'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import localFont from 'next/font/local';

const textFont = localFont({
  src: '../app/fonts/bpg_nino_elite_round.otf',
});

const bookFont = localFont({
  src: '../app/fonts/gl-lortkipanidze-bold.ttf',
});

/* ── Skeleton card for loading state ── */
function SkeletonCard() {
  return (
    <div className="verse-popup-skeleton-card">
      <div className="verse-popup-skeleton-header">
        <div className="verse-popup-skeleton-avatar" />
        <div className="verse-popup-skeleton-name" />
      </div>
      <div className="verse-popup-skeleton-line verse-popup-skeleton-line--long" />
      <div className="verse-popup-skeleton-line verse-popup-skeleton-line--medium" />
      <div className="verse-popup-skeleton-line verse-popup-skeleton-line--short" />
    </div>
  );
}

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
  const [closing, setClosing] = useState(false);
  const sheetRef = useRef(null);
  const dragRef = useRef({ startY: 0, currentY: 0, isDragging: false });

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

  /* ── Animated close ── */
  const animatedClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 280);
  }, [onClose]);

  /* ── Close on Escape ── */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') animatedClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [animatedClose]);

  /* ── Prevent body scroll while popup is open ── */
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, []);

  /* ── Swipe-to-dismiss (touch) ── */
  const handleTouchStart = useCallback((e) => {
    dragRef.current.startY = e.touches[0].clientY;
    dragRef.current.isDragging = true;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!dragRef.current.isDragging) return;
    const dy = e.touches[0].clientY - dragRef.current.startY;
    dragRef.current.currentY = dy;
    if (dy > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
      sheetRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;
    const dy = dragRef.current.currentY;
    if (sheetRef.current) {
      sheetRef.current.style.transition = '';
    }
    if (dy > 120) {
      animatedClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    dragRef.current.currentY = 0;
  }, [animatedClose]);

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) animatedClose();
    },
    [animatedClose],
  );

  /* ── Get author initial for avatar ── */
  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  /* ── Accent colors for author cards ── */
  const accentColors = ['#7c6f5b', '#8b7355', '#6b5d4f', '#937b5e', '#a0845c', '#7a6e5a'];
  const getAccentColor = (index) => accentColors[index % accentColors.length];

  return createPortal(
    <div
      className={`verse-popup-overlay ${closing ? 'verse-popup-overlay--closing' : ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="განმარტება"
    >
      <div
        ref={sheetRef}
        className={`verse-popup-sheet ${closing ? 'verse-popup-sheet--closing' : ''} ${textFont.className}`}
      >
        {/* ── Drag handle ── */}
        {/* <div className="verse-popup-drag-handle-area">
          <div className="verse-popup-drag-handle" />
        </div> */}

        {/* ── Verse quote section ── */}
        <div
          className="verse-popup-quote-section"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="verse-popup-quote-marks">"</div>
          <p className="verse-popup-quote-text">{verseText}</p>
          <p className={`verse-popup-quote-ref ${bookFont.className}`}>
            {activeBook} {activeChapter}:{verseIndex}
          </p>
          {/* ── Close button ── */}
          <button className="verse-popup-close" onClick={animatedClose} aria-label="დახურვა">
            <svg width="28" height="28" viewBox="0 0 18 18" fill="none">
              <path
                d="M14 4L4 14M4 4l10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* ── Commentary section ── */}
        <h3 className="verse-popup-section-title">განმარტებები</h3>
        <div className="verse-popup-body">
          {loading ? (
            <div className="verse-popup-skeleton-list">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : commentaries.length === 0 ? (
            <div className="verse-popup-empty">
              <div className="verse-popup-empty-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle
                    cx="24"
                    cy="24"
                    r="22"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    opacity="0.3"
                  />
                  <path
                    d="M16 20c0-4.4 3.6-8 8-8s8 3.6 8 8c0 3-1.6 5.6-4 6.9V30a2 2 0 01-2 2h-4a2 2 0 01-2-2v-3.1c-2.4-1.3-4-3.9-4-6.9z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    opacity="0.3"
                  />
                  <path
                    d="M20 36h8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.3"
                  />
                </svg>
              </div>
              <p className="verse-popup-empty-text">განმარტება არ მოიძებნა</p>
            </div>
          ) : (
            <div className="verse-popup-cards">
              {commentaries.map((item, index) => (
                <div
                  key={item.id}
                  className="verse-popup-card"
                  style={{
                    '--card-accent': getAccentColor(index),
                    animationDelay: `${index * 60}ms`,
                  }}
                >
                  {item.ავტორი && (
                    <div className="verse-popup-card-author">
                      {/* <span
                        className="verse-popup-author-avatar"
                        style={{ backgroundColor: getAccentColor(index) }}
                      >
                        {getInitial(item.ავტორი)}
                      </span> */}
                      <span className="verse-popup-author-name">{item.ავტორი}</span>
                    </div>
                  )}
                  <p className="verse-popup-card-text">{item.ტექსტი}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
