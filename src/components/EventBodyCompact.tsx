import {
  Box,
  Stack,
  HStack,
  VStack,
  Spacer,
  Heading,
  Text,
  Image,
  Badge,
  Button,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Link,
  Flex,
  Show,
  Hide,
  Tooltip,
} from '@chakra-ui/react';
import { FaXTwitter } from "react-icons/fa6";
import { FiArchive, FiExternalLink, FiMap } from "react-icons/fi";
import {
  GeoAlt,
  Person,
  People,
  ChevronRight,
  Star,
  StarFill,
} from '@chakra-icons/bootstrap';
import { formatEventDateKey, getEventAnchorId } from '../utils/eventAnchors';
import { ShareButton } from './ShareButtons';
import { buildGroupPagePath } from '../utils/groupPage';
import { useEventBodyData, type EventBodyProps } from './useEventBodyData';

// コミュニティロゴ(top/right起点の絶対配置)の実サイズ。標準表示より
// 縮小している(標準はEventBody.tsxのGROUP_LOGO_SIZEを参照)。
// モバイル/デスクトップ共通(スター・ロゴとも縦中央揃え・横並びに統一)。
const GROUP_LOGO_SIZE = { w: '44px', h: '30px' };
// 見出し・住所/コミュニティ行の右側予約幅。
// デスクトップ: ロゴ(または汎用アイコン/空きスペース)とスター単体ボタン
// ぶんを常に確保し、カード間でスター位置が縦に揃うようにする。
// モバイル: スターは左側に移動済みのため、右側はロゴ(あれば)+シェブロン
// ぶんのみでよい。ロゴがない行は汎用アイコンも出さないため、シェブロン分の
// 最小限の余白にする。
const RIGHT_RESERVE_PR_DESKTOP = '108px';
// ロゴ/汎用アイコンの右オフセット。モバイルはスターが左に移動済みなので
// カード右端(シェブロン)に寄せ、デスクトップはスター(right:'2')の
// さらに左に置く。
const GROUP_LOGO_RIGHT_OFFSET = { base: '24px', md: '56px' };

export function EventBodyCompact(data: EventBodyProps) {
  const d = useEventBodyData(data);
  const right_reserve_pr = {
    base: d.group_image_url ? '68px' : '24px',
    md: RIGHT_RESERVE_PR_DESKTOP,
  };

  return (
    <>
      <HStack ref={d.cardRef}
              p={'1'} position={'relative'}
              id={d.anchorId}
              data-event-card
              data-event-date={formatEventDateKey(d.start_date).replace(/-/g, '')}
              className={d.isHighlighted ? 'event-card-highlight' : undefined}
              scrollMarginTop={{base: '4.5rem', md: '5.5rem'}}
              {...(!d.isDesktopScreenSize && {
                onTouchStart: d.handleTouchStart,
                onTouchMove: d.handleTouchMove,
                onTouchEnd: d.handleTouchEnd,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                _active: {bg: 'gray.100'},
              })}>
        {/* 日付単位のanchorIdは同日2件目以降には付かないため、それとは
            独立してイベント単位で常に存在するジャンプ先を用意する。 */}
        <Box id={getEventAnchorId(d.event.uid)}
             position={'absolute'}
             top={'0'} left={'0'}
             w={'0'} h={'0'}
             overflow={'hidden'}
             scrollMarginTop={{base: '4.5rem', md: '5.5rem'}}
             aria-hidden
             />
        <Flex w={'100%'}
              ml={{base: '1', md: '0'}}
              flexDirection={'row'}
              alignItems={'stretch'}
              >
          {/* モバイル: スターを日付より左、カードの最も左に置く
              (シェブロンと近すぎて不自然だったため)。通常フローの
              先頭要素にすることで、絶対配置による重なりを避ける。 */}
          <Hide above='md'>
            <Flex alignItems={'center'} mr={'1'} flexShrink={0}>
              <Tooltip label={d.attendanceMarkLabel} hasArrow fontSize={'xs'}>
                <IconButton aria-label={d.attendanceMarkLabel}
                            icon={d.isMarked ? <StarFill /> : <Star />}
                            size={'xs'}
                            variant={d.isMarked ? 'solid' : 'ghost'}
                            colorScheme={d.isMarked ? 'yellow' : 'gray'}
                            onClick={d.handleCardMarkClick}
                            onTouchStart={d.handleMarkButtonTouch}
                            onTouchMove={d.handleMarkButtonTouch}
                            onTouchEnd={d.handleMarkButtonTouch}
                            />
              </Tooltip>
            </Flex>
          </Hide>
          <Stack w={{base: 'auto', md: '25%'}}
                flexShrink={{base: 0, md: 1}}
                direction={'column'}
                spacing={'0'}
                alignItems={'flex-start'}
                justifyContent={'center'}
                mr={{base: '3', md: '0'}}
                color={'gray.600'}
                >
            { d.now_year !== d.start_year && (
              <HStack spacing={'0'} justifyContent={'flex-start'}>
                <Text fontSize={{base: 'xs', md: 'sm'}}
                      fontWeight={'light'}
                      mr={'1'}
                      >{ d.start_year }</Text>
              </HStack>
            )}
            {/* 年表示がある場合(md)は年を別行にするため、月日と時刻は
                崩れないよう1つのHStackにまとめて1単位として扱う。
                alignItems=baselineで月日(大きい文字)と曜日/時刻(小さい
                文字)のベースラインを揃える。月日は左寄せに戻しつつ、
                最大幅"00/00"ぶんの固定幅boxに収めることで、実際の日付の
                桁数(1桁/2桁)に関わらず時刻の開始位置がカード間で縦に
                揃うようにする(tabular-numsで数字の字幅も揃える)。 */}
            <Stack spacing={'0'}
                    w={{base: '56px', md: 'auto'}}
                    direction={{base: 'column', md: 'row'}}
                    justifyContent={'flex-start'}
                    alignItems={{base: 'flex-start', md: 'baseline'}}
                    mt={d.now_year !== d.start_year ? '-1' : '0'}
                    >
              <Box w={{base: 'auto', md: '2.7em'}}
                   flexShrink={0}
                   fontSize={{base: 'lg', md: '2xl', lg: '3xl'}}
                   sx={{ fontVariantNumeric: 'tabular-nums' }}
                   >
                <HStack spacing={'0'}>
                  <Text fontSize={'inherit'}
                        fontWeight={'bold'}
                        color={'gray.700'}
                        >{ d.start_month }</Text>
                  <Text fontSize={'inherit'}
                        fontWeight={'light'}
                        color={'gray.700'}
                        >
                    /{ d.start_day }</Text>
                </HStack>
              </Box>
              <Text fontSize={{base: 'xs', lg: 'sm'}}
                    color={'gray.500'}
                    ml={{base: '0', md: '1'}}
                    mt={{base: '-1', md: '0'}}
                    whiteSpace={'nowrap'}
                    >
                ({ d.start_dow }) { d.start_time }-
              </Text>
            </Stack>
            {(d.is_today || d.is_ongoing) && !d.has_ended ? (
              <Badge bg={'#f9f1e8'}
                     color={'impact.700'}
                     border={'1px solid'}
                     borderColor={'impact.500'}
                     fontSize={{base: 'xs', md: '0.65rem'}}
                     fontWeight={'bold'}
                     ml={'0'}
                     mt={{base: '0', md: '-1'}}
                     >
                {d.is_ongoing ? '開催中' : '本日開催'}
              </Badge>
            ) : d.is_new ? (
              <Badge bg={'#f3e8fb'}
                     color={'purple.700'}
                     border={'1px solid'}
                     borderColor={'purple.500'}
                     fontSize={{base: 'xs', md: '0.65rem'}}
                     fontWeight={'bold'}
                     ml={'0'}
                     mt={{base: '0', md: '-1'}}
                     >
                NEW
              </Badge>
            ) : null}
          </Stack>
          <Show above='md'>
            <Stack spacing={'2px'} direction={'row'} ml={'3.1px'} mr={'4'}>
              <Box w={'1px'} bg={'impact.500'} />
              <Box w={'1px'} bg={'secondary.500'} />
              <Box w={'1px'} bg={'primary.500'} />
            </Stack>
          </Show>
          <Flex w={{base: 'auto', md: '100%'}}
                flex={{base: '1', md: 'initial'}}
                minW={'0'}
                direction={'column'}
                justifyContent={'center'}
                >
            <Hide above='md'>
              <Heading fontSize={'sm'}
                      color={'primary.800'}
                      pr={right_reserve_pr}
                      >
                { d.title }
              </Heading>
            </Hide>
            <Show above='md'>
              <Heading fontSize={'md'}
                      color={'primary.800'}
                      pr={right_reserve_pr}
                      letterSpacing={'0.05rem'}
                      >
                <Link href={d.event_url} isExternal>{ d.title }</Link>
              </Heading>
            </Show>
            <HStack mt={'1'} pr={right_reserve_pr}>
              <Stack p={'0'}
                     spacing={{base: '3', md: '4'}}
                     direction={'row'}
                     alignItems={'baseline'}
                     minW={'0'}
                     >
                {d.address_array.length > 0 && (
                  // モバイルはコミュニティ名を非表示にした関係で住所が
                  // Stack内の唯一の子要素になるため、flexShrinkを許可して
                  // 画像/シェブロンの手前でnoOfLinesの省略が効くようにする
                  // (flexShrink:0のままだと自然幅のまま画像に重なっていた)。
                  <HStack color={'gray.500'} flexShrink={{base: 1, md: 0}} minW={'0'}>
                    <GeoAlt />
                    <Show above='md'><Text fontSize={'xs'} noOfLines={1}><Link href={d.event_map_url} isExternal>{ d.address_array[0] }</Link></Text></Show>
                    <Hide above='md'><Text fontSize={'xs'} noOfLines={1} minW={'0'}>{ d.address_array[0] }</Text></Hide>
                  </HStack>
                )}
                {/* コミュニティ名/主催者名はモバイルでは非表示。表示幅が
                    狭く省略記号しか読めなかったため、住所の方を優先して
                    幅いっぱいまで読めるようにする。 */}
                <Show above='md'>
                  {d.group_name ? (
                    <HStack color={'gray.500'} minW={'0'}>
                      <People />
                      <Text fontSize={'xs'} noOfLines={1}>{d.group_name}</Text>
                    </HStack>
                  ) : d.owner_name && (
                    <HStack color={'gray.500'} minW={'0'}>
                      <Person />
                      <Text fontSize={'xs'} noOfLines={1}>{d.owner_name}</Text>
                    </HStack>
                  )}
                </Show>
              </Stack>
            </HStack>
            {/* モバイルの「その他」3点メニューはコンパクト表示では廃止。
                同じ内容のドロワーは長押しでも開けるため、行の高さが低い
                コンパクト表示では省略し、その分の右上スペースを空ける。 */}
            {d.group_image_url ? (
              d.group_key && d.isDesktopScreenSize ? (
                <Button variant={'unstyled'}
                        aria-label={`${d.group_name ?? 'コミュニティ'}のページを見る`}
                        position={'absolute'}
                        top={'50%'}
                        transform={'translateY(-50%)'}
                        right={GROUP_LOGO_RIGHT_OFFSET}
                        w={GROUP_LOGO_SIZE.w}
                        h={GROUP_LOGO_SIZE.h}
                        minW={'auto'}
                        p={'0'}
                        opacity={'1'}
                        transition={'opacity 120ms ease-out'}
                        _hover={{ opacity: '0.7' }}
                        onClick={d.handleGroupLogoClick}
                        onTouchStart={d.handleGroupLogoTouch}
                        onTouchMove={d.handleGroupLogoTouch}
                        onTouchEnd={d.handleGroupLogoTouch}
                        >
                  <Image src={ d.group_image_url } alt={''} w={'100%'} h={'100%'} fit={'contain'} />
                </Button>
              ) : (
                <Image src={ d.group_image_url }
                      alt={d.group_name ?? ''}
                      w={GROUP_LOGO_SIZE.w}
                      h={GROUP_LOGO_SIZE.h}
                      fit={'contain'}
                      position={'absolute'}
                      top={'50%'}
                      transform={'translateY(-50%)'}
                      right={GROUP_LOGO_RIGHT_OFFSET}
                      />
              )
            ) : (
              // 画像のない登録コミュニティ: デスクトップは実画像の代わりに
              // 汎用アイコンを同じ枠に表示し、位置を揃える。モバイルは
              // 汎用アイコンを出さず、その分イベント名等の表示エリアを
              // シェブロン近くまで広げる(right_reserve_prのbase側で対応)。
              d.has_group_page && (
                <Show above='md'>
                  <Button variant={'unstyled'}
                          aria-label={`${d.group_name ?? 'コミュニティ'}のページを見る`}
                          position={'absolute'}
                          top={'50%'}
                          transform={'translateY(-50%)'}
                          right={GROUP_LOGO_RIGHT_OFFSET.md}
                          w={GROUP_LOGO_SIZE.w}
                          h={GROUP_LOGO_SIZE.h}
                          minW={'auto'}
                          p={'0'}
                          display={'flex'}
                          alignItems={'center'}
                          justifyContent={'center'}
                          bg={'gray.50'}
                          borderRadius={'md'}
                          border={'1px solid'}
                          borderColor={'gray.100'}
                          opacity={'1'}
                          transition={'opacity 120ms ease-out'}
                          _hover={{ opacity: '0.7' }}
                          onClick={d.handleGroupLogoClick}
                          onTouchStart={d.handleGroupLogoTouch}
                          onTouchMove={d.handleGroupLogoTouch}
                          onTouchEnd={d.handleGroupLogoTouch}
                          >
                    <People color={'gray.400'} />
                  </Button>
                </Show>
              )
            )}
            {/* 標準表示の右下ボタン群(「詳細」+ドロップダウンメニュー)は
                行の高さが低いコンパクト表示だとロゴ(top基準)と縦に
                重なってしまうため、ロゴと同じ上端基準で横に並べる
                スター単体ボタンに置き換える。デスクトップのみ(モバイルは
                タイトル左のスターを使う。シェブロンとの距離を取るため)。 */}
            <Show above='md'>
              <Tooltip label={d.attendanceMarkLabel} hasArrow fontSize={'xs'}>
                <IconButton aria-label={d.attendanceMarkLabel}
                            icon={d.isMarked ? <StarFill /> : <Star />}
                            size={'sm'}
                            variant={d.isMarked ? 'solid' : 'ghost'}
                            colorScheme={d.isMarked ? 'yellow' : 'gray'}
                            position={'absolute'}
                            top={'50%'}
                            transform={'translateY(-50%)'}
                            right={'2'}
                            zIndex={1}
                            onClick={d.handleCardMarkClick}
                            onTouchStart={d.handleMarkButtonTouch}
                            onTouchMove={d.handleMarkButtonTouch}
                            onTouchEnd={d.handleMarkButtonTouch}
                            />
              </Tooltip>
            </Show>
          </Flex>
        </Flex>
        {/* シェブロンも画像・スターと同じく絶対配置にする。通常フロー
            (Spacer併用)のままだと、HStack内でシェブロン分の幅が常に
            確保されてしまい、画像なし行でコンテンツ側の右端をシェブロン
            際まで広げられなかったため。デスクトップはSpacerを維持
            (削除すると縦線位置がわずかにズレるため)。 */}
        <Show above='md'>
          <Spacer />
        </Show>
        <Hide above='md'>
          <Box position={'absolute'} top={'50%'} transform={'translateY(-50%)'} right={'2'} aria-hidden>
            <ChevronRight />
          </Box>
        </Hide>
      </HStack>

      <Drawer placement="bottom"
              isOpen={d.isOpen}
              onClose={() => {
                d.resetState();
                d.onClose();
              }}
              >
        <DrawerOverlay />
        <DrawerContent pb={6}
                       borderTopRadius="xl"
                       animation="slide-up"
                       >
          <DrawerHeader textAlign="center"
                        borderBottomWidth="1px"
                        >
            { d.title }
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={2}>
              <Button w="full"
                      leftIcon={d.isMarked ? <StarFill /> : <Star />}
                      colorScheme={d.isMarked ? 'yellow' : 'gray'}
                      onClick={d.handleDrawerMarkClick}
                      >
                { d.attendanceMarkLabel }
              </Button>
              <ShareButton event={d.event} onAfterAction={d.onClose} label={d.nativeShareLabel} />
              <Button w="full"
                      leftIcon={<FiExternalLink />}
                      onClick={() => {
                        window.open(d.event.event_url);
                        d.onClose();
                      }}
                      >
                情報提供元のページを開く
              </Button>
              {d.has_group_page && (
                <Button w="full"
                        leftIcon={<People />}
                        onClick={() => {
                          window.open(buildGroupPagePath(d.group_key!), '_self');
                          d.onClose();
                        }}
                        >
                  コミュニティページを見る
                </Button>
              )}
              {d.address_array.length > 0 && (
                <Button w="full"
                        leftIcon={<FiMap />}
                        onClick={() => {
                          window.open(d.event_map_url);
                          d.onClose();
                        }}
                        >
                  マップで会場を見る
                </Button>
              )}
              <Button w="full"
                      leftIcon={<FaXTwitter />}
                      onClick={() => {
                        window.open(d.event_x_search_url);
                        d.onClose();
                      }}
                      >
                { d.x_search_label }
              </Button>
              {d.is_archive_event && d.archive_url && (
                <Button w="full"
                        leftIcon={<FiArchive />}
                        onClick={() => {
                          window.open(d.archive_url!);
                          d.onClose();
                        }}
                        >
                  アーカイブ元を開く
                </Button>
              )}
              <Button w="full"
                      colorScheme="red"
                      onClick={d.onClose}
                      >
                キャンセル
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
