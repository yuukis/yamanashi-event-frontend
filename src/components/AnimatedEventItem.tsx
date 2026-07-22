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

// data-event-start/data-event-section は EventScrollGutter 用の目印。
// EventBody 側の data-event-date(日付ジャンプ用、形式も別)とは別物
// なので名前を分けている。
export function AnimatedEventItem({ children, date, section }: { children: ReactNode; date?: string; section?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionEventItem layout={!shouldReduceMotion}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                      onLayoutAnimationComplete={notifyLayoutSettled}
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
