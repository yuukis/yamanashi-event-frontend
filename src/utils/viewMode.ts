export type ViewMode = 'standard' | 'compact' | 'grid';

export const DEFAULT_VIEW_MODE: ViewMode = 'standard';

const VIEW_MODES: ViewMode[] = ['standard', 'compact', 'grid'];

export function isValidViewMode(value: unknown): value is ViewMode {
  return typeof value === 'string' && (VIEW_MODES as string[]).includes(value);
}
