'use client';
import React, { useRef, useState, useEffect } from 'react';

const CustomScroll = ({ children, height = '400px' }) => {
  const contentRef = useRef(null);
  const thumbRef = useRef(null);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [thumbTop, setThumbTop] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  const updateScrollbar = () => {
    if (!contentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;

    // Calculate thumb height as percentage
    const thumbHeightPercent = (clientHeight / scrollHeight) * 100;
    setThumbHeight(thumbHeightPercent);

    // Calculate thumb position
    const scrollRatio = scrollTop / (scrollHeight - clientHeight);
    const thumbTopPercent = scrollRatio * (100 - thumbHeightPercent);
    setThumbTop(thumbTopPercent);
  };

  useEffect(() => {
    updateScrollbar();
    window.addEventListener('resize', updateScrollbar);
    return () => window.removeEventListener('resize', updateScrollbar);
  }, [children]);

  const handleScroll = () => {
    updateScrollbar();
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart(e.clientY);
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setDragStart(e.touches[0].clientY);
    e.preventDefault();
  };

  const handleMove = (clientY) => {
    if (!isDragging || !contentRef.current || !thumbRef.current) return;

    const scrollbarRect = thumbRef.current.parentElement.getBoundingClientRect();
    const scrollRatio = (clientY - scrollbarRect.top) / scrollbarRect.height;
    const { scrollHeight, clientHeight } = contentRef.current;

    contentRef.current.scrollTop = scrollRatio * (scrollHeight - clientHeight);
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientY);
  };

  const handleTouchMove = (e) => {
    handleMove(e.touches[0].clientY);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging]);

  return (
    <div style={styles.container}>
      <div ref={contentRef} onScroll={handleScroll} style={{ ...styles.content, height }}>
        {children}
      </div>

      <div style={styles.scrollbar}>
        <div
          ref={thumbRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{
            ...styles.scrollbarThumb,
            height: `${thumbHeight}%`,
            top: `${thumbTop}%`,
            opacity: thumbHeight >= 100 ? 0 : 1, // Hide if content doesn't scroll
          }}
        />
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    width: '100%',
  },
  content: {
    overflowY: 'scroll',
    paddingRight: '20px',
    WebkitOverflowScrolling: 'touch',
    // Hide native scrollbar
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none', // IE/Edge
  },
  scrollbar: {
    position: 'absolute',
    right: '0',
    top: '0',
    width: '8px',
    height: '100%',
    background: '#f1f1f1',
    borderRadius: '4px',
    pointerEvents: 'none',
  },
  scrollbarThumb: {
    position: 'absolute',
    width: '100%',
    background: '#888',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    pointerEvents: 'auto',
  },
};

// Add this to your global CSS to hide webkit scrollbar
const globalStyles = `
  .custom-scroll-content::-webkit-scrollbar {
    display: none;
  }
`;

export default CustomScroll;
