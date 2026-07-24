import { useSyncExternalStore, type ReactElement } from 'react';
import { ButtonGroup, IconButton, Tooltip } from '@chakra-ui/react';
import { FiList, FiAlignJustify, FiGrid } from 'react-icons/fi';
import { subscribeViewMode, getViewModeSnapshot, setViewMode } from '../utils/viewModeStore';
import type { ViewMode } from '../utils/viewMode';

const VIEW_MODE_OPTIONS: { value: ViewMode; label: string; icon: ReactElement }[] = [
  { value: 'standard', label: '標準表示', icon: <FiList /> },
  { value: 'compact', label: 'コンパクト表示', icon: <FiAlignJustify /> },
  { value: 'grid', label: 'グリッド表示', icon: <FiGrid /> },
];

export function ViewModeToggle() {
  const viewMode = useSyncExternalStore(subscribeViewMode, getViewModeSnapshot);

  return (
    <ButtonGroup isAttached size={'sm'} variant={'outline'} colorScheme={'gray'}>
      {VIEW_MODE_OPTIONS.map((option) => (
        <Tooltip key={option.value} label={option.label} hasArrow fontSize={'xs'}>
          <IconButton aria-label={option.label}
                      aria-pressed={viewMode === option.value}
                      icon={option.icon}
                      onClick={() => setViewMode(option.value)}
                      bg={viewMode === option.value ? 'gray.600' : undefined}
                      color={viewMode === option.value ? 'white' : undefined}
                      borderColor={'gray.300'}
                      _hover={{ bg: viewMode === option.value ? 'gray.700' : 'gray.100' }}
                      />
        </Tooltip>
      ))}
    </ButtonGroup>
  );
}
