import { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import axios from 'axios';
import { SiteHeader, SelectYearButtons } from '../components/Site';
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

  const [data, setData] = useState({isLoading: true, events: []});

  document.title = `${year}年 開催イベント - Yamanashi Developer Hub`;

  useEffect(() => {
    const getData = async () => {
      // const res = await axios.get('http://localhost:8000/events');
      const res = await axios.get(`https://api.event.yamanashi.dev/events/in/${year}`);
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
      <SiteHeader />
      <Container maxW={'800px'} w={'100%'}
                 mt={'4'}
                 p={{base: '0', md: '4'}}
                 >
        <Stack spacing={'4'}>
          <Stack direction={'row'} spacing={'2'}
                 ml={{base: '4', md: '0'}}
                 mr={{base: '4', md: '0'}}
                 display={'flex'} alignItems={'flex-end'}
                 >
            <Heading size={{base: 'sm', md: 'md'}}
                     mt={'4'}
                     color={'gray.600'}
                     >
              { year }年 開催イベント
            </Heading>
            <Spacer />
            <Button size={'xs'}
                    variant={'ghost'}
                    colorScheme={'red'}
                    onClick={() => {window.open('/' + prev_year, '_self')}}
                    >← { prev_year }年</Button>
            <Button size={'xs'}
                    variant={'ghost'}
                    colorScheme={'red'}
                    onClick={() => {window.open('/' + next_year, '_self')}}
                    >{ next_year }年 →</Button>
          </Stack>
          <Card variant={{base: 'unstyled', md: 'outline'}}
                size={{base: 'sm', md: 'md'}}
                padding={{base: '4', md: '0'}}
                >
            <CardBody>
              <Stack divider={<StackDivider />}>
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

export default List;
