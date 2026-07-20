import { useRef } from 'react';
import type { ReactNode } from 'react';
import { Box, Card, CardBody, Heading, Stack, Text } from '@chakra-ui/react';
import { CopySnippetBlock } from './CopySnippetBlock';
import { useWidgetIframeAutoHeight, WIDGET_RESIZE_MESSAGE_TYPE } from '../utils/widgetResize';
import { SITE_URL as SITE_ORIGIN } from '../utils/site';

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeJsSingleQuotedString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
}

function buildSnippet(embedPath: string, iframeTitle: string, elementId: string): string {
  const src = escapeHtmlAttribute(`${SITE_ORIGIN}${embedPath}`);
  const idAttr = escapeHtmlAttribute(elementId);
  const idJs = escapeJsSingleQuotedString(elementId);
  const title = escapeHtmlAttribute(iframeTitle);
  return [
    `<iframe id="${idAttr}"`,
    `        src="${src}"`,
    `        style="width:100%;border:0;"`,
    `        scrolling="no"`,
    `        title="${title}"></iframe>`,
    `<script>`,
    `  (function () {`,
    `    var iframe = document.getElementById('${idJs}');`,
    `    if (!iframe) return;`,
    `    window.addEventListener('message', function (event) {`,
    `      if (event.source !== iframe.contentWindow) return;`,
    `      if (!event.data || event.data.type !== '${WIDGET_RESIZE_MESSAGE_TYPE}') return;`,
    `      var height = event.data.height;`,
    `      if (typeof height !== 'number' || !isFinite(height) || height < 0) return;`,
    `      iframe.style.height = height + 'px';`,
    `    });`,
    `  })();`,
    `</script>`,
  ].join('\n');
}

// 横並び表示(md以上)にしたときのプレビュー枠の固定幅。ブログの
// サイドバーに置くウィジェットとして想定している幅に合わせる。
const SIDE_BY_SIDE_PREVIEW_WIDTH = '360px';

type WidgetPreviewCardProps = {
  title: string;
  description: string;
  previewPath: string;
  embedPath: string;
  iframeTitle: string;
  elementId: string;
  controls?: ReactNode;
  // 'stacked'(既定): プレビューとスニペットを常に縦に並べる。
  // 'side-by-side': md以上でプレビューを固定幅にしてスニペットと横に並べる
  // (プレビューがカード幅いっぱいに間延びするのを防ぐ)。
  layout?: 'stacked' | 'side-by-side';
};

export function WidgetPreviewCard({
  title,
  description,
  previewPath,
  embedPath,
  iframeTitle,
  elementId,
  controls,
  layout = 'stacked',
}: WidgetPreviewCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useWidgetIframeAutoHeight(iframeRef);

  const isSideBySide = layout === 'side-by-side';

  return (
    <Card variant={'outline'} borderRadius={'md'}>
      <CardBody>
        <Stack spacing={'3'}>
          <Heading size={'sm'} color={'gray.700'}>{ title }</Heading>
          <Text fontSize={'sm'} color={'gray.600'} lineHeight={'1.8'}>{ description }</Text>
          { controls }
          <Stack direction={isSideBySide ? {base: 'column', md: 'row'} : 'column'}
                 spacing={isSideBySide ? '4' : '3'}
                 align={'flex-start'}
                 >
            <Box borderWidth={'1px'}
                 borderColor={'gray.200'}
                 borderRadius={'md'}
                 overflow={'hidden'}
                 bg={'white'}
                 w={isSideBySide ? {base: '100%', md: SIDE_BY_SIDE_PREVIEW_WIDTH} : '100%'}
                 flexShrink={0}
                 >
              <iframe ref={iframeRef}
                      src={previewPath}
                      title={iframeTitle}
                      loading={'lazy'}
                      style={{ width: '100%', border: 0, display: 'block' }}
                      />
            </Box>
            <Box w={'100%'} minW={'0'} flex={isSideBySide ? '1' : undefined}>
              <CopySnippetBlock code={buildSnippet(embedPath, iframeTitle, elementId)}
                                label={`${title}の埋め込みスニペット`}
                                />
            </Box>
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  );
}
