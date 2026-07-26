import { useSyncExternalStore, type ReactElement } from 'react';
import {
  Button, ButtonGroup, IconButton, Tooltip, Show, Hide,
  Menu, MenuButton, MenuList, MenuItem,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
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
  const current = VIEW_MODE_OPTIONS.find((option) => option.value === viewMode) ?? VIEW_MODE_OPTIONS[0];

  return (
    <>
      <Show above={'md'}>
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
      </Show>
      <Hide above={'md'}>
        <Menu placement={'bottom-end'} isLazy>
          <MenuButton as={Button}
                      aria-label={current.label}
                      leftIcon={current.icon}
                      rightIcon={<ChevronDownIcon />}
                      size={'sm'}
                      variant={'outline'}
                      colorScheme={'gray'}
                      color={'gray.700'}
                      borderColor={'gray.300'}
                      _hover={{ bg: 'gray.100' }}
                      px={'2'}
                      />
          <MenuList fontSize={'sm'} minW={'40'} zIndex={'popover'}>
            {VIEW_MODE_OPTIONS.map((option) => (
              <MenuItem key={option.value}
                        icon={option.icon}
                        fontWeight={option.value === viewMode ? 'bold' : 'normal'}
                        bg={option.value === viewMode ? 'gray.100' : undefined}
                        onClick={() => setViewMode(option.value)}
                        >
                { option.label }
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </Hide>
    </>
  );
}
