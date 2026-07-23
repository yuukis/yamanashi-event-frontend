import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// @testing-library/react only auto-registers cleanup when `afterEach` is a
// global; this project doesn't enable vitest's `globals` option, so wire it
// up explicitly to avoid DOM leaking between tests.
afterEach(() => {
  cleanup();
});

// jsdom does not implement scrollTo on elements; Chakra UI's Menu calls it
// on open to scroll the active item into view.
if (!window.HTMLElement.prototype.scrollTo) {
  window.HTMLElement.prototype.scrollTo = () => {};
}

// jsdom's window.scrollTo exists but only logs "not implemented"; Chakra
// UI's Modal calls it as part of its focus-trap/scroll-lock handling.
window.scrollTo = () => {};

// jsdom does not implement matchMedia; Chakra UI's useMediaQuery depends on it.
if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}

// jsdom does not implement ResizeObserver; GroupSelector/ChipBar use it to
// re-measure their scroll row when it becomes visible again (e.g. switching
// back to a tab whose panel was previously hidden with a width of 0).
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: () => Promise.resolve() },
    configurable: true,
  });
}
