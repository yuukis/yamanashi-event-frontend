import {
  Heading,
  Box,
  Stack,
  Spacer,
  Link,
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
  
export function SiteHeader() {

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
                 >
          <strong>Yamanashi</strong> Developer Hub <small>[BETA]</small>
        </Heading>
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
            <Button w={'100%'} variant={'ghost'} size={'sm'}
                    onClick={() => { window.open('https://calendar.google.com/calendar/r/settings/addbyurl', '_blank') }}>
              <CaretRightFill mr={'2'} />
              <Text fontWeight={'normal'}>Google カレンダーに登録する</Text>
              <Spacer />
            </Button>
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
          <Button w={'100%'} variant={'ghost'} size={'sm'}
                  onClick={() => { window.open('https://github.com/yuukis/yamanashi-event-frontend', '_blank') }}>
            <Github mr={'2'} />
            <Text fontWeight={'normal'}>yuukis/yamanashi-event-frontend</Text>
            <Spacer />
          </Button>
          <Button w={'100%'} variant={'ghost'} size={'sm'}
                  onClick={() => { window.open('https://github.com/yuukis/yamanashi-event-api', '_blank') }}>
            <Github mr={'2'} />
            <Text fontWeight={'normal'}>yuukis/yamanashi-event-api</Text>
            <Spacer />
          </Button>
          <Button w={'100%'} variant={'ghost'} size={'sm'}
                  onClick={() => { window.open('https://github.com/yuukis/yamanashi-event-icalendar', '_blank') }}>
            <Github mr={'2'} />
            <Text fontWeight={'normal'}>yuukis/yamanashi-event-icalendar</Text>
            <Spacer />
          </Button>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}