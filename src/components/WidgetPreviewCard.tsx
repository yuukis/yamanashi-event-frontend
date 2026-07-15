import { useRef } from 'react';
import type { ReactNode } from 'react';
import { Box, Card, CardBody, Heading, Stack, Text } from '@chakra-ui/react';
import { CopySnippetBlock } from './CopySnippetBlock';
import { useWidgetIframeAutoHeight, WIDGET_RESIZE_MESSAGE_TYPE } from '../utils/widgetResize';

const SITE_ORIGIN = 'https://hub.yamanashi.dev';

function buildSnippet(embedPath: string, iframeTitle: string, elementId: string): string {
  const src = `${SITE_ORIGIN}${embedPath}`;
  return [
    `<iframe id="${elementId}"`,
    `        src="${src}"`,
    `        style="width:100%;border:0;"`,
    `        scrolling="no"`,
    `        title="${iframeTitle}"></iframe>`,
    `<script>`,
    `  (function () {`,
    `    var iframe = document.getElementById('${elementId}');`,
    `    window.addEventListener('message', function (event) {`,
    `      if (event.source !== iframe.contentWindow) return;`,
    `      if (!event.data || event.data.type !== '${WIDGET_RESIZE_MESSAGE_TYPE}') return;`,
    `      iframe.style.height = event.data.height + 'px';`,
    `    });`,
    `  })();`,
    `</script>`,
  ].join('\n');
}

type WidgetPreviewCardProps = {
  title: string;
  description: string;
  previewPath: string;
  embedPath: string;
  iframeTitle: string;
  elementId: string;
  controls?: ReactNode;
};

export function WidgetPreviewCard({
  title,
  description,
  previewPath,
  embedPath,
  iframeTitle,
  elementId,
  controls,
}: WidgetPreviewCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useWidgetIframeAutoHeight(iframeRef);

  return (
    <Card variant={'outline'} borderRadius={'md'}>
      <CardBody>
        <Stack spacing={'3'}>
          <Heading size={'sm'} color={'gray.700'}>{ title }</Heading>
          <Text fontSize={'sm'} color={'gray.600'} lineHeight={'1.8'}>{ description }</Text>
          { controls }
          <Box borderWidth={'1px'} borderColor={'gray.200'} borderRadius={'md'} overflow={'hidden'} bg={'white'}>
            <iframe ref={iframeRef}
                    src={previewPath}
                    title={iframeTitle}
                    style={{ width: '100%', border: 0, display: 'block' }}
                    />
          </Box>
          <CopySnippetBlock code={buildSnippet(embedPath, iframeTitle, elementId)} />
        </Stack>
      </CardBody>
    </Card>
  );
}
