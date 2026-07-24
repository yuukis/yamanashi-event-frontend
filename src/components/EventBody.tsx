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
  ButtonGroup,
  Button,
  Menu,
  MenuList,
  MenuButton,
  MenuItem,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Link,
  Flex,
  Tag,
  Wrap,
  WrapItem,
  Skeleton,
  SkeletonCircle,
  Show,
  Hide,
  Tooltip,
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
} from '@chakra-ui/react';
import { FaXTwitter } from "react-icons/fa6";
import { FiArchive, FiExternalLink, FiMap, FiMoreVertical } from "react-icons/fi";
import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Hash,
  GeoAlt,
  Person,
  People,
  Tags,
  ChevronRight,
  ExclamationTriangleFill,
  Star,
  StarFill,
} from '@chakra-icons/bootstrap';
import { formatEventDateKey, getEventAnchorId } from '../utils/eventAnchors';
import { ShareIconRow, ShareButton, XShareButton } from './ShareButtons';
import { EventDescriptionSummary } from './EventDescriptionSummary';
import { buildGroupPagePath } from '../utils/groupPage';
import { useEventBodyData, type EventBodyProps } from './useEventBodyData';

// コミュニティロゴ(top/right起点の絶対配置)の実サイズ。この下に本文が
// 回り込まないよう、pr({@link RIGHT_RESERVE_PR})をこのサイズに揃えること。
const GROUP_LOGO_SIZE = { w: '80px', h: '54px' };
// 見出し・住所/コミュニティ行の右側予約幅。ロゴ(GROUP_LOGO_SIZE)と、
// デスクトップ右下の「詳細」ボタン+ドロップダウンメニューぶんを確保する。
const RIGHT_RESERVE_PR = { base: '60px', md: '140px' };
const RIGHT_RESERVE_PR_NO_LOGO = { base: '0px', md: '140px' };

export function EventBody(data: EventBodyProps) {
  const d = useEventBodyData(data);
  const right_reserve_pr = d.group_image_url ? RIGHT_RESERVE_PR : RIGHT_RESERVE_PR_NO_LOGO;

  return (
    <>
      <HStack ref={d.cardRef}
              p={'2'} position={'relative'}
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
              ml={{base: '2', md: '0'}}
              flexDirection={{base: 'column', md: 'row'}}
              alignItems={{base: 'flex-start', md: 'stretch'}}
              >
          <Stack w={{base: '100%', md: '25%'}}
                direction={{base: 'row', md: 'column'}}
                spacing={'0'}
                alignItems={{base: 'baseline', md: 'center'}}
                mb={{base: '1', md: '0'}}
                color={'gray.600'}
                >
            { d.now_year !== d.start_year && (
              <HStack spacing={'0'}
                      justifyContent={{base: 'flex-start', md: 'center'}}
                      >
                <Text fontSize={'sm'}
                      fontWeight={'light'}
                      letterSpacing={{md: '0.1rem'}}
                      mr={{base: '1', md: '0'}}
                      >{ d.start_year }</Text>
              </HStack>
            )}
            <HStack spacing={'0'}
                    justifyContent={{base: 'flex-start', md: 'center'}}
                    mt={{base: '0', md: '-0.5rem', lg: '-0.8rem'}}
                    >
              <Text fontSize={{base: '2xl', md: '4xl', lg: '5xl'}}
                    fontWeight={'bold'}
                    letterSpacing={{md: '0.1rem'}}
                    >{ d.start_month }</Text>
              <Text fontSize={{base: '2xl', md: '4xl', lg: '5xl'}}
                    fontWeight={'light'}
                    letterSpacing={{md: '0.1rem'}}
                    >
                /{ d.start_day }</Text>
            </HStack>
            <Text fontSize={'lg'}
                  mt={{md: '-0.5rem'}}
                  >
              ({ d.start_dow }) { d.start_time }-
            </Text>
            {(d.is_today || d.is_ongoing) && !d.has_ended ? (
              <Badge bg={'#f9f1e8'}
                     color={'impact.700'}
                     border={'1px solid'}
                     borderColor={'impact.500'}
                     fontSize={'xs'}
                     fontWeight={'bold'}
                     ml={{base: '2', md: '0'}}
                     mt={{base: '0', md: '1'}}
                     >
                {d.is_ongoing ? '開催中' : '本日開催'}
              </Badge>
            ) : d.is_new ? (
              <Badge bg={'#f3e8fb'}
                     color={'purple.700'}
                     border={'1px solid'}
                     borderColor={'purple.500'}
                     fontSize={'xs'}
                     fontWeight={'bold'}
                     ml={{base: '2', md: '0'}}
                     mt={{base: '0', md: '1'}}
                     >
                NEW
              </Badge>
            ) : null}
            <Show above='md'>
              <ShareIconRow event={d.event} nativeShareLabel={d.nativeShareLabel} />
            </Show>
          </Stack>
          <Show above='md'>
            <Stack spacing={'2px'} direction={'row'} mr={'4'}>
              <Box w={'1px'} bg={'impact.500'} />
              <Box w={'1px'} bg={'secondary.500'} />
              <Box w={'1px'} bg={'primary.500'} />
            </Stack>
          </Show>
          <Box w={'100%'} minH={{md: '120px'}}>
            <Heading fontSize={{base: 'md', lg: 'lg'}}
                    color={'primary.800'}
                    pr={right_reserve_pr}
                    letterSpacing={{base: '0', md: '0.05rem'}}
                    >
              <Show above='md'><Link href={d.event_url} isExternal>{ d.title }</Link></Show>
              <Hide above='md'>{ d.title }</Hide>
            </Heading>
            <Text fontSize={'sm'}
                  pr={right_reserve_pr}
                  >{ d.sub_title }</Text>
            {d.is_archive_event && (
              <Badge colorScheme="secondary" variant="subtle"
                     display={'block'} w={'fit-content'}
                     >
                アーカイブ
              </Badge>
            )}
            <EventDescriptionSummary eventUid={d.event.uid}
                                     eventTitle={d.title}
                                     eventUrl={d.event_url}
                                     enabled={d.enableSummarizer}
                                     descriptionYear={d.summaryDescriptionYear}
                                     />
            <HStack mt={'2'} pr={right_reserve_pr}>
              <Stack p={{base: '2', md: '2'}} spacing={{base: '0', md: '0.5rem'}}>
                {d.keywords.length > 0 && (
                  <HStack alignItems={'flex-start'} color={'gray.500'}>
                    <Tags mt={'3px'} />
                    <Wrap spacing={'1'}>
                      {d.keywords.map((keyword) => (
                        <WrapItem key={keyword}>
                          <Tag size={'sm'}
                               fontSize={'xs'}
                               fontWeight={'normal'}
                               bg={d.selectedKeyword === keyword ? 'gray.500' : 'blackAlpha.100'}
                               color={d.selectedKeyword === keyword ? 'white' : 'gray.500'}
                               {...(d.isDesktopScreenSize && d.onKeywordClick && {
                                 as: 'button' as const,
                                 cursor: 'pointer',
                                 onClick: () => d.onKeywordClick?.(keyword),
                               })}
                               >
                            {keyword}
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </HStack>
                )}
                {d.hash_tag && (
                  <HStack>
                    <Hash />
                    <Show above='md'><Text fontSize={'sm'} noOfLines={1}><Link href={d.hash_tag_url} isExternal>{ d.hash_tag }</Link></Text></Show>
                    <Hide above='md'><Text fontSize={'sm'} noOfLines={1}>{ d.hash_tag }</Text></Hide>
                  </HStack>
                )}
                {d.address_array.length > 0 && (
                  <HStack>
                    <GeoAlt />
                    <Show above='md'><Text fontSize={'sm'} noOfLines={1}><Link href={d.event_map_url} isExternal>{ d.address_array[0] }</Link></Text></Show>
                    <Hide above='md'><Text fontSize={'sm'} noOfLines={1}>{ d.address_array[0] }</Text></Hide>
                  </HStack>
                )}
                {d.address_array.length > 1 && (
                  <HStack ml={'24px'} mt={{base: '0', md: '-0.5rem'}}>
                    <Text fontSize={'sm'} noOfLines={1}>{ d.address_array[1] }</Text>
                  </HStack>
                )}
                {d.group_name && (
                  <HStack>
                    <People />
                    <Show above='md'>
                      {d.has_group_page ? (
                        <Button size={'xs'}
                                onClick={() => window.open(buildGroupPagePath(d.group_key!), '_self')}
                                >{d.group_name}</Button>
                      ) : d.group_key && d.group_url ? (
                        <Button size={'xs'}
                                as={'a'}
                                href={d.group_url}
                                target={'_blank'}
                                rel={'noopener'}
                                rightIcon={<FiExternalLink />}
                                >{d.group_name}</Button>
                      ) : (
                        <Text fontSize={'sm'} noOfLines={1}>{d.group_name}</Text>
                      )}
                    </Show>
                    <Hide above='md'>
                      <Text fontSize={'sm'}
                            noOfLines={1}
                            >{d.group_name}</Text>
                    </Hide>
                  </HStack>
                )}
                {d.group_name == null && d.owner_name && (
                  <HStack>
                    <Person />
                      <Text fontSize={'sm'} noOfLines={1}>{d.owner_name}</Text>
                  </HStack>
                )}
              </Stack>
            </HStack>
            <Hide above='md'>
              <IconButton aria-label='More options'
                          icon={<FiMoreVertical />}
                          size='sm'
                          variant='ghost'
                          position='absolute'
                          top='0'
                          right='0'
                          onClick={d.handleMenuButtonClick}
                          onTouchStart={d.handleMenuButtonTouch}
                          onTouchMove={d.handleMenuButtonTouch}
                          onTouchEnd={d.handleMenuButtonTouch}
                          zIndex={1}
                          />
            </Hide>

            <Hide above='md'>
              <IconButton aria-label={d.attendanceMarkLabel}
                          icon={d.isMarked ? <StarFill /> : <Star />}
                          size='sm'
                          variant={d.isMarked ? 'solid' : 'ghost'}
                          colorScheme={d.isMarked ? 'yellow' : 'gray'}
                          position='absolute'
                          bottom='2'
                          right='2'
                          onClick={d.handleCardMarkClick}
                          onTouchStart={d.handleMarkButtonTouch}
                          onTouchMove={d.handleMarkButtonTouch}
                          onTouchEnd={d.handleMarkButtonTouch}
                          zIndex={1}
                          />
            </Hide>

            {d.group_image_url && (
              d.group_key && d.isDesktopScreenSize ? (
                <Button variant={'unstyled'}
                        aria-label={`${d.group_name ?? 'コミュニティ'}のページを見る`}
                        position={'absolute'}
                        top={{base: '4', md: '2'}}
                        right={{base: '4', md: '4'}}
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
                      top={{base: '4', md: '2'}}
                      right={{base: '4', md: '4'}}
                      />
              )
            )}
            <Show above='md'>
              <Popover isOpen={d.isMarkPopoverOpen} onClose={d.onMarkPopoverClose} placement='top-end' isLazy>
                <HStack position={'absolute'} bottom={'2'} right={'4'} spacing={'2'}>
                  {/* Tooltipを外側に置く: PopoverAnchorは直接の子にrefをcloneするが、
                      Tooltipにrefを渡すとTooltip自身のポップアップ用refとして
                      横取りされてしまい、Popoverのアンカー位置が壊れる
                      (Tooltip内部でtooltip.getTooltipProps({}, ref)に渡る)。
                      shouldWrapChildrenでspan包みにし、cloneElementを介さない。 */}
                  <Tooltip label={d.attendanceMarkLabel} hasArrow fontSize={'xs'} shouldWrapChildren>
                    <PopoverAnchor>
                      <IconButton aria-label={d.attendanceMarkLabel}
                                  icon={d.isMarked ? <StarFill /> : <Star />}
                                  variant={d.isMarked ? 'solid' : 'ghost'}
                                  colorScheme={d.isMarked ? 'yellow' : 'gray'}
                                  onClick={d.handleCardMarkClick}
                                  />
                    </PopoverAnchor>
                  </Tooltip>
                  <ButtonGroup isAttached
                              size={'md'}
                              colorScheme={'impact'}
                              >
                    <Button w={'100px'} onClick={() => window.open(d.event_url)}>
                      <HStack>
                        <Text letterSpacing={'0.2rem'}>詳細</Text>
                      </HStack>
                    </Button>
                    <Box h="full" w="1px" />
                    <Menu placement="bottom-end" isLazy>
                      {({ isOpen: isMenuOpen }) => (
                        <>
                          <MenuButton as={IconButton}
                                      aria-label='Options'
                                      icon={<ChevronDownIcon />}
                                      />
                          <MenuList fontSize={'sm'} display={isMenuOpen ? 'block' : 'none'}>
                            <MenuItem icon={<FiExternalLink />}
                                      onClick={() => window.open(d.event_url)}
                                      >
                              情報提供元のページを開く
                            </MenuItem>
                            {d.has_group_page && (
                              <MenuItem icon={<People />}
                                        onClick={() => window.open(buildGroupPagePath(d.group_key!), '_self')}
                                        >
                                コミュニティページを見る
                              </MenuItem>
                            )}
                            <MenuItem icon={<FaXTwitter />}
                                      onClick={() => window.open(d.event_x_search_url)}
                                      >
                              { d.x_search_label }
                            </MenuItem>
                            {d.is_archive_event && d.archive_url && (
                              <MenuItem icon={<FiArchive />}
                                        onClick={() => window.open(d.archive_url!)}
                                        >
                                アーカイブ元を開く
                              </MenuItem>
                            )}
                          </MenuList>
                        </>
                      )}
                    </Menu>
                  </ButtonGroup>
                </HStack>
                <PopoverContent w={'auto'}>
                  <PopoverArrow />
                  <PopoverBody>
                    <Stack spacing={'2'}>
                      <Stack spacing={'0'}>
                        <Text fontSize={'sm'} fontWeight={'bold'}>{ d.attendanceMarkConfirmationText }</Text>
                        <Text fontSize={'xs'} color={'gray.500'}>{ d.attendanceInviteSubtext }</Text>
                      </Stack>
                      <XShareButton event={d.event} />
                      <ShareButton event={d.event} label={d.nativeShareLabel} />
                    </Stack>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </Show>
          </Box>
        </Flex>
        <Spacer />
        <Hide above='md'><ChevronRight /></Hide>
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

export function SkeletonEventBody() {

  return (
    <HStack p={{base: '4', md: '2'}}>
      <Flex w={'100%'}
          flexDirection={{base: 'column', md: 'row'}}
          alignItems={{base: 'flex-start', md: 'stretch'}}
          >
        <Stack w={{base: '100%', md: '180px'}}
              direction={{base: 'row', md: 'column'}}
              alignItems={{base: 'baseline', md: 'center'}}
              mb={'0.5rem'}
              >
          <Skeleton height={{base: '1.2rem', md: '2rem'}}
                    width={{base: '4rem', md: '5rem'}}
                    />
          <Skeleton height={{base: '0.875rem', md: '1.2rem'}}
                    width={{base: '3rem', md: '6rem'}}
                    />
        </Stack>
        <Show above='md'>
          <Stack spacing={'2px'} direction={'row'} mr={'4'}>
            <Box w={'1px'} bg={'gray.200'} />
            <Box w={'1px'} bg={'gray.200'} />
            <Box w={'1px'} bg={'gray.200'} />
          </Stack>
        </Show>
        <Box w={'100%'}>
          <Skeleton height={{base: '0.875rem', md: '1rem'}}
                    width={{base: '12rem', md: '12rem'}}
                    />
          <HStack mt={'2'}>
            <Stack p={'2'} spacing={{base: '0.2rem', md: '0.5rem'}}>
              <HStack>
                <SkeletonCircle size={'1rem'} />
                <Skeleton height={'0.875rem'} width={'6rem'} />
              </HStack>
              <HStack>
                <SkeletonCircle size={'1rem'} />
                <Skeleton height={'0.875rem'} width={'4rem'} />
              </HStack>
            </Stack>
          </HStack>
        </Box>
      </Flex>
    </HStack>
  )
}

export function EmptyEventBody() {

  return (
    <Box p={{base: '4', md: '2'}}>
      <Text fontSize={'sm'}>イベントはありません</Text>
    </Box>
  )
}

export function ErrorEventBody(prop: any) {

  const message = prop.message;

  return (
    <Stack direction={'row'} p={{base: '4', md: '2'}} spacing={'4'} color={'impact.500'}>
      <ExclamationTriangleFill boxSize={'2rem'} />
      <Stack>
        <Text fontSize={'sm'} fontWeight={'bold'}>イベント情報の取得に失敗しました</Text>
        {message && (
          <Text fontSize={'sm'}>{ message }</Text>
        )}
      </Stack>
    </Stack>
  )
}
