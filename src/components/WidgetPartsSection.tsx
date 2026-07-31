import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useDisclosure,
} from '@chakra-ui/react';
import type { BoxProps } from '@chakra-ui/react';
import { WidgetPickerCard } from './WidgetPickerCard';
import { WidgetPreviewCard } from './WidgetPreviewCard';

export type WidgetDefinition = {
  key: string;
  title: string;
  description: string;
  previewPath: string;
  embedPath: string;
  iframeTitle: string;
  elementId: string;
  fixedHeight?: string;
  controls?: ReactNode;
};

type WidgetPartsSectionProps = BoxProps & {
  widgets: WidgetDefinition[];
  heading?: string;
  description?: string;
};

export function WidgetPartsSection({
  widgets,
  heading = 'ブログパーツ',
  description = 'イベント情報をブログやサイトに埋め込めます。ウィジェットを選ぶと、プレビューと埋め込み用スニペットを確認できます。',
  ...boxProps
}: WidgetPartsSectionProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedWidgetKey, setSelectedWidgetKey] = useState<string | null>(null);
  const selectedWidget = widgets.find((widget) => widget.key === selectedWidgetKey) ?? null;

  return (
    <Box {...boxProps}>
      <Heading className={'widget-parts-heading'} size={{base: 'sm', md: 'md'}} mb={'4'} color={'gray.600'}>
        { heading }
      </Heading>
      <Text className={'widget-parts-description'} fontSize={'sm'} color={'gray.600'} mb={'4'} lineHeight={'1.8'}>
        { description }
      </Text>
      <SimpleGrid className={'widget-parts-grid'} columns={{base: 1, sm: 2, md: 3}} spacing={'4'}>
        {widgets.map((widget) => (
          <WidgetPickerCard key={widget.key}
                            title={widget.title}
                            description={widget.description}
                            previewPath={widget.previewPath}
                            peekHeight={widget.fixedHeight}
                            showFadeOverlay={!widget.fixedHeight}
                            onClick={() => { setSelectedWidgetKey(widget.key); onOpen(); }}
                            />
        ))}
      </SimpleGrid>
      <Drawer isOpen={isOpen} placement={'right'} onClose={onClose} size={{base: 'full', md: 'md'}}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>{ selectedWidget?.title }</DrawerHeader>
          <DrawerBody pb={'8'}>
            {selectedWidget && (
              <WidgetPreviewCard title={selectedWidget.title}
                                 description={selectedWidget.description}
                                 previewPath={selectedWidget.previewPath}
                                 embedPath={selectedWidget.embedPath}
                                 iframeTitle={selectedWidget.iframeTitle}
                                 elementId={selectedWidget.elementId}
                                 fixedHeight={selectedWidget.fixedHeight}
                                 controls={selectedWidget.controls}
                                 showTitle={false}
                                 variant={'plain'}
                                 />
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
