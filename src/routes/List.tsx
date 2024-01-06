import { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import axios from 'axios';
import { EventBody, SkeletonEventBody, EmptyEventBody } from '../components/EventBody';
import '../style.css';
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
  Button,
  Link,
  Spacer
} from '@chakra-ui/react';
import {
  Github
} from '@chakra-icons/bootstrap';

function List() {
  let { year } = useParams();
  const title = 'やまなし IT勉強会イベント(beta)';
  const [data, setData] = useState({isLoading: true, events: []});

  document.title = year + '年 開催イベント - ' + title;

  useEffect(() => {
    const getData = async () => {
      // const res = await axios.get('http://localhost:8000/events');
      const res = await axios.get('https://api.event.yamanashi.dev/events/in/' + year);
      const events = res.data;
      const data = {
        isLoading: false,
        events: events.sort((data: any) => {
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
      <Stack direction={'row'} alignItems={'center'} p={'4'} bg={'white'}>
        <Heading size={{base: 'sm', md: 'md'}} fontWeight={'normal'}>{ title }</Heading>
        <Spacer />
        <Link href={'https://github.com/yuukis/yamanashi-event-frontend'} target={'_blank'}>
          <Github boxSize={{base: '5', md: '6'}} />
        </Link>
      </Stack>
      <Container maxW={'800px'} w={'100%'}
                //  mt={{base: '-200px', md: '-320px'}}
                 p={{base: '0', md: '4'}}
                 >
        <Stack spacing={'4'}>
          <Card variant={{base: 'unstyled', md: 'outline'}}
                size={{base: 'sm', md: 'md'}}
                padding={{base: '4', md: '0'}}
                >
            <CardBody>
              <Stack divider={<StackDivider />}>
                <Stack direction={'row'} spacing={'2'}>
                  <Heading size={{base: 'xs', md: 'sm'}}>
                    { year }年 開催イベント
                  </Heading>
                </Stack>
                {data.isLoading && (
                  <SkeletonEventBody />
                )}
                {!data.isLoading && data.events.length === 0 && (
                  <EmptyEventBody />
                )}
                {data.events.map((data) => {
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
              <Button size={'sm'} m={'1'}>2015年</Button>
              <Button size={'sm'} m={'1'}>2016年</Button>
              <Button size={'sm'} m={'1'}>2017年</Button>
              <Button size={'sm'} m={'1'}>2018年</Button>
              <Button size={'sm'} m={'1'}>2019年</Button>
              <Button size={'sm'} m={'1'}>2020年</Button>
              <Button size={'sm'} m={'1'}>2021年</Button>
              <Button size={'sm'} m={'1'}>2022年</Button>
              <Button size={'sm'} m={'1'}>2023年</Button>
              <Button size={'sm'} m={'1'}>2024年</Button>
            </CardBody>
          </Card>
        </Stack>
        <Center p={'4'}>
          <Text fontSize={'xs'} color={'gray'}>{ title }</Text>
        </Center>
      </Container>
    </Box>
  );
}

export default List;
