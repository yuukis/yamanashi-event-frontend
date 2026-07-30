import { describe, it, expect } from 'vitest';
import { buildListWidgetPath, buildNextEventWidgetPath } from './widgetPaths';

describe('buildListWidgetPath', () => {
  it('builds the all-events widget path when no group key is given', () => {
    expect(buildListWidgetPath('')).toBe('/widget/events?limit=5');
  });

  it('builds the community-scoped widget path when a group key is given', () => {
    expect(buildListWidgetPath('techmujin')).toBe('/widget/groups/techmujin/events?limit=5');
  });

  it('encodes URL-reserved characters in the group key', () => {
    expect(buildListWidgetPath('a/b?c')).toBe('/widget/groups/a%2Fb%3Fc/events?limit=5');
  });
});

describe('buildNextEventWidgetPath', () => {
  it('builds the next-event widget path for a group key', () => {
    expect(buildNextEventWidgetPath('techmujin')).toBe('/widget/groups/techmujin/next-event');
  });

  it('encodes URL-reserved characters in the group key', () => {
    expect(buildNextEventWidgetPath('a/b?c')).toBe('/widget/groups/a%2Fb%3Fc/next-event');
  });
});
