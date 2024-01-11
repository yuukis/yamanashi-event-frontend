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
  PopoverFooter,
  Show
} from '@chakra-ui/react';
import { isMobile } from 'react-device-detect';
import { Github, Calendar3, CaretRightFill } from '@chakra-icons/bootstrap';
  
export function SiteHeader() {

  return (
    <Box w={'100%'} bg={'white'}>
      <Stack h={{base: '12', md: '16'}}
             maxW={'800px'} 
             m={'auto'}
             p={'4'}
             direction={'row'}
             alignItems={'center'}
             bg={'white'}
             >
        <Link href={'/'} _hover={{textDecoration: 'none', opacity: '0.6'}}>
          <Heading size={{base: 'sm', md: 'md'}}
                  fontWeight={'normal'}
                  noOfLines={1}
                  >
            <strong>Yamanashi</strong> Developer Hub <small>[BETA]</small>
          </Heading>
        </Link>
        <Spacer />
        <Show above='md'><ICalendarButton /></Show>
        <GithubButton />
      </Stack>
      <Stack spacing={'2px'}>
        <Box h={'1px'} bg={'impact.500'} />
        <Box h={'1px'} bg={'secondary.500'} />
        <Box h={'1px'} bg={'primary.500'} />
      </Stack>
    </Box>
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
            <Input value={'https://hub.yamanashi.dev/event.ics'}
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

export function SelectYearButtons() {

  const current_year = new Date().getFullYear();
  const start_year = 2015;
  const years = [];

  for (let y = start_year; y <= current_year; y++) {
    years.push(y);
  }

  return (
    <>
      {years.map((year) => (
        <Button key={year} size={'sm'} m={'1'}
                onClick={() => { window.open(`/${year}`, '_self'); }}
                >{`${year}年`}</Button>
      ))}
    </>
  );
}