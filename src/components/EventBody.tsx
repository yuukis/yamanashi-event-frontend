import {
  Box,
  Stack,
  HStack,
  Spacer,
  Heading,
  Text,
  Button,
  Flex,
  Skeleton,
  SkeletonCircle,
  useMediaQuery
} from '@chakra-ui/react';
import {
  Hash,
  GeoAlt,
  Person,
  People,
  ChevronRight,
} from '@chakra-icons/bootstrap';

export function EventBody(data: any) {

  const day_of_week = ['日', '月', '火', '水', '木', '金', '土'];
  const event = data.event;
  const now_year = new Date().getFullYear();
  const start_date = new Date(event.started_at);
  const start_year = start_date.getFullYear();
  const start_month = start_date.getMonth() + 1;
  const start_day = start_date.getDate();
  const start_dow = day_of_week[start_date.getDay()];
  const start_time = start_date.getHours() + ':' + ('0' + start_date.getMinutes()).slice(-2);

  const title = event.title;
  const sub_title = event.catch;
  const hash_tag = event.hash_tag;
  const address = event.address;
  const place = event.place;
  const event_url = event.event_url;
  const owner_name = event.owner_name;
  const group_name = event.group_name;
  const group_url = event.group_url;

  const address_array = [address, place].filter(Boolean);

  const [isDesktopScreenSize] = useMediaQuery("(min-width: 768px)");

  return (
    <HStack p={{md: '2'}}
            onClick={() => { if (!isDesktopScreenSize) window.open(event_url, '_self') }}
            >
      <Flex w={'100%'}
          flexDirection={{base: 'column', md: 'row'}}
          alignItems={{base: 'flex-start', md: 'stretch'}}
          >
        <Stack w={{base: '100%', md: '180px'}}
              direction={{base: 'row', md: 'column'}}
              spacing={'0'}
              alignItems={{base: 'baseline', md: 'center'}}
              mb={{base: '1', md: '0'}}
              >
          { now_year !== start_year && (
            <HStack spacing={'0'}
                    justifyContent={{base: 'flex-start', md: 'center'}}
                    >
              <Text fontSize={'sm'}
                    fontWeight={'light'}
                    letterSpacing={{md: '0.1rem'}}
                    mr={{base: '1', md: '0'}}
                    >{ start_year }</Text>
            </HStack>
          )}
          <HStack spacing={'0'}
                  justifyContent={{base: 'flex-start', md: 'center'}}
                  mt={{base: '0', md: '-0.5rem'}}
                  >
            <Text fontSize={{base: '2xl', md:'4xl'}}
                  fontWeight={'bold'}
                  letterSpacing={{md: '0.1rem'}}
                  >{ start_month }</Text>
            <Text fontSize={{base: '2xl', md:'4xl'}}
                  fontWeight={'light'}
                  letterSpacing={{md: '0.1rem'}}
                  >
              /{ start_day }</Text>
          </HStack>
          <Text fontSize={'lg'}
                mt={{md: '-0.5rem'}}
                >
            ({ start_dow }) { start_time }-
          </Text>
        </Stack>
        <Box w={'1'} bg={'#ffd980'} mr={'4'} display={{base: 'none', md: 'block'}}></Box>
        <Box w={'100%'} position={'relative'}>
          <Heading fontSize={'md'}>{ title }</Heading>
          <Text fontSize={'sm'} display={{base: 'none', md: 'flex'}}>{ sub_title }</Text>
          <HStack mt={'2'} pr={{md: '100px'}}>
            <Stack p={{base: '2', md: '2'}} spacing={{base: '0', md: '0.5rem'}}>
              {hash_tag && (
                <HStack>
                  <Hash />
                  <Text fontSize={'sm'} noOfLines={1}>{ hash_tag }</Text>
                </HStack>
              )}
              {address_array.length > 0 && (
                <HStack>
                  <GeoAlt />
                  <Text fontSize={'sm'} noOfLines={1}>{ address_array[0] }</Text>
                </HStack>
              )}
              {address_array.length > 1 && (
                <HStack ml={'24px'} mt={{base: '0', md: '-0.5rem'}}>
                  <Text fontSize={'sm'} noOfLines={1}>{ address_array[1] }</Text>
                </HStack>
              )}
              {group_name && (
                <HStack>
                  <People />
                  <Button size={'xs'} display={{ base: 'none', md: 'block' }}
                          onClick={() => window.open(group_url)}
                          >{group_name}</Button>
                  <Text fontSize={'sm'}
                        display={{ base: 'block', md: 'none' }}
                        noOfLines={1}
                        >{group_name}</Text>
                </HStack>
              )}
              {group_name == null && owner_name && (
                <HStack>
                  <Person />
                  <Text fontSize={'sm'} noOfLines={1}>{owner_name}</Text>
                </HStack>
              )}
            </Stack>
          </HStack>
          <Button w={'100px'}
                    size={'md'}
                    colorScheme={'red'}
                    display={{base: 'none', md: 'block'}}
                    position={'absolute'}
                    bottom={'0'}
                    right={'0'}
                    onClick={() => window.open(event_url)}
                    >
            <HStack>
              <ChevronRight />
              <Text letterSpacing={'0.2rem'}>詳細</Text>
            </HStack>
          </Button>
        </Box>
      </Flex>
      <Spacer />
      <ChevronRight display={{md: 'none'}} />
    </HStack>
  )
}

export function SkeletonEventBody() {

  return (
    <HStack p={{md: '2'}}>
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
        <Box w={'2'} bg={'gray.200'} mr={'4'} display={{base: 'none', md: 'block'}}></Box>
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
    <Box p={{md: '2'}}>
      <Text fontSize={'sm'}>イベントはありません</Text>
    </Box>
  )
}