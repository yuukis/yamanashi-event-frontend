import { useEffect, useState } from 'react';
import axios from 'axios';
import { SiteHeader, SiteFooter, SelectYearButtons, FooterLastModified } from '../components/Site';
import { EventBody, SkeletonEventBody, EmptyEventBody, ErrorEventBody } from '../components/EventBody';
import '../style.css';
import eyecatch from "../assets/images/eyecatch.png"
import {
  Container,
  Box,
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
import { sortByStartedAtAsc, sortByStartedAtDesc } from '../utils/eventSort';

function Root({startYear}: {startYear: number}) {
  const [data, setData] = useState({
    isLoading: true,
    pastEvents: [],
    futureEvents: [],
    lastModified: null,
    errorMessage: ''
  });

  document.title = `Yamanashi Developer Hub - 山梨のIT勉強会イベント情報ポータルサイト`;

  useEffect(() => {
    const getData = async () => {
      let res = null;
      let group_res = null;
      try {
        res = await axios.get('https://api.event.yamanashi.dev/events');
        group_res = await axios.get('https://api.event.yamanashi.dev/groups');
      }
      catch (err: any) {
        const data = {
          isLoading: false,
          pastEvents: [],
          futureEvents: [],
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
        pastEvents: events.filter((data: any) => {
          const open_status = data.open_status;
          return open_status !== 'cancelled' && open_status === 'close';
        }).sort(sortByStartedAtDesc),
        futureEvents: events.filter((data: any) => {
          const open_status = data.open_status;
          return open_status !== 'cancelled' && open_status !== 'close';
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
      <Box bg={'linen'} p={4}>
        <Container maxW={'800px'}
                   w={'100%'}
                   h={{md: '320px'}}
                   display={'flex'}
                   alignItems={'center'}
                   position={'relative'}
                   flexDirection={{base: 'column', md: 'row'}}
                   >
          <Image src={eyecatch}
                 boxSize={{base: '80%', md: '320px'}}
                 alt='Yamanashi Developer Hub'
                 position={{md: 'absolute'}}
                 right={{md: '0'}}
                 />
          <Stack pr={{md: '320px'}} color={'gray.600'}>
            <Heading size={{base: 'md', md: 'lg'}} mb={'4'} textAlign={{base: 'center', md: 'left'}}>
              <Text fontWeight={'bold'} as={'span'} color={'impact.500'}>Yamanashi </Text>
              <Text fontWeight={'normal'} as={'span'} color={'secondary.700'}>Developer </Text>
              <Text fontWeight={'normal'} as={'span'} color={'primary.600'}>Hub</Text>
            </Heading>
            <Text fontSize={{base: 'sm', md: 'md'}}>
              Yamanashi Developer Hub は、山梨県内で開催されるIT勉強会の情報をまとめたサイトです。
            </Text>
            <Text fontSize={{base: 'sm', md: 'md'}}>
              イベント情報は、
              <Link color={'primary.800'} href='https://connpass.com' isExternal>
                connpass<ExternalLinkIcon mx={'2px'} />
              </Link>
              またはコミュニティが提供するイベントカレンダーから取得しています。
            </Text>
          </Stack>          
        </Container>
      </Box>
      <Stack spacing={'2px'}>
        <Box h={'1px'} bg={'primary.500'} />
        <Box h={'1px'} bg={'secondary.500'} />
        <Box h={'1px'} bg={'impact.500'} />
      </Stack>
      <Container maxW={'800px'} w={'100%'}
                 p={{base: '0', md: '4'}}
                 >
        <Stack>
          <Heading size={{base: 'sm', md: 'md'}}
                   ml={{base: '4', md: '0'}}
                   mt={'8'}
                   mb={'2'}
                   color={'gray.600'}
                   >
            直近開催イベント
          </Heading>
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
                ) : data.futureEvents.length === 0 ? (
                  <EmptyEventBody />
                ) : (
                  data.futureEvents.map((data) => {
                    return <EventBody event={data} />
                  }
                ))}
              </Stack>
            </CardBody>
          </Card>
          {data.lastModified &&
            <FooterLastModified lastModified={ data.lastModified } />
          }

          <Heading size={{base: 'sm', md: 'md'}}
                   ml={{base: '4', md: '0'}}
                   mt={'8'}
                   mb={'2'}
                   color={'gray.600'}
                   >
            終了したイベント
          </Heading>
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
                ) : data.pastEvents.length === 0 ? (
                  <EmptyEventBody />
                ) : (
                  data.pastEvents.map((data) => {
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
                padding={{base: '4', md: '0'}}
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

export default Root;
