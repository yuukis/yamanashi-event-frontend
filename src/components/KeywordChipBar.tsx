import { Wrap, WrapItem, Button } from '@chakra-ui/react';

type KeywordChipBarProps = {
  keywords: [string, number][];
  selected: string | null;
  onSelect: (keyword: string | null) => void;
};

const MAX_CHIPS = 10;

export function KeywordChipBar({ keywords, selected, onSelect }: KeywordChipBarProps) {
  const chips = keywords.slice(0, MAX_CHIPS).map(([keyword]) => keyword);
  if (selected && !chips.includes(selected)) {
    chips.push(selected);
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <Wrap spacing={'2'}
          ml={{base: '4', md: '0'}}
          mr={{base: '4', md: '0'}}
          mb={'2'}
          >
      {chips.map((keyword) => (
        <WrapItem key={keyword}>
          <Button size={'xs'}
                  rounded={'full'}
                  fontWeight={'normal'}
                  {...(selected === keyword ? {
                    bg: 'gray.600',
                    color: 'white',
                    _hover: { bg: 'gray.700' },
                  } : {
                    variant: 'outline',
                    bg: 'white',
                    color: 'gray.600',
                    borderColor: 'gray.300',
                  })}
                  onClick={() => onSelect(selected === keyword ? null : keyword)}
                  >
            {keyword}
          </Button>
        </WrapItem>
      ))}
    </Wrap>
  );
}
