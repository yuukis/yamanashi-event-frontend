import { Button, ButtonGroup, Menu, MenuButton, MenuList, MenuItem, Portal } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

export const YEAR_HEADING_ANCHOR_ID = 'year-heading';
export const FUTURE_EVENTS_ANCHOR_ID = 'future-events-heading';

const HIGHLIGHT_BG = '#e8f6fb';
const HIGHLIGHT_COLOR = 'primary.800';

type YearSwitcherProps = {
  startYear: number;
  selectedYear: number | null;
};

function goToYear(year: number) {
  window.open(`/events/${year}#${YEAR_HEADING_ANCHOR_ID}`, '_self');
}

function goToRecent() {
  window.open(`/#${FUTURE_EVENTS_ANCHOR_ID}`, '_self');
}

export function YearSwitcher({ startYear, selectedYear }: YearSwitcherProps) {
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = Math.max(currentYear, selectedYear ?? currentYear); y >= startYear; y--) {
    yearOptions.push(y);
  }

  return (
    <ButtonGroup size={'sm'} colorScheme={'gray'}>
      <Menu placement={'bottom'} isLazy>
        <MenuButton as={Button}
                    variant={'outline'}
                    color={'gray.700'}
                    borderColor={'gray.300'}
                    _hover={{ bg: 'gray.100' }}
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
    </ButtonGroup>
  );
}
