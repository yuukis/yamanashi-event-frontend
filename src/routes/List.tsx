import { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import axios from 'axios';
import { SiteHeader, SiteFooter, SelectYearButtons, FooterLastModified } from '../components/Site';
import { EventBody, SkeletonEventBody, EmptyEventBody, ErrorEventBody } from '../components/EventBody';
import '../style.css';
import {
  Container,
  Box,
  Stack,
  StackDivider,
  Card,
  CardBody,
  Heading,
  Button,
  Spacer
} from '@chakra-ui/react';
import { sortByStartedAtAsc } from '../utils/eventSort';

function List({ startYear} : {startYear: number}) {
  let { year: param_year } = useParams();
  const year = parseInt(param_year as string);
  const prev_year = year - 1;
  const next_year = year + 1;

  const [data, setData] = useState({
    isLoading: true,
    events: [],
    lastModified: null,
    errorMessage: ''
  });

  document.title = `${year}年 開催イベント - Yamanashi Developer Hub`;

  useEffect(() => {
    const getData = async () => {
      let res = null;
      let group_res = null;
      try {
        res = await axios.get(`https://api.event.yamanashi.dev/events/in/${year}`);
        group_res = await axios.get('https://api.event.yamanashi.dev/groups');
      }
      catch (err: any) {
        const data = {
          isLoading: false,
          events: [],
          lastModified: null,
          errorMessage: err.message
        }
        setData(data);
        return;
      }

      let groups: { [key: string]: any } = {};
      group_res.data.forEach((group: any) => {
        groups[group.key] = group;
      });
      const events = res.data.map((event: any) => {
        let group_key = event.group_key;
        if (group_key in groups) {
          let group = groups[group_key];
          event.group_image_url = group.image_url;
        }
        return event;
      });
      const data = {
        isLoading: false,
        events: events.filter((data: any) => {
          const open_status = data.open_status;
          return open_status !== 'cancelled';
        }).sort(sortByStartedAtAsc),
        lastModified: res.headers['last-modified'],
        errorMessage: ''
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
        <Stack>
          <Stack direction={'row'} spacing={'2'}
                 ml={{base: '4', md: '0'}}
                 mr={{base: '4', md: '0'}}
                 mb={'2'}
                 display={'flex'} alignItems={'flex-end'}
                 >
            <Heading size={{base: 'sm', md: 'md'}}
                     mt={'4'}
                     color={'gray.600'}
                     >
              { year }年 開催イベント
            </Heading>
            <Spacer />
            {
              prev_year >= startYear && (
                    <Button size={'xs'}
                            variant={'ghost'}
                            colorScheme={'impact'}
                            onClick={() => {window.open('/' + prev_year, '_self')}}
                    >← { prev_year }年</Button>
                )
            }
            <Button size={'xs'}
                    variant={'ghost'}
                    colorScheme={'impact'}
                    onClick={() => {window.open('/' + next_year, '_self')}}
                    >{ next_year }年 →</Button>
          </Stack>
          <Card variant={{base: 'unstyled', md: 'outline'}}
                size={{base: 'sm', md: 'md'}}
                p={'0'}
                >
            <CardBody>
              <Stack spacing={{base: '0', md: '0.5em'}} divider={<StackDivider />}>
              {data.isLoading ? (
                  <SkeletonEventBody />
                ) : data.errorMessage ? (
                  <ErrorEventBody message={ data.errorMessage } />
                ) : data.events.length === 0 ? (
                  <EmptyEventBody />
                ) : (
                  data.events.map((data) => {
                    return <EventBody event={data} />
                  }
                ))}
              </Stack>
            </CardBody>
          </Card>
          {data.lastModified &&
            <FooterLastModified lastModified={ data.lastModified } />
          }

          <Card variant={{base: 'unstyled', md: 'outline'}}
                size={{base: 'sm', md: 'md'}}
                p={{base: '4', md: '0'}}
                >
            <CardBody>
              <SelectYearButtons startYear={startYear}/>
            </CardBody>
          </Card>
        </Stack>
        <SiteFooter />
      </Container>
    </Box>
  );
}

export default List;
