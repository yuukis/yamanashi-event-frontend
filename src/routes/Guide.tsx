import { useEffect, useMemo, useState } from 'react';
import { ICalendarButton, SiteHeader, SiteFooter, useFixedHeaderBoundary } from '../components/Site';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { WidgetPartsSection } from '../components/WidgetPartsSection';
import type { WidgetDefinition } from '../components/WidgetPartsSection';
import { SyncButton } from '../components/Sync';
import '../style.css';
import eyecatch from '../assets/images/eyecatch.png';
import {
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Flex,
  Heading,
  Image,
  Link,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { CalendarIcon, ExternalLinkIcon, InfoOutlineIcon, SearchIcon, StarIcon } from '@chakra-ui/icons';
import { FaXTwitter } from 'react-icons/fa6';
import { FiArrowRight, FiBell, FiCalendar, FiCode, FiCoffee, FiHeadphones, FiMapPin, FiUsers } from 'react-icons/fi';
import { fetchEvents, fetchGroups } from '../utils/api';
import { buildListWidgetPath, buildNextEventWidgetPath } from '../utils/widgetPaths';
import { collectActiveGroupKeys, splitGroupsByActivity } from '../utils/groupActivity';
import { X_ACCOUNT_URL } from '../utils/site';
import type { ApiGroup } from '../types/events';

function Guide() {
  const headerBoundaryRef = useFixedHeaderBoundary<HTMLDivElement>();
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [activeGroupKeys, setActiveGroupKeys] = useState<Set<string>>(new Set());
  const [selectedGroupKey, setSelectedGroupKey] = useState('');
  const [selectedBannerGroupKey, setSelectedBannerGroupKey] = useState('');

  useEffect(() => {
    document.title = 'はじめての方へ - Yamanashi Developer Hub';
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchGroups().then((response) => !cancelled && setGroups(response)).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchEvents('group_key')
      .then((response) => !cancelled && setActiveGroupKeys(collectActiveGroupKeys(response.events)))
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const { activeGroups, inactiveGroups } = useMemo(
    () => splitGroupsByActivity(groups, activeGroupKeys),
    [groups, activeGroupKeys],
  );

  useEffect(() => {
    if (selectedBannerGroupKey || groups.length === 0) return;
    setSelectedBannerGroupKey((activeGroups[0] ?? inactiveGroups[0] ?? groups[0]).key);
  }, [groups, activeGroups, inactiveGroups, selectedBannerGroupKey]);

  const groupOptions = (activeList: ApiGroup[], inactiveList: ApiGroup[]) => (
    <>
      {activeList.length > 0 && (
        <optgroup label={'イベント情報のあるコミュニティ'}>
          {activeList.map((group) => <option key={group.key} value={group.key}>{group.title}</option>)}
        </optgroup>
      )}
      {inactiveList.length > 0 && (
        <optgroup label={'その他のコミュニティ'}>
          {inactiveList.map((group) => <option key={group.key} value={group.key}>{group.title}</option>)}
        </optgroup>
      )}
    </>
  );

  const selectedGroup = groups.find((group) => group.key === selectedGroupKey);
  const listWidgetPath = buildListWidgetPath(selectedGroupKey);
  const selectedBannerGroup = groups.find((group) => group.key === selectedBannerGroupKey);
  const bannerWidgetPath = buildNextEventWidgetPath(selectedBannerGroupKey);

  const widgetDefinitions: WidgetDefinition[] = [
    {
      key: 'events',
      title: 'イベント一覧',
      description: '直近開催・終了したイベントを一覧表示。コミュニティで絞り込むこともできます。',
      previewPath: listWidgetPath,
      embedPath: listWidgetPath,
      iframeTitle: selectedGroup ? `${selectedGroup.title} イベント情報` : '山梨イベント情報',
      elementId: selectedGroup ? `yamanashi-hub-widget-events-${selectedGroup.key}` : 'yamanashi-hub-widget-events',
      controls: (
        <Select size={'sm'} aria-label={'プレビューするコミュニティを選択'} value={selectedGroupKey} onChange={(event) => setSelectedGroupKey(event.target.value)}>
          <option value={''}>すべてのイベント</option>
          {groupOptions(activeGroups, inactiveGroups)}
        </Select>
      ),
    },
    {
      key: 'calendar',
      title: 'イベントカレンダー',
      description: 'イベントのある日がひと目で分かる月間カレンダーです。',
      previewPath: '/widget/calendar',
      embedPath: '/widget/calendar',
      iframeTitle: '山梨イベントカレンダー',
      elementId: 'yamanashi-hub-widget-calendar',
    },
    ...(selectedBannerGroupKey ? [{
      key: 'next-event',
      title: '次回イベント予定',
      description: 'コミュニティの次回予定をコンパクトなバナーで案内します。',
      previewPath: bannerWidgetPath,
      embedPath: bannerWidgetPath,
      iframeTitle: selectedBannerGroup ? `${selectedBannerGroup.title} 次回イベント予定` : '次回イベント予定',
      elementId: selectedBannerGroup ? `yamanashi-hub-widget-next-event-${selectedBannerGroup.key}` : 'yamanashi-hub-widget-next-event',
      fixedHeight: '96px',
      controls: (
        <Select size={'sm'} aria-label={'プレビューするコミュニティを選択'} value={selectedBannerGroupKey} onChange={(event) => setSelectedBannerGroupKey(event.target.value)}>
          {groupOptions(activeGroups, inactiveGroups)}
        </Select>
      ),
    }] : []),
  ];

  return (
    <Box className={'guide-c'} minH={'100vh'}>
      <SiteHeader />

      <Box ref={headerBoundaryRef} className={'guide-c-hero'}>
        <PageBreadcrumb items={[{label: 'はじめての方へ', href: '/guide'}]} />
        <Container maxW={'1120px'} px={{base: '5', md: '8'}} py={{base: '9', md: '16'}}>
          <SimpleGrid templateColumns={{base: '1fr', lg: '1.12fr 0.88fr'}} spacing={{base: '10', lg: '14'}} alignItems={'center'}>
            <Stack spacing={'6'} position={'relative'} zIndex={'2'}>
              <Flex className={'guide-c-label'} align={'center'} gap={'2'} alignSelf={'flex-start'}>
                <Box className={'guide-c-live-dot'} />
                <Text>山梨のITイベント情報ポータル</Text>
              </Flex>
              <Heading as={'h1'} className={'guide-c-title'} fontSize={{base: '4xl', sm: '5xl', lg: '6xl'}}>
                山梨の<br />ITイベントが、<br />ここで見つかる。
              </Heading>
              <Text color={'#24454f'} lineHeight={'1.9'} fontSize={{base: 'md', md: 'lg'}} maxW={'640px'}>
                Yamanashi Developer Hub は、山梨県内のIT勉強会や開発者向けイベントをまとめて探せるサイトです。
                開催予定の確認から、地域コミュニティ探しまで、ここから始められます。
              </Text>
              <Stack direction={{base: 'column', sm: 'row'}} spacing={'3'}>
                <Button as={'a'} href={'/'} size={'lg'} className={'guide-c-primary-button'} rightIcon={<FiArrowRight />}>開催予定から探す</Button>
                <Button as={'a'} href={'/groups'} size={'lg'} variant={'ghost'} color={'#153f49'} leftIcon={<FiUsers />} _hover={{bg: 'blackAlpha.100'}}>コミュニティを見る</Button>
              </Stack>
              <Flex gap={'5'} wrap={'wrap'} color={'#45656d'} fontSize={'sm'}>
                <Flex align={'center'} gap={'2'}><FiMapPin /> 山梨県内＋オンライン</Flex>
                <Flex align={'center'} gap={'2'}><FiCalendar /> 過去イベントも検索</Flex>
              </Flex>
            </Stack>

            <Box className={'guide-c-collage'}>
              <Box className={'guide-c-shape guide-c-shape-yellow'} aria-hidden />
              <Box className={'guide-c-shape guide-c-shape-blue'} aria-hidden />
              <Box className={'guide-c-image-card'}>
                <Image src={eyecatch} alt={'山梨の技術コミュニティに集まる人々'} />
              </Box>
              <Box className={'guide-c-sticker guide-c-sticker-top'}>
                <Text fontSize={'xs'} fontWeight={'bold'}>次のイベント</Text>
                <Text fontSize={'lg'} fontWeight={'bold'}>見つけよう ↗</Text>
              </Box>
              <Box className={'guide-c-sticker guide-c-sticker-bottom'}>
                <Text fontSize={'3xl'}>☺</Text>
                <Text fontSize={'xs'} fontWeight={'bold'}>LISTEN ONLY<br />IS WELCOME</Text>
              </Box>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      <Box className={'guide-c-marquee'} aria-hidden>
        <Text>EVENTS&nbsp; ✦ &nbsp;PEOPLE&nbsp; ✦ &nbsp;IDEAS&nbsp; ✦ &nbsp;COMMUNITY&nbsp; ✦ &nbsp;YAMANASHI&nbsp; ✦ &nbsp;EVENTS&nbsp; ✦ &nbsp;PEOPLE</Text>
      </Box>

      <Box bg={'#fffaf0'}>
        <Container maxW={'1120px'} px={{base: '5', md: '8'}} py={{base: '14', md: '22'}}>
          <Flex justify={'space-between'} align={{base: 'flex-start', lg: 'end'}} direction={{base: 'column', lg: 'row'}} gap={'4'} mb={'9'}>
            <Box>
              <Text className={'guide-c-kicker'}>WHAT YOU CAN DO</Text>
              <Heading color={'#153f49'} fontSize={{base: '3xl', md: '4xl'}} mt={'2'}>ここでできること。</Heading>
            </Box>
            <Text color={'#5c7075'} maxW={'460px'} lineHeight={'1.8'}>探す、残す、追いかける。使い方はあなたのペースに合わせて。</Text>
          </Flex>

          <Box className={'guide-c-bento'}>
            <Card className={'guide-c-bento-card guide-c-bento-search'}>
              <CardBody p={{base: '6', md: '8'}} display={'flex'} flexDirection={'column'} justifyContent={'space-between'}>
                <Flex justify={'space-between'} align={'flex-start'}><SearchIcon boxSize={'7'} /><Text className={'guide-c-card-number'}>01</Text></Flex>
                <Box mt={'12'}><Heading size={'lg'} mb={'3'}>イベントを探す</Heading><Text lineHeight={'1.8'}>開催日、エリア、コミュニティ、キーワードで絞り込みながら、山梨県内とオンラインの開催予定を探せます。</Text></Box>
                <Link href={'/'} display={'inline-flex'} alignItems={'center'} gap={'2'} mt={'6'} fontWeight={'bold'}>開催予定を見る <FiArrowRight /></Link>
              </CardBody>
            </Card>

            <Card className={'guide-c-bento-card guide-c-bento-archive'}>
              <CardBody p={'6'}>
                <Flex justify={'space-between'}><CalendarIcon boxSize={'6'} /><Text className={'guide-c-card-number'}>02</Text></Flex>
                <Heading size={'md'} mt={'8'} mb={'2'}>過去をたどる</Heading>
                <Text fontSize={'sm'} lineHeight={'1.8'}>2010年からの開催記録を年別に掲載。活動したコミュニティや月ごとの開催数も分かります。</Text>
                <Link href={'/events'} display={'inline-flex'} alignItems={'center'} gap={'2'} mt={'4'} fontSize={'sm'} fontWeight={'bold'}>アーカイブへ <FiArrowRight /></Link>
              </CardBody>
            </Card>

            <Card className={'guide-c-bento-card guide-c-bento-mark'}>
              <CardBody p={'6'}>
                <Flex justify={'space-between'}><StarIcon boxSize={'6'} /><Text className={'guide-c-card-number'}>03</Text></Flex>
                <Heading size={'md'} mt={'8'} mb={'2'}>行きたいを残す</Heading>
                <Text fontSize={'sm'} lineHeight={'1.8'}>気になるイベントに星をつけて、あとからまとめて確認。友達へのシェアや別端末への引き継ぎもできます。</Text>
                <Box mt={'5'}><SyncButton /></Box>
              </CardBody>
            </Card>

            <Card className={'guide-c-bento-card guide-c-bento-follow'}>
              <CardBody p={{base: '6', md: '8'}}>
                <Flex align={'center'} justify={'space-between'} gap={'3'}><FiBell size={'25'} /><Text className={'guide-c-card-number'}>04</Text></Flex>
                <Heading size={'lg'} mt={'6'} mb={'3'}>新しいイベントを見逃さない</Heading>
                <Text lineHeight={'1.8'} maxW={'720px'}>新着情報の受け取り方は3種類。普段の情報収集や予定管理に合う方法を選べます。</Text>
                <SimpleGrid columns={{base: 1, md: 3}} spacing={'3'} mt={'6'}>
                  <Stack className={'guide-c-follow-option'} spacing={'3'}>
                    <Flex className={'guide-c-follow-icon'} align={'center'} justify={'center'}><FiBell /></Flex>
                    <Box>
                      <Heading size={'sm'} mb={'1'}>Webプッシュ通知</Heading>
                      <Text fontSize={'xs'} lineHeight={'1.7'}>新しいイベントが登録されたら、ブラウザへ通知します。</Text>
                    </Box>
                    <Text fontSize={'xs'} fontWeight={'bold'}>画面上部のベルから設定</Text>
                  </Stack>
                  <Stack className={'guide-c-follow-option'} spacing={'3'}>
                    <Flex justify={'space-between'} align={'center'}>
                      <Flex className={'guide-c-follow-icon'} align={'center'} justify={'center'}><FiCalendar /></Flex>
                      <ICalendarButton />
                    </Flex>
                    <Box>
                      <Heading size={'sm'} mb={'1'}>iCalendar</Heading>
                      <Text fontSize={'xs'} lineHeight={'1.7'}>Google、Outlook、Appleのカレンダーに登録。追加された予定が普段のカレンダーに反映されます。</Text>
                    </Box>
                  </Stack>
                  <Stack className={'guide-c-follow-option'} spacing={'3'}>
                    <Flex className={'guide-c-follow-icon'} align={'center'} justify={'center'}><FaXTwitter /></Flex>
                    <Box>
                      <Heading size={'sm'} mb={'1'}>X</Heading>
                      <Text fontSize={'xs'} lineHeight={'1.7'}>新しく掲載されたイベントをタイムラインで確認できます。</Text>
                    </Box>
                    <Button as={'a'} href={X_ACCOUNT_URL} target={'_blank'} rel={'noopener'} size={'xs'} alignSelf={'flex-start'} leftIcon={<FaXTwitter />} bg={'black'} color={'white'} _hover={{bg: 'blackAlpha.800'}}>@ymns_tech_event</Button>
                  </Stack>
                </SimpleGrid>
              </CardBody>
            </Card>

            <Card className={'guide-c-bento-card guide-c-bento-source'}>
              <CardBody p={'6'} display={'flex'} flexDirection={'column'} justifyContent={'space-between'}>
                <Flex justify={'space-between'}><InfoOutlineIcon boxSize={'6'} /><Text className={'guide-c-card-number'}>05</Text></Flex>
                <Box mt={'8'}><Heading size={'md'} mb={'2'}>掲載元を確認</Heading><Text fontSize={'sm'} lineHeight={'1.8'}>イベント情報は connpass と地域コミュニティのカレンダーをもとに掲載。詳しい内容や参加申込は各イベントの公式ページで確認できます。</Text></Box>
              </CardBody>
            </Card>
          </Box>
        </Container>
      </Box>

      <Box className={'guide-c-archive-feature'}>
        <Container maxW={'1120px'} px={{base: '5', md: '8'}} py={{base: '14', md: '20'}}>
          <SimpleGrid templateColumns={{base: '1fr', lg: '0.78fr 1.22fr'}} spacing={{base: '10', lg: '16'}} alignItems={'center'}>
            <Stack spacing={'6'}>
              <Box>
                <Text className={'guide-c-kicker'} color={'#ffd45c'}>EVENT ARCHIVE</Text>
                <Heading color={'white'} fontSize={{base: '3xl', md: '4xl'}} lineHeight={'1.4'} mt={'3'}>
                  2010年からの活動を、<br />年ごとに振り返る。
                </Heading>
              </Box>
              <Text color={'whiteAlpha.700'} lineHeight={'1.9'}>
                イベントアーカイブでは、その年に活動したコミュニティと、月ごとのイベント開催数を一覧できます。昔参加した勉強会を探したり、山梨の技術コミュニティの広がりを眺めたりできます。
              </Text>
              <Stack spacing={'3'}>
                {[
                  '年を選ぶと、その年のイベント一覧へ',
                  'コミュニティのアイコンから活動ページへ',
                  '月ごとの開催数を小さなグラフで比較',
                ].map((text) => (
                  <Flex key={text} align={'center'} gap={'3'} color={'whiteAlpha.900'} fontSize={'sm'}>
                    <Box w={'6px'} h={'6px'} borderRadius={'full'} bg={'#ff745f'} />
                    <Text>{text}</Text>
                  </Flex>
                ))}
              </Stack>
              <Button as={'a'} href={'/events'} alignSelf={'flex-start'} size={'lg'} bg={'#ffd45c'} color={'#153f49'} rightIcon={<FiArrowRight />} _hover={{bg: '#ffe18a', transform: 'translateX(3px)'}}>
                イベントアーカイブを見る
              </Button>
            </Stack>

            <Box className={'guide-c-archive-preview'} aria-label={'イベントアーカイブの表示イメージ'}>
              <Flex className={'guide-c-archive-preview-header'} justify={'space-between'} align={'end'}>
                <Box>
                  <Text className={'guide-c-card-number'}>YAMANASHI TECH HISTORY</Text>
                  <Heading size={'md'} mt={'1'}>イベントアーカイブ</Heading>
                </Box>
                <Text className={'guide-c-card-number'}>2010 — NOW</Text>
              </Flex>
              <Stack spacing={'3'} mt={'5'}>
                {[
                  {year: '2011', groups: 1, counts: [0, 0, 0, 0, 2, 3, 1, 0, 0, 0, 0, 0]},
                  {year: '2019', groups: 8, counts: [2, 2, 4, 5, 8, 9, 4, 8, 7, 5, 5, 5]},
                  {year: '2025', groups: 11, counts: [3, 3, 3, 5, 6, 6, 6, 6, 3, 6, 5, 4]},
                ].map((row) => (
                  <Flex key={row.year} className={'guide-c-archive-row'} align={'center'} gap={{base: '3', sm: '5'}}>
                    <Text className={'guide-c-archive-year'}>{row.year}</Text>
                    <Flex className={'guide-c-archive-community'} align={'center'}>
                      {Array.from({length: Math.min(row.groups, 4)}).map((_, index) => <Box key={index} className={'guide-c-avatar-dot'} />)}
                      <Text fontSize={'xs'} color={'#617278'} ml={'2'}>+{row.groups}</Text>
                    </Flex>
                    <Flex className={'guide-c-archive-bars'} align={'flex-end'} gap={'2px'} aria-hidden>
                      {row.counts.map((count, index) => <Box key={index} h={`${Math.max(3, count * 4)}px`} />)}
                    </Flex>
                  </Flex>
                ))}
              </Stack>
              <Text fontSize={'xs'} color={'#718185'} mt={'4'} textAlign={'right'}>年を選ぶとイベントの記録が開きます ↗</Text>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      <Box className={'guide-c-first'}>
        <Container maxW={'1120px'} px={{base: '5', md: '8'}} py={{base: '14', md: '20'}}>
          <SimpleGrid templateColumns={{base: '1fr', lg: '0.85fr 1.15fr'}} spacing={{base: '9', lg: '14'}} alignItems={'center'}>
            <Box>
              <Text className={'guide-c-kicker'}>FIRST TIME?</Text>
              <Heading color={'#153f49'} fontSize={{base: '3xl', md: '4xl'}} lineHeight={'1.4'} mt={'2'}>参加スタイルは、<br />ひとつじゃない。</Heading>
              <Text color={'#45656d'} lineHeight={'1.9'} mt={'5'}>まずは聞いてみるだけでも、もちろん大丈夫。自分に合いそうなイベントから始めてみてください。</Text>
            </Box>
            <Stack spacing={'4'}>
              {[
                {icon: FiHeadphones, title: '聞いてみる', body: '発表を聞くだけの参加でも大丈夫なイベントが多くあります。'},
                {icon: FiCoffee, title: '話してみる', body: '休憩時間や交流タイムに、気になったことをひとこと。'},
                {icon: FiUsers, title: 'つながってみる', body: 'コミュニティページから過去の活動や次回予定をチェック。'},
              ].map(({icon: Icon, title, body}) => (
                <Flex key={title} className={'guide-c-mode'} align={'center'} gap={'5'}>
                  <Flex className={'guide-c-mode-icon'} align={'center'} justify={'center'}><Icon size={'23'} /></Flex>
                  <Box><Heading size={'sm'} color={'#153f49'} mb={'1'}>{title}</Heading><Text fontSize={'sm'} color={'#5c7075'} lineHeight={'1.7'}>{body}</Text></Box>
                </Flex>
              ))}
            </Stack>
          </SimpleGrid>
        </Container>
      </Box>

      <Box className={'guide-c-widget-area'}>
        <Container maxW={'1120px'} px={{base: '5', md: '8'}} py={{base: '14', md: '20'}}>
          <SimpleGrid templateColumns={{base: '1fr', lg: '0.8fr 1.2fr'}} spacing={'8'} alignItems={'end'} mb={'9'}>
            <Box>
              <Flex align={'center'} gap={'2'} mb={'3'}><FiCode /><Text className={'guide-c-kicker'}>WIDGET TOOLBOX</Text></Flex>
              <Heading color={'#153f49'} fontSize={{base: '3xl', md: '4xl'}}>あなたのサイトにも、<br />山梨のイベントを。</Heading>
            </Box>
            <Text color={'#495e63'} lineHeight={'1.9'}>3種類のブログパーツから選んで、表示を確認し、埋め込みコードをコピーできます。</Text>
          </SimpleGrid>
          <Box className={'guide-c-widget-shell'}>
            <WidgetPartsSection widgets={widgetDefinitions} heading={''} description={''} />
          </Box>
        </Container>
      </Box>

      <Box bg={'#fffaf0'}>
        <Container maxW={'1120px'} px={{base: '5', md: '8'}} pt={{base: '14', md: '20'}}>
          <Box className={'guide-c-about'}>
            <SimpleGrid columns={{base: 1, lg: 2}} spacing={'8'} alignItems={'center'}>
              <Box><Text className={'guide-c-kicker'}>MADE IN YAMANASHI</Text><Heading color={'#153f49'} fontSize={{base: '2xl', md: '3xl'}} mt={'2'}>コミュニティへの入口を、もっと近くに。</Heading></Box>
              <Stack spacing={'4'} color={'#5c7075'} fontSize={'sm'} lineHeight={'1.9'}>
                <Text>
                  このサイトは
                  <Link href={'https://maxio.jp/yuuki'} isExternal color={'#153f49'} mx={'1'}>しみず ゆうき<ExternalLinkIcon mx={'2px'} /></Link>
                  が個人で運営しています。
                </Text>
                <Text>
                  掲載相談・情報修正・ご意見は
                  <Link href={'https://github.com/yuukis/yamanashi-event-frontend'} isExternal color={'#153f49'} mx={'1'}>GitHub<ExternalLinkIcon mx={'2px'} /></Link>
                  または
                  <Link href={'https://x.com/yuuki_maxio'} isExternal color={'#153f49'} mx={'1'}>X<ExternalLinkIcon mx={'2px'} /></Link>
                  からどうぞ。
                </Text>
              </Stack>
            </SimpleGrid>
          </Box>
          <SiteFooter />
        </Container>
      </Box>
    </Box>
  );
}

export default Guide;
