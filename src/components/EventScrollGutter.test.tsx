import { describe, it, expect } from 'vitest';
import { buildGutterLayout, withMarkerFlags } from './EventScrollGutter';
import type { RawMarker, SectionExtent } from './EventScrollGutter';

function marker(overrides: Partial<RawMarker>): RawMarker {
  return { top: 0, year: '2025', month: '01', section: 'all', ...overrides };
}

describe('withMarkerFlags', () => {
  it('flags the first marker as both a year start and a section start', () => {
    const [first] = withMarkerFlags([marker({ top: 100 })]);

    expect(first.showYear).toBe(true);
    expect(first.isSectionStart).toBe(true);
  });

  it('does not repeat the year/section flags for a later marker in the same year and section', () => {
    const [, second] = withMarkerFlags([
      marker({ top: 100, month: '01' }),
      marker({ top: 200, month: '02' }),
    ]);

    expect(second.showYear).toBe(false);
    expect(second.isSectionStart).toBe(false);
  });

  it('flags showYear (but not isSectionStart) when the year changes within the same section', () => {
    const [, second] = withMarkerFlags([
      marker({ top: 100, year: '2025' }),
      marker({ top: 200, year: '2026' }),
    ]);

    expect(second.showYear).toBe(true);
    expect(second.isSectionStart).toBe(false);
  });

  it('flags both showYear and isSectionStart when the section changes, even if the year is unchanged', () => {
    const [, second] = withMarkerFlags([
      marker({ top: 100, year: '2026', section: 'future' }),
      marker({ top: 200, year: '2026', section: 'past' }),
    ]);

    expect(second.showYear).toBe(true);
    expect(second.isSectionStart).toBe(true);
  });

  it('compares only against the immediately preceding marker, so a year seen before can show again after a section change', () => {
    const [, , third] = withMarkerFlags([
      marker({ top: 100, year: '2025', section: 'future' }),
      marker({ top: 200, year: '2026', section: 'future' }),
      marker({ top: 300, year: '2025', section: 'past' }),
    ]);

    expect(third.showYear).toBe(true);
    expect(third.isSectionStart).toBe(true);
  });
});

// trackHeight = viewportHeight - 128 (TRACK_TOP_OFFSET + TRACK_BOTTOM_OFFSET).
// Pick round numbers so toTrackY(x) = x / 10 for x in [0, 10000], which keeps
// the expected pixel math easy to verify by hand.
const VIEWPORT_HEIGHT = 1128; // -> trackHeight = 1000
const DOC_HEIGHT = 11128; // -> maxScroll = 10000

describe('buildGutterLayout', () => {
  it('returns empty layout (but still computes trackHeight/maxScroll) when there are no markers', () => {
    const layout = buildGutterLayout([], [], DOC_HEIGHT, VIEWPORT_HEIGHT);

    expect(layout.lineRanges).toEqual([]);
    expect(layout.labeledMarkers).toEqual([]);
    expect(layout.trackHeight).toBe(1000);
    expect(layout.maxScroll).toBe(10000);
  });

  it('maps documentY to track pixels using maxScroll, not docHeight, and clamps beyond maxScroll', () => {
    const rawMarkers: RawMarker[] = [
      marker({ top: 1000, month: '01' }), // -> y = 100
      marker({ top: 12000, month: '02' }), // beyond maxScroll -> clamped to trackHeight
    ];
    const extents: SectionExtent[] = [{ section: 'all', startTop: 1000, endBottom: 12000 }];

    const { labeledMarkers } = buildGutterLayout(rawMarkers, extents, DOC_HEIGHT, VIEWPORT_HEIGHT);

    expect(labeledMarkers[0].y).toBe(100);
    expect(labeledMarkers[1].y).toBe(1000);
  });

  it('shows the full year+month label on the first marker of a year when another month in that year is also visible', () => {
    const rawMarkers: RawMarker[] = [
      marker({ top: 1000, month: '01' }), // y = 100
      marker({ top: 3000, month: '03' }), // y = 300, well clear of the previous label
      marker({ top: 6000, month: '06' }), // y = 600, well clear of the previous label
    ];
    const extents: SectionExtent[] = [{ section: 'all', startTop: 1000, endBottom: 6200 }];

    const { labeledMarkers, lineRanges } = buildGutterLayout(rawMarkers, extents, DOC_HEIGHT, VIEWPORT_HEIGHT);

    expect(labeledMarkers).toEqual([
      expect.objectContaining({ y: 100, yearText: '2025年', monthText: '1月' }),
      expect.objectContaining({ y: 300, yearText: null, monthText: '3月' }),
      expect.objectContaining({ y: 600, yearText: null, monthText: '6月' }),
    ]);
    // single section -> a single line, padded and clamped from the extent
    expect(lineRanges).toEqual([{ section: 'all', top: 94, bottom: 626 }]);
  });

  it('hides a month-only label that lands too close to the previously shown label', () => {
    const rawMarkers: RawMarker[] = [
      marker({ top: 1000, month: '01' }), // y = 100 (year marker, always shown)
      marker({ top: 1100, month: '02' }), // y = 110, only 10px from the last shown label (<14) -> hidden
      marker({ top: 1300, month: '03' }), // y = 130, 30px from the last *shown* label (marker 1) -> shown
    ];
    const extents: SectionExtent[] = [{ section: 'all', startTop: 1000, endBottom: 1400 }];

    const { labeledMarkers } = buildGutterLayout(rawMarkers, extents, DOC_HEIGHT, VIEWPORT_HEIGHT);

    expect(labeledMarkers[0].monthText).toBe('1月');
    expect(labeledMarkers[1].monthText).toBeNull();
    expect(labeledMarkers[2].monthText).toBe('3月');
  });

  it('collapses a single-month year to a year-only label when it is cramped against the previous label', () => {
    const rawMarkers: RawMarker[] = [
      marker({ top: 1000, year: '2024', month: '12' }), // y = 100, first marker -> never cramped
      marker({ top: 1050, year: '2025', month: '01' }), // y = 105, only 5px away (<14) -> cramped, single month
    ];
    const extents: SectionExtent[] = [{ section: 'all', startTop: 1000, endBottom: 1100 }];

    const { labeledMarkers } = buildGutterLayout(rawMarkers, extents, DOC_HEIGHT, VIEWPORT_HEIGHT);

    expect(labeledMarkers[1]).toEqual(
      expect.objectContaining({ yearText: '2025年', monthText: null }),
    );
  });

  it('once any single-month year is cramped, every single-month year switches to year-only, even ones with room to spare', () => {
    const rawMarkers: RawMarker[] = [
      marker({ top: 1000, year: '2024', month: '12' }), // y = 100, not cramped itself
      marker({ top: 1050, year: '2025', month: '01' }), // y = 105, cramped (5px from previous) -> triggers the global switch
      marker({ top: 3000, year: '2026', month: '05' }), // y = 300, plenty of room, but should still collapse
    ];
    const extents: SectionExtent[] = [{ section: 'all', startTop: 1000, endBottom: 3100 }];

    const { labeledMarkers } = buildGutterLayout(rawMarkers, extents, DOC_HEIGHT, VIEWPORT_HEIGHT);

    expect(labeledMarkers.map((m) => [m.yearText, m.monthText])).toEqual([
      ['2024年', null],
      ['2025年', null],
      ['2026年', null],
    ]);
  });

  it('keeps other months in a year visible even when a different, single-month year is cramped elsewhere', () => {
    const rawMarkers: RawMarker[] = [
      marker({ top: 1000, year: '2024', month: '12' }), // y = 100, not cramped itself, single month
      marker({ top: 1050, year: '2025', month: '01' }), // y = 105, cramped (5px) -> single month, triggers global switch
      marker({ top: 3000, year: '2026', month: '05' }), // y = 300, first month of a year with another visible month below
      marker({ top: 5000, year: '2026', month: '10' }), // y = 500, second month of 2026 -> not cramped, stays visible
    ];
    const extents: SectionExtent[] = [{ section: 'all', startTop: 1000, endBottom: 5100 }];

    const { labeledMarkers } = buildGutterLayout(rawMarkers, extents, DOC_HEIGHT, VIEWPORT_HEIGHT);

    // 2026 has another visible month in its block, so it keeps the full label
    // regardless of the global single-month-year switch.
    expect(labeledMarkers[2]).toEqual(expect.objectContaining({ yearText: '2026年', monthText: '5月' }));
    expect(labeledMarkers[3]).toEqual(expect.objectContaining({ yearText: null, monthText: '10月' }));
  });

  it('splits line ranges per section with a gap between them, and lets the same year show its year prefix again after a section break', () => {
    const rawMarkers: RawMarker[] = [
      marker({ top: 500, year: '2026', month: '07', section: 'future' }), // y = 50
      marker({ top: 5000, year: '2026', month: '07', section: 'past' }), // y = 500, same year but a new section
    ];
    const extents: SectionExtent[] = [
      { section: 'future', startTop: 400, endBottom: 900 },
      { section: 'past', startTop: 4800, endBottom: 5300 },
    ];

    const { lineRanges, labeledMarkers } = buildGutterLayout(rawMarkers, extents, DOC_HEIGHT, VIEWPORT_HEIGHT);

    expect(lineRanges).toEqual([
      { section: 'future', top: 34, bottom: 96 },
      { section: 'past', top: 474, bottom: 536 },
    ]);
    // both are the "first of their section", so both repeat the year prefix
    // even though it's the same year on both sides of the gap.
    expect(labeledMarkers).toEqual([
      expect.objectContaining({ yearText: '2026年', monthText: '7月' }),
      expect.objectContaining({ yearText: '2026年', monthText: '7月' }),
    ]);
    expect(labeledMarkers[0].marker.isSectionStart).toBe(true);
    expect(labeledMarkers[1].marker.isSectionStart).toBe(true);
  });
});
