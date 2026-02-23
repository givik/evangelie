import { SCROLL_OFFSET_PX, CONTROLS_OFFSET_PX, BOOKS } from './constants';

export const scrollToElement = (elementId, setControlsVisible = null) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  if (typeof setControlsVisible === 'function') {
    setControlsVisible(true);
  }

  const controlsPanel = document.querySelector('.controls');
  const offset = (controlsPanel?.offsetHeight ?? SCROLL_OFFSET_PX) + CONTROLS_OFFSET_PX;

  const elementPosition = element.getBoundingClientRect().top;
  const targetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: targetPosition,
    behavior: 'instant',
  });

  // Move focus to the element
  if (!element.getAttribute('tabindex')) {
    element.setAttribute('tabindex', '-1'); // Make it focusable
    element.style.outline = 'none'; // Prevent visual outline on programmatic focus if desired, or leave it
  }
  element.focus({ preventScroll: true }); // Prevent additional scroll since we handled it manually
};

export const getbookSlug = (bookName) => {
  return BOOKS.find((b) => b.name === bookName)?.slug || '';
};

export const decodeSlug = (slug) => {
  if (!slug) return [];
  return slug.map((s) => {
    try {
      return decodeURIComponent(s);
    } catch (e) {
      return s;
    }
  });
};
