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
