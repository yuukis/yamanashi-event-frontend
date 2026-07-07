import { chakra } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const MotionEventItem = motion(chakra.div);

// Stack の spacing prop と同じ値にすること。もともと StackDivider は spacing 分の
// 余白を線の上下それぞれに付与していたため、Stack 側の spacing(上側の余白)に
// 加えてここで marginBottom(下側の余白)を再現している。
export const EVENT_LIST_SPACING = { base: '0', md: '0.5em' };

export function AnimatedEventItem({ eventKey, children }: { eventKey: string; children: ReactNode }) {
  return (
    <MotionEventItem key={eventKey}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      sx={{
                        '&:not(:last-child)': {
                          marginBottom: EVENT_LIST_SPACING,
                          borderBottomWidth: '1px',
                          borderColor: 'gray.200',
                        },
                      }}
                      >
      {children}
    </MotionEventItem>
  );
}
