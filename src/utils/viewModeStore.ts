import { DEFAULT_VIEW_MODE, isValidViewMode, type ViewMode } from './viewMode';

export const VIEW_MODE_STORAGE_KEY = 'yamanashi-event-hub.view-mode.v1';

let current: ViewMode = DEFAULT_VIEW_MODE;
let hasLoaded = false;
const listeners = new Set<() => void>();

function loadFromStorage(): ViewMode {
  try {
    const raw = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return isValidViewMode(raw) ? raw : DEFAULT_VIEW_MODE;
  } catch {
    return DEFAULT_VIEW_MODE;
  }
}

function saveToStorage(value: ViewMode): void {
  try {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

export function getViewModeSnapshot(): ViewMode {
  if (!hasLoaded) {
    current = loadFromStorage();
    hasLoaded = true;
  }
  return current;
}

export function subscribeViewMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getHeaderOffset(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  return window.matchMedia('(min-width: 48em)').matches ? 88 : 72;
}

function findPrecedingSticky(card: HTMLElement): HTMLElement | null {
  if (typeof window === 'undefined') {
    return null;
  }
  let node: Element | null = card;
  while (node) {
    let sibling = node.previousElementSibling;
    while (sibling) {
      if (sibling instanceof HTMLElement && window.getComputedStyle(sibling).position === 'sticky') {
        return sibling;
      }
      sibling = sibling.previousElementSibling;
    }
    node = node.parentElement;
  }
  return null;
}

type ScrollAnchor = {
  eventAnchorId: string;
  headingScreenYBefore: number | null;
};

function captureScrollAnchor(): ScrollAnchor | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const offset = getHeaderOffset();
  const cards = document.querySelectorAll<HTMLElement>('[data-event-card]');
  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    if (rect.bottom > offset) {
      const anchor = card.querySelector<HTMLElement>('[id^="event-"]');
      if (!anchor?.id) {
        return null;
      }
      const sticky = findPrecedingSticky(card);
      return {
        eventAnchorId: anchor.id,
        headingScreenYBefore: sticky ? sticky.getBoundingClientRect().top : null,
      };
    }
  }
  return null;
}

function keepAnchorInView(anchor: ScrollAnchor): void {
  if (typeof window === 'undefined') {
    return;
  }
  const start = performance.now();
  const DURATION_MS = 800;
  const TOLERANCE_PX = 2;
  let aborted = false;

  const abort = () => {
    aborted = true;
  };
  const listenerOptions = { passive: true } as const;
  window.addEventListener('wheel', abort, listenerOptions);
  window.addEventListener('touchstart', abort, listenerOptions);
  window.addEventListener('keydown', abort, listenerOptions);

  const cleanup = () => {
    window.removeEventListener('wheel', abort);
    window.removeEventListener('touchstart', abort);
    window.removeEventListener('keydown', abort);
  };

  let useHeadingBased: boolean | null = null;

  const tick = () => {
    if (aborted) {
      cleanup();
      return;
    }

    const el = document.getElementById(anchor.eventAnchorId);
    if (el) {
      const card = el.closest<HTMLElement>('[data-event-card]') ?? el;
      const sticky = anchor.headingScreenYBefore !== null ? findPrecedingSticky(card) : null;
      let neededScroll: number;

      if (sticky && anchor.headingScreenYBefore !== null) {
        if (useHeadingBased === null) {
          const headingBasedScroll = sticky.getBoundingClientRect().top - anchor.headingScreenYBefore;
          const projectedCardTop = el.getBoundingClientRect().top - headingBasedScroll;
          const viewportH = window.innerHeight;
          useHeadingBased = projectedCardTop >= -100 && projectedCardTop <= viewportH + 100;
        }
        neededScroll = useHeadingBased
          ? sticky.getBoundingClientRect().top - anchor.headingScreenYBefore
          : el.getBoundingClientRect().top - getHeaderOffset();
      } else {
        neededScroll = el.getBoundingClientRect().top - getHeaderOffset();
      }

      if (Math.abs(neededScroll) > TOLERANCE_PX) {
        window.scrollBy(0, neededScroll);
      }
    }

    if (performance.now() - start < DURATION_MS) {
      window.requestAnimationFrame(tick);
    } else {
      cleanup();
    }
  };

  window.requestAnimationFrame(tick);
}

export function setViewMode(value: ViewMode): void {
  if (value === current) {
    return;
  }

  const nearTop = typeof window !== 'undefined' && window.scrollY < getHeaderOffset() + 200;
  const anchor = nearTop ? null : captureScrollAnchor();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('site-header-hold'));
  }

  current = value;
  hasLoaded = true;
  saveToStorage(value);
  listeners.forEach((listener) => listener());

  if (anchor) {
    keepAnchorInView(anchor);
  }
}
