import {
  Heading,
  Box,
  Stack,
  Spacer,
  Link,
  List,
  ListItem,
  ListIcon,
  Text,
  Button,
  IconButton,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverHeader,
  PopoverCloseButton,
  PopoverBody,
  PopoverFooter
} from '@chakra-ui/react';
import { isMobile } from 'react-device-detect';
import { Github, Calendar3, CaretRightFill } from '@chakra-icons/bootstrap';
  
export function SiteHeader(prop: any) {

  const title = prop.title;

  return (
    <Stack h={{base: '10', md: '12'}}
           p={'3'}
           direction={'row'}
           alignItems={'center'}
           bg={'white'}
           >
      <Link href={'/'}>
        <Heading size={{base: 'sm', md: 'md'}}
                 fontWeight={'normal'}
                 noOfLines={1}
                 >{ title }</Heading>
      </Link>
      <Spacer />
      <Box display={{base: 'none', md: 'block'}}><ICalendarButton /></Box>
      <GithubButton />
    </Stack>
  );
}

export function ICalendarButton() {

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant={'ghost'}>
          <Calendar3 mr={'2'} />
          <Text fontWeight={'normal'} fontSize={'sm'}>iCalendar</Text>
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
          </Stack>
        </PopoverBody>
        {!isMobile && (
          <PopoverFooter>
            <List fontSize={'sm'} p={'2'}>
              <ListItem>
                <ListIcon as={CaretRightFill} />
                <Link href={'https://calendar.google.com/calendar/r/settings/addbyurl'} target={'_blank'}>
                  Google カレンダーに登録する
                </Link>
              </ListItem>
            </List>
          </PopoverFooter>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function GithubButton() {

  return (
    <Popover>
      <PopoverTrigger>
        <IconButton aria-label='Git repo' variant={'ghost'} icon={<Github />} />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverHeader>
          <Text fontSize={'sm'}>
            git repo
          </Text>
        </PopoverHeader>
        <PopoverCloseButton />
        <PopoverBody>
          <List fontSize={'sm'}>
            <ListItem p={'2'}>
              <ListIcon as={Github} />
              <Link href={'https://github.com/yuukis/yamanashi-event-frontend'} target={'_blank'}>
                yuukis/yamanashi-event-frontend
              </Link>
            </ListItem>
            <ListItem p={'2'}>
              <ListIcon as={Github} />
              <Link href={'https://github.com/yuukis/yamanashi-event-api'} target={'_blank'}>
                yuukis/yamanashi-event-api
              </Link>
            </ListItem>
            <ListItem p={'2'}>
              <ListIcon as={Github} />
              <Link href={'https://github.com/yuukis/yamanashi-event-icalendar'} target={'_blank'}>
                yuukis/yamanashi-event-icalendar
              </Link>
            </ListItem>
          </List>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}