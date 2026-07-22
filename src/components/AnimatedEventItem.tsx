import { chakra } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

const MotionEventItem = motion(chakra.div);

// Stack の spacing prop と同じ値にすること
export const EVENT_LIST_SPACING = { base: '0', md: '0.5em' };

// date/section は EventScrollGutter が年月の目盛りを組み立てるための
// 目印(data-event-start / data-event-section)。EventBody 側の
// data-event-date(YYYYMMDD、日付ジャンプ時のハイライト用)とは別物なので
// 名前を分けている。section は「直近開催」「終了」のように一覧が複数に
// 分かれているページで、擬似スクロールバー上にも区切りを表現するために
// 使う。渡さない呼び出し元(ウィジェット等)では単に付かない。
export function AnimatedEventItem({ children, date, section }: { children: ReactNode; date?: string; section?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionEventItem layout={!shouldReduceMotion}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                      data-event-start={date}
                      data-event-section={section}
                      sx={{
                        '&:not(:last-child)': {
                          paddingBottom: EVENT_LIST_SPACING,
                          borderBottomWidth: '1px',
                          borderColor: 'gray.200',
                        },
                      }}
                      >
      {children}
    </MotionEventItem>
  );
}
