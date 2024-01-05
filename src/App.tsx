import { useEffect, useState } from 'react';
import axios from 'axios';
import { EventBody, SkeletonEventBody, EmptyEventBody } from './components/EventBody';
import './style.css';
import {
  Container,
  Box,
  Stack,
  StackDivider,
  Card,
  CardHeader,
  CardBody,
  Heading
} from '@chakra-ui/react';
import {
  Calendar2EventFill
} from '@chakra-icons/bootstrap';

function App() {
  const title = 'やまなし IT勉強会イベント(beta)';
  const [data, setData] = useState({isLoading: true, pastEvents: [], futureEvents: []});

  document.title = title;

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
      <Container maxW={'800px'} w={'100%'}>
        <Box p={'4'} mb={'8'}>
          <Heading size={'md'}>
            やまなし IT勉強会イベント(beta)
          </Heading>
        </Box>
        <Stack spacing={'4'}>
          <Card variant={'outline'} size={{base: 'sm', md: 'md'}}>
            <CardHeader>
              <Stack direction={'row'} spacing={'2'}>
                <Calendar2EventFill />
                <Heading size={'sm'}>
                  直近開催イベント
                </Heading>
              </Stack>
            </CardHeader>
            
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

          <Card variant={'outline'} size={{base: 'sm', md: 'md'}}>
            <CardHeader>
              <Heading size={'sm'}>
                終了したイベント
              </Heading>
            </CardHeader>
            
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
        </Stack>
      </Container>
    </Box>
  );
}

export default App;
