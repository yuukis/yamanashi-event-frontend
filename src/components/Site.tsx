import { Flex, Heading, Stack, Spacer, Link, Text } from '@chakra-ui/react';
import { Github, Calendar2Plus } from '@chakra-icons/bootstrap';
  
export function SiteHeader(prop: any) {

  const title = prop.title;

  return (
    <Stack direction={'row'} alignItems={'center'} p={'4'} bg={'white'}>
      <Link href={'/'}>
        <Heading size={{base: 'sm', md: 'md'}} fontWeight={'normal'}>{ title }</Heading>
      </Link>
      <Spacer />
      <Calendar2Plus boxSize={{base: '5', md: '6'}} />
      <Text fontSize={{base: 'xs', md: 'sm'}} mr={'2'}>カレンダーに追加</Text>
      <Link href={'https://github.com/yuukis/yamanashi-event-frontend'} target={'_blank'}>
        <Github boxSize={{base: '5', md: '6'}} />
      </Link>
    </Stack>
  );
}