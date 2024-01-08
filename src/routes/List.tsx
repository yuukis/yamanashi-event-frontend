import { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import axios from 'axios';
import { SiteHeader } from '../components/Site';
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
  Spacer
} from '@chakra-ui/react';

function List() {
  let { year: param_year } = useParams();
  const year = parseInt(param_year as string);
  const prev_year = year - 1;
  const next_year = year + 1;

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
      <SiteHeader title={ title } />
      <Container maxW={'800px'} w={'100%'}
                 mt={'4'}
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
                  <Spacer />
                  <Button size={'xs'}
                          variant={'outline'}
                          onClick={() => {window.open('/' + prev_year, '_self')}}
                          >← { prev_year }年</Button>
                  <Button size={'xs'}
                          variant={'outline'}
                          onClick={() => {window.open('/' + next_year, '_self')}}
                          >{ next_year }年 →</Button>
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
          <Text fontSize={'xs'} color={'gray'}>{ title }</Text>
        </Center>
      </Container>
    </Box>
  );
}

export default List;
