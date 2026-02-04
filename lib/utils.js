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

    window.scrollTo(0, targetPosition);
};

export const getShortBook = (bookName) => {
    return BOOKS.find((b) => b.name === bookName)?.short || '';
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
