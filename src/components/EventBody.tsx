import {
  Box,
  Stack,
  HStack,
  Spacer,
  Heading,
  Text,
  Button,
  Flex,
  useMediaQuery
} from '@chakra-ui/react';
import {
  Hash,
  GeoAlt,
  Person,
  ChevronRight,
} from '@chakra-icons/bootstrap';

export function EventBody(data: any) {

  const event = data.event;
  const start_year = new Date(event.started_at).getFullYear();
  const start_date = new Date(event.started_at);
  const start_month = start_date.getMonth() + 1;
  const start_day = start_date.getDate();
  const day_of_week = ['日', '月', '火', '水', '木', '金', '土'][start_date.getDay()];
  const start_time = start_date.getHours() + ':' + ('0' + start_date.getMinutes()).slice(-2);

  const title = event.title;
  const sub_title = event.catch;
  const hash_tag = event.hash_tag;
  const address = event.address;
  const event_url = event.event_url;
  const place = event.place;
  const group_name = event.group_name;
  const group_url = event.group_url;

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
              >
          <HStack spacing={'0'}
                  justifyContent={{base: 'flex-start', md: 'center'}}
                  >
            <Text fontSize={'sm'}
                  fontWeight={'light'}
                  letterSpacing={{md: '0.1rem'}}
                  mr={{base: '1', md: '0'}}
                  >{ start_year }</Text>
          </HStack>
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
            ({ day_of_week }) { start_time }-
          </Text>
        </Stack>
        <Box w={'2'} bg={'gray.200'} mr={'4'} display={{base: 'none', md: 'block'}}></Box>
        <Box w={'100%'}>
          <Heading fontSize={'1rem'}>{ title }</Heading>
          <Text fontSize={'sm'} display={{base: 'none', md: 'flex'}}>{ sub_title }</Text>
          <HStack mt={'2'}>
            <Stack p={{base: '2', md: '2'}} spacing={{base: '0', md: '0.5rem'}}>
              {hash_tag && (
                <HStack>
                  <Hash />
                  <Text fontSize={'sm'} noOfLines={1}>{ hash_tag }</Text>
                </HStack>
              )}
              {address && (
                <HStack>
                  <GeoAlt />
                  <Text fontSize={'sm'} noOfLines={1}>{ address }</Text>
                </HStack>
              )}
              {place && (
                <HStack ml={'24px'} mt={{base: '0', md: '-0.5rem'}}>
                  <Text fontSize={'sm'} noOfLines={1}>{ place }</Text>
                </HStack>
              )}
              {group_name && (
                <HStack>
                  <Person />
                  <Button size={'xs'} display={{ base: 'none', md: 'block' }}
                          onClick={() => window.open(group_url)}
                          >
                    {group_name}
                  </Button>
                  <Text fontSize={'sm'} display={{ base: 'block', md: 'none' }}>
                    {group_name}
                  </Text>
                </HStack>
              )}
            </Stack>
            <Spacer />
            <Button w={'120px'}
                    size={'lg'}
                    colorScheme='red'
                    alignSelf={'flex-end'}
                    display={{base: 'none', md: 'flex'}}
                    onClick={() => window.open(event_url)}
                    >
              <HStack>
                <ChevronRight />
                <Text letterSpacing={'0.2rem'}>詳細</Text>
              </HStack>
            </Button>
          </HStack>
        </Box>
      </Flex>
      <Spacer />
      <ChevronRight display={{md: 'none'}} />
    </HStack>
  )
}