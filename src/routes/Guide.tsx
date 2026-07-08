import { SiteHeader, SiteFooter, useFixedHeaderBoundary } from '../components/Site';
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

function Guide() {
  const headerBoundaryRef = useFixedHeaderBoundary<HTMLHeadingElement>();

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
                      onClick={() => { window.open(`/${new Date().getFullYear()}`, '_self') }}
                      leftIcon={<CalendarIcon />}
                      >
                年別一覧を見る
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
