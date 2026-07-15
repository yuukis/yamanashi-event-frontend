import { describe, it, expect } from 'vitest';
import { parseWidgetLimit, WIDGET_DEFAULT_LIMIT, WIDGET_MIN_LIMIT, WIDGET_MAX_LIMIT } from './widgetLimit';

describe('parseWidgetLimit', () => {
  it('returns the default limit when no value is given', () => {
    expect(parseWidgetLimit(null)).toBe(WIDGET_DEFAULT_LIMIT);
  });

  it('returns the default limit for a non-numeric value', () => {
    expect(parseWidgetLimit('abc')).toBe(WIDGET_DEFAULT_LIMIT);
  });

  it('clamps values below the minimum up to the minimum', () => {
    expect(parseWidgetLimit('0')).toBe(WIDGET_MIN_LIMIT);
    expect(parseWidgetLimit('-5')).toBe(WIDGET_MIN_LIMIT);
  });

  it('clamps values above the maximum down to the maximum', () => {
    expect(parseWidgetLimit('999')).toBe(WIDGET_MAX_LIMIT);
  });

  it('returns the given value when within range', () => {
    expect(parseWidgetLimit('7')).toBe(7);
  });
});
