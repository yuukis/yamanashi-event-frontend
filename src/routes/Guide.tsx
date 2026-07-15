import { useEffect, useState } from 'react';
import { SiteHeader, SiteFooter, useFixedHeaderBoundary } from '../components/Site';
import { WidgetPreviewCard } from '../components/WidgetPreviewCard';
import '../style.css';
import eyecatch from "../assets/images/eyecatch.png"
import {
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Heading,
  Image,
  Link,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import {
  BellIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  InfoOutlineIcon,
  SearchIcon,
  StarIcon,
} from "@chakra-ui/icons";
import { fetchGroups } from '../utils/api';
import { buildListWidgetPath } from '../utils/widgetPaths';
import type { ApiGroup } from '../types/events';

function Guide() {
  const headerBoundaryRef = useFixedHeaderBoundary<HTMLHeadingElement>();

  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [selectedGroupKey, setSelectedGroupKey] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchGroups()
      .then((res) => {
        if (!cancelled) {
          setGroups([...res].sort((a, b) => a.title.localeCompare(b.title, 'ja')));
        }
      })
      .catch(() => {
        // 一覧パーツのプレビューは「すべてのイベント」のまま利用できるので、
        // コミュニティ選択肢の取得失敗は静かに無視する
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedGroup = groups.find((group) => group.key === selectedGroupKey);
  const listWidgetPath = buildListWidgetPath(selectedGroupKey);
  const listIframeTitle = selectedGroup ? `${selectedGroup.title} イベント情報` : '山梨イベント情報';
  const listElementId = selectedGroup ? `yamanashi-hub-widget-events-${selectedGroup.key}` : 'yamanashi-hub-widget-events';

  document.title = 'はじめての方へ - Yamanashi Developer Hub';

  const guideItems = [
    {
      icon: <SearchIcon color={'primary.700'} />,
      title: '山梨のITイベントを探す',
      body: '県内で開催される勉強会、コミュニティイベント、オンライン参加できるイベントをまとめて確認できます。',
    },
    {
      icon: <CalendarIcon color={'secondary.800'} />,
      title: '開催予定と過去のイベントを見る',
      body: 'トップページでは直近の開催予定、年別ページではこれまでに開催されたイベントを一覧できます。',
    },
    {
      icon: <BellIcon color={'impact.700'} />,
      title: '通知やカレンダーで追いかける',
      body: '新しいイベントを見逃したくない方は通知を有効にしたり、iCalendar URL を普段のカレンダーに登録できます。',
    },
    {
      icon: <InfoOutlineIcon color={'gray.600'} />,
      title: '掲載元を確認する',
      body: 'イベント情報は connpass と、地域コミュニティが提供するイベントカレンダーをもとに掲載しています。',
    },
  ];

  return (
    <Box bg={'gray.100'} w={'100vw'} minH={'100vh'}>
      <SiteHeader />
      <Box bg={'#fffafa'}>
        <Container maxW={'980px'}
                   p={{base: '8', md: '10'}}
                   display={'flex'}
                   alignItems={'center'}
                   flexDirection={{base: 'column', md: 'row'}}
                   gap={{base: '6', md: '10'}}
                   >
          <Stack spacing={'4'} flex={'1'}>
            <Text fontSize={'sm'} color={'impact.700'} fontWeight={'bold'}>
              はじめての方へ
            </Text>
            <Heading size={{base: 'lg', md: 'xl'}} color={'gray.700'} lineHeight={'1.5'}>
              山梨の技術コミュニティと出会うための入口です
            </Heading>
            <Text fontSize={{base: 'sm', md: 'md'}} color={'gray.700'}>
              Yamanashi Developer Hub は、山梨県内のIT勉強会や開発者向けイベントをまとめて見つけられるサイトです。
              興味のあるイベントを探したり、地域のコミュニティを知るきっかけとして使えます。
            </Text>
            <Stack direction={{base: 'column', sm: 'row'}} spacing={'3'}>
              <Button colorScheme={'impact'}
                      onClick={() => { window.open('/', '_self') }}
                      leftIcon={<CheckCircleIcon />}
                      >
                開催予定を見る
              </Button>
              <Button variant={'outline'}
                      colorScheme={'primary'}
                      onClick={() => { window.open('/events', '_self') }}
                      leftIcon={<CalendarIcon />}
                      >
                イベントアーカイブを見る
              </Button>
            </Stack>
          </Stack>
          <Image src={eyecatch}
                 boxSize={{base: '220px', md: '300px'}}
                 objectFit={'contain'}
                 alt='Yamanashi Developer Hub'
                 />
        </Container>
      </Box>

      <Container maxW={'980px'} w={'100%'} p={{base: '4', md: '8'}}>
        <Stack spacing={'8'}>
          <Box>
            <Heading ref={headerBoundaryRef} size={{base: 'sm', md: 'md'}} mb={'4'} color={'gray.600'}>
              このサイトでできること
            </Heading>
            <SimpleGrid columns={{base: 1, md: 2}} spacing={'4'}>
              {guideItems.map((item) => (
                <Card key={item.title} variant={'outline'} borderRadius={'md'}>
                  <CardBody>
                    <Stack spacing={'3'}>
                      <Box fontSize={'xl'}>{item.icon}</Box>
                      <Heading size={'sm'} color={'gray.700'}>
                        {item.title}
                      </Heading>
                      <Text fontSize={'sm'} color={'gray.600'} lineHeight={'1.8'}>
                        {item.body}
                      </Text>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>

          <Box>
            <Heading size={{base: 'sm', md: 'md'}} mb={'4'} color={'gray.600'}>
              初めて参加する方へ
            </Heading>
            <Card variant={'outline'} borderRadius={'md'}>
              <CardBody>
                <Stack spacing={'4'}>
                  <Stack direction={'row'} spacing={'3'} alignItems={'flex-start'}>
                    <StarIcon color={'secondary.800'} mt={'1'} />
                    <Text fontSize={'sm'} color={'gray.700'} lineHeight={'1.8'}>
                      勉強会は、発表を聞くだけの参加でも大丈夫なものが多くあります。イベントページで対象者、会場、参加方法を確認してみてください。
                    </Text>
                  </Stack>
                  <Stack direction={'row'} spacing={'3'} alignItems={'flex-start'}>
                    <StarIcon color={'secondary.800'} mt={'1'} />
                    <Text fontSize={'sm'} color={'gray.700'} lineHeight={'1.8'}>
                      気になるコミュニティを見つけたら、イベントページや主催者ページから過去の活動も見られます。
                    </Text>
                  </Stack>
                  <Stack direction={'row'} spacing={'3'} alignItems={'flex-start'}>
                    <StarIcon color={'secondary.800'} mt={'1'} />
                    <Text fontSize={'sm'} color={'gray.700'} lineHeight={'1.8'}>
                      掲載したいイベントがある場合は、GitHub リポジトリから相談できます。
                      <Link color={'primary.800'} href='https://github.com/yuukis/yamanashi-event-frontend' isExternal ml={'1'}>
                        GitHub<ExternalLinkIcon mx={'2px'} />
                      </Link>
                    </Text>
                  </Stack>
                </Stack>
              </CardBody>
            </Card>
          </Box>

          <Box>
            <Heading size={{base: 'sm', md: 'md'}} mb={'4'} color={'gray.600'}>
              ブログパーツ
            </Heading>
            <Text fontSize={'sm'} color={'gray.600'} mb={'4'} lineHeight={'1.8'}>
              イベント情報をブログやサイトに埋め込めます。プレビューを確認して、下のスニペットをコピーしてお使いください。
            </Text>
            <SimpleGrid columns={{base: 1, md: 2}} spacing={'4'}>
              <WidgetPreviewCard title={'イベント一覧'}
                                 description={'直近開催・終了したイベントを一覧表示します。プルダウンでコミュニティを絞り込めます。'}
                                 previewPath={listWidgetPath}
                                 embedPath={listWidgetPath}
                                 iframeTitle={listIframeTitle}
                                 elementId={listElementId}
                                 controls={
                                   <Select size={'sm'}
                                           value={selectedGroupKey}
                                           onChange={(e) => setSelectedGroupKey(e.target.value)}
                                           >
                                     <option value={''}>すべてのイベント</option>
                                     {groups.map((group) => (
                                       <option key={group.key} value={group.key}>{ group.title }</option>
                                     ))}
                                   </Select>
                                 }
                                 />
              <WidgetPreviewCard title={'イベントカレンダー'}
                                 description={'月間カレンダーでイベント日をハイライトします。日付をクリックするとその日のイベントを確認できます。'}
                                 previewPath={'/widget/calendar'}
                                 embedPath={'/widget/calendar'}
                                 iframeTitle={'山梨イベントカレンダー'}
                                 elementId={'yamanashi-hub-widget-calendar'}
                                 />
            </SimpleGrid>
          </Box>

          <Box>
            <Heading size={{base: 'sm', md: 'md'}} mb={'4'} color={'gray.600'}>
              運営について
            </Heading>
            <Card variant={'outline'} borderRadius={'md'}>
              <CardBody>
                <Stack spacing={'3'}>
                  <Text fontSize={'sm'} color={'gray.700'} lineHeight={'1.8'}>
                    Yamanashi Developer Hub は、山梨県内のITイベントを見つけやすくするために
                    <Link color={'primary.800'} href='https://maxio.jp/yuuki' isExternal mx={'1'}>
                      しみず ゆうき<ExternalLinkIcon mx={'2px'} />
                    </Link>
                    が個人で運営しています。
                  </Text>
                  <Text fontSize={'sm'} color={'gray.700'} lineHeight={'1.8'}>
                    サイトへの意見、掲載に関する相談、イベント情報の修正依頼は、
                    <Link color={'primary.800'} href='https://github.com/yuukis/yamanashi-event-frontend' isExternal mx={'1'}>
                      GitHub<ExternalLinkIcon mx={'2px'} />
                    </Link>
                    または
                    <Link color={'primary.800'} href='https://x.com/yuuki_maxio' isExternal mx={'1'}>
                      X<ExternalLinkIcon mx={'2px'} />
                    </Link>
                    から連絡できます。
                  </Text>
                </Stack>
              </CardBody>
            </Card>
          </Box>
        </Stack>
        <SiteFooter />
      </Container>
    </Box>
  );
}

export default Guide;
