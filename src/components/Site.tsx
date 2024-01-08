import { Heading, Stack, Spacer, Link } from '@chakra-ui/react';
import { Github } from '@chakra-icons/bootstrap';
  
export function SiteHeader(prop: any) {

  const title = prop.title;

  return (
    <Stack direction={'row'} alignItems={'center'} p={'4'} bg={'white'}>
      <Link href={'/'}>
        <Heading size={{base: 'sm', md: 'md'}} fontWeight={'normal'}>{ title }</Heading>
      </Link>
      <Spacer />
      <Link href={'https://github.com/yuukis/yamanashi-event-frontend'} target={'_blank'}>
        <Github boxSize={{base: '5', md: '6'}} />
      </Link>
    </Stack>
  );
}