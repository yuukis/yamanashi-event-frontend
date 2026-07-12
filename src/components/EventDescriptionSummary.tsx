import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode, SyntheticEvent } from 'react';
import {
  Box,
  Button,
  Heading,
  HStack,
  Link,
  ListItem,
  OrderedList,
  Stack,
  Text,
  UnorderedList,
  useMediaQuery,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { fetchEventDescription } from '../utils/api';
import { SummarizerUnavailableError, isEventDescriptionSummarizerAvailable, streamEventDescriptionSummary } from '../utils/summarizer';

type EventDescriptionSummaryProps = {
  eventUid: string;
  eventTitle: string;
  eventUrl: string;
  enabled?: boolean;
  descriptionYear?: number;
};

type SummaryStatus = 'idle' | 'loading' | 'done' | 'error';

type MarkdownListItem = {
  text: string;
  showCursor: boolean;
};

function renderTerminalCursor() {
  return (
    <Text as={'span'}
          key={'terminal-cursor'}
          color={'green.300'}
          data-testid={'summary-terminal-cursor'}
          sx={{
            '@keyframes terminalCursorBlink': {
              '0%, 45%': { opacity: 1 },
              '46%, 100%': { opacity: 0 },
            },
            animation: 'terminalCursorBlink 1s steps(1, end) infinite',
          }}
          >
      {' '}▌
    </Text>
  );
}

function renderInlineMarkdown(text: string, showCursor = false): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const matchIndex = match.index;
    if (matchIndex == null) {
      continue;
    }

    if (matchIndex > lastIndex) {
      nodes.push(text.slice(lastIndex, matchIndex));
    }

    if (match[2]) {
      nodes.push(
        <Text as={'strong'} key={`${matchIndex}-strong`} fontWeight={'semibold'}>
          {match[2]}
        </Text>,
      );
    } else if (match[3]) {
      nodes.push(
        <Text as={'code'}
              key={`${matchIndex}-code`}
              px={'1'}
              bg={'whiteAlpha.200'}
              borderRadius={'sm'}
              fontSize={'0.9em'}
              >
          {match[3]}
        </Text>,
      );
    } else if (match[4] && match[5]) {
      nodes.push(
        <Link key={`${matchIndex}-link`}
              href={match[5]}
              isExternal
              color={'green.200'}
              textDecoration={'underline'}
              >
          {match[4]}
        </Link>,
      );
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  if (showCursor) {
    nodes.push(renderTerminalCursor());
  }

  return nodes;
}

function renderMarkdownList(items: MarkdownListItem[], ordered: boolean, key: string) {
  const List = ordered ? OrderedList : UnorderedList;

  return (
    <List key={key} spacing={'1'} pl={'4'} m={'0'} fontSize={'sm'}>
      {items.map((item, index) => (
        <ListItem key={`${index}-${item.text}`}>
          {renderInlineMarkdown(item.text, item.showCursor)}
        </ListItem>
      ))}
    </List>
  );
}

function renderSummaryText(summaryText: string, showCursor = false) {
  const blocks: ReactNode[] = [];
  const pendingListItems: MarkdownListItem[] = [];
  let pendingListOrdered = false;
  const lines = summaryText.split(/\r?\n/);
  const lastContentLineIndex = lines.reduce<number | null>((lastIndex, rawLine, index) => (
    rawLine.trim() ? index : lastIndex
  ), null);

  const flushList = () => {
    if (pendingListItems.length === 0) {
      return;
    }

    blocks.push(renderMarkdownList([...pendingListItems], pendingListOrdered, `list-${blocks.length}`));
    pendingListItems.length = 0;
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (unorderedMatch || orderedMatch) {
      const isOrdered = Boolean(orderedMatch);
      if (pendingListItems.length > 0 && pendingListOrdered !== isOrdered) {
        flushList();
      }
      pendingListOrdered = isOrdered;
      pendingListItems.push({
        text: (unorderedMatch ?? orderedMatch)![1],
        showCursor: showCursor && index === lastContentLineIndex,
      });
      return;
    }

    flushList();

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push(
        <Heading key={`heading-${index}`}
                 as={'h3'}
                 size={'xs'}
                 mt={blocks.length === 0 ? '0' : '2'}
                 color={'green.200'}
                 >
          {renderInlineMarkdown(headingMatch[2], showCursor && index === lastContentLineIndex)}
        </Heading>,
      );
      return;
    }

    const quoteMatch = line.match(/^>\s+(.+)$/);
    if (quoteMatch) {
      blocks.push(
        <Box key={`quote-${index}`}
             borderLeft={'3px solid'}
             borderColor={'green.500'}
             pl={'2'}
             color={'gray.300'}
             >
          <Text fontSize={'sm'}>
            {renderInlineMarkdown(quoteMatch[1], showCursor && index === lastContentLineIndex)}
          </Text>
        </Box>,
      );
      return;
    }

    blocks.push(
      <Text key={`paragraph-${index}`} fontSize={'sm'} whiteSpace={'pre-wrap'}>
        {renderInlineMarkdown(line, showCursor && index === lastContentLineIndex)}
      </Text>,
    );
  });

  flushList();

  return <Stack spacing={'2'}>{blocks}</Stack>;
}

function renderTerminalStatusText(label: string, color = 'gray.300', showCursor = true) {
  return (
    <Text fontSize={'sm'} fontFamily={'mono'} color={color} whiteSpace={'pre-wrap'}>
      {label}
      {showCursor && renderTerminalCursor()}
    </Text>
  );
}

function renderSummaryTerminalPanel(content: ReactNode, eventUrl: string) {
  return (
    <Box bg={'#101820'}
         border={'1px solid'}
         borderColor={'whiteAlpha.200'}
         borderRadius={'md'}
         boxShadow={'inset 0 1px 0 rgba(255,255,255,0.06)'}
         overflow={'hidden'}
         w={'100%'}
         aria-live={'polite'}
         >
      <HStack bg={'whiteAlpha.100'}
              borderBottom={'1px solid'}
              borderColor={'whiteAlpha.100'}
              px={'3'}
              py={'2'}
              spacing={'0'}
              >
        <Text color={'gray.400'}
              fontSize={'xs'}
              fontFamily={'mono'}
              >
          [ Built-in AI ]
        </Text>
      </HStack>
      <Box px={'3'}
           py={'3'}
           color={'gray.100'}
           fontFamily={'mono'}
           fontSize={'sm'}
           lineHeight={'1.7'}
           >
        <Text color={'green.300'}
              mb={'2'}
              whiteSpace={'pre-wrap'}
              wordBreak={'break-all'}
              >
          {`$ summarize ${eventUrl}`}
        </Text>
        {content}
      </Box>
    </Box>
  );
}

export function EventDescriptionSummary({
  eventUid,
  eventTitle,
  eventUrl,
  enabled,
  descriptionYear,
}: EventDescriptionSummaryProps) {
  const [isDesktopScreenSize] = useMediaQuery("(min-width: 768px)");
  const [canUseSummarizer, setCanUseSummarizer] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState<SummaryStatus>('idle');
  const [summaryText, setSummaryText] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [summaryDownloadProgress, setSummaryDownloadProgress] = useState<number | null>(null);
  const isSummaryMountedRef = useRef(true);

  const stopCardNavigation = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  useEffect(() => {
    if (!enabled || !isDesktopScreenSize) {
      setCanUseSummarizer(false);
      return;
    }

    let isMounted = true;
    isEventDescriptionSummarizerAvailable().then((isAvailable) => {
      if (isMounted) {
        setCanUseSummarizer(isAvailable);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [enabled, isDesktopScreenSize]);

  useEffect(() => {
    isSummaryMountedRef.current = true;
    return () => {
      isSummaryMountedRef.current = false;
    };
  }, []);

  const handleSummaryButtonClick = async (e: MouseEvent) => {
    stopCardNavigation(e);
    if (summaryStatus === 'loading') {
      return;
    }
    if (isSummaryExpanded) {
      setIsSummaryExpanded(false);
      return;
    }
    setIsSummaryExpanded(true);
    if (summaryStatus === 'done' && summaryText) {
      return;
    }

    setSummaryStatus('loading');
    setSummaryText('');
    setSummaryError('');
    setSummaryDownloadProgress(null);

    try {
      const description = (descriptionYear == null
        ? await fetchEventDescription(eventUid)
        : await fetchEventDescription(eventUid, { year: descriptionYear })).trim();
      if (!description) {
        setSummaryError('要約できる説明文がありません');
        setSummaryStatus('error');
        return;
      }

      await streamEventDescriptionSummary(description, eventTitle, (chunk) => {
        if (!isSummaryMountedRef.current) {
          return;
        }
        setSummaryText((current) => current + chunk);
      }, (progress) => {
        if (!isSummaryMountedRef.current) {
          return;
        }
        setSummaryDownloadProgress(Math.round(progress * 100));
      });
      if (!isSummaryMountedRef.current) {
        return;
      }
      setSummaryStatus('done');
      setSummaryDownloadProgress(null);
    } catch (error) {
      if (!isSummaryMountedRef.current) {
        return;
      }
      setSummaryError(error instanceof SummarizerUnavailableError
        ? error.message
        : '要約の生成に失敗しました');
      setSummaryStatus('error');
      setSummaryDownloadProgress(null);
    }
  };

  if (!enabled || !isDesktopScreenSize || !canUseSummarizer) {
    return null;
  }

  return (
    <Stack mt={'2'} pr={{md: '140px'}} spacing={'2'} alignItems={'flex-start'}>
      <Button size={'sm'}
              variant={'ghost'}
              color={'gray.600'}
              fontWeight={'normal'}
              leftIcon={isSummaryExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
              px={'1'}
              h={'auto'}
              minH={'1.5rem'}
              _hover={{ bg: 'blackAlpha.50', color: 'gray.700' }}
              _active={{ bg: 'blackAlpha.100' }}
              onClick={handleSummaryButtonClick}
              onTouchStart={stopCardNavigation}
              onTouchMove={stopCardNavigation}
              onTouchEnd={stopCardNavigation}
              >
        どんなイベント？（AI要約）
      </Button>
      {isSummaryExpanded && (
        renderSummaryTerminalPanel(summaryText ? (
            renderSummaryText(summaryText, summaryStatus === 'loading')
          ) : summaryStatus === 'error' ? (
            renderTerminalStatusText(`error: ${summaryError}`, 'red.200', false)
          ) : (
            renderTerminalStatusText(summaryDownloadProgress == null
              ? '確認中...'
              : `AIモデルをダウンロード中... ${summaryDownloadProgress}%`)
          ), eventUrl)
      )}
    </Stack>
  );
}
