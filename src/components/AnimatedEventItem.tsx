import { chakra } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { EVENT_CARD_LAYOUT_SETTLED } from './EventScrollGutter';

const MotionEventItem = motion(chakra.div);

function notifyLayoutSettled() {
  document.dispatchEvent(new Event(EVENT_CARD_LAYOUT_SETTLED));
}

// Stack の spacing prop と同じ値にすること
export const EVENT_LIST_SPACING = { base: '0', md: '0.5em' };
// コンパクト表示用。EVENT_LIST_SPACING より詰めた値にすること
export const EVENT_LIST_SPACING_COMPACT = { base: '0', md: '0.15em' };

type AnimatedEventItemVariant = 'list' | 'compact' | 'grid';

// data-event-start/data-event-section は EventScrollGutter 用の目印。
// EventBody 側の data-event-date(日付ジャンプ用、形式も別)とは別物
// なので名前を分けている。
export function AnimatedEventItem({
  children,
  date,
  section,
  variant = 'list',
}: {
  children: ReactNode;
  date?: string;
  section?: string;
  variant?: AnimatedEventItemVariant;
}) {
  const shouldReduceMotion = useReducedMotion();

  // grid はカード同士の間隔を SimpleGrid の spacing に任せるため、
  // list/compact のような下端ボーダー・paddingBottom を付けない。
  const listSx = variant === 'grid'
    ? { h: '100%' }
    : {
        '&:not(:last-child)': {
          paddingBottom: variant === 'compact' ? EVENT_LIST_SPACING_COMPACT : EVENT_LIST_SPACING,
          borderBottomWidth: '1px',
          borderColor: 'gray.200',
        },
      };

  return (
    <MotionEventItem layout={!shouldReduceMotion}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                      onLayoutAnimationComplete={notifyLayoutSettled}
                      data-event-start={date}
                      data-event-section={section}
                      sx={listSx}
                      >
      {children}
    </MotionEventItem>
  );
}
