import { Box, Card, CardBody, Heading, Stack, Text } from '@chakra-ui/react';

const DEFAULT_PEEK_HEIGHT = '140px';

type WidgetPickerCardProps = {
  title: string;
  description: string;
  previewPath: string;
  onClick: () => void;
  peekHeight?: string;
  showFadeOverlay?: boolean;
};

export function WidgetPickerCard({
  title,
  description,
  previewPath,
  onClick,
  peekHeight = DEFAULT_PEEK_HEIGHT,
  showFadeOverlay = true,
}: WidgetPickerCardProps) {
  return (
    <Card as={'button'}
          type={'button'}
          onClick={onClick}
          variant={'outline'}
          borderRadius={'md'}
          textAlign={'left'}
          fontFamily={'inherit'}
          transition={'box-shadow 0.15s ease, border-color 0.15s ease'}
          _hover={{ borderColor: 'primary.300', shadow: 'sm' }}
          _focusVisible={{ boxShadow: 'outline' }}
          >
      <CardBody>
        <Stack spacing={'3'}>
          <Heading size={'sm'} color={'gray.700'}>{ title }</Heading>
          <Text fontSize={'sm'} color={'gray.600'} lineHeight={'1.8'} noOfLines={2}>{ description }</Text>
          <Box position={'relative'}
               h={peekHeight}
               overflow={'hidden'}
               borderRadius={'md'}
               bg={'white'}
               >
            <iframe src={previewPath}
                    title={`${title}のプレビュー`}
                    tabIndex={-1}
                    aria-hidden
                    loading={'lazy'}
                    style={{ width: '100%', height: peekHeight, border: 0, pointerEvents: 'none' }}
                    />
            {showFadeOverlay && (
              <Box position={'absolute'}
                   bottom={'0'} left={'0'} right={'0'}
                   h={'40px'}
                   bgGradient={'linear(to-t, white, transparent)'}
                   pointerEvents={'none'}
                   aria-hidden
                   />
            )}
          </Box>
        </Stack>
      </CardBody>
    </Card>
  );
}
