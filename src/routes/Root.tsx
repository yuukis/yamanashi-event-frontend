import { useEffect, useState } from 'react';
import axios from 'axios';
import { SiteHeader } from '../components/Site';
import { EventBody, SkeletonEventBody, EmptyEventBody } from '../components/EventBody';
import '../style.css';
import background from "../assets/images/background.jpg"
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
  Button
} from '@chakra-ui/react';
import {
  Calendar2EventFill
} from '@chakra-icons/bootstrap';

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
      <Box w={'100%'} h={{base: '320px', md: '480px'}} background={`url(${background}) center/cover no-repeat`} />
      <Container maxW={'800px'} w={'100%'}
                 mt={{base: '-200px', md: '-320px'}}
                 p={{base: '0', md: '4'}}
                 >
        <Stack spacing={'4'}>
          <Card variant={'filled'} size={{base: 'sm', md: 'md'}} opacity={'0.8'}>
            <CardBody>
              <Stack spacing={'2'}>
                <Heading size={{base: 'xs', md: 'sm'}}>
                  本サイトについて
                </Heading>
                <Text fontSize={{base: 'xs', md: 'sm'}}>
                  Yamanashi Developer Hub は、山梨県内で開催されるIT勉強会の情報をまとめたサイトです。
                </Text>
                <Text fontSize={{base: 'xs', md: 'sm'}}>
                  イベント情報は、<a href='https://connpass.com' target='_blank'>Connpass</a> から取得しています。
                </Text>
              </Stack>
            </CardBody>
          </Card>
          <Card variant={{base: 'unstyled', md: 'outline'}}
                size={{base: 'sm', md: 'md'}}
                padding={{base: '4', md: '0'}}
                >
            <CardBody>
              <Stack divider={<StackDivider />}>
                <Stack direction={'row'} spacing={'2'}>
                  <Calendar2EventFill />
                  <Heading size={{base: 'xs', md: 'sm'}}>
                    直近開催イベント
                  </Heading>
                </Stack>
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

          <Card variant={{base: 'unstyled', md: 'outline'}}
                size={{base: 'sm', md: 'md'}}
                padding={{base: '4', md: '0'}}
                >
            <CardBody>
              <Stack divider={<StackDivider />}>
                <Heading size={{base: 'xs', md: 'sm'}}>
                  終了したイベント
                </Heading>
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
              <Button size={'sm'} m={'1'} onClick={() => {window.open('/2015', '_self')}}>2015年</Button>
              <Button size={'sm'} m={'1'} onClick={() => {window.open('/2016', '_self')}}>2016年</Button>
              <Button size={'sm'} m={'1'} onClick={() => {window.open('/2017', '_self')}}>2017年</Button>
              <Button size={'sm'} m={'1'} onClick={() => {window.open('/2018', '_self')}}>2018年</Button>
              <Button size={'sm'} m={'1'} onClick={() => {window.open('/2019', '_self')}}>2019年</Button>
              <Button size={'sm'} m={'1'} onClick={() => {window.open('/2020', '_self')}}>2020年</Button>
              <Button size={'sm'} m={'1'} onClick={() => {window.open('/2021', '_self')}}>2021年</Button>
              <Button size={'sm'} m={'1'} onClick={() => {window.open('/2022', '_self')}}>2022年</Button>
              <Button size={'sm'} m={'1'} onClick={() => {window.open('/2023', '_self')}}>2023年</Button>
              <Button size={'sm'} m={'1'} onClick={() => {window.open('/2024', '_self')}}>2024年</Button>
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
