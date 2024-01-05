import { useEffect, useState } from 'react';
import axios from 'axios';
import { EventBody, SkeletonEventBody } from './components/EventBody';
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
  const [data, setData] = useState([]);

  useEffect(() => {
    const getData = async () => {
      // const res = await axios.get('http://localhost:8000/events');
      const res = await axios.get('https://api.event.yamanashi.dev/events');
      setData(res.data);
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
                {data.length === 0 && (
                  <SkeletonEventBody />
                )}
                {data.filter((data) => {
                  const now = new Date();
                  const start = new Date((data as { started_at: string }).started_at);
                  return now <= start;
                }).sort((data) => {
                  const start = new Date((data as { started_at: string }).started_at);
                  return start.getTime();
                }).map((data) => {
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
                {data.length === 0 && (
                  <SkeletonEventBody />
                )}
                {data.filter((data) => {
                  const now = new Date();
                  const start = new Date((data as { started_at: string }).started_at);
                  return now > start;
                }).sort((data) => {
                  const start = new Date((data as { started_at: string }).started_at);
                  return -start.getTime();
                }).map((data) => {
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
