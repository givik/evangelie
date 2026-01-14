// Source - https://stackoverflow.com/a
// Posted by QoP, modified by community. See post 'Timeline' for change history
// Retrieved 2026-01-13, License - CC BY-SA 4.0

import { useState, useEffect } from 'react';

function getWindowDimensions() {
  if (typeof window === 'undefined') {
    return { width: null, height: null };
  }
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

export default function useWindowDimensions() {
  // lazy init + getWindowDimensions guards against SSR
  const [windowDimensions, setWindowDimensions] = useState(() => getWindowDimensions());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}
