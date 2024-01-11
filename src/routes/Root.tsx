import { useEffect, useState } from 'react';
import axios from 'axios';
import { SiteHeader, SelectYearButtons } from '../components/Site';
import { EventBody, SkeletonEventBody, EmptyEventBody } from '../components/EventBody';
import '../style.css';
import background from "../assets/images/background.png"
import {
  Container,
  Box,
  Center,
  Stack,
  StackDivider,
  Card,
  CardBody,
  Heading,
  Text,
  Image,
  Link
} from '@chakra-ui/react';
import { ExternalLinkIcon } from "@chakra-ui/icons";

function Root() {
  const [data, setData] = useState({isLoading: true, pastEvents: [], futureEvents: []});

  useEffect(() => {
    const getData = async () => {
      // const res = await axios.get('http://localhost:8000/events');
      const res = await axios.get('https://api.event.yamanashi.dev/events');
      const events = res.data;
      const data = {
        isLoading: false,
        pastEvents: events.filter((data: any) => {
          const now = new Date();
          const start = new Date(data.started_at);
          return now > start;
        }).sort((data: any) => {
          const start = new Date(data.started_at);
          return -start.getTime();
        }),
        futureEvents: events.filter((data: any) => {
          const now = new Date();
          const start = new Date(data.started_at);
          return now <= start;
        }).sort((data: any) => {
          const start = new Date(data.started_at);
          return start.getTime();
        })
      }
      setData(data);
    }
    getData();
  }, []);

  return (
    <Box bg={'gray.100'} w={'100vw'} minH={'100vh'}>
      <SiteHeader />
      <Box bg={'linen'} p={4}>
        <Container maxW={'800px'}
                   w={'100%'}
                   h={{md: '320px'}}
                   display={'flex'}
                   alignItems={'center'}
                   position={'relative'}
                   flexDirection={{base: 'column', md: 'row'}}
                   >
          <Image src={background}
                 boxSize={{base: '80%', md: '320px'}}
                 alt='Yamanashi Developer Hub'
                 position={{md: 'absolute'}}
                 right={{md: '0'}}
                 />
          <Stack pr={{md: '320px'}} color={'gray.600'}>
            <Heading size={{base: 'md', md: 'lg'}} mb={'4'} textAlign={{base: 'center', md: 'left'}}>
              <Text fontWeight={'bold'} as={'span'} color={'#ff6e61'}>Yamanashi </Text>
              <Text fontWeight={'normal'} as={'span'} color={'#8ac770'}>Developer </Text>
              <Text fontWeight={'normal'} as={'span'} color={'#38a9cc'}>Hub</Text>
            </Heading>
            <Text fontSize={{base: 'sm', md: 'md'}}>
              Yamanashi Developer Hub は、山梨県内で開催されるIT勉強会の情報をまとめたサイトです。
            </Text>
            <Text fontSize={{base: 'sm', md: 'md'}}>
              イベント情報は、
              <Link color='red.500' href='https://connpass.com' isExternal>
                connpass<ExternalLinkIcon mx={'2px'} />
              </Link>
              から取得しています。
            </Text>
          </Stack>          
        </Container>
      </Box>
      <Stack spacing={'2px'}>
        <Box h={'1px'} bg={'#4abfe3'} />
        <Box h={'1px'} bg={'#a5de8c'} />
        <Box h={'1px'} bg={'#ff6e61'} />
      </Stack>
      <Container maxW={'800px'} w={'100%'}
                 p={{base: '0', md: '4'}}
                 >
        <Stack>
          <Heading size={{base: 'sm', md: 'md'}}
                   ml={{base: '4', md: '0'}}
                   mt={'8'}
                   color={'gray.600'}
                   >
            直近開催イベント
          </Heading>
          <Card variant={{base: 'unstyled', md: 'outline'}}
                size={{base: 'sm', md: 'md'}}
                padding={{base: '4', md: '0'}}
                >
            <CardBody>
              <Stack divider={<StackDivider />}>
                {data.isLoading && (
                  <SkeletonEventBody />
                )}
                {!data.isLoading && data.futureEvents.length === 0 && (
                  <EmptyEventBody />
                )}
                {data.futureEvents.map((data) => {
                  return <EventBody event={data} />
                })}
              </Stack>
            </CardBody>
          </Card>

          <Heading size={{base: 'sm', md: 'md'}}
                   ml={{base: '4', md: '0'}}
                   mt={'8'}
                   color={'gray.600'}
                   >
            終了したイベント
          </Heading>
          <Card variant={{base: 'unstyled', md: 'outline'}}
                size={{base: 'sm', md: 'md'}}
                padding={{base: '4', md: '0'}}
                >
            <CardBody>
              <Stack divider={<StackDivider />}>
                {data.isLoading && (
                  <SkeletonEventBody />
                )}
                {!data.isLoading && data.pastEvents.length === 0 && (
                  <EmptyEventBody />
                )}
                {data.pastEvents.map((data) => {
                  return <EventBody event={data} />
                })}
              </Stack>
            </CardBody>
          </Card>

          <Card variant={{base: 'unstyled', md: 'outline'}}
                size={{base: 'sm', md: 'md'}}
                padding={{base: '4', md: '0'}}
                >
            <CardBody>
              <SelectYearButtons />
            </CardBody>
          </Card>
        </Stack>
        <Center p={'4'}>
          <Text fontSize={'xs'} color={'gray'}>Yamanashi Developer Hub</Text>
        </Center>
      </Container>
    </Box>
  );
}

export default Root;
