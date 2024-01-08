import {
  Heading,
  Stack,
  Spacer,
  Link,
  List,
  ListItem,
  ListIcon,
  Text,
  Button,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverHeader,
  PopoverCloseButton,
  PopoverBody
} from '@chakra-ui/react';
import { Github, Calendar3, CaretRightFill } from '@chakra-icons/bootstrap';
  
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
        <PopoverHeader>
          <Text fontSize={'sm'}>
            iCalendar で外部のカレンダーに表示する
          </Text>
        </PopoverHeader>
        <PopoverCloseButton />
        <PopoverBody>
          <Stack>
            <Text fontSize={'xs'}>
              以下の URL をコピーして、Google カレンダーなどのカレンダーに登録すると、
              カレンダー上でイベントが表示されるようになります
            </Text>
            <Input value={'https://event.yamanashi.dev/calendar.ics'}
                  size={'sm'}
                  contentEditable
                  onSelect={(e) => {
                    const inputElement = e.target as HTMLInputElement;
                    inputElement.select();
                  }}
                  />
            <List fontSize={'sm'} p={'2'}>
              <ListItem>
                <ListIcon as={CaretRightFill} />
                <Link href={'https://calendar.google.com/calendar/r/settings/addbyurl'} target={'_blank'}>
                  Google カレンダーに登録する
                </Link>
              </ListItem>
            </List>
          </Stack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}