/* eslint-disable react-refresh/only-export-components -- test helper module, never hot-reloaded */
import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import AppTheme from '../theme';

function Providers({ children }: { children: ReactNode }) {
  return <ChakraProvider theme={AppTheme}>{children}</ChakraProvider>;
}

export function renderWithChakra(ui: ReactElement) {
  return render(ui, { wrapper: Providers });
}

// Chakra's useMediaQuery reads window.matchMedia; tests can force the
// desktop/mobile branch by stubbing it to always report a fixed result.
export function mockMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

export * from '@testing-library/react';
