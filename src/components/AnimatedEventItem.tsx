import { chakra } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const MotionEventItem = motion(chakra.div);

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
                          borderBottomWidth: '1px',
                          borderColor: 'gray.200',
                        },
                      }}
                      >
      {children}
    </MotionEventItem>
  );
}
