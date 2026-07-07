import { chakra } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

const MotionEventItem = motion(chakra.div);

// Stack の spacing prop と同じ値にすること
export const EVENT_LIST_SPACING = { base: '0', md: '0.5em' };

export function AnimatedEventItem({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionEventItem layout={!shouldReduceMotion}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
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
