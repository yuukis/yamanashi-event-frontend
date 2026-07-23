import { Box, Button, ButtonGroup, IconButton, Menu, MenuButton, MenuList, MenuItem, Portal } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '@chakra-ui/icons';

export const YEAR_HEADING_ANCHOR_ID = 'year-heading';
export const FUTURE_EVENTS_ANCHOR_ID = 'future-events-heading';

const HIGHLIGHT_BG = '#e8f6fb';
const HIGHLIGHT_COLOR = 'primary.800';

type YearSwitcherProps = {
  startYear: number;
  selectedYear: number | null;
  showChevrons?: boolean;
};

function goToYear(year: number) {
  window.open(`/events/${year}#${YEAR_HEADING_ANCHOR_ID}`, '_self');
}

function goToRecent() {
  window.open(`/#${FUTURE_EVENTS_ANCHOR_ID}`, '_self');
}

export function YearSwitcher({ startYear, selectedYear, showChevrons = true }: YearSwitcherProps) {
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = Math.max(currentYear, selectedYear ?? currentYear); y >= startYear; y--) {
    yearOptions.push(y);
  }

  const menu = (
    <Menu placement={'bottom'} isLazy>
      <MenuButton as={Button}
                  variant={'solid'}
                  color={'white'}
                  rightIcon={<ChevronDownIcon />}
                  >
        { selectedYear !== null ? `${selectedYear}年` : '直近' }
      </MenuButton>
      <Portal>
        <MenuList fontSize={'sm'} minW={'28'} zIndex={'popover'}>
          <MenuItem fontWeight={selectedYear === null ? 'bold' : 'normal'}
                    bg={selectedYear === null ? HIGHLIGHT_BG : undefined}
                    color={selectedYear === null ? HIGHLIGHT_COLOR : undefined}
                    onClick={goToRecent}
                    >
            直近
          </MenuItem>
          {yearOptions.map((y) => (
            <MenuItem key={y}
                      fontWeight={y === selectedYear ? 'bold' : 'normal'}
                      bg={y === selectedYear ? HIGHLIGHT_BG : undefined}
                      color={y === selectedYear ? HIGHLIGHT_COLOR : undefined}
                      onClick={() => goToYear(y)}
                      >
              { y }年
            </MenuItem>
          ))}
        </MenuList>
      </Portal>
    </Menu>
  );

  if (!showChevrons || selectedYear === null) {
    return (
      <ButtonGroup size={{base: 'xs', md: 'sm'}} colorScheme={'primary'}>
        { menu }
      </ButtonGroup>
    );
  }

  const prevYear = selectedYear - 1;
  const nextYear = selectedYear + 1;

  return (
    <ButtonGroup size={{base: 'xs', md: 'sm'}} colorScheme={'primary'} isAttached>
      <IconButton aria-label={`${prevYear}年のイベントを表示`}
                  icon={<ChevronLeftIcon />}
                  variant={'solid'}
                  color={'white'}
                  isDisabled={prevYear < startYear}
                  onClick={() => goToYear(prevYear)}
                  />
      <Box h={'full'} w={'1px'} />
      { menu }
      <Box h={'full'} w={'1px'} />
      <IconButton aria-label={`${nextYear}年のイベントを表示`}
                  icon={<ChevronRightIcon />}
                  variant={'solid'}
                  color={'white'}
                  onClick={() => goToYear(nextYear)}
                  />
    </ButtonGroup>
  );
}
