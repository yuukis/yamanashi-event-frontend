import {
  Heading,
  Stack,
  Spacer,
  Link,
  Text,
  Button, 
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverHeader,
  PopoverCloseButton,
  PopoverBody
} from '@chakra-ui/react';
import { Github, Calendar3 } from '@chakra-icons/bootstrap';
  
export function SiteHeader(prop: any) {

  const title = prop.title;

  return (
    <Stack direction={'row'} alignItems={'center'} p={'4'} bg={'white'}>
      <Link href={'/'}>
        <Heading size={{base: 'sm', md: 'md'}} fontWeight={'normal'}>{ title }</Heading>
      </Link>
      <Spacer />
      <ICalendarButton />
      <Link href={'https://github.com/yuukis/yamanashi-event-frontend'} target={'_blank'}>
        <Github boxSize={{base: '5', md: '6'}} />
      </Link>
    </Stack>
  );
}

export function ICalendarButton() {

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant={'outline'} size={'xs'}>
          <Calendar3 mr={'2'} />
          <Text>iCalendar URL</Text>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverHeader>iCalendar で外部のカレンダーと連携</PopoverHeader>
        <PopoverCloseButton />
        <PopoverBody>
          <Text fontSize={'sm'}>https://calendar.yamanashi.dev/event.ics</Text>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}