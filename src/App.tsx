import './style.css';
import {
  Container,
  Box,
  Stack,
  HStack,
  StackDivider,
  Spacer,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button,
  Flex
} from '@chakra-ui/react';
import {
  Hash,
  GeoAlt,
  Person,
  ChevronRight,
  Calendar2EventFill
} from '@chakra-icons/bootstrap';

function App() {
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
                <HStack p={{md: '2'}}>
                  <Stack w={'100%'} direction={{base: 'column', md: 'row'}}>
                    <Stack w={{base: '100%', md: '180px'}}
                           textAlign={{base: 'left', md: 'center'}}
                           display={{base: 'flex', md: 'block'}}
                           direction={{base: 'row', md: 'column'}}
                           spacing={'0'}
                           alignItems={{base: 'baseline', md: 'center'}}
                           >
                      <HStack spacing={'0'}
                              justifyContent={{base: 'flex-start', md: 'center'}}
                              >
                        <Text fontSize={{base: '2xl', md:'5xl'}} fontWeight={'bold'} letterSpacing={{md: '0.1rem'}}>
                          12
                        </Text>
                        <Text fontSize={{base: '2xl', md:'5xl'}} fontWeight={'light'} letterSpacing={{md: '0.1rem'}}>
                          /2
                        </Text>
                      </HStack>
                      <Text fontSize={'lg'}>(土) 15:00-</Text>
                    </Stack>
                    <Box w={'100%'}>
                      <Heading fontSize={'1rem'}>
                        おいでなって！ビルド山梨
                      </Heading>
                      <Text fontSize={'sm'} display={{base: 'none', md: 'flex'}}>ビルド山梨</Text>
                      <HStack mt={'2'}>
                        <Stack p={{base: '2', md: '2'}} spacing={{base: '0', md: '0.5rem'}}>
                          <HStack>
                            <GeoAlt />
                            <Text fontSize={'sm'} noOfLines={1} isTruncated={'true'}>
                              山梨県甲府市中央4丁目3-20 コットンクラブ
                            </Text>
                          </HStack>
                          <HStack>
                            <Person />
                            <Text fontSize={'sm'}>YoshikazuNagai</Text>
                          </HStack>
                        </Stack>
                        <Spacer />
                        <Button w={'120px'} size={'lg'} colorScheme='red' alignSelf={'flex-end'} display={{base: 'none', md: 'flex'}}>
                          <HStack>
                            <ChevronRight />
                            <Text letterSpacing={'0.2rem'}>詳細</Text>
                          </HStack>
                        </Button>
                      </HStack>
                    </Box>
                  </Stack>
                  <Spacer />
                  <ChevronRight display={{md: 'none'}} />
                </HStack>
                <HStack p={{md: '2'}}>
                  <Stack w={'100%'} direction={{base: 'column', md: 'row'}}>
                    <Stack w={{base: '100%', md: '180px'}}
                           textAlign={{base: 'left', md: 'center'}}
                           display={{base: 'flex', md: 'block'}}
                           direction={{base: 'row', md: 'column'}}
                           spacing={'0'}
                           alignItems={{base: 'baseline', md: 'center'}}
                           >
                      <HStack spacing={'0'}
                              justifyContent={{base: 'flex-start', md: 'center'}}
                              >
                        <Text fontSize={{base: '2xl', md:'5xl'}} fontWeight={'bold'} letterSpacing={{md: '0.1rem'}}>
                          1
                        </Text>
                        <Text fontSize={{base: '2xl', md:'5xl'}} fontWeight={'light'} letterSpacing={{md: '0.1rem'}}>
                          /28
                        </Text>
                      </HStack>
                      <Text fontSize={'lg'}>(日) 13:00-</Text>
                    </Stack>
                    <Box w={'100%'}>
                      <Heading fontSize={'1rem'}>
                        [Shingen.py] ワイン産地を支える! Pythonで山梨の気象データ分析とWeb公開
                      </Heading>
                      <Text fontSize={'sm'} display={{base: 'none', md: 'flex'}}>
                        この勉強会はAIによって生成されました
                      </Text>
                      <HStack mt={'2'}>
                        <Stack p={{base: '2', md: '2'}} spacing={{base: '0', md: '0.5rem'}}>
                          <HStack>
                            <Hash />
                            <Text fontSize={'sm'} noOfLines={1} isTruncated={'true'}>
                              信玄パイ
                            </Text>
                          </HStack>
                          <HStack>
                            <GeoAlt />
                            <Text fontSize={'sm'} noOfLines={1} isTruncated={'true'}>
                              山梨県甲府市北口2丁目8番1号 山梨県立図書館 交流ルーム 102 号室
                            </Text>
                          </HStack>
                          <HStack>
                            <Person />
                            <Button size={'xs'} display={{base: 'none', md: 'block'}}>shingen.py</Button>
                            <Text fontSize={'sm'} display={{base: 'block', md: 'none'}}>shingen.py</Text>
                          </HStack>
                        </Stack>
                        <Spacer />
                        <Button w={'120px'} size={'lg'} colorScheme='red' alignSelf={'flex-end'} display={{base: 'none', md: 'flex'}}>
                          <HStack>
                            <ChevronRight />
                            <Text letterSpacing={'0.2rem'}>詳細</Text>
                          </HStack>
                        </Button>
                      </HStack>
                    </Box>
                  </Stack>
                  <Spacer />
                  <ChevronRight display={{md: 'none'}} />
                </HStack>
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
              <HStack p={{md: '2'}}>
                  <Stack w={'100%'} direction={{base: 'column', md: 'row'}}>
                    <Stack w={{base: '100%', md: '180px'}}
                           textAlign={{base: 'left', md: 'center'}}
                           display={{base: 'flex', md: 'block'}}
                           direction={{base: 'row', md: 'column'}}
                           spacing={'0'}
                           alignItems={{base: 'baseline', md: 'center'}}
                           >
                      <HStack spacing={'0'}
                              justifyContent={{base: 'flex-start', md: 'center'}}
                              >
                        <Text fontSize={{base: '2xl', md:'5xl'}} fontWeight={'bold'} letterSpacing={{md: '0.1rem'}}>
                          11
                        </Text>
                        <Text fontSize={{base: '2xl', md:'5xl'}} fontWeight={'light'} letterSpacing={{md: '0.1rem'}}>
                          /23
                        </Text>
                      </HStack>
                      <Text fontSize={'lg'}>(木) 20:00-</Text>
                    </Stack>
                    <Box w={'100%'}>
                      <Heading fontSize={'1rem'}>
                      第23回 富士もくもく会（オンライン）
                      </Heading>
                      <HStack mt={'2'}>
                        <Stack p={{base: '2', md: '2'}} spacing={{base: '0', md: '0.5rem'}}>
                          <HStack>
                            <Person />
                            <Button size={'xs'} display={{base: 'none', md: 'block'}}>富士もくもく会</Button>
                            <Text fontSize={'sm'} display={{base: 'block', md: 'none'}}>富士もくもく会</Text>
                          </HStack>
                        </Stack>
                        <Spacer />
                        <Button w={'120px'} size={'lg'} colorScheme='red' alignSelf={'flex-end'} display={{base: 'none', md: 'flex'}}>
                          <HStack>
                            <ChevronRight />
                            <Text letterSpacing={'0.2rem'}>詳細</Text>
                          </HStack>
                        </Button>
                      </HStack>
                    </Box>
                  </Stack>
                  <Spacer />
                  <ChevronRight display={{md: 'none'}} />
                </HStack>
              </Stack>
            </CardBody>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

export default App;
