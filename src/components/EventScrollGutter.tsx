import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, Text, useMediaQuery } from '@chakra-ui/react';

export type RawMarker = {
  // ドキュメント先頭からのY座標(px)
  top: number;
  year: string;
  month: string;
  // 「直近開催」「終了」のようにページ内で一覧が分かれている場合の区分。
  // 分かれていないページ(年別一覧)では固定値になる。
  section: string;
};

// 軌道の縦線はこの範囲(先頭カードの上端〜末尾カードの下端)まで伸ばす。
export type SectionExtent = {
  section: string;
  startTop: number;
  endBottom: number;
};

type Segment = {
  section: string;
  startY: number;
  endY: number;
};

// 実際に描画される縦線の1本分の範囲(区分の隙間・パディングを反映済み)。
// つまみがこの範囲にかかっている間だけガターを表示する判定にも使う。
export type LineRange = {
  section: string;
  top: number;
  bottom: number;
};

// 区分が変わった場合は showYear も必ず true になるが、showYear は年の
// 表示可否、isSectionStart は区切り線の見た目に使うためのもので目的が
// 異なる。
export type MarkerFlags = { showYear: boolean; isSectionStart: boolean };

export type LabeledMarker = {
  marker: RawMarker & MarkerFlags;
  y: number;
  // 間引きの結果、非表示ならどちらも null。年部分は太字、月部分は標準の
  // 太さで表示するため別々に持つ。
  yearText: string | null;
  monthText: string | null;
};

// 間引き判定(1周目)の結果。isCramped は直前に表示したラベルとの間隔が
// 詰まっているか、monthVisible はそれを踏まえてこの目盛りの文字を表示
// するか(年を表示する目盛りは常に true)。
type Pass1Entry = {
  marker: RawMarker & MarkerFlags;
  y: number;
  isCramped: boolean;
  monthVisible: boolean;
};

// 固定ヘッダーの下に収まる位置から開始し、フッター手前で終わる縦の軌道。
const TRACK_TOP_OFFSET = 96;
const TRACK_BOTTOM_OFFSET = 32;
// ラベル同士が重ならないよう間引く際の最小間隔(px)。fontSize xs の行高
// 目安。
const MIN_LABEL_GAP = 14;
const SECTION_GAP = 16;
const LINE_PAD = 6;
// つまみ(丸みを帯びたピル)の高さ(px)。下の描画(h={'26px'})と揃える。
const THUMB_HEIGHT = 26;

function collectEventData(): { markers: RawMarker[]; extents: SectionExtent[] } {
  const elements = document.querySelectorAll<HTMLElement>('[data-event-start]');
  const markers: RawMarker[] = [];
  const extents: SectionExtent[] = [];
  let previousMarkerKey: string | null = null;

  elements.forEach((el) => {
    const dateValue = el.dataset.eventStart;
    if (!dateValue) {
      return;
    }
    const section = el.dataset.eventSection ?? 'all';
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const bottom = rect.bottom + window.scrollY;

    const currentExtent = extents[extents.length - 1];
    if (currentExtent && currentExtent.section === section) {
      currentExtent.endBottom = bottom;
    } else {
      extents.push({ section, startTop: top, endBottom: bottom });
    }

    const year = dateValue.slice(0, 4);
    const month = dateValue.slice(5, 7);
    const markerKey = `${section}:${year}-${month}`;
    if (markerKey === previousMarkerKey) {
      return;
    }
    previousMarkerKey = markerKey;
    markers.push({ top, year, month, section });
  });

  return { markers, extents };
}

export function withMarkerFlags(rawMarkers: RawMarker[]): (RawMarker & MarkerFlags)[] {
  let previousSection: string | null = null;
  let previousYear: string | null = null;

  return rawMarkers.map((marker) => {
    const isSectionStart = marker.section !== previousSection;
    const showYear = isSectionStart || marker.year !== previousYear;
    previousSection = marker.section;
    previousYear = marker.year;
    return { ...marker, showYear, isSectionStart };
  });
}

function formatMonth(month: string): string {
  return `${parseInt(month, 10)}月`;
}

export type GutterLayout = {
  lineRanges: LineRange[];
  labeledMarkers: LabeledMarker[];
  trackHeight: number;
  // つまみ・クリックジャンプが基準にしているスクロール可能範囲。
  maxScroll: number;
};

// DOM/Reactに依存しない純粋関数なので、実際のスクロール位置(scrollY)
// には関係なく、DOM構成が変わったときだけ呼び直せばよい。
export function buildGutterLayout(
  rawMarkers: RawMarker[],
  extents: SectionExtent[],
  docHeight: number,
  viewportHeight: number,
): GutterLayout {
  const trackHeight = Math.max(viewportHeight - TRACK_TOP_OFFSET - TRACK_BOTTOM_OFFSET, 0);
  const maxScroll = Math.max(docHeight - viewportHeight, 1);

  if (docHeight === 0 || rawMarkers.length === 0) {
    return { lineRanges: [], labeledMarkers: [], trackHeight, maxScroll };
  }

  // documentY(ページ先頭からのpx)を軌道上のY座標に変換する。つまみは
  // scrollY(0〜maxScroll)を軌道全体に引き伸ばして動くため、目盛り側も
  // documentYをmaxScroll基準で正規化しないと、同じ絶対位置でもつまみと
  // 目盛りがズレる(docHeightで割ると、ページ末尾に近い目盛りほどつまみ
  // より手前に表示されてしまう)。maxScrollを超える位置(ページ最下部
  // 付近、スクロールしても先頭がそこまで届かない範囲)はmaxScrollに
  // 丸める。
  const toTrackY = (documentY: number) => (Math.min(documentY, maxScroll) / maxScroll) * trackHeight;

  const segments: Segment[] = extents.map((extent) => ({
    section: extent.section,
    startY: toTrackY(extent.startTop),
    endY: toTrackY(extent.endBottom),
  }));

  // 区分が変わる箇所には隙間を空けて描画する(つまみの表示判定にも使う)。
  const lineRanges: LineRange[] = segments.map((segment, index) => {
    const previous = segments[index - 1];
    const next = segments[index + 1];
    const top = previous
      ? Math.max(segment.startY - LINE_PAD, previous.endY + SECTION_GAP / 2)
      : Math.max(segment.startY - LINE_PAD, 0);
    const bottom = next
      ? Math.min(segment.endY + LINE_PAD, next.startY - SECTION_GAP / 2)
      : Math.min(segment.endY + LINE_PAD, trackHeight);
    return { section: segment.section, top, bottom: Math.max(bottom, top + 2) };
  });

  const markersWithFlags = withMarkerFlags(rawMarkers);

  // 1周目: 直前に表示したラベルとの間隔が詰まっている(=文字が省略
  // される密集地帯にいる)かどうかを見て、月のみの目盛りの表示可否を
  // 決める。年を表示する目盛りは(このパスでは)常に表示扱いにする。
  let lastLabelY = -Infinity;
  const pass1: Pass1Entry[] = markersWithFlags.map((marker) => {
    const y = toTrackY(marker.top);
    const isCramped = (y - lastLabelY) < MIN_LABEL_GAP;
    const monthVisible = marker.showYear || !isCramped;
    if (monthVisible) {
      lastLabelY = y;
    }
    return { marker, y, isCramped, monthVisible };
  });

  // 2周目: 年を表示する目盛りを先頭に、次に年が変わる目盛りが現れる
  // までを1つの「年ブロック」としてまとめ、そのブロック内に表示される
  // 月(年マーカー自身以外)があるかを記録する。
  type YearBlock = { year: Pass1Entry; hasVisibleOtherMonth: boolean };
  const yearBlocks: YearBlock[] = [];
  pass1.forEach((entry) => {
    if (entry.marker.showYear) {
      yearBlocks.push({ year: entry, hasVisibleOtherMonth: false });
    } else if (entry.monthVisible) {
      yearBlocks[yearBlocks.length - 1].hasVisibleOtherMonth = true;
    }
  });

  // 月が1つだけの年(=ブロック内に他の月がない)のうち、どれか1つでも
  // 詰まって年のみ表示に切り替わるなら、他の年で詰まっていなくても、
  // 月が1つだけの年は揃って年のみ表示にする(一部だけ「年月」・一部
  // だけ「年」が混ざるのを避ける)。
  const anySingleMonthYearCramped = yearBlocks.some(
    (block) => !block.hasVisibleOtherMonth && block.year.isCramped
  );

  // 3周目: 上記を踏まえて最終的な表示内容を決める。年ブロックは出現順
  // のままなので、年マーカーに出会うたびに次のブロックへ進めればよい。
  let nextYearBlockIndex = 0;
  const labeledMarkers: LabeledMarker[] = pass1.map(({ marker, y, monthVisible }) => {
    if (!marker.showYear) {
      return { marker, y, yearText: null, monthText: monthVisible ? formatMonth(marker.month) : null };
    }

    const { hasVisibleOtherMonth } = yearBlocks[nextYearBlockIndex];
    nextYearBlockIndex += 1;
    const showMonth = hasVisibleOtherMonth || !anySingleMonthYearCramped;
    return {
      marker,
      y,
      yearText: `${marker.year}年`,
      monthText: showMonth ? formatMonth(marker.month) : null,
    };
  });

  return { lineRanges, labeledMarkers, trackHeight, maxScroll };
}

// スクロールハンドラから毎フレーム読むための ref に保持する値。
type ScrollLayout = {
  trackHeight: number;
  docHeight: number;
  viewportHeight: number;
  lineRanges: LineRange[];
};

// 十分に横幅のあるデスクトップ画面でのみ、イベントカード列の右側に
// 位置と年月を示す擬似スクロールバーを表示する。クリックで該当位置へ
// ジャンプできる。年月ラベルはDOM構成が変わったときだけ組み立て直し、
// つまみの位置・ガターの表示/非表示はスクロールのたびにref経由で
// DOMを直接書き換える(どちらもReactの再レンダーを挟まない)。
export function EventScrollGutter() {
  // xl未満ではガター自体をマウントせず、DOM監視・スクロール監視も張らない。
  const [isDesktopScreenSize] = useMediaQuery('(min-width: 80em)');
  const [rawMarkers, setRawMarkers] = useState<RawMarker[]>([]);
  const [extents, setExtents] = useState<SectionExtent[]>([]);
  const [docHeight, setDocHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const gutterElRef = useRef<HTMLDivElement>(null);
  const thumbElRef = useRef<HTMLDivElement>(null);
  const scrollLayoutRef = useRef<ScrollLayout>({ trackHeight: 0, docHeight: 0, viewportHeight: 0, lineRanges: [] });

  const recomputeMarkers = useCallback(() => {
    const { markers, extents } = collectEventData();
    setRawMarkers(markers);
    setExtents(extents);
    setDocHeight(document.documentElement.scrollHeight);
    setViewportHeight(window.innerHeight);
  }, []);

  // document.body をsubtree監視するため、登録したままだとヘッダーの
  // ポップオーバー開閉など無関係な変化のたびに全カードを走査してしまう。
  // ガターが見えない画面幅では登録自体をスキップする。
  useEffect(() => {
    if (!isDesktopScreenSize) {
      return;
    }

    let rafId = 0;
    const scheduleRecompute = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(recomputeMarkers);
    };

    scheduleRecompute();
    window.addEventListener('resize', scheduleRecompute);
    const observer = new MutationObserver(scheduleRecompute);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleRecompute);
      observer.disconnect();
    };
  }, [recomputeMarkers, isDesktopScreenSize]);

  const { lineRanges, labeledMarkers, trackHeight, maxScroll } = useMemo(
    () => buildGutterLayout(rawMarkers, extents, docHeight, viewportHeight),
    [rawMarkers, extents, docHeight, viewportHeight],
  );

  // つまみの位置とガターの表示/非表示を直接DOMに反映する(Reactの
  // stateを介さないので、スクロール中は再レンダーが発生しない)。
  const applyThumbPosition = useCallback(() => {
    const { trackHeight, docHeight, viewportHeight, lineRanges } = scrollLayoutRef.current;
    const thumbEl = thumbElRef.current;
    const gutterEl = gutterElRef.current;
    if (!thumbEl || !gutterEl || trackHeight <= 0 || docHeight <= viewportHeight) {
      return;
    }

    const maxScroll = Math.max(docHeight - viewportHeight, 1);
    // つまみは「画面の縦中央にある位置」を指す。目盛り(toTrackY)と同じ
    // 考え方(documentYをmaxScroll基準で正規化し、はみ出す分はmaxScrollに
    // 丸める)で、scrollYではなくビューポート中央のdocumentYを変換する。
    const viewportCenterDocumentY = window.scrollY + viewportHeight / 2;
    const thumbY = (Math.min(viewportCenterDocumentY, maxScroll) / maxScroll) * trackHeight;
    thumbEl.style.top = `${thumbY}px`;

    // つまみ(ピル)が実際に描画されている縦線と視覚的に重なっている間
    // だけガターを表示する。
    const thumbTop = thumbY - THUMB_HEIGHT / 2;
    const thumbBottom = thumbY + THUMB_HEIGHT / 2;
    const isThumbOnLine = lineRanges.some((range) => thumbBottom >= range.top && thumbTop <= range.bottom);
    gutterEl.style.opacity = isThumbOnLine ? '1' : '0';
    gutterEl.style.pointerEvents = isThumbOnLine ? 'auto' : 'none';
  }, []);

  // レイアウトに影響する値(データ読み込み・絞り込み・リサイズ等)が
  // 変わるたびに ref を最新化し、つまみの位置も即座に補正する。描画後・
  // ペイント前に同期させるため useLayoutEffect を使う。
  useLayoutEffect(() => {
    scrollLayoutRef.current = { trackHeight, docHeight, viewportHeight, lineRanges };
    applyThumbPosition();
  }, [trackHeight, docHeight, viewportHeight, lineRanges, applyThumbPosition]);

  // モバイル/タブレットではガターが見えないため、スクロールのたびに
  // つまみ位置を計算するだけでも無駄になる。ここもスキップする。
  useEffect(() => {
    if (!isDesktopScreenSize) {
      return;
    }

    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(applyThumbPosition);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [applyThumbPosition, isDesktopScreenSize]);

  const hasScrollableContent = docHeight > viewportHeight && viewportHeight > 0;

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.height === 0) {
      return;
    }
    const ratio = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
    // つまみと同じく、クリックした位置が画面の縦中央に来るようにジャンプ
    // する(トラック上の位置はビューポート中央のdocumentYを表しているため)。
    const targetCenterDocumentY = ratio * maxScroll;
    const targetScrollY = Math.min(Math.max(targetCenterDocumentY - viewportHeight / 2, 0), maxScroll);
    window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
  };

  if (!isDesktopScreenSize || rawMarkers.length === 0 || !hasScrollableContent) {
    return null;
  }

  return (
    <Box ref={gutterElRef}
         position={'fixed'}
         top={`${TRACK_TOP_OFFSET}px`}
         right={'28px'}
         h={`${trackHeight}px`}
         zIndex={'docked'}
         opacity={0}
         pointerEvents={'none'}
         data-testid={'event-scroll-gutter'}
         // ページ本体は擬似スクロールバーが無くてもネイティブスクロール・
         // キーボードだけで完全に操作できる補助的なミニマップなので、
         // 支援技術には存在しないものとして扱う(クリックジャンプはマウス
         // 向けのショートカットに限定する)。
         aria-hidden={true}
         sx={{
           transition: 'opacity 180ms ease-out',
           '@media (prefers-reduced-motion: reduce)': {
             transition: 'none',
           },
         }}
         >
      <Box ref={trackRef}
           position={'relative'}
           h={'100%'}
           w={'10px'}
           cursor={'pointer'}
           onClick={handleTrackClick}
           >
        {lineRanges.map((range, index) => (
          <Box key={`${range.section}-${index}`}
               position={'absolute'}
               top={`${range.top}px`}
               h={`${range.bottom - range.top}px`}
               left={'50%'}
               transform={'translateX(-50%)'}
               w={'2px'}
               bg={'blackAlpha.200'}
               borderRadius={'full'}
               pointerEvents={'none'}
               />
        ))}
        {labeledMarkers.map(({ marker, y, yearText, monthText }) => (
          <Box key={`${marker.section}-${marker.year}-${marker.month}-${marker.top}`}
               position={'absolute'}
               top={`${y}px`}
               left={'50%'}
               transform={'translate(-50%, -50%)'}
               pointerEvents={'none'}
               >
            <Box boxSize={'4px'}
                 borderRadius={'full'}
                 bg={'blackAlpha.400'}
                 />
            {marker.isSectionStart && (
              // 区分(直近開催/終了 等)の先頭であることを示す小さな横線。
              // 縦線の隙間だけでは区切りが分かりにくいための補助。
              <Box position={'absolute'}
                   top={'50%'}
                   left={'100%'}
                   transform={'translateY(-50%)'}
                   w={'8px'}
                   h={'2px'}
                   bg={'blackAlpha.400'}
                   pointerEvents={'none'}
                   />
            )}
            {(yearText || monthText) && (
              <Text position={'absolute'}
                    top={'50%'}
                    right={'calc(100% + 8px)'}
                    transform={'translateY(-50%)'}
                    whiteSpace={'nowrap'}
                    fontSize={'xs'}
                    color={'gray.500'}
                    >
                {yearText && <Text as={'span'} fontWeight={'bold'}>{yearText}</Text>}
                {monthText && <Text as={'span'} fontWeight={'normal'}>{monthText}</Text>}
              </Text>
            )}
          </Box>
        ))}
        <Box ref={thumbElRef}
             position={'absolute'}
             top={'0px'}
             left={'50%'}
             transform={'translate(-50%, -50%)'}
             w={'10px'}
             h={`${THUMB_HEIGHT}px`}
             borderRadius={'full'}
             bg={'primary.500'}
             boxShadow={'0 1px 3px rgba(0,0,0,0.35)'}
             pointerEvents={'none'}
             sx={{
               transition: 'top 60ms linear',
               '@media (prefers-reduced-motion: reduce)': {
                 transition: 'none',
               },
             }}
             />
      </Box>
    </Box>
  );
}
